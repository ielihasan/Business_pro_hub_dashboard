package com.businessprohub.backend.controller;

import com.businessprohub.backend.dto.response.ApiResponse;
import com.businessprohub.backend.repository.BusinessRepository;
import com.businessprohub.backend.repository.CustomerRepository;
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

    private final BusinessRepository businessRepo;
    private final CustomerRepository customerRepo;
    private final QueueRepository queueRepo;
    private final OrderRepository orderRepo;

    public AdminStatsController(BusinessRepository businessRepo,
                                 CustomerRepository customerRepo,
                                 QueueRepository queueRepo,
                                 OrderRepository orderRepo) {
        this.businessRepo = businessRepo;
        this.customerRepo = customerRepo;
        this.queueRepo = queueRepo;
        this.orderRepo = orderRepo;
    }

    @GetMapping
    public ResponseEntity<ApiResponse<?>> getStats() {
        // Businesses — pure count queries, no findAll()
        long totalBusinesses  = businessRepo.count();
        long activeBusinesses = businessRepo.countByIsActive(true);

        // Customers (walk-in records across all businesses)
        long totalCustomers = customerRepo.count();

        // Queues — DB-side count queries only
        long activeQueues    = queueRepo.countActiveQueues();
        long completedQueues = queueRepo.countByStatus("completed");
        long totalQueues     = queueRepo.count();

        // Orders — DB-side count queries only
        long totalOrders     = orderRepo.count();
        long pendingOrders   = orderRepo.countByStatus("pending");
        long completedOrders = orderRepo.countByStatus("completed");

        Map<String, Object> stats = new LinkedHashMap<>();
        stats.put("totalBusinesses",  totalBusinesses);
        stats.put("activeBusinesses", activeBusinesses);
        stats.put("totalCustomers",   totalCustomers);
        stats.put("activeQueues",     activeQueues);
        stats.put("completedQueues",  completedQueues);
        stats.put("totalQueues",      totalQueues);
        stats.put("totalOrders",      totalOrders);
        stats.put("pendingOrders",    pendingOrders);
        stats.put("completedOrders",  completedOrders);

        return ResponseEntity.ok(ApiResponse.success(stats));
    }
}
