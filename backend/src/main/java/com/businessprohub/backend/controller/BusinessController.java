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
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.util.List;
import java.util.Map;

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

    // GET /api/businesses
    @GetMapping
    public ResponseEntity<ApiResponse<?>> list() {
        List<Business> businesses = businessRepo.findByIsActive(true);
        return ResponseEntity.ok(ApiResponse.success(businesses));
    }

    // POST /api/businesses
    @PostMapping
    public ResponseEntity<ApiResponse<?>> create(@RequestBody Map<String, Object> body) {
        String email = (String) body.get("email");
        String password = (String) body.get("password");
        String businessName = (String) body.get("business_name");

        // Create auth user
        Map<?, ?> authUser = authAdmin.createUserWithMeta(email, password,
                Map.of("role", "business_owner", "business_name", businessName));
        String userId = (String) authUser.get("id");

        OffsetDateTime now = OffsetDateTime.now(ZoneOffset.UTC);

        // Create businesses row
        Business business = new Business();
        business.setId(userId);
        business.setBusinessName(businessName);
        business.setBusinessType((String) body.get("business_type"));
        business.setEmail(email);
        business.setBusinessPhone((String) body.get("phone"));
        business.setBusinessAddress((String) body.get("address"));
        business.setIsActive(true);
        business.setCreatedAt(now);
        businessRepo.save(business);

        // Create admins row
        Admin admin = new Admin();
        admin.setId(userId);
        admin.setFullName((String) body.get("full_name"));
        admin.setEmail(email);
        admin.setRole("business_owner");
        admin.setIsApproved(true);
        admin.setBusinessName(businessName);
        admin.setBusinessType((String) body.get("business_type"));
        admin.setCreatedAt(now);
        adminRepo.save(admin);

        return ResponseEntity.ok(ApiResponse.success(business, "Business created successfully"));
    }

    // PATCH /api/businesses/{id}
    @PatchMapping("/{id}")
    public ResponseEntity<ApiResponse<?>> update(@PathVariable String id,
                                                  @RequestBody Map<String, Object> body) {
        Business business = businessRepo.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Business not found"));

        if (body.containsKey("business_name")) business.setBusinessName((String) body.get("business_name"));
        if (body.containsKey("business_type")) business.setBusinessType((String) body.get("business_type"));
        if (body.containsKey("phone")) business.setBusinessPhone((String) body.get("phone"));
        if (body.containsKey("address")) business.setBusinessAddress((String) body.get("address"));
        if (body.containsKey("is_active")) business.setIsActive((Boolean) body.get("is_active"));
        business.setUpdatedAt(OffsetDateTime.now(ZoneOffset.UTC));
        businessRepo.save(business);

        // Sync admin record
        adminRepo.findByIdAndRole(id, "business_owner").ifPresent(a -> {
            if (body.containsKey("business_name")) a.setBusinessName((String) body.get("business_name"));
            if (body.containsKey("business_type")) a.setBusinessType((String) body.get("business_type"));
            if (body.containsKey("phone")) a.setBusinessPhone((String) body.get("phone"));
            if (body.containsKey("address")) a.setBusinessAddress((String) body.get("address"));
            a.setUpdatedAt(OffsetDateTime.now(ZoneOffset.UTC));
            adminRepo.save(a);
        });

        return ResponseEntity.ok(ApiResponse.success(business, "Business updated"));
    }

    // POST /api/businesses/approve/{applicationId}
    @PostMapping("/approve/{applicationId}")
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
        admin.setBusinessDescription(isBusinessOwner ? app.getBusinessDescription() : null);
        if (admin.getCreatedAt() == null) admin.setCreatedAt(now);
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
            business.setBusinessDescription(app.getBusinessDescription());
            business.setIsActive(true);
            business.setApprovedAt(now);
            business.setApprovedBy(approvedBy);
            if (business.getCreatedAt() == null) business.setCreatedAt(now);
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
            System.err.println("Warning: failed to send approval email to " + app.getEmail() + ": " + e.getMessage());
        }

        return ResponseEntity.ok(ApiResponse.success(null, "Business approved successfully"));
    }

    // DELETE /api/businesses/application/{applicationId} — remove a pre-approval (unverified) application
    @DeleteMapping("/application/{applicationId}")
    public ResponseEntity<ApiResponse<?>> deleteApplication(@PathVariable String applicationId) {
        BusinessApplication app = applicationRepo.findById(applicationId)
                .orElseThrow(() -> new ResourceNotFoundException("Application not found"));

        // Delete auth user if one was created (may not exist if registration never completed)
        if (app.getUserId() != null) {
            try { authAdmin.deleteUser(app.getUserId()); } catch (Exception ignored) {}
            // Also clean up any stale admins row created during registration
            adminRepo.findByIdAndRole(app.getUserId(), "business_owner").ifPresent(adminRepo::delete);
        }

        applicationRepo.delete(app);
        return ResponseEntity.ok(ApiResponse.success(null, "Application removed successfully"));
    }

    // DELETE /api/businesses/{id}
    @DeleteMapping("/{id}")
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
