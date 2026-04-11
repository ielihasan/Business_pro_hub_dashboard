package com.businessprohub.backend.controller;

import com.businessprohub.backend.dto.response.ApiResponse;
import com.businessprohub.backend.entity.Customer;
import com.businessprohub.backend.entity.Queue;
import com.businessprohub.backend.repository.CustomerRepository;
import com.businessprohub.backend.repository.QueueRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.util.*;

@RestController
@RequestMapping("/api/customers")
public class CustomerController {

    private final QueueRepository queueRepo;
    private final CustomerRepository customerRepo;

    public CustomerController(QueueRepository queueRepo, CustomerRepository customerRepo) {
        this.queueRepo = queueRepo;
        this.customerRepo = customerRepo;
    }

    // GET /api/customers?business_id=&page=1&page_size=20 — aggregated from queues
    @GetMapping
    public ResponseEntity<ApiResponse<?>> list(
            @RequestParam("business_id") String businessId,
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(value = "page_size", defaultValue = "20") int pageSize) {

        List<Queue> allEntries = queueRepo.findByBusinessIdAndCreatedAtAfterOrderByPositionAsc(
                businessId, OffsetDateTime.now(ZoneOffset.UTC).minusYears(1));

        OffsetDateTime todayStart = LocalDate.now(ZoneOffset.UTC)
                .atStartOfDay().atOffset(ZoneOffset.UTC);

        // Aggregate by phone or customer_id
        Map<String, Map<String, Object>> customerMap = new LinkedHashMap<>();
        for (Queue q : allEntries) {
            String key = q.getCustomerId() != null ? q.getCustomerId() : q.getCustomerPhone();
            if (key == null) continue;

            customerMap.computeIfAbsent(key, k -> {
                Map<String, Object> c = new HashMap<>();
                c.put("customer_id", q.getCustomerId());
                c.put("customer_name", q.getCustomerName());
                c.put("customer_phone", q.getCustomerPhone());
                c.put("customer_email", q.getCustomerEmail());
                c.put("visit_count", 0);
                c.put("completed_visits", 0);
                c.put("cancelled_visits", 0);
                c.put("total_spent", BigDecimal.ZERO);
                c.put("first_visit", q.getCreatedAt());
                c.put("last_visit", q.getCreatedAt());
                c.put("visit_history", new ArrayList<Map<String, Object>>());
                c.put("services_used", new LinkedHashSet<String>());
                return c;
            });

            Map<String, Object> c = customerMap.get(key);
            c.put("visit_count", (int) c.get("visit_count") + 1);

            // Count by status
            if ("completed".equals(q.getStatus())) {
                c.put("completed_visits", (int) c.get("completed_visits") + 1);
            } else if ("cancelled".equals(q.getStatus()) || "no_show".equals(q.getStatus())) {
                c.put("cancelled_visits", (int) c.get("cancelled_visits") + 1);
            }

            // Sum spending from total_price
            if (q.getTotalPrice() != null) {
                BigDecimal current = (BigDecimal) c.get("total_spent");
                c.put("total_spent", current.add(q.getTotalPrice()));
            }

            // Track first/last visit
            if (q.getCreatedAt() != null) {
                OffsetDateTime first = (OffsetDateTime) c.get("first_visit");
                OffsetDateTime last = (OffsetDateTime) c.get("last_visit");
                if (first == null || q.getCreatedAt().isBefore(first)) {
                    c.put("first_visit", q.getCreatedAt());
                }
                if (last == null || q.getCreatedAt().isAfter(last)) {
                    c.put("last_visit", q.getCreatedAt());
                }
            }

            // Collect service types
            @SuppressWarnings("unchecked")
            Set<String> services = (Set<String>) c.get("services_used");
            if (q.getServiceType() != null && !q.getServiceType().isBlank()) {
                services.add(q.getServiceType());
            }

            // Build visit history entry
            @SuppressWarnings("unchecked")
            List<Map<String, Object>> history = (List<Map<String, Object>>) c.get("visit_history");
            Map<String, Object> visit = new HashMap<>();
            visit.put("date", q.getCreatedAt());
            visit.put("service", q.getServiceType());
            visit.put("status", q.getStatus());
            visit.put("total_price", q.getTotalPrice());
            visit.put("ticket_no", q.getTicketNo());
            history.add(visit);
        }

        // Convert sets to lists and compute new_today flag
        List<Map<String, Object>> all = new ArrayList<>();
        int newToday = 0;
        for (Map<String, Object> c : customerMap.values()) {
            @SuppressWarnings("unchecked")
            Set<String> services = (Set<String>) c.get("services_used");
            c.put("services_used", new ArrayList<>(services));

            OffsetDateTime firstVisit = (OffsetDateTime) c.get("first_visit");
            boolean isNew = firstVisit != null && firstVisit.isAfter(todayStart);
            c.put("is_new_today", isNew);
            if (isNew) newToday++;

            all.add(c);
        }

        int total = all.size();
        int repeatCount = (int) all.stream()
                .filter(c -> (int) c.get("visit_count") > 1)
                .count();
        int totalVisits = all.stream().mapToInt(c -> (int) c.get("visit_count")).sum();

        int fromIndex = Math.max(0, (page - 1) * pageSize);
        int toIndex = Math.min(fromIndex + pageSize, total);
        List<Map<String, Object>> paged = fromIndex >= total ? List.of() : all.subList(fromIndex, toIndex);
        int totalPages = (int) Math.ceil((double) total / pageSize);

        Map<String, Object> result = new HashMap<>();
        result.put("data", paged);
        result.put("total", total);
        result.put("page", page);
        result.put("page_size", pageSize);
        result.put("total_pages", totalPages);
        result.put("stats", Map.of(
                "total_customers", total,
                "new_customers_today", newToday,
                "repeat_customers", repeatCount,
                "total_visits", totalVisits
        ));
        return ResponseEntity.ok(ApiResponse.success(result));
    }

    // POST /api/customers — add manual customer
    @PostMapping
    public ResponseEntity<ApiResponse<?>> create(@RequestBody Map<String, Object> body) {
        Customer customer = new Customer();
        customer.setBusinessId((String) body.get("business_id"));
        customer.setName((String) body.get("name"));
        customer.setPhone((String) body.get("phone"));
        customer.setEmail((String) body.get("email"));
        customer.setNotes((String) body.get("notes"));
        customer.setCreatedAt(OffsetDateTime.now(ZoneOffset.UTC));
        customerRepo.save(customer);
        return ResponseEntity.ok(ApiResponse.success(customer, "Customer added"));
    }
}
