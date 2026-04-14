package com.businessprohub.backend.dto.request;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

public record AuthSendVerificationRequest(
        @NotBlank(message = "email is required")
        @Email(message = "email must be valid")
        String email
) {
}
