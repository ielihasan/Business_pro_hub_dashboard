package com.businessprohub.backend.controller;

import com.businessprohub.backend.dto.response.ApiResponse;
import com.businessprohub.backend.entity.Queue;
import com.businessprohub.backend.exception.ResourceNotFoundException;
import com.businessprohub.backend.repository.QueueRepository;
import com.businessprohub.backend.service.QrCodeService;
import com.businessprohub.backend.service.QueueService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@Slf4j
@RestController
@RequestMapping("/api/queue")
public class QueueController {

    private final QueueService queueService;
    private final QueueRepository queueRepo;
    private final QrCodeService qrCodeService;

    public QueueController(QueueService queueService,
                           QueueRepository queueRepo,
                           QrCodeService qrCodeService) {
        this.queueService = queueService;
        this.queueRepo = queueRepo;
        this.qrCodeService = qrCodeService;
    }

    // GET /api/queue?business_id=&status=&date=
    @GetMapping
    public ResponseEntity<ApiResponse<?>> getQueue(
            @RequestParam("business_id") String businessId,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String date) {
        return ResponseEntity.ok(ApiResponse.success(queueService.getQueue(businessId, status, date)));
    }

    // POST /api/queue — walk-in
    @PostMapping
    public ResponseEntity<ApiResponse<?>> addWalkIn(@RequestBody Map<String, Object> body) {
        Map<String, Object> result = queueService.addWalkIn(body);
        return ResponseEntity.ok(ApiResponse.success(result.get("data"), "Customer added to queue"));
    }

    // POST /api/queue/join — QR / mobile
    @PostMapping("/join")
    public ResponseEntity<ApiResponse<?>> joinQueue(@RequestBody Map<String, Object> body) {
        Map<String, Object> result = queueService.joinQueue(body);
        return ResponseEntity.ok(ApiResponse.success(result.get("data"), (String) result.get("message")));
    }

    // GET /api/queue/info
    @GetMapping("/info")
    public ResponseEntity<ApiResponse<?>> getInfo(
            @RequestParam("business_id") String businessId,
            @RequestParam(value = "queue_type_id", required = false) String queueTypeId) {
        return ResponseEntity.ok(ApiResponse.success(
                queueService.getQueueInfo(businessId, queueTypeId)));
    }

    // GET /api/queue/status
    @GetMapping("/status")
    public ResponseEntity<ApiResponse<?>> getStatus(
            @RequestParam(required = false) String ticket,
            @RequestParam(required = false) String phone,
            @RequestParam(value = "business_id", required = false) String businessId) {
        return ResponseEntity.ok(ApiResponse.success(
                queueService.getStatus(ticket, phone, businessId)));
    }

    // GET /api/queue/qrcode?business_id=&queue_type_id=
    @GetMapping("/qrcode")
    public ResponseEntity<ApiResponse<?>> getQrCode(
            @RequestParam("business_id") String businessId,
            @RequestParam(value = "queue_type_id", required = false) String queueTypeId) {
        try {
            String dataUrl = qrCodeService.generateQrCodeDataUrl(businessId, queueTypeId);
            return ResponseEntity.ok(ApiResponse.success(Map.of("qr_code", dataUrl)));
        } catch (Exception e) {
            log.error("Failed to generate QR code for business {}: {}", businessId, e.getMessage(), e);
            return ResponseEntity.internalServerError().body(ApiResponse.error("Failed to generate QR code"));
        }
    }

    // POST /api/queue/qrcode
    @PostMapping("/qrcode")
    public ResponseEntity<ApiResponse<?>> postQrCode(@RequestBody Map<String, Object> body) {
        try {
            String businessId = (String) body.get("business_id");
            String queueTypeId = (String) body.get("queue_type_id");
            String dataUrl = qrCodeService.generateQrCodeDataUrl(businessId, queueTypeId);
            return ResponseEntity.ok(ApiResponse.success(Map.of("qr_code", dataUrl)));
        } catch (Exception e) {
            log.error("Failed to generate QR code: {}", e.getMessage(), e);
            return ResponseEntity.internalServerError().body(ApiResponse.error("Failed to generate QR code"));
        }
    }

    // GET /api/queue/{id}
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<?>> getById(@PathVariable String id) {
        Queue q = queueRepo.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Queue entry not found"));
        return ResponseEntity.ok(ApiResponse.success(q));
    }

    // PATCH /api/queue/{id}
    @PatchMapping("/{id}")
    public ResponseEntity<ApiResponse<?>> update(@PathVariable String id,
                                                  @RequestBody Map<String, Object> body) {
        Queue updated = queueService.updateEntry(id, body);
        return ResponseEntity.ok(ApiResponse.success(updated, "Queue entry updated"));
    }

    // POST /api/queue/{id}/leave — public endpoint to cancel/leave a queue (replaces the old public PATCH)
    @PostMapping("/{id}/leave")
    public ResponseEntity<ApiResponse<?>> leaveQueue(@PathVariable String id) {
        Queue updated = queueService.updateEntry(id, Map.of("status", "cancelled"));
        return ResponseEntity.ok(ApiResponse.success(updated, "Left queue successfully"));
    }

    // DELETE /api/queue/{id}
    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<?>> delete(@PathVariable String id) {
        if (!queueRepo.existsById(id)) {
            throw new ResourceNotFoundException("Queue entry not found");
        }
        queueRepo.deleteById(id);
        return ResponseEntity.ok(ApiResponse.success(null, "Queue entry deleted"));
    }
}
