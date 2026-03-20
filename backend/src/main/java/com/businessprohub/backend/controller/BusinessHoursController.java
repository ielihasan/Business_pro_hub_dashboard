package com.businessprohub.backend.controller;

import com.businessprohub.backend.dto.response.ApiResponse;
import com.businessprohub.backend.entity.BusinessHours;
import com.businessprohub.backend.entity.SpecialHours;
import com.businessprohub.backend.exception.ResourceNotFoundException;
import com.businessprohub.backend.repository.BusinessHoursRepository;
import com.businessprohub.backend.repository.SpecialHoursRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/business-hours")
public class BusinessHoursController {

    private final BusinessHoursRepository hoursRepo;
    private final SpecialHoursRepository specialRepo;

    public BusinessHoursController(BusinessHoursRepository hoursRepo,
                                    SpecialHoursRepository specialRepo) {
        this.hoursRepo = hoursRepo;
        this.specialRepo = specialRepo;
    }

    // GET /api/business-hours?business_id=
    @GetMapping
    public ResponseEntity<ApiResponse<?>> get(@RequestParam("business_id") String businessId) {
        List<BusinessHours> weekly = hoursRepo.findByBusinessId(businessId);
        List<SpecialHours> special = specialRepo.findByBusinessId(businessId);
        return ResponseEntity.ok(ApiResponse.success(Map.of(
                "weekly", weekly,
                "special", special
        )));
    }

    // POST /api/business-hours — upsert weekly + add special
    @SuppressWarnings("unchecked")
    @PostMapping
    public ResponseEntity<ApiResponse<?>> upsert(@RequestBody Map<String, Object> body) {
        String businessId = (String) body.get("business_id");

        // Handle weekly hours
        if (body.containsKey("weekly")) {
            List<Map<String, Object>> weekly = (List<Map<String, Object>>) body.get("weekly");
            for (Map<String, Object> dayData : weekly) {
                Integer dayOfWeek = (Integer) dayData.get("day_of_week");
                List<BusinessHours> existing = hoursRepo.findByBusinessIdAndDayOfWeek(businessId, dayOfWeek);
                BusinessHours bh = existing.isEmpty() ? new BusinessHours() : existing.get(0);
                bh.setBusinessId(businessId);
                bh.setDayOfWeek(dayOfWeek);
                bh.setOpenTime((String) dayData.get("open_time"));
                bh.setCloseTime((String) dayData.get("close_time"));
                Boolean isClosed = dayData.get("is_closed") != null ? (Boolean) dayData.get("is_closed") : false;
                bh.setIsOpen(!isClosed);
                bh.setBreakStart((String) dayData.get("break_start"));
                bh.setBreakEnd((String) dayData.get("break_end"));
                hoursRepo.save(bh);
            }
        }

        // Handle special hours — accepts both "special" (single map) and "special_hours" (list)
        List<Map<String, Object>> specialList = null;
        if (body.containsKey("special_hours")) {
            specialList = (List<Map<String, Object>>) body.get("special_hours");
        } else if (body.containsKey("special")) {
            specialList = List.of((Map<String, Object>) body.get("special"));
        }
        if (specialList != null) {
            for (Map<String, Object> specialData : specialList) {
                SpecialHours sh = new SpecialHours();
                sh.setBusinessId(businessId);
                sh.setDate(LocalDate.parse((String) specialData.get("date")));
                sh.setOpenTime((String) specialData.get("open_time"));
                sh.setCloseTime((String) specialData.get("close_time"));
                Boolean shIsClosed = specialData.get("is_closed") != null ? (Boolean) specialData.get("is_closed") : false;
                sh.setIsOpen(!shIsClosed);
                String reason = specialData.containsKey("reason") ? (String) specialData.get("reason") : (String) specialData.get("description");
                sh.setReason(reason);
                sh.setCreatedAt(OffsetDateTime.now(ZoneOffset.UTC));
                specialRepo.save(sh);
            }
        }

        return ResponseEntity.ok(ApiResponse.success(null, "Business hours updated"));
    }

    // DELETE /api/business-hours?special_id=
    @DeleteMapping
    public ResponseEntity<ApiResponse<?>> deleteSpecial(@RequestParam("special_id") String specialId) {
        if (!specialRepo.existsById(specialId)) {
            throw new ResourceNotFoundException("Special hours not found");
        }
        specialRepo.deleteById(specialId);
        return ResponseEntity.ok(ApiResponse.success(null, "Special hours deleted"));
    }
}
