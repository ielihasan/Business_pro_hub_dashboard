package com.businessprohub.backend.controller;

import com.businessprohub.backend.dto.response.ApiResponse;
import com.businessprohub.backend.repository.AppUserRepository;
import com.businessprohub.backend.repository.BusinessApplicationRepository;
import com.businessprohub.backend.repository.BusinessRepository;
import com.businessprohub.backend.repository.OrderRepository;
import com.businessprohub.backend.repository.QueueRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.LinkedHashMap;
import java.util.Map;

/**
 * GET /api/admin/stats
 * Returns platform-wide stats for the admin dashboard overview.
 * Queries across all businesses — not scoped to a single business_id.
 */
@RestController
@RequestMapping("/api/admin/stats")
public class AdminStatsController {

    private final BusinessRepository            businessRepo;
    private final AppUserRepository             appUserRepo;
    private final BusinessApplicationRepository applicationRepo;
    private final QueueRepository               queueRepo;
    private final OrderRepository               orderRepo;

    public AdminStatsController(BusinessRepository            businessRepo,
                                AppUserRepository             appUserRepo,
                                BusinessApplicationRepository applicationRepo,
                                QueueRepository               queueRepo,
                                OrderRepository               orderRepo) {
        this.businessRepo    = businessRepo;
        this.appUserRepo     = appUserRepo;
        this.applicationRepo = applicationRepo;
        this.queueRepo       = queueRepo;
        this.orderRepo       = orderRepo;
    }

    @GetMapping
    public ResponseEntity<ApiResponse<?>> getStats() {
        // Businesses (businesses table = approved only)
        long totalBusinesses  = businessRepo.count();
        long activeBusinesses = businessRepo.countByIsActive(true);

        // Pending applications (business_applications where not approved and not rejected)
        long pendingApplications = applicationRepo.countByIsApprovedFalseAndIsRejectedFalse();

        // Total customers = mobile app users (users table), not walk-in customer records
        long totalCustomers = appUserRepo.count();

        // Queues — DB-side count queries only
        long activeQueues    = queueRepo.countActiveQueues();
        long completedQueues = queueRepo.countByStatus("completed");
        long totalQueues     = queueRepo.count();

        // Orders — DB-side count queries only
        long totalOrders     = orderRepo.count();
        long pendingOrders   = orderRepo.countByStatus("pending");
        long completedOrders = orderRepo.countByStatus("completed");

        Map<String, Object> stats = new LinkedHashMap<>();
        stats.put("totalBusinesses",     totalBusinesses);
        stats.put("activeBusinesses",    activeBusinesses);
        stats.put("pendingApplications", pendingApplications);   // ← pending from business_applications
        stats.put("totalCustomers",      totalCustomers);         // ← mobile app users count
        stats.put("activeQueues",        activeQueues);
        stats.put("completedQueues",     completedQueues);
        stats.put("totalQueues",         totalQueues);
        stats.put("totalOrders",         totalOrders);
        stats.put("pendingOrders",       pendingOrders);
        stats.put("completedOrders",     completedOrders);

        return ResponseEntity.ok(ApiResponse.success(stats));
    }
}
