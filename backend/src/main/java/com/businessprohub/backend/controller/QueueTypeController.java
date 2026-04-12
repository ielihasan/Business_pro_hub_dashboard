package com.businessprohub.backend.controller;

import com.businessprohub.backend.dto.response.ApiResponse;
import com.businessprohub.backend.entity.Queue;
import com.businessprohub.backend.entity.ServiceEntity;
import com.businessprohub.backend.exception.ResourceNotFoundException;
import com.businessprohub.backend.repository.QueueRepository;
import com.businessprohub.backend.repository.ServiceEntityRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/queue-types")
public class QueueTypeController {

    private final ServiceEntityRepository serviceRepo;
    private final QueueRepository queueRepo;
    private final ObjectMapper objectMapper;

    public QueueTypeController(ServiceEntityRepository serviceRepo,
                               QueueRepository queueRepo,
                               ObjectMapper objectMapper) {
        this.serviceRepo = serviceRepo;
        this.queueRepo = queueRepo;
        this.objectMapper = objectMapper;
    }

    // GET /api/queue-types?business_id=
    @GetMapping
    public ResponseEntity<ApiResponse<?>> list(@RequestParam("business_id") String businessId) {
        List<ServiceEntity> services = serviceRepo.findByBusinessIdAndIsActive(businessId, true);
        List<Map<String, Object>> mapped = services.stream().map(this::toDto).toList();
        return ResponseEntity.ok(ApiResponse.success(mapped));
    }

