package com.businessprohub.backend.dto.request;

import jakarta.validation.constraints.NotBlank;

public record AuthVerifyEmailRequest(
        @NotBlank(message = "token is required")
        String token
) {
}
