package com.businessprohub.backend.controller;

import com.businessprohub.backend.dto.response.ApiResponse;
import com.businessprohub.backend.entity.AppUser;
import com.businessprohub.backend.exception.ResourceNotFoundException;
import com.businessprohub.backend.repository.AppUserRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.util.Map;

@RestController
@RequestMapping("/api/app-user")
public class AppUserController {

    private final AppUserRepository userRepo;

    public AppUserController(AppUserRepository userRepo) {
        this.userRepo = userRepo;
    }

    // GET /api/app-user/profile?user_id=
    @GetMapping("/profile")
    public ResponseEntity<ApiResponse<?>> getProfile(@RequestParam("user_id") String userId) {
        AppUser user = userRepo.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        return ResponseEntity.ok(ApiResponse.success(user));
    }

    // POST /api/app-user/profile — upsert
    @PostMapping("/profile")
    public ResponseEntity<ApiResponse<?>> upsert(@RequestBody Map<String, Object> body) {
        String userId = (String) body.get("user_id");
        AppUser user = userRepo.findById(userId).orElse(new AppUser());
        user.setId(userId);
        if (body.containsKey("full_name")) user.setFullName((String) body.get("full_name"));
        if (body.containsKey("email")) user.setEmail((String) body.get("email"));
        if (body.containsKey("phone_number")) user.setPhoneNumber((String) body.get("phone_number"));
        if (body.containsKey("avatar_url")) user.setAvatarUrl((String) body.get("avatar_url"));
        if (user.getCreatedAt() == null) user.setCreatedAt(OffsetDateTime.now(ZoneOffset.UTC));
        user.setUpdatedAt(OffsetDateTime.now(ZoneOffset.UTC));
        userRepo.save(user);
        return ResponseEntity.ok(ApiResponse.success(user, "Profile saved"));
    }

    // PATCH /api/app-user/profile
    @PatchMapping("/profile")
    public ResponseEntity<ApiResponse<?>> update(@RequestBody Map<String, Object> body) {
        return upsert(body);
    }
}