    // GET /api/queue-types/revenue?business_id=
    @GetMapping("/revenue")
    public ResponseEntity<ApiResponse<?>> revenue(@RequestParam("business_id") String businessId) {

        List<Queue> allQueues = queueRepo.findByBusinessId(businessId);
        List<ServiceEntity> services = serviceRepo.findByBusinessId(businessId);

        // Build lookup maps for service name + color
        Map<String, String> nameMap  = new HashMap<>();
        Map<String, String> colorMap = new HashMap<>();
        for (ServiceEntity svc : services) {
            nameMap.put(svc.getId(), svc.getName());
            try {
                if (svc.getDescription() != null) {
                    @SuppressWarnings("unchecked")
                    Map<String, Object> desc = objectMapper.readValue(svc.getDescription(), Map.class);
                    colorMap.put(svc.getId(), (String) desc.getOrDefault("color", "#6B7280"));
                }
            } catch (Exception ignored) {}
        }

        LocalDate today = LocalDate.now(ZoneOffset.UTC);
        LocalDate sevenDaysAgo = today.minusDays(6);

        // Per-service accumulators
        // key = service uuid OR "general" for null service_type
        Map<String, BigDecimal> totalRev      = new LinkedHashMap<>();
        Map<String, BigDecimal> todayRev      = new LinkedHashMap<>();
        Map<String, BigDecimal> advanceCol    = new LinkedHashMap<>();
        Map<String, BigDecimal> outstanding   = new LinkedHashMap<>();
        Map<String, Long>       served        = new LinkedHashMap<>();
        Map<String, Long>       totalCustomers = new LinkedHashMap<>();

        // Global summary accumulators
        BigDecimal gTotalRev    = BigDecimal.ZERO;
        BigDecimal gTodayRev    = BigDecimal.ZERO;
        BigDecimal gAdvance     = BigDecimal.ZERO;
        BigDecimal gOutstanding = BigDecimal.ZERO;
        long gServed = 0;

        // Daily trend map (last 7 days)
        TreeMap<LocalDate, BigDecimal> dailyMap = new TreeMap<>();
        for (int i = 0; i <= 6; i++) dailyMap.put(sevenDaysAgo.plusDays(i), BigDecimal.ZERO);

        List<String> activeStatuses = List.of("waiting", "in_progress", "called", "serving");

        for (Queue q : allQueues) {
            String key = (q.getServiceType() != null && !q.getServiceType().isBlank())
                    ? q.getServiceType() : "general";

            // Ensure key exists in maps
            totalRev.putIfAbsent(key, BigDecimal.ZERO);
            todayRev.putIfAbsent(key, BigDecimal.ZERO);
            advanceCol.putIfAbsent(key, BigDecimal.ZERO);
            outstanding.putIfAbsent(key, BigDecimal.ZERO);
            served.putIfAbsent(key, 0L);
            totalCustomers.put(key, totalCustomers.getOrDefault(key, 0L) + 1);

            boolean isCompleted = "completed".equals(q.getStatus());
            boolean isActive    = activeStatuses.contains(q.getStatus());
            LocalDate qDate = q.getCreatedAt() != null
                    ? q.getCreatedAt().atZoneSameInstant(ZoneOffset.UTC).toLocalDate()
                    : null;
            boolean isToday = today.equals(qDate);

            // Revenue from completed entries
            if (isCompleted && q.getTotalPrice() != null && q.getTotalPrice().compareTo(BigDecimal.ZERO) > 0) {
                totalRev.put(key, totalRev.get(key).add(q.getTotalPrice()));
                gTotalRev = gTotalRev.add(q.getTotalPrice());
                served.put(key, served.get(key) + 1);
                gServed++;

                if (isToday) {
                    todayRev.put(key, todayRev.get(key).add(q.getTotalPrice()));
                    gTodayRev = gTodayRev.add(q.getTotalPrice());
                }

                // Daily trend
                if (qDate != null && !qDate.isBefore(sevenDaysAgo) && !qDate.isAfter(today)) {
                    dailyMap.merge(qDate, q.getTotalPrice(), BigDecimal::add);
                }
            }

            // Advance collected (any status)
            if (q.getAdvancePaid() != null && q.getAdvancePaid().compareTo(BigDecimal.ZERO) > 0) {
                advanceCol.put(key, advanceCol.get(key).add(q.getAdvancePaid()));
                gAdvance = gAdvance.add(q.getAdvancePaid());
            }

            // Outstanding payment (only for active queues)
            if (isActive && q.getPaymentLeft() != null && q.getPaymentLeft().compareTo(BigDecimal.ZERO) > 0) {
                outstanding.put(key, outstanding.get(key).add(q.getPaymentLeft()));
                gOutstanding = gOutstanding.add(q.getPaymentLeft());
            }
        }

        // Build by_service list — known services first, then "general"
        List<Map<String, Object>> byService = new ArrayList<>();
        Set<String> allKeys = new LinkedHashSet<>();
        // Named services in creation order
        for (ServiceEntity svc : services) allKeys.add(svc.getId());
        // Add general and any orphaned keys
        allKeys.addAll(totalRev.keySet());

        for (String key : allKeys) {
            if (!totalRev.containsKey(key) && !served.containsKey(key)) continue; // skip completely unknown
            boolean isGeneral = "general".equals(key);
            long s = served.getOrDefault(key, 0L);
            BigDecimal rev = totalRev.getOrDefault(key, BigDecimal.ZERO);

            Map<String, Object> row = new LinkedHashMap<>();
            row.put("service_id",    isGeneral ? null : key);
            row.put("service_name",  isGeneral ? "General Queue" : nameMap.getOrDefault(key, "Unknown Service"));
            row.put("color",         isGeneral ? "#6B7280" : colorMap.getOrDefault(key, "#6B7280"));
            row.put("total_revenue", rev);
            row.put("today_revenue", todayRev.getOrDefault(key, BigDecimal.ZERO));
            row.put("advance_collected", advanceCol.getOrDefault(key, BigDecimal.ZERO));
            row.put("payment_outstanding", outstanding.getOrDefault(key, BigDecimal.ZERO));
            row.put("customers_served", s);
            row.put("total_customers", totalCustomers.getOrDefault(key, 0L));
            row.put("avg_revenue_per_customer",
                    s > 0 ? rev.divide(BigDecimal.valueOf(s), 2, RoundingMode.HALF_UP) : BigDecimal.ZERO);
            byService.add(row);
        }

        // Daily trend list
        List<Map<String, Object>> dailyTrend = dailyMap.entrySet().stream().map(e -> {
            Map<String, Object> d = new LinkedHashMap<>();
            d.put("date", e.getKey().toString());
            // Short label e.g. "Mon", "Tue"
            d.put("day", e.getKey().getDayOfWeek().toString().substring(0, 3));
            d.put("revenue", e.getValue());
            return d;
        }).collect(Collectors.toList());

        // Summary
        Map<String, Object> summary = new LinkedHashMap<>();
        summary.put("total_revenue",      gTotalRev);
        summary.put("today_revenue",      gTodayRev);
        summary.put("advance_collected",  gAdvance);
        summary.put("payment_outstanding", gOutstanding);
        summary.put("total_served",       gServed);

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("summary",     summary);
        result.put("by_service",  byService);
        result.put("daily_trend", dailyTrend);

        return ResponseEntity.ok(ApiResponse.success(result));
    }

