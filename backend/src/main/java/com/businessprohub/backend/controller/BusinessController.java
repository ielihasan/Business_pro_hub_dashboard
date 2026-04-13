package com.businessprohub.backend.controller;

import com.businessprohub.backend.dto.response.ApiResponse;
import com.businessprohub.backend.entity.Admin;
import com.businessprohub.backend.entity.Business;
import com.businessprohub.backend.entity.BusinessApplication;
import com.businessprohub.backend.exception.ResourceNotFoundException;
import com.businessprohub.backend.repository.AdminRepository;
import com.businessprohub.backend.repository.BusinessApplicationRepository;
import com.businessprohub.backend.repository.BusinessRepository;
import com.businessprohub.backend.service.EmailService;
import com.businessprohub.backend.service.SupabaseAuthAdminService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.util.List;
import java.util.Map;

@Slf4j
@RestController
@RequestMapping("/api/businesses")
public class BusinessController {

    private final BusinessRepository businessRepo;
    private final AdminRepository adminRepo;
    private final BusinessApplicationRepository applicationRepo;
    private final SupabaseAuthAdminService authAdmin;
    private final EmailService emailService;

    public BusinessController(BusinessRepository businessRepo,
                               AdminRepository adminRepo,
                               BusinessApplicationRepository applicationRepo,
                               SupabaseAuthAdminService authAdmin,
                               EmailService emailService) {
        this.businessRepo = businessRepo;
        this.adminRepo = adminRepo;
        this.applicationRepo = applicationRepo;
        this.authAdmin = authAdmin;
        this.emailService = emailService;
    }

    // GET /api/businesses?search=&business_type=
    @GetMapping
    public ResponseEntity<ApiResponse<?>> list(
            @RequestParam(required = false) String search,
            @RequestParam(value = "business_type", required = false) String businessType) {
        List<Business> businesses = businessRepo.findByIsActive(true);
        final String q = (search != null && !search.isBlank()) ? search.toLowerCase() : null;
        if (q != null || (businessType != null && !businessType.isBlank())) {
            businesses = businesses.stream()
                    .filter(b -> q == null
                            || (b.getBusinessName() != null && b.getBusinessName().toLowerCase().contains(q))
                            || (b.getFullName() != null && b.getFullName().toLowerCase().contains(q))
                            || (b.getEmail() != null && b.getEmail().toLowerCase().contains(q)))
                    .filter(b -> businessType == null || businessType.isBlank()
                            || businessType.equalsIgnoreCase(b.getBusinessType()))
                    .toList();
        }
        return ResponseEntity.ok(ApiResponse.success(businesses));
    }

    // POST /api/businesses — admin creates a business directly (bypasses application flow)
    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<?>> create(@RequestBody Map<String, Object> body) {
        String email = (String) body.get("email");
        String password = (String) body.get("password");
        String businessName = (String) body.get("business_name");

        // Create auth user — if 422, auto-cleanup orphaned auth user from a prior failed attempt and retry
        Map<?, ?> authUser;
        String userId;
        try {
            authUser = authAdmin.createUserWithMeta(email, password,
                    Map.of("role", "business_owner", "business_name", businessName));
            userId = (String) authUser.get("id");
        } catch (Exception ex) {
            String msg = ex.getMessage() != null ? ex.getMessage() : "";
            if (msg.contains("422") || msg.contains("already registered") || msg.contains("already been registered")) {
                // Check if this is an orphaned auth user (auth exists but no businesses row)
                String orphanId = authAdmin.findUserIdByEmail(email);
                if (orphanId != null && !businessRepo.existsById(orphanId)) {
                    // Safe to delete — no approved business linked to this auth user
                    try { authAdmin.deleteUser(orphanId); } catch (Exception cleanupEx) {
                        log.warn("Failed to delete orphaned auth user {}: {}", orphanId, cleanupEx.getMessage());
                    }
                    // Retry creation with a clean slate
                    authUser = authAdmin.createUserWithMeta(email, password,
                            Map.of("role", "business_owner", "business_name", businessName));
                    userId = (String) authUser.get("id");
                } else {
                    return ResponseEntity.status(422)
                            .body(ApiResponse.error("Email is already registered as an active business."));
                }
            } else {
                throw ex;
            }
        }

        OffsetDateTime now = OffsetDateTime.now(ZoneOffset.UTC);

        // Create businesses + admins rows — rollback auth user if DB fails
        try {
            Business business = new Business();
            business.setId(userId);
            business.setFullName((String) body.get("full_name"));
            business.setBusinessName(businessName);
            business.setBusinessType((String) body.get("business_type"));
            business.setEmail(email);
            business.setBusinessPhone((String) body.get("phone"));
            business.setBusinessAddress((String) body.get("address"));
            business.setAddressLine((String) body.get("address_line"));
            business.setCity((String) body.get("city"));
            business.setState((String) body.get("state"));
            business.setCountry((String) body.getOrDefault("country", "Pakistan"));
            business.setIsActive(true);
            business.setSubscriptionPlan((String) body.getOrDefault("subscription_plan", "free"));
            business.setSubscriptionStatus("active");
            business.setCreatedAt(now);
            business.setUpdatedAt(now);
            businessRepo.save(business);

            Admin admin = new Admin();
            admin.setId(userId);
            admin.setFullName((String) body.get("full_name"));
            admin.setEmail(email);
            admin.setRole("business_owner");
            admin.setIsApproved(true);
            admin.setBusinessName(businessName);
            admin.setBusinessType((String) body.get("business_type"));
            admin.setBusinessPhone((String) body.get("phone"));
            admin.setBusinessAddress((String) body.get("address"));
            admin.setAddressLine((String) body.get("address_line"));
            admin.setCity((String) body.get("city"));
            admin.setState((String) body.get("state"));
            admin.setCountry((String) body.getOrDefault("country", "Pakistan"));
            admin.setSubscriptionPlan((String) body.getOrDefault("subscription_plan", "free"));
            admin.setSubscriptionStatus("active");
            admin.setCreatedAt(now);
            admin.setUpdatedAt(now);
            adminRepo.save(admin);

            return ResponseEntity.ok(ApiResponse.success(business, "Business created successfully"));
        } catch (Exception dbEx) {
            // Rollback: delete the auth user we just created so the email can be reused
            try { authAdmin.deleteUser(userId); } catch (Exception ex) {
                log.warn("Rollback: failed to delete auth user {} after DB error: {}", userId, ex.getMessage());
            }
            throw dbEx;
        }
    }

