package com.businessprohub.backend.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;

import java.util.List;
import java.util.Map;

/**
 * Calls Supabase Auth Admin REST API for auth.users lifecycle operations.
 * auth.users is Supabase-managed and cannot be written via JPA.
 */
@Service
public class SupabaseAuthAdminService {

    private final WebClient webClient;

    @Value("${supabase.url}")
    private String supabaseUrl;

    @Value("${supabase.service-role-key}")
    private String serviceRoleKey;

    public SupabaseAuthAdminService(WebClient.Builder builder) {
        this.webClient = builder.build();
    }

    /** Create a new auth user. Returns the created user object as a Map. */
    public Map<?, ?> createUser(String email, String password) {
        return webClient.post()
                .uri(supabaseUrl + "/auth/v1/admin/users")
                .header("Authorization", "Bearer " + serviceRoleKey)
                .header("apikey", serviceRoleKey)
                .header("Content-Type", "application/json")
                .bodyValue(Map.of("email", email, "password", password, "email_confirm", true))
                .retrieve()
                .bodyToMono(Map.class)
                .block();
    }

    /** Create a new auth user with user_metadata (e.g. role). */
    public Map<?, ?> createUserWithMeta(String email, String password, Map<String, Object> userMetadata) {
        return webClient.post()
                .uri(supabaseUrl + "/auth/v1/admin/users")
                .header("Authorization", "Bearer " + serviceRoleKey)
                .header("apikey", serviceRoleKey)
                .header("Content-Type", "application/json")
                .bodyValue(Map.of(
                        "email", email,
                        "password", password,
                        "email_confirm", true,
                        "user_metadata", userMetadata
                ))
                .retrieve()
                .bodyToMono(Map.class)
                .block();
    }

    /** Update an existing auth user (email or password). */
    public Map<?, ?> updateUser(String userId, Map<String, Object> updates) {
        return webClient.put()
                .uri(supabaseUrl + "/auth/v1/admin/users/" + userId)
                .header("Authorization", "Bearer " + serviceRoleKey)
                .header("apikey", serviceRoleKey)
                .header("Content-Type", "application/json")
                .bodyValue(updates)
                .retrieve()
                .bodyToMono(Map.class)
                .block();
    }

    /** Check if an auth user exists (returns false if deleted from auth.users). */
    public boolean userExists(String userId) {
        try {
            webClient.get()
                    .uri(supabaseUrl + "/auth/v1/admin/users/" + userId)
                    .header("Authorization", "Bearer " + serviceRoleKey)
                    .header("apikey", serviceRoleKey)
                    .retrieve()
                    .bodyToMono(Map.class)
                    .block();
            return true;
        } catch (Exception e) {
            return false;
        }
    }

    /** Delete a user from auth.users. */
    public void deleteUser(String userId) {
        webClient.delete()
                .uri(supabaseUrl + "/auth/v1/admin/users/" + userId)
                .header("Authorization", "Bearer " + serviceRoleKey)
                .header("apikey", serviceRoleKey)
                .retrieve()
                .toBodilessEntity()
                .block();
    }

    /**
     * Find the auth user ID for a given email, or null if not found.
     * Used to detect orphaned auth users after a failed registration.
     */
    public String findUserIdByEmail(String email) {
        try {
            String encodedEmail = java.net.URLEncoder.encode(email, java.nio.charset.StandardCharsets.UTF_8);
            Map<?, ?> result = webClient.get()
                    .uri(supabaseUrl + "/auth/v1/admin/users?filter=email%3D" + encodedEmail + "&per_page=1")
                    .header("Authorization", "Bearer " + serviceRoleKey)
                    .header("apikey", serviceRoleKey)
                    .retrieve()
                    .bodyToMono(Map.class)
                    .block();
            if (result == null) return null;
            List<?> users = (List<?>) result.get("users");
            if (users != null && !users.isEmpty()) {
                return (String) ((Map<?, ?>) users.get(0)).get("id");
            }
            return null;
        } catch (Exception e) {
            return null;
        }
    }
}
