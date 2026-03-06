package com.businessprohub.backend.controller;

import com.businessprohub.backend.dto.response.ApiResponse;
import com.businessprohub.backend.entity.Business;
import com.businessprohub.backend.entity.Payment;
import com.businessprohub.backend.entity.Subscription;
import com.businessprohub.backend.exception.ResourceNotFoundException;
import com.businessprohub.backend.repository.BusinessRepository;
import com.businessprohub.backend.repository.PaymentRepository;
import com.businessprohub.backend.repository.SubscriptionRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/pricing")
public class PricingController {

    private final SubscriptionRepository subRepo;
    private final PaymentRepository paymentRepo;
    private final BusinessRepository businessRepo;

    public PricingController(SubscriptionRepository subRepo,
                             PaymentRepository paymentRepo,
                             BusinessRepository businessRepo) {
        this.subRepo = subRepo;
        this.paymentRepo = paymentRepo;
        this.businessRepo = businessRepo;
    }

    // GET /api/pricing?business_id=
    @GetMapping
    public ResponseEntity<ApiResponse<?>> get(@RequestParam("business_id") String businessId) {
        List<Subscription> subs = subRepo.findByBusinessId(businessId);
        List<Payment> payments = paymentRepo.findByBusinessId(businessId);

        Subscription activeSub = subs.stream()
                .filter(s -> "active".equals(s.getStatus()))
                .findFirst().orElse(null);

        Map<String, Object> result = new HashMap<>();
        result.put("subscription", activeSub);
        result.put("current_plan", activeSub != null ? activeSub.getPlanId() : "free");
        result.put("payments", payments);
        return ResponseEntity.ok(ApiResponse.success(result));
    }

    // POST /api/pricing — subscribe to a plan
    @PostMapping
    public ResponseEntity<ApiResponse<?>> subscribe(@RequestBody Map<String, Object> body) {
        String businessId = (String) body.get("business_id");
        String planId     = (String) body.get("plan_id");
        String planName   = body.get("plan_name") != null ? body.get("plan_name").toString() : planId;
        String paymentMethod = body.get("payment_method") != null
                ? body.get("payment_method").toString() : "card";

        BigDecimal planPrice = body.get("plan_price") != null
                ? new BigDecimal(body.get("plan_price").toString()) : BigDecimal.ZERO;

        // Cancel any existing active subscription for this business
        subRepo.findByBusinessId(businessId).stream()
                .filter(s -> "active".equals(s.getStatus()))
                .forEach(s -> {
                    s.setStatus("cancelled");
                    s.setUpdatedAt(OffsetDateTime.now(ZoneOffset.UTC));
                    subRepo.save(s);
                });

        // Create new subscription
        Subscription sub = new Subscription();
        sub.setBusinessId(businessId);
        sub.setPlanId(planId);
        sub.setStatus("active");
        sub.setCurrentPeriodStart(OffsetDateTime.now(ZoneOffset.UTC));
        sub.setCurrentPeriodEnd(OffsetDateTime.now(ZoneOffset.UTC).plusMonths(1));
        sub.setCreatedAt(OffsetDateTime.now(ZoneOffset.UTC));
        subRepo.save(sub);

        // Record payment
        Payment payment = new Payment();
        payment.setBusinessId(businessId);
        payment.setPlanId(planId);
        payment.setAmount(planPrice);
        payment.setCurrency("PKR");
        payment.setStatus("completed");
        payment.setPaymentMethod(paymentMethod);
        payment.setDescription(planName + " Plan - Monthly Subscription");
        payment.setTransactionId("TXN-" + System.currentTimeMillis() + "-"
                + Integer.toHexString((int) (Math.random() * 0xFFFFF)).toUpperCase());
        payment.setCreatedAt(OffsetDateTime.now(ZoneOffset.UTC));
        paymentRepo.save(payment);

        // Sync subscription_plan + subscription_status to businesses table
        businessRepo.findById(businessId).ifPresent(biz -> {
            biz.setSubscriptionPlan(planId);
            biz.setSubscriptionStatus("active");
            biz.setSubscriptionExpiresAt(sub.getCurrentPeriodEnd());
            biz.setUpdatedAt(OffsetDateTime.now(ZoneOffset.UTC));
            businessRepo.save(biz);
        });

        return ResponseEntity.ok(ApiResponse.success(sub, "Subscribed successfully"));
    }

    // DELETE /api/pricing?business_id=
    @DeleteMapping
    public ResponseEntity<ApiResponse<?>> cancel(@RequestParam("business_id") String businessId) {
        Subscription sub = subRepo.findByBusinessId(businessId).stream()
                .filter(s -> "active".equals(s.getStatus()))
                .findFirst()
                .orElseThrow(() -> new ResourceNotFoundException("No active subscription found"));

        sub.setStatus("cancelled");
        sub.setUpdatedAt(OffsetDateTime.now(ZoneOffset.UTC));
        subRepo.save(sub);

        // Sync cancellation to businesses table
        businessRepo.findById(businessId).ifPresent(biz -> {
            biz.setSubscriptionPlan("free");
            biz.setSubscriptionStatus("cancelled");
            biz.setSubscriptionExpiresAt(null);
            biz.setUpdatedAt(OffsetDateTime.now(ZoneOffset.UTC));
            businessRepo.save(biz);
        });

        return ResponseEntity.ok(ApiResponse.success(null, "Subscription cancelled"));
    }
}
