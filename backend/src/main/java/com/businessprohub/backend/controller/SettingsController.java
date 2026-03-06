package com.businessprohub.backend.controller;

import com.businessprohub.backend.dto.response.ApiResponse;
import com.businessprohub.backend.entity.Admin;
import com.businessprohub.backend.entity.SystemSettings;
import com.businessprohub.backend.exception.ResourceNotFoundException;
import com.businessprohub.backend.repository.AdminRepository;
import com.businessprohub.backend.repository.SystemSettingsRepository;
import com.businessprohub.backend.service.SupabaseAuthAdminService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/settings")
public class SettingsController {

    private final AdminRepository adminRepo;
    private final SystemSettingsRepository settingsRepo;
    private final SupabaseAuthAdminService authAdmin;

    public SettingsController(AdminRepository adminRepo,
                               SystemSettingsRepository settingsRepo,
                               SupabaseAuthAdminService authAdmin) {
        this.adminRepo = adminRepo;
        this.settingsRepo = settingsRepo;
        this.authAdmin = authAdmin;
    }

    // GET /api/settings/profile
    @GetMapping("/profile")
    public ResponseEntity<ApiResponse<?>> getProfile(Authentication auth) {
        String userId = (String) auth.getPrincipal();
        Admin admin = adminRepo.findAll().stream()
                .filter(a -> a.getId().equals(userId))
                .findFirst()
                .orElseThrow(() -> new ResourceNotFoundException("Profile not found"));
        return ResponseEntity.ok(ApiResponse.success(admin));
    }

    // PATCH /api/settings/profile
    @PatchMapping("/profile")
    public ResponseEntity<ApiResponse<?>> updateProfile(Authentication auth,
                                                         @RequestBody Map<String, Object> body) {
        String userId = (String) auth.getPrincipal();
        Admin admin = adminRepo.findAll().stream()
                .filter(a -> a.getId().equals(userId))
                .findFirst()
                .orElseThrow(() -> new ResourceNotFoundException("Profile not found"));

        if (body.containsKey("full_name")) admin.setFullName((String) body.get("full_name"));
        if (body.containsKey("business_name")) admin.setBusinessName((String) body.get("business_name"));
        if (body.containsKey("business_phone")) admin.setBusinessPhone((String) body.get("business_phone"));
        if (body.containsKey("business_address")) admin.setBusinessAddress((String) body.get("business_address"));
        if (body.containsKey("business_description")) admin.setBusinessDescription((String) body.get("business_description"));
        admin.setUpdatedAt(OffsetDateTime.now(ZoneOffset.UTC));
        adminRepo.save(admin);

        if (body.containsKey("email")) {
            authAdmin.updateUser(userId, Map.of("email", body.get("email")));
        }
        return ResponseEntity.ok(ApiResponse.success(admin, "Profile updated"));
    }

    // PATCH /api/settings/password
    @PatchMapping("/password")
    public ResponseEntity<ApiResponse<?>> changePassword(Authentication auth,
                                                          @RequestBody Map<String, Object> body) {
        String userId = (String) auth.getPrincipal();
        String newPassword = (String) body.get("new_password");
        authAdmin.updateUser(userId, Map.of("password", newPassword));
        return ResponseEntity.ok(ApiResponse.success(null, "Password updated successfully"));
    }

    // GET /api/settings/system
    @GetMapping("/system")
    public ResponseEntity<ApiResponse<?>> getSystem() {
        List<SystemSettings> all = settingsRepo.findAll();
        Map<String, String> result = all.stream()
                .collect(Collectors.toMap(SystemSettings::getKey, s -> s.getValue() != null ? s.getValue() : ""));
        return ResponseEntity.ok(ApiResponse.success(result));
    }

    // PATCH /api/settings/system
    @PatchMapping("/system")
    public ResponseEntity<ApiResponse<?>> updateSystem(@RequestBody Map<String, Object> body) {
        for (Map.Entry<String, Object> entry : body.entrySet()) {
            Optional<SystemSettings> existing = settingsRepo.findByKey(entry.getKey());
            SystemSettings setting = existing.orElse(new SystemSettings());
            setting.setKey(entry.getKey());
            setting.setValue(entry.getValue() != null ? entry.getValue().toString() : null);
            setting.setUpdatedAt(OffsetDateTime.now(ZoneOffset.UTC));
            settingsRepo.save(setting);
        }
        return ResponseEntity.ok(ApiResponse.success(null, "System settings updated"));
    }
}