    // PATCH /api/businesses/{id} — admin or the business owner themselves
    @PatchMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN') or #id == authentication.principal")
    public ResponseEntity<ApiResponse<?>> update(@PathVariable String id,
                                                  @RequestBody Map<String, Object> body,
                                                  Authentication auth) {
        Business business = businessRepo.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Business not found"));
        // Extra ownership guard: non-admins can only update their own record
        boolean isAdmin = auth.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));
        if (!isAdmin && !id.equals(auth.getPrincipal())) {
            return ResponseEntity.status(403).body(ApiResponse.error("You can only update your own business"));
        }
        // Non-owners cannot change subscription plan or active status
        if (!isAdmin) {
            body.remove("subscription_plan");
            body.remove("is_active");
        }

        if (body.containsKey("business_name")) business.setBusinessName((String) body.get("business_name"));
        if (body.containsKey("business_type")) business.setBusinessType((String) body.get("business_type"));
        if (body.containsKey("phone")) business.setBusinessPhone((String) body.get("phone"));
        if (body.containsKey("address")) business.setBusinessAddress((String) body.get("address"));
        if (body.containsKey("address_line")) business.setAddressLine((String) body.get("address_line"));
        if (body.containsKey("city")) business.setCity((String) body.get("city"));
        if (body.containsKey("state")) business.setState((String) body.get("state"));
        if (body.containsKey("country")) business.setCountry((String) body.get("country"));
        if (body.containsKey("is_active")) business.setIsActive((Boolean) body.get("is_active"));
        if (body.containsKey("subscription_plan")) business.setSubscriptionPlan((String) body.get("subscription_plan"));
        business.setUpdatedAt(OffsetDateTime.now(ZoneOffset.UTC));
        businessRepo.save(business);

        // Sync admin record
        adminRepo.findByIdAndRole(id, "business_owner").ifPresent(a -> {
            if (body.containsKey("business_name")) a.setBusinessName((String) body.get("business_name"));
            if (body.containsKey("business_type")) a.setBusinessType((String) body.get("business_type"));
            if (body.containsKey("phone")) a.setBusinessPhone((String) body.get("phone"));
            if (body.containsKey("address")) a.setBusinessAddress((String) body.get("address"));
            if (body.containsKey("address_line")) a.setAddressLine((String) body.get("address_line"));
            if (body.containsKey("city")) a.setCity((String) body.get("city"));
            if (body.containsKey("state")) a.setState((String) body.get("state"));
            if (body.containsKey("country")) a.setCountry((String) body.get("country"));
            if (body.containsKey("subscription_plan")) a.setSubscriptionPlan((String) body.get("subscription_plan"));
            a.setUpdatedAt(OffsetDateTime.now(ZoneOffset.UTC));
            adminRepo.save(a);
        });

        return ResponseEntity.ok(ApiResponse.success(business, "Business updated"));
    }

    // POST /api/businesses/approve/{applicationId} — admin only
    @PostMapping("/approve/{applicationId}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<?>> approve(@PathVariable String applicationId) {
        String approvedBy = (String) SecurityContextHolder.getContext()
                .getAuthentication().getPrincipal();

        BusinessApplication app = applicationRepo.findById(applicationId)
                .orElseThrow(() -> new ResourceNotFoundException("Application not found"));

        // Verify auth user still exists (application could be orphaned if user was deleted)
        if (!authAdmin.userExists(app.getUserId())) {
            return ResponseEntity.badRequest().body(
                    ApiResponse.error("Cannot approve: no auth account found for user ID " + app.getUserId()
                            + ". The applicant's account may have been deleted from auth."));
        }

        OffsetDateTime now = OffsetDateTime.now(ZoneOffset.UTC);
        boolean isBusinessOwner = !"Admin".equals(app.getBusinessType());

        // Upsert admins row — update existing row if already present, else insert
        String role = isBusinessOwner ? "business_owner" : "admin";
        Admin admin = adminRepo.findByIdAndRole(app.getUserId(), role)
                .orElseGet(Admin::new);
        admin.setId(app.getUserId());
        admin.setFullName(app.getFullName());
        admin.setEmail(app.getEmail());
        admin.setRole(role);
        admin.setIsApproved(true);
        admin.setBusinessName(isBusinessOwner ? app.getBusinessName() : null);
        admin.setBusinessType(isBusinessOwner ? app.getBusinessType() : null);
        admin.setBusinessPhone(isBusinessOwner ? app.getBusinessPhone() : null);
        admin.setBusinessAddress(isBusinessOwner ? app.getBusinessAddress() : null);
        admin.setAddressLine(isBusinessOwner ? app.getAddressLine() : null);
        admin.setCity(isBusinessOwner ? app.getCity() : null);
        admin.setState(isBusinessOwner ? app.getState() : null);
        admin.setCountry(isBusinessOwner ? app.getCountry() : null);
        admin.setBusinessDescription(isBusinessOwner ? app.getBusinessDescription() : null);
        if (admin.getCreatedAt() == null) admin.setCreatedAt(now);
        admin.setUpdatedAt(now);
        if (admin.getSubscriptionPlan() == null) admin.setSubscriptionPlan("free");
        if (admin.getSubscriptionStatus() == null) admin.setSubscriptionStatus("active");
        adminRepo.save(admin);

        if (isBusinessOwner) {
            // Upsert businesses row — update if trigger already created it, else insert
            Business business = businessRepo.findById(app.getUserId())
                    .orElseGet(Business::new);
            business.setId(app.getUserId());
            business.setFullName(app.getFullName());
            business.setEmail(app.getEmail());
            business.setBusinessName(app.getBusinessName());
            business.setBusinessType(app.getBusinessType());
            business.setBusinessPhone(app.getBusinessPhone());
            business.setBusinessAddress(app.getBusinessAddress());
            business.setAddressLine(app.getAddressLine());
            business.setCity(app.getCity());
            business.setState(app.getState());
            business.setCountry(app.getCountry());
            business.setBusinessDescription(app.getBusinessDescription());
            business.setIsActive(true);
            if (business.getSubscriptionPlan() == null) business.setSubscriptionPlan("free");
            if (business.getSubscriptionStatus() == null) business.setSubscriptionStatus("active");
            business.setApprovedAt(now);
            business.setApprovedBy(approvedBy);
            if (business.getCreatedAt() == null) business.setCreatedAt(now);
            business.setUpdatedAt(now);
            businessRepo.save(business);
        }

        // Mark application as approved
        app.setIsApproved(true);
        app.setUpdatedAt(now);
        applicationRepo.save(app);

        // Send approval email to the applicant
        try {
            emailService.sendApprovalEmail(app.getEmail(), app.getBusinessName() != null ? app.getBusinessName() : app.getFullName());
        } catch (Exception e) {
            // Log but don't fail the approval if email sending fails
            log.error("Failed to send approval email to {}: {}", app.getEmail(), e.getMessage(), e);
        }

        return ResponseEntity.ok(ApiResponse.success(null, "Business approved successfully"));
    }

    // DELETE /api/businesses/application/{applicationId} — admin only
    @DeleteMapping("/application/{applicationId}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<?>> deleteApplication(@PathVariable String applicationId) {
        BusinessApplication app = applicationRepo.findById(applicationId)
                .orElseThrow(() -> new ResourceNotFoundException("Application not found"));

        // Delete auth user if one was created (may not exist if registration never completed)
        if (app.getUserId() != null) {
            try { authAdmin.deleteUser(app.getUserId()); } catch (Exception e) {
                log.warn("Failed to delete auth user {} for application {}: {}", app.getUserId(), applicationId, e.getMessage());
            }
            // Also clean up any stale admins row created during registration
            adminRepo.findByIdAndRole(app.getUserId(), "business_owner").ifPresent(adminRepo::delete);
        }

        applicationRepo.delete(app);
        return ResponseEntity.ok(ApiResponse.success(null, "Application removed successfully"));
    }

    // DELETE /api/businesses/{id} — admin only
    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<?>> delete(@PathVariable String id) {
        if (!businessRepo.existsById(id)) {
            throw new ResourceNotFoundException("Business not found");
        }
        businessRepo.deleteById(id); // cascades to queues, services, etc.
        adminRepo.findByIdAndRole(id, "business_owner").ifPresent(a -> adminRepo.delete(a));
        authAdmin.deleteUser(id);
        return ResponseEntity.ok(ApiResponse.success(null, "Business deleted"));
    }
}
