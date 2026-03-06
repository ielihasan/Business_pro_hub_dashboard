package com.businessprohub.backend.controller;

import com.businessprohub.backend.dto.response.ApiResponse;
import com.businessprohub.backend.entity.Business;
import com.businessprohub.backend.entity.Payment;
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

    // Plan metadata: id → [displayName, monthlyPriceInPKR]
    private static final Map<String, Object[]> PLAN_META = Map.of(
            "free",         new Object[]{"Free",         0},
            "starter",      new Object[]{"Starter",      2999},
            "professional", new Object[]{"Professional", 5999},
            "enterprise",   new Object[]{"Enterprise",   14999}
    );

    public AdminPaymentsController(PaymentRepository paymentRepo,
                                   SubscriptionRepository subRepo,
                                   BusinessRepository businessRepo) {
        this.paymentRepo = paymentRepo;
        this.subRepo = subRepo;
        this.businessRepo = businessRepo;
    }

    /**
     * GET /api/admin/payments
     *
     * ?type=stats         → { data: { stats: {...} } }
     * ?type=subscriptions → { data: { subscriptions: [...] } }
     * default             → { data: { payments: [...] }, pagination: { page, limit, total, totalPages } }
     */
    @GetMapping("/payments")
    public ResponseEntity<?> getPayments(
            @RequestParam(required = false) String type,
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "10") int limit,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String plan,
            @RequestParam(required = false) String search) {

        List<Business> allBusinesses = businessRepo.findAll();
        Map<String, Business> businessMap = allBusinesses.stream()
                .collect(Collectors.toMap(Business::getId, b -> b, (a, b) -> a));

        if ("stats".equals(type)) {
            return buildStats(allBusinesses);
        } else if ("subscriptions".equals(type)) {
            return buildSubscriptions(allBusinesses);
        } else {
            return buildPayments(businessMap, page, limit, status, plan, search);
        }
    }

    // ── Stats ─────────────────────────────────────────────────────────────────

    private ResponseEntity<?> buildStats(List<Business> businesses) {
        List<Payment> rawPayments = paymentRepo.findAll();

        BigDecimal totalRevenue = rawPayments.stream()
                .filter(p -> "completed".equals(p.getStatus()))
                .map(Payment::getAmount)
                .filter(Objects::nonNull)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        long successful = rawPayments.stream().filter(p -> "completed".equals(p.getStatus())).count();
        long pending    = rawPayments.stream().filter(p -> "pending".equals(p.getStatus())).count();
        long failed     = rawPayments.stream().filter(p -> "failed".equals(p.getStatus())).count();

        // Plan distribution from businesses.subscription_plan (current state)
        Map<String, Long> planDistribution = businesses.stream()
                .collect(Collectors.groupingBy(
                        b -> b.getSubscriptionPlan() != null ? b.getSubscriptionPlan() : "free",
                        Collectors.counting()));

        // Monthly revenue — last 6 months, sorted chronologically
        DateTimeFormatter fmt = DateTimeFormatter.ofPattern("MMM yyyy");
        Map<String, Map<String, Object>> monthlyMap = new LinkedHashMap<>();
        rawPayments.stream()
                .filter(p -> p.getCreatedAt() != null)
                .sorted(Comparator.comparing(p -> p.getCreatedAt()))
                .forEach(p -> {
                    String month = p.getCreatedAt().format(fmt);
                    monthlyMap.computeIfAbsent(month, k -> {
                        Map<String, Object> e = new HashMap<>();
                        e.put("month", k);
                        e.put("revenue", BigDecimal.ZERO);
                        e.put("transactions", 0);
                        return e;
                    });
                    if ("completed".equals(p.getStatus()) && p.getAmount() != null) {
                        BigDecimal prev = (BigDecimal) monthlyMap.get(month).get("revenue");
                        monthlyMap.get(month).put("revenue", prev.add(p.getAmount()));
                    }
                    monthlyMap.get(month).put("transactions",
                            (int) monthlyMap.get(month).get("transactions") + 1);
                });

        List<Map<String, Object>> monthlyRevenue = new ArrayList<>(monthlyMap.values());
        if (monthlyRevenue.size() > 6) {
            monthlyRevenue = monthlyRevenue.subList(monthlyRevenue.size() - 6, monthlyRevenue.size());
        }

        Map<String, Object> stats = new HashMap<>();
        stats.put("totalRevenue", totalRevenue);
        stats.put("totalTransactions", rawPayments.size());
        stats.put("successfulPayments", successful);
        stats.put("pendingPayments", pending);
        stats.put("failedPayments", failed);
        stats.put("planDistribution", planDistribution);
        stats.put("monthlyRevenue", monthlyRevenue);

        Map<String, Object> result = new HashMap<>();
        result.put("stats", stats);
        return ResponseEntity.ok(ApiResponse.success(result));
    }

    // ── Business Subscriptions ────────────────────────────────────────────────

    private ResponseEntity<?> buildSubscriptions(List<Business> businesses) {
        List<Map<String, Object>> subscriptions = businesses.stream().map(b -> {
            String planId = b.getSubscriptionPlan() != null ? b.getSubscriptionPlan() : "free";
            Object[] meta = PLAN_META.getOrDefault(planId, new Object[]{"Free", 0});

            Map<String, Object> planDetails = new HashMap<>();
            planDetails.put("name", meta[0]);
            planDetails.put("price", meta[1]);

            Map<String, Object> sub = new HashMap<>();
            sub.put("id", b.getId());
            sub.put("full_name", b.getFullName());
            sub.put("email", b.getEmail());
            sub.put("business_name", b.getBusinessName());
            sub.put("subscription_plan", planId);
            sub.put("subscription_status",
                    b.getSubscriptionStatus() != null ? b.getSubscriptionStatus() : "active");
            sub.put("subscription_expires_at", b.getSubscriptionExpiresAt());
            sub.put("created_at", b.getCreatedAt());
            sub.put("plan_details", planDetails);
            return sub;
        }).collect(Collectors.toList());

        Map<String, Object> result = new HashMap<>();
        result.put("subscriptions", subscriptions);
        return ResponseEntity.ok(ApiResponse.success(result));
    }

    // ── Payments list (paginated + filtered) ──────────────────────────────────

    private ResponseEntity<?> buildPayments(Map<String, Business> businessMap,
                                             int page, int limit,
                                             String status, String plan, String search) {
        List<Payment> rawPayments = paymentRepo.findAll();

        // Enrich all payments with business info
        List<Map<String, Object>> enriched = rawPayments.stream().map(p -> {
            Business biz = businessMap.get(p.getBusinessId());
            Map<String, Object> m = new HashMap<>();
            m.put("id", p.getId());
            m.put("business_id", p.getBusinessId());
            m.put("plan_id", p.getPlanId());
            m.put("plan_name", p.getPlanId() != null ? capitalize(p.getPlanId()) : "");
            m.put("amount", p.getAmount());
            m.put("currency", p.getCurrency());
            m.put("status", p.getStatus());
            m.put("payment_method", p.getPaymentMethod());
            m.put("description", p.getDescription());
            m.put("transaction_id", p.getTransactionId());
            m.put("created_at", p.getCreatedAt());
            m.put("business_name", biz != null ? biz.getBusinessName() : "");
            m.put("business_email", biz != null ? biz.getEmail() : "");
            m.put("owner_name", biz != null ? biz.getFullName() : "");
            return m;
        }).filter(m -> {
            if (status != null && !status.isBlank() && !status.equals(m.get("status"))) return false;
            if (plan != null && !plan.isBlank() && !plan.equals(m.get("plan_id")))       return false;
            if (search != null && !search.isBlank()) {
                String q     = search.toLowerCase();
                String name  = String.valueOf(m.getOrDefault("business_name", "")).toLowerCase();
                String email = String.valueOf(m.getOrDefault("business_email", "")).toLowerCase();
                String txn   = String.valueOf(m.getOrDefault("transaction_id", "")).toLowerCase();
                if (!name.contains(q) && !email.contains(q) && !txn.contains(q)) return false;
            }
            return true;
        }).sorted(Comparator.comparing(
                m -> m.get("created_at") != null ? m.get("created_at").toString() : "",
                Comparator.reverseOrder()
        )).collect(Collectors.toList());

        int total      = enriched.size();
        int totalPages = (int) Math.ceil((double) total / limit);
        int from       = Math.min((page - 1) * limit, total);
        int to         = Math.min(from + limit, total);
        List<Map<String, Object>> paged = enriched.subList(from, to);

        // Frontend reads: data.data?.payments  and  data.pagination?.totalPages
        // So we return a raw map (not wrapped in ApiResponse) to put pagination at top level
        Map<String, Object> response = new HashMap<>();
        response.put("data", Map.of("payments", paged));

        Map<String, Object> pagination = new HashMap<>();
        pagination.put("page", page);
        pagination.put("limit", limit);
        pagination.put("total", total);
        pagination.put("totalPages", Math.max(1, totalPages));
        response.put("pagination", pagination);

        return ResponseEntity.ok(response);
    }

    private String capitalize(String s) {
        if (s == null || s.isEmpty()) return s;
        return Character.toUpperCase(s.charAt(0)) + s.substring(1);
    }
}
