package com.businessprohub.backend.controller;

import com.businessprohub.backend.dto.response.ApiResponse;
import com.businessprohub.backend.entity.Order;
import com.businessprohub.backend.entity.Payment;
import com.businessprohub.backend.entity.Queue;
import com.businessprohub.backend.entity.ServiceEntity;
import com.businessprohub.backend.exception.ResourceNotFoundException;
import com.businessprohub.backend.repository.BusinessRepository;
import com.businessprohub.backend.repository.CustomerRepository;
import com.businessprohub.backend.repository.OrderRepository;
import com.businessprohub.backend.repository.PaymentRepository;
import com.businessprohub.backend.repository.QueueRepository;
import com.businessprohub.backend.repository.ServiceEntityRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.time.*;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/admin/businesses")
public class AdminBusinessDetailController {

    private final BusinessRepository businessRepo;
    private final QueueRepository queueRepo;
    private final CustomerRepository customerRepo;
    private final PaymentRepository paymentRepo;
    private final OrderRepository orderRepo;
    private final ServiceEntityRepository serviceRepo;

    public AdminBusinessDetailController(BusinessRepository businessRepo,
                                          QueueRepository queueRepo,
                                          CustomerRepository customerRepo,
                                          PaymentRepository paymentRepo,
                                          OrderRepository orderRepo,
                                          ServiceEntityRepository serviceRepo) {
        this.businessRepo = businessRepo;
        this.queueRepo = queueRepo;
        this.customerRepo = customerRepo;
        this.paymentRepo = paymentRepo;
        this.orderRepo = orderRepo;
        this.serviceRepo = serviceRepo;
    }

