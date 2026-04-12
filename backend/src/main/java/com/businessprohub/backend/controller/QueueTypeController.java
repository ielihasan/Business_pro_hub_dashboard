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
        this.queueRepo   = queueRepo;
        this.objectMapper = objectMapper;
    }

    // ── GET /api/queue-types?business_id= ────────────────────────────────────
    @GetMapping
    public ResponseEntity<ApiResponse<?>> list(@RequestParam("business_id") String businessId) {
        List<ServiceEntity> services = serviceRepo.findByBusinessIdAndIsActive(businessId, true);
        List<Map<String, Object>> mapped = services.stream().map(this::toDto).toList();
        return ResponseEntity.ok(ApiResponse.success(mapped));
    }

    // ── GET /api/queue-types/revenue?business_id= ────────────────────────────
    @GetMapping("/revenue")
    public ResponseEntity<ApiResponse<?>> revenue(@RequestParam("business_id") String businessId) {

        List<Queue>         allQueues = queueRepo.findByBusinessId(businessId);
        List<ServiceEntity> services  = serviceRepo.findByBusinessId(businessId);

        /* Service name / color lookup */
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

        LocalDate today          = LocalDate.now(ZoneOffset.UTC);
        LocalDate fourteenDaysAgo = today.minusDays(13); // 14-day trend window

        List<String> activeStatuses = List.of("waiting", "in_progress", "called", "serving");

        /* ── Per-service accumulators ─────────────────────────────────────── */
        Map<String, BigDecimal> svTotalBooked   = new LinkedHashMap<>();
        Map<String, BigDecimal> svCompletedRev  = new LinkedHashMap<>();
        Map<String, BigDecimal> svAdvanceCol    = new LinkedHashMap<>();
        Map<String, BigDecimal> svOutstanding   = new LinkedHashMap<>();
        Map<String, Long>       svTotalVisits   = new LinkedHashMap<>();
        Map<String, Long>       svPaidVisits    = new LinkedHashMap<>();
        Map<String, Long>       svCompletedCnt  = new LinkedHashMap<>();

        /* ── Global accumulators ─────────────────────────────────────────── */
        BigDecimal gTotalBooked  = BigDecimal.ZERO;
        BigDecimal gCompletedRev = BigDecimal.ZERO;
        BigDecimal gAdvance      = BigDecimal.ZERO;
        BigDecimal gOutstanding  = BigDecimal.ZERO;
        long gTotalVisits   = 0;
        long gPaidVisits    = 0;
        long gCompleted     = 0;

        /* ── 14-day daily trend:  slot[0]=booked, slot[1]=advance ─────────── */
        TreeMap<LocalDate, BigDecimal[]> dailyMap = new TreeMap<>();
        for (int i = 0; i < 14; i++) {
            dailyMap.put(fourteenDaysAgo.plusDays(i),
                         new BigDecimal[]{ BigDecimal.ZERO, BigDecimal.ZERO });
        }

        /* ── Recent paid transactions (any status with price > 0) ─────────── */
        List<Map<String, Object>> allPaid = new ArrayList<>();

        /* ── Process all queue rows ──────────────────────────────────────── */
        for (Queue q : allQueues) {
            String key = (q.getServiceType() != null && !q.getServiceType().isBlank())
                    ? q.getServiceType() : "general";

            // Ensure key exists in all maps
            svTotalBooked.putIfAbsent(key,  BigDecimal.ZERO);
            svCompletedRev.putIfAbsent(key, BigDecimal.ZERO);
            svAdvanceCol.putIfAbsent(key,   BigDecimal.ZERO);
            svOutstanding.putIfAbsent(key,  BigDecimal.ZERO);
            svTotalVisits.put(key, svTotalVisits.getOrDefault(key, 0L) + 1);
            svPaidVisits.putIfAbsent(key,   0L);
            svCompletedCnt.putIfAbsent(key, 0L);
            gTotalVisits++;

            boolean isCompleted = "completed".equals(q.getStatus());
            boolean isActive    = activeStatuses.contains(q.getStatus());

            LocalDate qDate = q.getCreatedAt() != null
                    ? q.getCreatedAt().atZoneSameInstant(ZoneOffset.UTC).toLocalDate()
                    : null;

            /* Total booked = total_price for ANY entry that has a price */
            if (q.getTotalPrice() != null && q.getTotalPrice().compareTo(BigDecimal.ZERO) > 0) {
                svTotalBooked.put(key, svTotalBooked.get(key).add(q.getTotalPrice()));
                gTotalBooked  = gTotalBooked.add(q.getTotalPrice());
                svPaidVisits.put(key, svPaidVisits.get(key) + 1);
                gPaidVisits++;

                // Daily trend – booked slot
                if (qDate != null && !qDate.isBefore(fourteenDaysAgo) && !qDate.isAfter(today)) {
                    BigDecimal[] slot = dailyMap.get(qDate);
                    if (slot != null) slot[0] = slot[0].add(q.getTotalPrice());
                }

                // Build transaction record
                boolean isGenTxn = "general".equals(key);
                Map<String, Object> txn = new LinkedHashMap<>();
                txn.put("id",             q.getId());
                txn.put("ticket_no",      q.getTicketNo());
                txn.put("customer_name",  q.getCustomerName());
                txn.put("customer_phone", q.getCustomerPhone());
                txn.put("service_name",   isGenTxn ? "General Queue" : nameMap.getOrDefault(key, "Unknown Service"));
                txn.put("service_color",  isGenTxn ? "#6B7280" : colorMap.getOrDefault(key, "#6B7280"));
                txn.put("quantity",       q.getQuantity());
                txn.put("unit_price",     q.getUnitPrice());
                txn.put("total_price",    q.getTotalPrice());
                txn.put("advance_paid",   q.getAdvancePaid() != null ? q.getAdvancePaid() : BigDecimal.ZERO);
                txn.put("payment_left",   q.getPaymentLeft() != null ? q.getPaymentLeft() : BigDecimal.ZERO);
                txn.put("status",         q.getStatus());
                txn.put("created_at",     q.getCreatedAt() != null ? q.getCreatedAt().toString() : null);
                allPaid.add(txn);
            }

            /* Completed revenue (subset of total_booked) */
            if (isCompleted && q.getTotalPrice() != null && q.getTotalPrice().compareTo(BigDecimal.ZERO) > 0) {
                svCompletedRev.put(key, svCompletedRev.get(key).add(q.getTotalPrice()));
                gCompletedRev = gCompletedRev.add(q.getTotalPrice());
                svCompletedCnt.put(key, svCompletedCnt.get(key) + 1);
                gCompleted++;
            }

            /* Advance collected (all statuses — money already received) */
            if (q.getAdvancePaid() != null && q.getAdvancePaid().compareTo(BigDecimal.ZERO) > 0) {
                svAdvanceCol.put(key, svAdvanceCol.get(key).add(q.getAdvancePaid()));
                gAdvance = gAdvance.add(q.getAdvancePaid());

                // Daily trend – advance slot
                if (qDate != null && !qDate.isBefore(fourteenDaysAgo) && !qDate.isAfter(today)) {
                    BigDecimal[] slot = dailyMap.get(qDate);
                    if (slot != null) slot[1] = slot[1].add(q.getAdvancePaid());
                }
            }

            /* Outstanding = payment_left on ACTIVE (non-cancelled) entries only */
            if (isActive && q.getPaymentLeft() != null && q.getPaymentLeft().compareTo(BigDecimal.ZERO) > 0) {
                svOutstanding.put(key, svOutstanding.get(key).add(q.getPaymentLeft()));
                gOutstanding = gOutstanding.add(q.getPaymentLeft());
            }
        }

        /* ── Build by_service list ───────────────────────────────────────── */
        List<Map<String, Object>> byService = new ArrayList<>();
        Set<String> allKeys = new LinkedHashSet<>();
        // Named services first (in DB order), then orphan keys
        for (ServiceEntity svc : services) allKeys.add(svc.getId());
        allKeys.addAll(svTotalBooked.keySet());

        for (String key : allKeys) {
            if (!svTotalBooked.containsKey(key)) continue;
            boolean isGen   = "general".equals(key);
            long    visits  = svTotalVisits.getOrDefault(key, 0L);
            long    paid    = svPaidVisits.getOrDefault(key, 0L);
            BigDecimal booked = svTotalBooked.getOrDefault(key, BigDecimal.ZERO);

            Map<String, Object> row = new LinkedHashMap<>();
            row.put("service_id",         isGen ? null : key);
            row.put("service_name",       isGen ? "General Queue" : nameMap.getOrDefault(key, "Unknown Service"));
            row.put("color",              isGen ? "#6B7280" : colorMap.getOrDefault(key, "#6B7280"));
            row.put("total_booked",       booked);
            row.put("completed_revenue",  svCompletedRev.getOrDefault(key, BigDecimal.ZERO));
            row.put("advance_collected",  svAdvanceCol.getOrDefault(key, BigDecimal.ZERO));
            row.put("payment_outstanding",svOutstanding.getOrDefault(key, BigDecimal.ZERO));
            row.put("total_visits",       visits);
            row.put("paid_visits",        paid);
            row.put("completed_count",    svCompletedCnt.getOrDefault(key, 0L));
            row.put("avg_booking_value",  paid > 0
                    ? booked.divide(BigDecimal.valueOf(paid), 2, RoundingMode.HALF_UP)
                    : BigDecimal.ZERO);
            byService.add(row);
        }

        /* ── Sort recent transactions by date desc, limit 20 ────────────── */
        allPaid.sort((a, b) -> {
            String da = (String) a.get("created_at");
            String db = (String) b.get("created_at");
            if (da == null && db == null) return 0;
            if (da == null) return 1;
            if (db == null) return -1;
            return db.compareTo(da);
        });
        List<Map<String, Object>> recentTransactions =
                allPaid.subList(0, Math.min(20, allPaid.size()));

        /* ── Build 14-day trend list ─────────────────────────────────────── */
        List<Map<String, Object>> dailyTrend = dailyMap.entrySet().stream().map(e -> {
            Map<String, Object> d = new LinkedHashMap<>();
            d.put("date",    e.getKey().toString());
            d.put("day",     e.getKey().getDayOfWeek().toString().substring(0, 3)
                             + " " + e.getKey().getDayOfMonth());
            d.put("booked",  e.getValue()[0]);
            d.put("advance", e.getValue()[1]);
            return d;
        }).collect(Collectors.toList());

        /* ── Summary ─────────────────────────────────────────────────────── */
        Map<String, Object> summary = new LinkedHashMap<>();
        summary.put("total_booked",        gTotalBooked);
        summary.put("completed_revenue",   gCompletedRev);
        summary.put("advance_collected",   gAdvance);
        summary.put("payment_outstanding", gOutstanding);
        summary.put("total_visits",        gTotalVisits);
        summary.put("paid_visits",         gPaidVisits);
        summary.put("completed_count",     gCompleted);

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("summary",             summary);
        result.put("by_service",          byService);
        result.put("daily_trend",         dailyTrend);
        result.put("recent_transactions", recentTransactions);

        return ResponseEntity.ok(ApiResponse.success(result));
    }

    // ── POST /api/queue-types ─────────────────────────────────────────────────
    @PostMapping
    public ResponseEntity<ApiResponse<?>> create(@RequestBody Map<String, Object> body) {
        ServiceEntity svc = new ServiceEntity();
        svc.setBusinessId((String) body.get("business_id"));
        svc.setName((String) body.get("name"));
        svc.setIsActive(true);
        svc.setCreatedAt(OffsetDateTime.now(ZoneOffset.UTC));

        Map<String, Object> desc = Map.of(
                "label",                  body.getOrDefault("label", ""),
                "color",                  body.getOrDefault("color", "#36455e"),
                "max_capacity",           body.getOrDefault("max_capacity", 50),
                "is_queue_type",          true,
                "estimated_service_time", body.getOrDefault("estimated_service_time", 5)
        );
        try { svc.setDescription(objectMapper.writeValueAsString(desc)); }
        catch (Exception ignored) {}

        if (body.get("price") != null)
            svc.setPrice(new BigDecimal(body.get("price").toString()));

        serviceRepo.save(svc);
        return ResponseEntity.ok(ApiResponse.success(toDto(svc), "Queue type created"));
    }

    // ── PATCH /api/queue-types/{id} ──────────────────────────────────────────
    @SuppressWarnings("unchecked")
    @PatchMapping("/{id}")
    public ResponseEntity<ApiResponse<?>> update(@PathVariable String id,
                                                  @RequestBody Map<String, Object> body) {
        ServiceEntity svc = serviceRepo.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Queue type not found"));

        if (body.containsKey("name"))  svc.setName((String) body.get("name"));
        if (body.get("price") != null) svc.setPrice(new BigDecimal(body.get("price").toString()));
        svc.setUpdatedAt(OffsetDateTime.now(ZoneOffset.UTC));

        try {
            Map<String, Object> existing = svc.getDescription() != null
                    ? objectMapper.readValue(svc.getDescription(), Map.class)
                    : new java.util.HashMap<>();
            if (body.containsKey("color"))                  existing.put("color",                  body.get("color"));
            if (body.containsKey("max_capacity"))           existing.put("max_capacity",           body.get("max_capacity"));
            if (body.containsKey("estimated_service_time")) existing.put("estimated_service_time", body.get("estimated_service_time"));
            svc.setDescription(objectMapper.writeValueAsString(existing));
        } catch (Exception ignored) {}

        if (body.containsKey("is_active")) {
            Object ia = body.get("is_active");
            if (ia instanceof Boolean b)   svc.setIsActive(b);
            else if (ia instanceof String s) svc.setIsActive(Boolean.parseBoolean(s));
        }

        serviceRepo.save(svc);
        return ResponseEntity.ok(ApiResponse.success(toDto(svc), "Queue type updated"));
    }

    // ── DELETE /api/queue-types/{id} ─────────────────────────────────────────
    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<?>> delete(@PathVariable String id) {
        if (!serviceRepo.existsById(id)) throw new ResourceNotFoundException("Queue type not found");
        serviceRepo.deleteById(id);
        return ResponseEntity.ok(ApiResponse.success(null, "Queue type deleted"));
    }

    // ── toDto helper ─────────────────────────────────────────────────────────
    private Map<String, Object> toDto(ServiceEntity svc) {
        Map<String, Object> dto = new java.util.HashMap<>();
        dto.put("id",        svc.getId());
        dto.put("business_id", svc.getBusinessId());
        dto.put("name",      svc.getName());
        dto.put("is_active", svc.getIsActive());
        dto.put("price",     svc.getPrice() != null ? svc.getPrice() : BigDecimal.ZERO);
        try {
            if (svc.getDescription() != null) {
                @SuppressWarnings("unchecked")
                Map<String, Object> desc = objectMapper.readValue(svc.getDescription(), Map.class);
                dto.put("color",                  desc.get("color"));
                dto.put("max_capacity",           desc.get("max_capacity"));
                dto.put("estimated_service_time", desc.get("estimated_service_time"));
                dto.put("description",            desc.get("label")); // frontend uses 'description'
            }
        } catch (Exception ignored) {}
        return dto;
    }
}
