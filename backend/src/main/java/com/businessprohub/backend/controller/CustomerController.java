package com.businessprohub.backend.controller;

import com.businessprohub.backend.dto.response.ApiResponse;
import com.businessprohub.backend.entity.Customer;
import com.businessprohub.backend.entity.Queue;
import com.businessprohub.backend.repository.CustomerRepository;
import com.businessprohub.backend.repository.QueueRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

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

    // GET /api/customers?business_id= — aggregated from queues
    @GetMapping
    public ResponseEntity<ApiResponse<?>> list(@RequestParam("business_id") String businessId) {
        List<Queue> allEntries = queueRepo.findByBusinessIdAndCreatedAtAfterOrderByPositionAsc(
                businessId, OffsetDateTime.now(ZoneOffset.UTC).minusYears(1));

        // Aggregate by phone or customer_id
        Map<String, Map<String, Object>> customerMap = new LinkedHashMap<>();
        for (Queue q : allEntries) {
            String key = q.getCustomerId() != null ? q.getCustomerId() : q.getCustomerPhone();
            if (key == null) continue;
            customerMap.computeIfAbsent(key, k -> {
                Map<String, Object> c = new HashMap<>();
                c.put("customer_name", q.getCustomerName());
                c.put("customer_phone", q.getCustomerPhone());
                c.put("customer_email", q.getCustomerEmail());
                c.put("visit_count", 0);
                c.put("last_visit", q.getCreatedAt());
                return c;
            });
            Map<String, Object> c = customerMap.get(key);
            c.put("visit_count", (int) c.get("visit_count") + 1);
            if (q.getCreatedAt() != null) {
                OffsetDateTime last = (OffsetDateTime) c.get("last_visit");
                if (last == null || q.getCreatedAt().isAfter(last)) {
                    c.put("last_visit", q.getCreatedAt());
                }
            }
        }

        return ResponseEntity.ok(ApiResponse.success(new ArrayList<>(customerMap.values())));
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
