package com.businessprohub.backend.controller;

import com.businessprohub.backend.dto.response.ApiResponse;
import com.businessprohub.backend.entity.Order;
import com.businessprohub.backend.exception.BadRequestException;
import com.businessprohub.backend.exception.ResourceNotFoundException;
import com.businessprohub.backend.repository.OrderRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/orders")
public class OrderController {

    private final OrderRepository orderRepo;

    public OrderController(OrderRepository orderRepo) {
        this.orderRepo = orderRepo;
    }

    // GET /api/orders?business_id=&status=&page=1&page_size=20
    @GetMapping
    public ResponseEntity<ApiResponse<?>> list(
            @RequestParam("business_id") String businessId,
            @RequestParam(required = false) String status,
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(value = "page_size", defaultValue = "20") int pageSize) {
        List<Order> all;
        if (status != null) {
            all = orderRepo.findByBusinessIdAndStatus(businessId, status);
        } else {
            all = orderRepo.findByBusinessId(businessId);
        }
        int total = all.size();
        int fromIndex = Math.max(0, (page - 1) * pageSize);
        int toIndex = Math.min(fromIndex + pageSize, total);
        List<Order> paged = fromIndex >= total ? List.of() : all.subList(fromIndex, toIndex);
        int totalPages = (int) Math.ceil((double) total / pageSize);

        Map<String, Object> result = new HashMap<>();
        result.put("data", paged);
        result.put("total", total);
        result.put("page", page);
        result.put("page_size", pageSize);
        result.put("total_pages", totalPages);
        return ResponseEntity.ok(ApiResponse.success(result));
    }

    // POST /api/orders
    @PostMapping
    public ResponseEntity<ApiResponse<?>> create(@RequestBody Map<String, Object> body) {
        Order order = new Order();
        order.setBusinessId((String) body.get("business_id"));
        order.setCustomerId((String) body.get("customer_id"));
        order.setQueueId((String) body.get("queue_id"));
        order.setStatus("pending");
        order.setPaymentStatus("unpaid");
        order.setNotes((String) body.get("notes"));
        order.setCreatedAt(OffsetDateTime.now(ZoneOffset.UTC));

        if (body.containsKey("total_amount")) {
            order.setTotalAmount(new BigDecimal(body.get("total_amount").toString()));
        }
        orderRepo.save(order);
        return ResponseEntity.ok(ApiResponse.success(order, "Order created"));
    }

    // GET /api/orders/{id}
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<?>> getById(@PathVariable String id) {
        Order order = orderRepo.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Order not found"));
        return ResponseEntity.ok(ApiResponse.success(order));
    }

    // PATCH /api/orders/{id}
    @PatchMapping("/{id}")
    public ResponseEntity<ApiResponse<?>> update(@PathVariable String id,
                                                  @RequestBody Map<String, Object> body) {
        Order order = orderRepo.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Order not found"));

        if (body.containsKey("status")) order.setStatus((String) body.get("status"));
        if (body.containsKey("payment_status")) order.setPaymentStatus((String) body.get("payment_status"));
        if (body.containsKey("notes")) order.setNotes((String) body.get("notes"));
        if (body.containsKey("total_amount")) {
            order.setTotalAmount(new BigDecimal(body.get("total_amount").toString()));
        }
        order.setUpdatedAt(OffsetDateTime.now(ZoneOffset.UTC));
        orderRepo.save(order);
        return ResponseEntity.ok(ApiResponse.success(order, "Order updated"));
    }

    // DELETE /api/orders/{id}
    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<?>> delete(@PathVariable String id) {
        Order order = orderRepo.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Order not found"));
        if (!List.of("pending", "cancelled").contains(order.getStatus())) {
            throw new BadRequestException("Only pending or cancelled orders can be deleted");
        }
        orderRepo.deleteById(id);
        return ResponseEntity.ok(ApiResponse.success(null, "Order deleted"));
    }
}
