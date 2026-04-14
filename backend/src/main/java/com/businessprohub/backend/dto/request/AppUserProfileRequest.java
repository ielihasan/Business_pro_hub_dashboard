package com.businessprohub.backend.dto.request;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.constraints.Email;

public record AppUserProfileRequest(
        @JsonProperty("user_id")
        String userId,

        @JsonProperty("full_name")
        String fullName,

        @Email(message = "email must be valid")
        String email,

        @JsonProperty("phone_number")
        String phoneNumber,

        @JsonProperty("avatar_url")
        String avatarUrl
) {
}
