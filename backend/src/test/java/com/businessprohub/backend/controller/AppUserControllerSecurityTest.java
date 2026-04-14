package com.businessprohub.backend.controller;

import com.businessprohub.backend.entity.AppUser;
import com.businessprohub.backend.repository.AdminRepository;
import com.businessprohub.backend.security.JwtService;
import com.businessprohub.backend.service.AppUserProfileService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.Import;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.web.servlet.MockMvc;

import java.util.Optional;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.ArgumentMatchers.isNull;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(controllers = AppUserController.class)
@Import({
        com.businessprohub.backend.config.SecurityConfig.class,
        com.businessprohub.backend.security.JwtAuthFilter.class,
        com.businessprohub.backend.security.RateLimitFilter.class,
        com.businessprohub.backend.security.RateLimitService.class
})
@TestPropertySource(properties = "cors.allowed-origins=http://localhost:3002")
class AppUserControllerSecurityTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private AppUserProfileService appUserProfileService;

    @MockBean
    private AdminRepository adminRepository;

    @MockBean
    private JwtService jwtService;

    @BeforeEach
    void setUp() {
        when(adminRepository.findByIdAndRole(anyString(), anyString())).thenReturn(Optional.empty());
    }

    @Test
    void shouldRejectUnauthenticatedProfileRequest() throws Exception {
        mockMvc.perform(get("/api/app-user/profile"))
                .andExpect(status().isForbidden());
    }

    @Test
    void shouldAllowAuthenticatedUserToReadOwnProfile() throws Exception {
        AppUser user = new AppUser();
        user.setId("user-1");
        when(jwtService.isTokenValid("valid-token")).thenReturn(true);
        when(jwtService.extractUserId("valid-token")).thenReturn("user-1");
        when(appUserProfileService.getProfile(any(), isNull()))
                .thenReturn(user);

        mockMvc.perform(
                        get("/api/app-user/profile")
                                .header("Authorization", "Bearer valid-token")
                )
                .andExpect(status().isOk());
    }

    @Test
    void shouldBlockNonAdminFromReadingAnotherUsersProfile() throws Exception {
        when(jwtService.isTokenValid("valid-token")).thenReturn(true);
        when(jwtService.extractUserId("valid-token")).thenReturn("user-1");
        when(appUserProfileService.getProfile(any(), anyString()))
                .thenThrow(new org.springframework.security.access.AccessDeniedException("denied"));

        mockMvc.perform(
                        get("/api/app-user/profile")
                                .param("user_id", "user-2")
                                .header("Authorization", "Bearer valid-token")
                )
                .andExpect(status().isForbidden());
    }

    @Test
    void shouldAllowAdminToReadAnotherUsersProfile() throws Exception {
        AppUser user = new AppUser();
        user.setId("user-2");

        when(jwtService.isTokenValid("admin-token")).thenReturn(true);
        when(jwtService.extractUserId("admin-token")).thenReturn("user-1");
        when(appUserProfileService.getProfile(any(), eq("user-2")))
                .thenReturn(user);

        mockMvc.perform(
                        get("/api/app-user/profile")
                                .param("user_id", "user-2")
                                .header("Authorization", "Bearer admin-token")
                )
                .andExpect(status().isOk());
    }
}
