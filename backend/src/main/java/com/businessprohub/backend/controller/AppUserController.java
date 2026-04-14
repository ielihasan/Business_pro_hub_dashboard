package com.businessprohub.backend.controller;

import com.businessprohub.backend.dto.request.AppUserProfileRequest;
import com.businessprohub.backend.dto.response.ApiResponse;
import com.businessprohub.backend.entity.AppUser;
import com.businessprohub.backend.service.AppUserProfileService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/app-user")
public class AppUserController {

    private final AppUserProfileService appUserProfileService;

    public AppUserController(AppUserProfileService appUserProfileService) {
        this.appUserProfileService = appUserProfileService;
    }

    // GET /api/app-user/profile?user_id= (admin can query any user, others can only query self)
    @GetMapping("/profile")
    public ResponseEntity<ApiResponse<?>> getProfile(Authentication auth,
                                                     @RequestParam(value = "user_id", required = false) String userIdParam) {
        AppUser user = appUserProfileService.getProfile(auth, userIdParam);
        return ResponseEntity.ok(ApiResponse.success(user));
    }

    // POST /api/app-user/profile — upsert
    @PostMapping("/profile")
    public ResponseEntity<ApiResponse<?>> upsert(Authentication auth, @Valid @RequestBody AppUserProfileRequest request) {
        AppUser user = appUserProfileService.saveProfile(auth, request);
        return ResponseEntity.ok(ApiResponse.success(user, "Profile saved"));
    }

    // PATCH /api/app-user/profile
    @PatchMapping("/profile")
    public ResponseEntity<ApiResponse<?>> update(Authentication auth, @Valid @RequestBody AppUserProfileRequest request) {
        return upsert(auth, request);
    }
}