    /**
     * GET /api/admin/businesses/{id}
     * Returns full business profile + aggregated stats for the admin detail page.
     */
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<?>> getBusinessDetail(@PathVariable String id) {
        var business = businessRepo.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Business not found: " + id));

        /* ── Queue stats ─────────────────────────────────────────────────── */
        List<Queue> allQueues = queueRepo.findByBusinessId(id);

        OffsetDateTime dayStart = LocalDate.now(ZoneOffset.UTC)
                .atStartOfDay().atOffset(ZoneOffset.UTC);
        long todayQueues = allQueues.stream()
                .filter(q -> q.getCreatedAt() != null && q.getCreatedAt().isAfter(dayStart))
                .count();

        Map<String, Long> queueByStatus = allQueues.stream()
                .filter(q -> q.getStatus() != null)
                .collect(Collectors.groupingBy(Queue::getStatus, Collectors.counting()));

        /* ── Customer count ──────────────────────────────────────────────── */
        long totalCustomers = customerRepo.countByBusinessId(id);

        /* ── Order stats ─────────────────────────────────────────────────── */
        List<Order> orders = orderRepo.findByBusinessId(id);
        Map<String, Long> ordersByStatus = orders.stream()
                .filter(o -> o.getStatus() != null)
                .collect(Collectors.groupingBy(Order::getStatus, Collectors.counting()));

        /* ── Payment / revenue stats ─────────────────────────────────────── */
        List<Payment> payments = paymentRepo.findByBusinessId(id);

        BigDecimal totalRevenue = payments.stream()
                .filter(p -> "completed".equals(p.getStatus()) && p.getAmount() != null)
                .map(Payment::getAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        long successfulPayments = payments.stream()
                .filter(p -> "completed".equals(p.getStatus())).count();
        long pendingPayments = payments.stream()
                .filter(p -> "pending".equals(p.getStatus())).count();
        long failedPayments = payments.stream()
                .filter(p -> "failed".equals(p.getStatus())).count();

        /* ── Service stats ───────────────────────────────────────────────── */
        List<ServiceEntity> services = serviceRepo.findByBusinessId(id);
        long activeServices = services.stream()
                .filter(s -> Boolean.TRUE.equals(s.getIsActive())).count();

        /* ── Monthly revenue (last 6 months) ─────────────────────────────── */
        DateTimeFormatter monthFmt = DateTimeFormatter.ofPattern("MMM yyyy");
        List<Map<String, Object>> monthlyRevenue = new ArrayList<>();
        for (int i = 5; i >= 0; i--) {
            YearMonth ym = YearMonth.now(ZoneOffset.UTC).minusMonths(i);
            String label = ym.atDay(1).format(monthFmt);
            OffsetDateTime start = ym.atDay(1).atStartOfDay().atOffset(ZoneOffset.UTC);
            OffsetDateTime end   = ym.atEndOfMonth().atTime(23, 59, 59).atOffset(ZoneOffset.UTC);

            BigDecimal rev = payments.stream()
                    .filter(p -> "completed".equals(p.getStatus())
                            && p.getCreatedAt() != null
                            && !p.getCreatedAt().isBefore(start)
                            && !p.getCreatedAt().isAfter(end)
                            && p.getAmount() != null)
                    .map(Payment::getAmount)
                    .reduce(BigDecimal.ZERO, BigDecimal::add);

            Map<String, Object> m = new LinkedHashMap<>();
            m.put("month", label);
            m.put("revenue", rev);
            monthlyRevenue.add(m);
        }

        /* ── Recent queues (last 5) ──────────────────────────────────────── */
        List<Map<String, Object>> recentQueues = allQueues.stream()
                .filter(q -> q.getCreatedAt() != null)
                .sorted(Comparator.comparing(Queue::getCreatedAt).reversed())
                .limit(5)
                .map(q -> {
                    Map<String, Object> m = new LinkedHashMap<>();
                    m.put("id", q.getId());
                    m.put("customer_name", q.getCustomerName() != null ? q.getCustomerName() : "Walk-in");
                    m.put("customer_phone", q.getCustomerPhone());
                    m.put("service_type", q.getServiceType());
                    m.put("status", q.getStatus());
                    m.put("position", q.getPosition());
                    m.put("priority", q.getPriority());
                    m.put("created_at", q.getCreatedAt());
                    m.put("completed_at", q.getCompletedAt());
                    return m;
                })
                .collect(Collectors.toList());

        /* ── Recent payments (last 5) ────────────────────────────────────── */
        List<Map<String, Object>> recentPayments = payments.stream()
                .filter(p -> p.getCreatedAt() != null)
                .sorted(Comparator.comparing(Payment::getCreatedAt).reversed())
                .limit(5)
                .map(p -> {
                    Map<String, Object> m = new LinkedHashMap<>();
                    m.put("id", p.getId());
                    m.put("plan_id", p.getPlanId());
                    m.put("amount", p.getAmount());
                    m.put("status", p.getStatus());
                    m.put("payment_method", p.getPaymentMethod());
                    m.put("transaction_id", p.getTransactionId());
                    m.put("created_at", p.getCreatedAt());
                    return m;
                })
                .collect(Collectors.toList());

        /* ── Services list ───────────────────────────────────────────────── */
        List<Map<String, Object>> servicesList = services.stream()
                .map(s -> {
                    Map<String, Object> m = new LinkedHashMap<>();
                    m.put("id", s.getId());
                    m.put("name", s.getName());
                    m.put("price", s.getPrice() != null ? s.getPrice() : BigDecimal.ZERO);
                    m.put("is_active", Boolean.TRUE.equals(s.getIsActive()));
                    m.put("created_at", s.getCreatedAt());
                    return m;
                })
                .collect(Collectors.toList());

        /* ── Assemble response ───────────────────────────────────────────── */
        Map<String, Object> stats = new LinkedHashMap<>();
        stats.put("totalQueues", allQueues.size());
        stats.put("todayQueues", todayQueues);
        stats.put("queueByStatus", queueByStatus);
        stats.put("totalCustomers", totalCustomers);
        stats.put("totalOrders", orders.size());
        stats.put("ordersByStatus", ordersByStatus);
        stats.put("totalRevenue", totalRevenue);
        stats.put("successfulPayments", successfulPayments);
        stats.put("pendingPayments", pendingPayments);
        stats.put("failedPayments", failedPayments);
        stats.put("activeServices", activeServices);
        stats.put("totalServices", services.size());
        stats.put("monthlyRevenue", monthlyRevenue);
        stats.put("recentQueues", recentQueues);
        stats.put("recentPayments", recentPayments);
        stats.put("services", servicesList);

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("business", business);
        result.put("stats", stats);

        return ResponseEntity.ok(ApiResponse.success(result));
    }
}
