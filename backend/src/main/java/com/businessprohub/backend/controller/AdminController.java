package com.businessprohub.backend.controller;

import com.businessprohub.backend.dto.response.ApiResponse;
import com.businessprohub.backend.entity.Admin;
import com.businessprohub.backend.exception.ResourceNotFoundException;
import com.businessprohub.backend.repository.AdminRepository;
import com.businessprohub.backend.service.SupabaseAuthAdminService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admins")
@PreAuthorize("hasRole('ADMIN')")
public class AdminController {

    private final AdminRepository adminRepo;
    private final SupabaseAuthAdminService authAdmin;

    public AdminController(AdminRepository adminRepo, SupabaseAuthAdminService authAdmin) {
        this.adminRepo = adminRepo;
        this.authAdmin = authAdmin;
    }

    // GET /api/admins?role=&is_approved=
    @GetMapping
    public ResponseEntity<ApiResponse<?>> list(
            @RequestParam(required = false) String role,
            @RequestParam(required = false) Boolean is_approved) {
        List<Admin> admins;
        if (role != null && is_approved != null) {
            admins = adminRepo.findByRoleAndIsApproved(role, is_approved);
        } else if (role != null) {
            admins = adminRepo.findByRole(role);
        } else {
            admins = adminRepo.findAll();
        }
        return ResponseEntity.ok(ApiResponse.success(admins));
    }

    // POST /api/admins
    @PostMapping
    public ResponseEntity<ApiResponse<?>> create(@RequestBody Map<String, Object> body) {
        String email = (String) body.get("email");
        String password = (String) body.get("password");
        String role = (String) body.getOrDefault("role", "admin");

        Map<?, ?> authUser = authAdmin.createUserWithMeta(email, password, Map.of("role", role));
        String userId = (String) authUser.get("id");

        Admin admin = new Admin();
        admin.setId(userId);
        admin.setFullName((String) body.get("full_name"));
        admin.setEmail(email);
        admin.setRole(role);
        admin.setIsApproved(true);
        admin.setCreatedAt(OffsetDateTime.now(ZoneOffset.UTC));
        adminRepo.save(admin);

        return ResponseEntity.ok(ApiResponse.success(admin, "Admin created successfully"));
    }

    // PATCH /api/admins/{id}
    @PatchMapping("/{id}")
    public ResponseEntity<ApiResponse<?>> update(@PathVariable String id,
                                                  @RequestBody Map<String, Object> body) {
        Admin admin = adminRepo.findByIdAndRole(id, "admin")
                .orElseGet(() -> adminRepo.findByIdAndRole(id, "business_owner")
                        .orElseThrow(() -> new ResourceNotFoundException("Admin not found")));

        if (body.containsKey("full_name")) admin.setFullName((String) body.get("full_name"));
        if (body.containsKey("is_approved")) admin.setIsApproved((Boolean) body.get("is_approved"));
        admin.setUpdatedAt(OffsetDateTime.now(ZoneOffset.UTC));
        adminRepo.save(admin);

        // Update auth email/password if provided
        if (body.containsKey("email") || body.containsKey("password")) {
            Map<String, Object> authUpdate = new java.util.HashMap<>();
            authUpdate.put("email", body.getOrDefault("email", admin.getEmail()));
            String newPassword = (String) body.get("password");
            if (newPassword != null && !newPassword.isBlank()) {
                authUpdate.put("password", newPassword);
            }
            authAdmin.updateUser(id, authUpdate);
        }

        return ResponseEntity.ok(ApiResponse.success(admin, "Admin updated"));
    }

    // DELETE /api/admins/{id}
    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<?>> delete(@PathVariable String id) {
        List<Admin> records = adminRepo.findByRole("admin").stream()
                .filter(a -> a.getId().equals(id)).toList();
        if (records.isEmpty()) {
            throw new ResourceNotFoundException("Admin not found");
        }
        records.forEach(adminRepo::delete);
        authAdmin.deleteUser(id);
        return ResponseEntity.ok(ApiResponse.success(null, "Admin deleted"));
    }
}
