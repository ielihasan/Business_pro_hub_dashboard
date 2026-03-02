package com.businessprohub.backend.controller;

import com.businessprohub.backend.dto.response.ApiResponse;
import com.businessprohub.backend.entity.Business;
import com.businessprohub.backend.entity.Payment;
import com.businessprohub.backend.entity.Subscription;
import com.businessprohub.backend.repository.BusinessRepository;
import com.businessprohub.backend.repository.PaymentRepository;
import com.businessprohub.backend.repository.SubscriptionRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/admin")
public class AdminPaymentsController {

    private final PaymentRepository paymentRepo;
    private final SubscriptionRepository subRepo;
    private final BusinessRepository businessRepo;

    public AdminPaymentsController(PaymentRepository paymentRepo,
                                   SubscriptionRepository subRepo,
                                   BusinessRepository businessRepo) {
        this.paymentRepo = paymentRepo;
        this.subRepo = subRepo;
        this.businessRepo = businessRepo;
    }

    // GET /api/admin/payments
    @GetMapping("/payments")
    public ResponseEntity<ApiResponse<?>> getPayments() {
        List<Payment> rawPayments = paymentRepo.findAll();
        List<Subscription> subs = subRepo.findAll();

        // Build business lookup map
        Map<String, Business> businessMap = businessRepo.findAll().stream()
                .collect(Collectors.toMap(Business::getId, b -> b, (a, b) -> a));

        // Enrich payments with business info
        List<Map<String, Object>> payments = rawPayments.stream().map(p -> {
            Map<String, Object> m = new HashMap<>();
            m.put("id", p.getId());
            m.put("business_id", p.getBusinessId());
            m.put("plan_id", p.getPlanId());
            m.put("amount", p.getAmount());
            m.put("currency", p.getCurrency());
            m.put("status", p.getStatus());
            m.put("payment_method", p.getPaymentMethod());
            m.put("description", p.getDescription());
            m.put("transaction_id", p.getTransactionId());
            m.put("created_at", p.getCreatedAt());
            Business biz = businessMap.get(p.getBusinessId());
            m.put("business_name", biz != null ? biz.getBusinessName() : "");
            m.put("business_email", biz != null ? biz.getEmail() : "");
            m.put("owner_name", biz != null ? biz.getFullName() : "");
            m.put("plan_name", p.getPlanId() != null ? capitalize(p.getPlanId()) : "");
            return m;
        }).collect(Collectors.toList());

        // Compute stats
        BigDecimal totalRevenue = rawPayments.stream()
                .filter(p -> "completed".equals(p.getStatus()))
                .map(Payment::getAmount)
                .filter(Objects::nonNull)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        long successfulPayments = rawPayments.stream().filter(p -> "completed".equals(p.getStatus())).count();
        long pendingPayments   = rawPayments.stream().filter(p -> "pending".equals(p.getStatus())).count();
        long failedPayments    = rawPayments.stream().filter(p -> "failed".equals(p.getStatus())).count();

        Map<String, Long> planDistribution = rawPayments.stream()
                .collect(Collectors.groupingBy(
                        p -> p.getPlanId() != null ? p.getPlanId() : "unknown",
                        Collectors.counting()));

        // Monthly revenue (last 6 months order)
        DateTimeFormatter fmt = DateTimeFormatter.ofPattern("MMM yyyy");
        Map<String, Map<String, Object>> monthlyMap = new LinkedHashMap<>();
        for (Payment p : rawPayments) {
            if (p.getCreatedAt() == null) continue;
            String month = p.getCreatedAt().format(fmt);
            monthlyMap.computeIfAbsent(month, k -> {
                Map<String, Object> entry = new HashMap<>();
                entry.put("month", k);
                entry.put("revenue", BigDecimal.ZERO);
                entry.put("transactions", 0);
                return entry;
            });
            if ("completed".equals(p.getStatus()) && p.getAmount() != null) {
                BigDecimal prev = (BigDecimal) monthlyMap.get(month).get("revenue");
                monthlyMap.get(month).put("revenue", prev.add(p.getAmount()));
            }
            monthlyMap.get(month).put("transactions", (int) monthlyMap.get(month).get("transactions") + 1);
        }

        Map<String, Object> stats = new HashMap<>();
        stats.put("totalRevenue", totalRevenue);
        stats.put("totalTransactions", rawPayments.size());
        stats.put("successfulPayments", successfulPayments);
        stats.put("pendingPayments", pendingPayments);
        stats.put("failedPayments", failedPayments);
        stats.put("activeSubscriptions", subs.stream().filter(s -> "active".equals(s.getStatus())).count());
        stats.put("planDistribution", planDistribution);
        stats.put("monthlyRevenue", new ArrayList<>(monthlyMap.values()));

        Map<String, Object> result = new HashMap<>();
        result.put("payments", payments);
        result.put("subscriptions", subs);
        result.put("stats", stats);

        return ResponseEntity.ok(ApiResponse.success(result));
    }

    private String capitalize(String s) {
        if (s == null || s.isEmpty()) return s;
        return Character.toUpperCase(s.charAt(0)) + s.substring(1);
    }
}
