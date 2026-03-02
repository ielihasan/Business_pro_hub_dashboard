package com.businessprohub.backend.controller;

import com.businessprohub.backend.dto.response.ApiResponse;
import com.businessprohub.backend.entity.Payment;
import com.businessprohub.backend.entity.Subscription;
import com.businessprohub.backend.exception.ResourceNotFoundException;
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

    public PricingController(SubscriptionRepository subRepo, PaymentRepository paymentRepo) {
        this.subRepo = subRepo;
        this.paymentRepo = paymentRepo;
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

        BigDecimal planPrice = body.get("plan_price") != null
                ? new BigDecimal(body.get("plan_price").toString()) : BigDecimal.ZERO;

        Subscription sub = new Subscription();
        sub.setBusinessId(businessId);
        sub.setPlanId((String) body.get("plan_id"));
        sub.setStatus("active");
        sub.setCurrentPeriodStart(OffsetDateTime.now(ZoneOffset.UTC));
        sub.setCreatedAt(OffsetDateTime.now(ZoneOffset.UTC));
        subRepo.save(sub);

        // Record payment
        Payment payment = new Payment();
        payment.setBusinessId(businessId);
        payment.setPlanId(sub.getPlanId());
        payment.setAmount(planPrice);
        payment.setCurrency("PKR");
        payment.setStatus("completed");
        payment.setDescription("Subscription: " + sub.getPlanId());
        payment.setCreatedAt(OffsetDateTime.now(ZoneOffset.UTC));
        paymentRepo.save(payment);

        return ResponseEntity.ok(ApiResponse.success(sub, "Subscribed successfully"));
    }

    // DELETE /api/pricing?subscription_id=
    @DeleteMapping
    public ResponseEntity<ApiResponse<?>> cancel(@RequestParam("subscription_id") String id) {
        Subscription sub = subRepo.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Subscription not found"));
        sub.setStatus("cancelled");
        sub.setUpdatedAt(OffsetDateTime.now(ZoneOffset.UTC));
        subRepo.save(sub);
        return ResponseEntity.ok(ApiResponse.success(null, "Subscription cancelled"));
    }
}
