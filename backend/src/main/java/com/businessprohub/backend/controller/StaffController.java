package com.businessprohub.backend.controller;

import com.businessprohub.backend.dto.response.ApiResponse;
import com.businessprohub.backend.entity.Staff;
import com.businessprohub.backend.repository.QueueRepository;
import com.businessprohub.backend.repository.StaffRepository;
import com.businessprohub.backend.service.SupabaseAuthAdminService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.util.*;

/**
 * Staff Management — business owner creates/edits/deletes staff members.
 * Each staff member can optionally have a Supabase auth account for limited dashboard login.
 *
 * Restricted pages for staff (enforced on frontend):
 *  - Staff Management (cannot add/remove other staff)
 *  - Pricing & Plans (cannot change subscription)
 */
@RestController
@RequestMapping("/api/staff")
public class StaffController {

    private final StaffRepository staffRepo;
    private final QueueRepository queueRepo;
    private final SupabaseAuthAdminService authAdminService;

    public StaffController(StaffRepository staffRepo,
                           QueueRepository queueRepo,
                           SupabaseAuthAdminService authAdminService) {
        this.staffRepo = staffRepo;
        this.queueRepo = queueRepo;
        this.authAdminService = authAdminService;
    }

    // ─── GET /api/staff?business_id= ─────────────────────────────────────────
    // List all staff for a business with customers_served count
    @GetMapping
    public ResponseEntity<ApiResponse<?>> list(@RequestParam("business_id") String businessId) {
        List<Staff> staffList = staffRepo.findByBusinessId(businessId);

        List<Map<String, Object>> result = new ArrayList<>();
        for (Staff s : staffList) {
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("id", s.getId());
            m.put("business_id", s.getBusinessId());
            m.put("auth_user_id", s.getAuthUserId());
            m.put("full_name", s.getFullName());
            m.put("email", s.getEmail());
            m.put("phone", s.getPhone());
            m.put("position", s.getPosition());
            m.put("is_active", s.getIsActive());
            m.put("created_at", s.getCreatedAt());
            // Count completed queue entries this staff member handled
            long served = s.getId() != null
                    ? queueRepo.countByServedByStaffIdAndStatus(s.getId(), "completed")
                    : 0L;
            m.put("customers_served", served);
            result.add(m);
        }

        Map<String, Object> response = new HashMap<>();
        response.put("data", result);
        response.put("total", result.size());
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    // ─── GET /api/staff/me?auth_user_id= ─────────────────────────────────────
    // Resolve staff record for a logged-in staff member (used by frontend layout)
    @GetMapping("/me")
    public ResponseEntity<ApiResponse<?>> me(@RequestParam("auth_user_id") String authUserId) {
        Optional<Staff> opt = staffRepo.findByAuthUserId(authUserId);
        if (opt.isEmpty()) {
            return ResponseEntity.ok(ApiResponse.success(null));
        }
        Staff s = opt.get();
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("id", s.getId());
        m.put("business_id", s.getBusinessId());
        m.put("full_name", s.getFullName());
        m.put("email", s.getEmail());
        m.put("position", s.getPosition());
        m.put("is_active", s.getIsActive());
        return ResponseEntity.ok(ApiResponse.success(m));
    }

    // ─── POST /api/staff ──────────────────────────────────────────────────────
    // Create a staff member and (optionally) a Supabase auth account
    @PostMapping
    public ResponseEntity<ApiResponse<?>> create(@RequestBody Map<String, Object> body) {
        String businessId = (String) body.get("business_id");
        String fullName   = (String) body.get("full_name");
        String email      = (String) body.get("email");
        String phone      = (String) body.get("phone");
        String position   = (String) body.getOrDefault("position", "Staff");

        if (businessId == null || fullName == null || email == null) {
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error("business_id, full_name and email are required"));
        }

        if (staffRepo.existsByEmailAndBusinessId(email, businessId)) {
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error("A staff member with this email already exists"));
        }

        // Generate a secure temporary password
        String tempPassword = generateTempPassword();

        // Create Supabase auth account for the staff member
        String authUserId = null;
        try {
            Map<?, ?> authUser = authAdminService.createUserWithMeta(
                    email,
                    tempPassword,
                    Map.of("role", "staff", "full_name", fullName)
            );
            if (authUser != null && authUser.get("id") != null) {
                authUserId = (String) authUser.get("id");
            }
        } catch (Exception e) {
            // Auth account creation failed — still save the staff record without auth
            authUserId = null;
        }

