package com.businessprohub.backend.controller;

import com.businessprohub.backend.dto.response.ApiResponse;
import com.businessprohub.backend.entity.AppUser;
import com.businessprohub.backend.exception.ResourceNotFoundException;
import com.businessprohub.backend.repository.AppUserRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.Authentication;
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

    // GET /api/app-user/profile?user_id= (admin can query any user, others can only query self)
    @GetMapping("/profile")
    public ResponseEntity<ApiResponse<?>> getProfile(Authentication auth,
                                                     @RequestParam(value = "user_id", required = false) String userIdParam) {
        String principalId = (String) auth.getPrincipal();
        boolean isAdmin = auth.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));
        String userId = (userIdParam == null || userIdParam.isBlank()) ? principalId : userIdParam;
        if (!isAdmin && !principalId.equals(userId)) {
            throw new AccessDeniedException("You can only access your own profile");
        }
        AppUser user = userRepo.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        return ResponseEntity.ok(ApiResponse.success(user));
    }

    // POST /api/app-user/profile — upsert
    @PostMapping("/profile")
    public ResponseEntity<ApiResponse<?>> upsert(Authentication auth, @RequestBody Map<String, Object> body) {
        String principalId = (String) auth.getPrincipal();
        boolean isAdmin = auth.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));
        String requestedUserId = (String) body.get("user_id");
        String userId = (requestedUserId == null || requestedUserId.isBlank()) ? principalId : requestedUserId;
        if (!isAdmin && !principalId.equals(userId)) {
            throw new AccessDeniedException("You can only update your own profile");
        }
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
    public ResponseEntity<ApiResponse<?>> update(Authentication auth, @RequestBody Map<String, Object> body) {
        return upsert(auth, body);
    }
}
