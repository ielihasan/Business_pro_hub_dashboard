package com.businessprohub.backend.controller;

import com.businessprohub.backend.repository.BusinessApplicationRepository;
import com.businessprohub.backend.service.EmailService;
import com.businessprohub.backend.service.SupabaseAuthAdminService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(controllers = AuthController.class)
@Import({
        com.businessprohub.backend.config.SecurityConfig.class,
        com.businessprohub.backend.security.JwtAuthFilter.class,
        com.businessprohub.backend.security.RateLimitFilter.class,
        com.businessprohub.backend.security.RateLimitService.class,
        com.businessprohub.backend.exception.GlobalExceptionHandler.class
})
class AuthControllerValidationTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private BusinessApplicationRepository businessApplicationRepository;

    @MockBean
    private SupabaseAuthAdminService supabaseAuthAdminService;

    @MockBean
    private EmailService emailService;

    @MockBean
    private com.businessprohub.backend.repository.AdminRepository adminRepository;

    @MockBean
    private com.businessprohub.backend.security.JwtService jwtService;

    @Test
    void shouldRejectInvalidRegistrationPayload() throws Exception {
        String payload = """
                {
                  "email": "bad-email",
                  "password": "123",
                  "business_name": ""
                }
                """;

        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(payload))
                .andExpect(status().isBadRequest());
    }

    @Test
    void shouldRejectUnsupportedRole() throws Exception {
        String payload = """
                {
                  "email": "test@example.com",
                  "password": "password123",
                  "business_name": "Test Biz",
                  "role": "super_admin"
                }
                """;

        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(payload))
                .andExpect(status().isBadRequest());
    }
}
