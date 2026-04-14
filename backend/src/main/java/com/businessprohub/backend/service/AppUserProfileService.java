package com.businessprohub.backend.service;

import com.businessprohub.backend.dto.request.AppUserProfileRequest;
import com.businessprohub.backend.entity.AppUser;
import com.businessprohub.backend.exception.ResourceNotFoundException;
import com.businessprohub.backend.repository.AppUserRepository;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;

import java.time.OffsetDateTime;
import java.time.ZoneOffset;

@Service
public class AppUserProfileService {

    private final AppUserRepository userRepository;

    public AppUserProfileService(AppUserRepository userRepository) {
        this.userRepository = userRepository;
    }

    public AppUser getProfile(Authentication auth, String userIdParam) {
        String userId = resolveAuthorizedUserId(auth, userIdParam, "You can only access your own profile");
        return userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
    }

    public AppUser saveProfile(Authentication auth, AppUserProfileRequest request) {
        String userId = resolveAuthorizedUserId(auth, request.userId(), "You can only update your own profile");

        AppUser user = userRepository.findById(userId).orElse(new AppUser());
        user.setId(userId);
        if (request.fullName() != null) user.setFullName(request.fullName());
        if (request.email() != null) user.setEmail(request.email());
        if (request.phoneNumber() != null) user.setPhoneNumber(request.phoneNumber());
        if (request.avatarUrl() != null) user.setAvatarUrl(request.avatarUrl());
        if (user.getCreatedAt() == null) user.setCreatedAt(OffsetDateTime.now(ZoneOffset.UTC));
        user.setUpdatedAt(OffsetDateTime.now(ZoneOffset.UTC));
        return userRepository.save(user);
    }

    private String resolveAuthorizedUserId(Authentication auth, String requestedUserId, String deniedMessage) {
        String principalId = (String) auth.getPrincipal();
        boolean isAdmin = auth.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));
        String targetUserId = (requestedUserId == null || requestedUserId.isBlank()) ? principalId : requestedUserId;

        if (!isAdmin && !principalId.equals(targetUserId)) {
            throw new AccessDeniedException(deniedMessage);
        }
        return targetUserId;
    }
}
