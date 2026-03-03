package com.businessprohub.backend.controller;

import com.businessprohub.backend.dto.response.ApiResponse;
import com.businessprohub.backend.entity.ServiceEntity;
import com.businessprohub.backend.exception.ResourceNotFoundException;
import com.businessprohub.backend.repository.ServiceEntityRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/queue-types")
public class QueueTypeController {

    private final ServiceEntityRepository serviceRepo;
    private final ObjectMapper objectMapper;

    public QueueTypeController(ServiceEntityRepository serviceRepo, ObjectMapper objectMapper) {
        this.serviceRepo = serviceRepo;
        this.objectMapper = objectMapper;
    }

    // GET /api/queue-types?business_id=
    @GetMapping
    public ResponseEntity<ApiResponse<?>> list(@RequestParam("business_id") String businessId) {
        List<ServiceEntity> services = serviceRepo.findByBusinessIdAndIsActive(businessId, true);
        List<Map<String, Object>> mapped = services.stream().map(this::toDto).toList();
        return ResponseEntity.ok(ApiResponse.success(mapped));
    }

    // POST /api/queue-types
    @PostMapping
    public ResponseEntity<ApiResponse<?>> create(@RequestBody Map<String, Object> body) {
        ServiceEntity svc = new ServiceEntity();
        svc.setBusinessId((String) body.get("business_id"));
        svc.setName((String) body.get("name"));
        svc.setIsActive(true);
        svc.setCreatedAt(OffsetDateTime.now(ZoneOffset.UTC));

        Map<String, Object> desc = Map.of(
                "label", body.getOrDefault("label", ""),
                "color", body.getOrDefault("color", "#36455e"),
                "max_capacity", body.getOrDefault("max_capacity", 50),
                "is_queue_type", true,
                "estimated_service_time", body.getOrDefault("estimated_service_time", 5)
        );
        try {
            svc.setDescription(objectMapper.writeValueAsString(desc));
        } catch (Exception ignored) {}

        if (body.get("price") != null) {
            svc.setPrice(new BigDecimal(body.get("price").toString()));
        }

        serviceRepo.save(svc);
        return ResponseEntity.ok(ApiResponse.success(toDto(svc), "Queue type created"));
    }

    // PATCH /api/queue-types/{id}
    @SuppressWarnings("unchecked")
    @PatchMapping("/{id}")
    public ResponseEntity<ApiResponse<?>> update(@PathVariable String id,
                                                  @RequestBody Map<String, Object> body) {
        ServiceEntity svc = serviceRepo.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Queue type not found"));

        if (body.containsKey("name")) svc.setName((String) body.get("name"));
        if (body.get("price") != null) svc.setPrice(new BigDecimal(body.get("price").toString()));
        svc.setUpdatedAt(OffsetDateTime.now(ZoneOffset.UTC));

        // Merge description JSON
        try {
            Map<String, Object> existing = svc.getDescription() != null
                    ? objectMapper.readValue(svc.getDescription(), Map.class)
                    : new java.util.HashMap<>();
            if (body.containsKey("color")) existing.put("color", body.get("color"));
            if (body.containsKey("max_capacity")) existing.put("max_capacity", body.get("max_capacity"));
            if (body.containsKey("estimated_service_time")) existing.put("estimated_service_time", body.get("estimated_service_time"));
            svc.setDescription(objectMapper.writeValueAsString(existing));
        } catch (Exception ignored) {}

        serviceRepo.save(svc);
        return ResponseEntity.ok(ApiResponse.success(toDto(svc), "Queue type updated"));
    }

    // DELETE /api/queue-types/{id}
    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<?>> delete(@PathVariable String id) {
        if (!serviceRepo.existsById(id)) throw new ResourceNotFoundException("Queue type not found");
        serviceRepo.deleteById(id);
        return ResponseEntity.ok(ApiResponse.success(null, "Queue type deleted"));
    }

    private Map<String, Object> toDto(ServiceEntity svc) {
        Map<String, Object> dto = new java.util.HashMap<>();
        dto.put("id", svc.getId());
        dto.put("business_id", svc.getBusinessId());
        dto.put("name", svc.getName());
        dto.put("is_active", svc.getIsActive());
        dto.put("price", svc.getPrice() != null ? svc.getPrice() : BigDecimal.ZERO);
        try {
            if (svc.getDescription() != null) {
                Map<?, ?> desc = objectMapper.readValue(svc.getDescription(), Map.class);
                dto.put("color", desc.get("color"));
                dto.put("max_capacity", desc.get("max_capacity"));
                dto.put("estimated_service_time", desc.get("estimated_service_time"));
                dto.put("label", desc.get("label"));
            }
        } catch (Exception ignored) {}
        return dto;
    }
}