    // POST /api/queue-types
    @PostMapping
    public ResponseEntity<ApiResponse<?>> create(@RequestBody Map<String, Object> body) {
        ServiceEntity svc = new ServiceEntity();
        svc.setBusinessId((String) body.get("business_id"));
        svc.setName((String) body.get("name"));
        svc.setIsActive(true);
        svc.setCreatedAt(OffsetDateTime.now(ZoneOffset.UTC));

        Map<String, Object> desc = Map.of(
                "label", body.getOrDefault("label", ""),
                "color", body.getOrDefault("color", "#36455e"),
                "max_capacity", body.getOrDefault("max_capacity", 50),
                "is_queue_type", true,
                "estimated_service_time", body.getOrDefault("estimated_service_time", 5)
        );
        try {
            svc.setDescription(objectMapper.writeValueAsString(desc));
        } catch (Exception ignored) {}

        if (body.get("price") != null) {
            svc.setPrice(new BigDecimal(body.get("price").toString()));
        }

        serviceRepo.save(svc);
        return ResponseEntity.ok(ApiResponse.success(toDto(svc), "Queue type created"));
    }

    // PATCH /api/queue-types/{id}
    @SuppressWarnings("unchecked")
    @PatchMapping("/{id}")
    public ResponseEntity<ApiResponse<?>> update(@PathVariable String id,
                                                  @RequestBody Map<String, Object> body) {
        ServiceEntity svc = serviceRepo.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Queue type not found"));

        if (body.containsKey("name")) svc.setName((String) body.get("name"));
        if (body.get("price") != null) svc.setPrice(new BigDecimal(body.get("price").toString()));
        svc.setUpdatedAt(OffsetDateTime.now(ZoneOffset.UTC));

        // Merge description JSON
        try {
            Map<String, Object> existing = svc.getDescription() != null
                    ? objectMapper.readValue(svc.getDescription(), Map.class)
                    : new java.util.HashMap<>();
            if (body.containsKey("color")) existing.put("color", body.get("color"));
            if (body.containsKey("max_capacity")) existing.put("max_capacity", body.get("max_capacity"));
            if (body.containsKey("estimated_service_time")) existing.put("estimated_service_time", body.get("estimated_service_time"));
            if (body.containsKey("is_active")) existing.put("is_active", body.get("is_active"));
            svc.setDescription(objectMapper.writeValueAsString(existing));
        } catch (Exception ignored) {}

        // Handle is_active at entity level if ServiceEntity supports it
        if (body.containsKey("is_active")) {
            Object ia = body.get("is_active");
            if (ia instanceof Boolean b) svc.setIsActive(b);
            else if (ia instanceof String s) svc.setIsActive(Boolean.parseBoolean(s));
        }

        serviceRepo.save(svc);
        return ResponseEntity.ok(ApiResponse.success(toDto(svc), "Queue type updated"));
    }

    // DELETE /api/queue-types/{id}
    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<?>> delete(@PathVariable String id) {
        if (!serviceRepo.existsById(id)) throw new ResourceNotFoundException("Queue type not found");
        serviceRepo.deleteById(id);
        return ResponseEntity.ok(ApiResponse.success(null, "Queue type deleted"));
    }

    private Map<String, Object> toDto(ServiceEntity svc) {
        Map<String, Object> dto = new java.util.HashMap<>();
        dto.put("id", svc.getId());
        dto.put("business_id", svc.getBusinessId());
        dto.put("name", svc.getName());
        dto.put("is_active", svc.getIsActive());
        dto.put("price", svc.getPrice() != null ? svc.getPrice() : BigDecimal.ZERO);
        try {
            if (svc.getDescription() != null) {
                @SuppressWarnings("unchecked")
                Map<String, Object> desc = objectMapper.readValue(svc.getDescription(), Map.class);
                dto.put("color", desc.get("color"));
                dto.put("max_capacity", desc.get("max_capacity"));
                dto.put("estimated_service_time", desc.get("estimated_service_time"));
                dto.put("label", desc.get("label"));
                dto.put("description", desc.get("label")); // frontend uses 'description'
            }
        } catch (Exception ignored) {}
        return dto;
    }
}
