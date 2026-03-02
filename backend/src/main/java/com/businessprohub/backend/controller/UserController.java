package com.businessprohub.backend.controller;

import com.businessprohub.backend.dto.response.ApiResponse;
import com.businessprohub.backend.entity.AppUser;
import com.businessprohub.backend.exception.ResourceNotFoundException;
import com.businessprohub.backend.repository.AppUserRepository;
import com.businessprohub.backend.service.SupabaseAuthAdminService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.util.Map;

@RestController
@RequestMapping("/api/users")
public class UserController {

    private final AppUserRepository userRepo;
    private final SupabaseAuthAdminService authAdmin;

    public UserController(AppUserRepository userRepo, SupabaseAuthAdminService authAdmin) {
        this.userRepo = userRepo;
        this.authAdmin = authAdmin;
    }

    // PATCH /api/users?user_id=
    @PatchMapping
    public ResponseEntity<ApiResponse<?>> update(@RequestParam("user_id") String userId,
                                                  @RequestBody Map<String, Object> body) {
        AppUser user = userRepo.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        if (body.containsKey("full_name")) user.setFullName((String) body.get("full_name"));
        if (body.containsKey("phone_number")) user.setPhoneNumber((String) body.get("phone_number"));
        if (body.containsKey("email")) user.setEmail((String) body.get("email"));
        user.setUpdatedAt(OffsetDateTime.now(ZoneOffset.UTC));
        userRepo.save(user);
        return ResponseEntity.ok(ApiResponse.success(user, "User updated"));
    }

    // DELETE /api/users/{id}
    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<?>> delete(@PathVariable String id) {
        if (!userRepo.existsById(id)) throw new ResourceNotFoundException("User not found");
        userRepo.deleteById(id);
        authAdmin.deleteUser(id);
        return ResponseEntity.ok(ApiResponse.success(null, "User deleted"));
    }
}