        Staff staff = new Staff();
        staff.setBusinessId(businessId);
        staff.setAuthUserId(authUserId);
        staff.setFullName(fullName);
        staff.setEmail(email);
        staff.setPhone(phone);
        staff.setPosition(position);
        staff.setIsActive(true);
        staff.setTempPassword(tempPassword); // Business owner can share this with the staff member
        staff.setCreatedAt(OffsetDateTime.now(ZoneOffset.UTC));
        staff.setUpdatedAt(OffsetDateTime.now(ZoneOffset.UTC));

        Staff saved = staffRepo.save(staff);

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("id", saved.getId());
        result.put("full_name", saved.getFullName());
        result.put("email", saved.getEmail());
        result.put("position", saved.getPosition());
        result.put("is_active", saved.getIsActive());
        result.put("auth_account_created", authUserId != null);
        result.put("temp_password", tempPassword); // Only returned once at creation
        result.put("customers_served", 0);

        return ResponseEntity.ok(ApiResponse.success(result, "Staff member added successfully"));
    }

    // ─── PUT /api/staff/{id} ──────────────────────────────────────────────────
    // Update staff info (name, phone, position, active status)
    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<?>> update(
            @PathVariable("id") String id,
            @RequestBody Map<String, Object> body) {

        Optional<Staff> opt = staffRepo.findById(id);
        if (opt.isEmpty()) {
            return ResponseEntity.status(404).body(ApiResponse.error("Staff member not found"));
        }

        Staff staff = opt.get();

        if (body.containsKey("full_name") && body.get("full_name") != null) {
            staff.setFullName((String) body.get("full_name"));
        }
        if (body.containsKey("phone")) {
            staff.setPhone((String) body.get("phone"));
        }
        if (body.containsKey("position") && body.get("position") != null) {
            staff.setPosition((String) body.get("position"));
        }
        if (body.containsKey("is_active") && body.get("is_active") != null) {
            staff.setIsActive((Boolean) body.get("is_active"));
        }
        staff.setUpdatedAt(OffsetDateTime.now(ZoneOffset.UTC));

        Staff saved = staffRepo.save(staff);

        long served = queueRepo.countByServedByStaffIdAndStatus(saved.getId(), "completed");

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("id", saved.getId());
        result.put("full_name", saved.getFullName());
        result.put("email", saved.getEmail());
        result.put("phone", saved.getPhone());
        result.put("position", saved.getPosition());
        result.put("is_active", saved.getIsActive());
        result.put("customers_served", served);

        return ResponseEntity.ok(ApiResponse.success(result, "Staff member updated"));
    }

    // ─── DELETE /api/staff/{id} ───────────────────────────────────────────────
    // Delete staff member and their Supabase auth account
    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<?>> delete(@PathVariable("id") String id) {
        Optional<Staff> opt = staffRepo.findById(id);
        if (opt.isEmpty()) {
            return ResponseEntity.status(404).body(ApiResponse.error("Staff member not found"));
        }

        Staff staff = opt.get();

        // Delete Supabase auth account if it exists
        if (staff.getAuthUserId() != null) {
            try {
                authAdminService.deleteUser(staff.getAuthUserId());
            } catch (Exception e) {
                // Log but don't block deletion of the staff record
            }
        }

        staffRepo.delete(staff);
        return ResponseEntity.ok(ApiResponse.success(null, "Staff member removed"));
    }

    // ─── GET /api/staff/{id}/queues ───────────────────────────────────────────
    // View customers served by a specific staff member
    @GetMapping("/{id}/queues")
    public ResponseEntity<ApiResponse<?>> staffQueues(@PathVariable("id") String staffId) {
        Optional<Staff> opt = staffRepo.findById(staffId);
        if (opt.isEmpty()) {
            return ResponseEntity.status(404).body(ApiResponse.error("Staff member not found"));
        }

        long total     = queueRepo.countByServedByStaffId(staffId);
        long completed = queueRepo.countByServedByStaffIdAndStatus(staffId, "completed");

        Map<String, Object> result = new HashMap<>();
        result.put("staff_id", staffId);
        result.put("staff_name", opt.get().getFullName());
        result.put("total_assigned", total);
        result.put("customers_served", completed);
        return ResponseEntity.ok(ApiResponse.success(result));
    }

    // ─────────────────────────────────────────────────────────────────────────
    private String generateTempPassword() {
        String chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$";
        StringBuilder sb = new StringBuilder();
        Random rnd = new Random();
        // Always start with a letter for safety
        sb.append("Staff_");
        for (int i = 0; i < 6; i++) {
            sb.append(chars.charAt(rnd.nextInt(chars.length())));
        }
        return sb.toString();
    }
}
