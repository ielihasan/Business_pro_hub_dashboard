package com.businessprohub.backend.controller;

import com.businessprohub.backend.dto.response.ApiResponse;
import com.businessprohub.backend.entity.BusinessApplication;
import com.businessprohub.backend.exception.BadRequestException;
import com.businessprohub.backend.exception.ResourceNotFoundException;
import com.businessprohub.backend.repository.BusinessApplicationRepository;
import com.businessprohub.backend.service.EmailService;
import com.businessprohub.backend.service.SupabaseAuthAdminService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final BusinessApplicationRepository appRepo;
    private final SupabaseAuthAdminService authAdmin;
    private final EmailService emailService;

    public AuthController(BusinessApplicationRepository appRepo,
                          SupabaseAuthAdminService authAdmin,
                          EmailService emailService) {
        this.appRepo = appRepo;
        this.authAdmin = authAdmin;
        this.emailService = emailService;
    }

    // POST /api/auth/register
    @PostMapping("/register")
    public ResponseEntity<ApiResponse<?>> register(@RequestBody Map<String, Object> body) {
        String email = (String) body.get("email");
        String password = (String) body.get("password");
        String businessName = (String) body.get("business_name");
        String role = (String) body.getOrDefault("role", "business_owner");

        Map<?, ?> authUser = authAdmin.createUserWithMeta(email, password,
                Map.of("role", role, "business_name", businessName != null ? businessName : ""));
        String userId = (String) authUser.get("id");

        BusinessApplication app = new BusinessApplication();
        app.setUserId(userId);
        app.setEmail(email);
        app.setBusinessName(businessName);
        app.setBusinessType((String) body.get("business_type"));
        app.setBusinessPhone((String) body.get("phone"));
        app.setBusinessAddress((String) body.get("address"));
        app.setIsApproved(false);
        app.setEmailVerified(false);

        String token = UUID.randomUUID().toString();
        app.setVerificationToken(token);
        app.setVerificationTokenExpires(OffsetDateTime.now(ZoneOffset.UTC).plusHours(24));
        app.setCreatedAt(OffsetDateTime.now(ZoneOffset.UTC));
        appRepo.save(app);

        try {
            emailService.sendVerificationEmail(email, token, businessName != null ? businessName : email);
        } catch (Exception ignored) {}

        return ResponseEntity.ok(ApiResponse.success(
                Map.of("user_id", userId, "application_id", app.getId()),
                "Registration successful. Please check your email to verify your account."));
    }

    // POST /api/auth/send-verification
    @PostMapping("/send-verification")
    public ResponseEntity<ApiResponse<?>> sendVerification(@RequestBody Map<String, Object> body) {
        String email = (String) body.get("email");
        BusinessApplication app = appRepo.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("Application not found"));

        String token = UUID.randomUUID().toString();
        app.setVerificationToken(token);
        app.setVerificationTokenExpires(OffsetDateTime.now(ZoneOffset.UTC).plusHours(24));
        appRepo.save(app);

        emailService.sendVerificationEmail(email, token,
                app.getBusinessName() != null ? app.getBusinessName() : email);
        return ResponseEntity.ok(ApiResponse.success(null, "Verification email sent"));
    }

    // POST /api/auth/resend-verification
    @PostMapping("/resend-verification")
    public ResponseEntity<ApiResponse<?>> resendVerification(@RequestBody Map<String, Object> body) {
        return sendVerification(body);
    }

    // GET /api/auth/verify-email?token=
    @GetMapping("/verify-email")
    public ResponseEntity<ApiResponse<?>> verifyEmailGet(@RequestParam String token) {
        return doVerify(token);
    }

    // POST /api/auth/verify-email
    @PostMapping("/verify-email")
    public ResponseEntity<ApiResponse<?>> verifyEmailPost(@RequestBody Map<String, Object> body) {
        return doVerify((String) body.get("token"));
    }

    private ResponseEntity<ApiResponse<?>> doVerify(String token) {
        BusinessApplication app = appRepo.findByVerificationToken(token)
                .orElseThrow(() -> new BadRequestException("Invalid verification token"));

        if (app.getVerificationTokenExpires().isBefore(OffsetDateTime.now(ZoneOffset.UTC))) {
            throw new BadRequestException("Verification token has expired");
        }

        app.setEmailVerified(true);
        app.setVerificationToken(null);
        app.setUpdatedAt(OffsetDateTime.now(ZoneOffset.UTC));
        appRepo.save(app);

        return ResponseEntity.ok(ApiResponse.success(null, "Email verified successfully"));
    }

    // POST /api/auth/send-approval-notification
    @PostMapping("/send-approval-notification")
    public ResponseEntity<ApiResponse<?>> sendApprovalNotification(@RequestBody Map<String, Object> body) {
        String email = (String) body.get("email");
        String businessName = (String) body.get("business_name");
        String status = (String) body.get("status"); // "approved" | "rejected"
        String reason = (String) body.get("reason");

        if ("approved".equals(status)) {
            emailService.sendApprovalEmail(email, businessName);
        } else {
            emailService.sendRejectionEmail(email, businessName, reason);
        }
        return ResponseEntity.ok(ApiResponse.success(null, "Notification sent"));
    }
}
