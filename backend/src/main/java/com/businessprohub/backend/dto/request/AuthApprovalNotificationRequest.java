package com.businessprohub.backend.dto.request;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

public record AuthApprovalNotificationRequest(
        @NotBlank(message = "email is required")
        @Email(message = "email must be valid")
        String email,

        @JsonProperty("business_name")
        @NotBlank(message = "business_name is required")
        String businessName,

        @NotBlank(message = "status is required")
        @Pattern(regexp = "approved|rejected", message = "status must be either 'approved' or 'rejected'")
        String status,

        String reason
) {
}
