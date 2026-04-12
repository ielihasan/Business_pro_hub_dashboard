package com.businessprohub.backend.config;

import com.businessprohub.backend.security.JwtAuthFilter;
import com.businessprohub.backend.security.RateLimitFilter;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.Arrays;
import java.util.List;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity
public class SecurityConfig {

    private final JwtAuthFilter jwtAuthFilter;
    private final RateLimitFilter rateLimitFilter;

    @Value("${cors.allowed-origins}")
    private String allowedOriginsStr;

    public SecurityConfig(JwtAuthFilter jwtAuthFilter, RateLimitFilter rateLimitFilter) {
        this.jwtAuthFilter = jwtAuthFilter;
        this.rateLimitFilter = rateLimitFilter;
    }

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
            .csrf(AbstractHttpConfigurer::disable)
            .cors(cors -> cors.configurationSource(corsConfigurationSource()))
            .sessionManagement(sm -> sm.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .authorizeHttpRequests(auth -> auth
                // Allow CORS preflight through without authentication
                .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()
                // Public endpoints — no JWT required
                .requestMatchers(HttpMethod.POST, "/api/auth/register").permitAll()
                .requestMatchers(HttpMethod.POST, "/api/auth/send-verification").permitAll()
                .requestMatchers(HttpMethod.POST, "/api/auth/resend-verification").permitAll()
                .requestMatchers(HttpMethod.GET,  "/api/auth/verify-email").permitAll()
                .requestMatchers(HttpMethod.POST, "/api/auth/verify-email").permitAll()
                .requestMatchers(HttpMethod.POST, "/api/queue/join").permitAll()
                .requestMatchers(HttpMethod.GET,  "/api/queue/info").permitAll()
                .requestMatchers(HttpMethod.GET,  "/api/queue/status").permitAll()
                .requestMatchers(HttpMethod.GET,  "/api/queue/qrcode").permitAll()
                .requestMatchers(HttpMethod.POST, "/api/queue/qrcode").permitAll()
                .requestMatchers(HttpMethod.GET,  "/api/queue-types").permitAll()
                .requestMatchers(HttpMethod.POST, "/api/queue/*/leave").permitAll()
                .requestMatchers(HttpMethod.GET,  "/api/app-user/profile").permitAll()
                // ── Admin-only management endpoints ─────────────────────────────────
                .requestMatchers("/api/admins/**").hasRole("ADMIN")
                .requestMatchers(HttpMethod.POST,   "/api/businesses").hasRole("ADMIN")
                .requestMatchers(HttpMethod.POST,   "/api/businesses/approve/**").hasRole("ADMIN")
                .requestMatchers(HttpMethod.DELETE, "/api/businesses/application/**").hasRole("ADMIN")
                .requestMatchers(HttpMethod.DELETE, "/api/businesses/*").hasRole("ADMIN")
                .requestMatchers(HttpMethod.GET,    "/api/settings/system").hasRole("ADMIN")
                .requestMatchers(HttpMethod.PATCH,  "/api/settings/system").hasRole("ADMIN")
                .requestMatchers("/api/admin/**").hasRole("ADMIN")
                // Staff management — business owners and admins only
                // /api/staff/me is kept open to any authenticated user (staff self-lookup)
                .requestMatchers(HttpMethod.POST,   "/api/staff").hasAnyRole("BUSINESS_OWNER", "ADMIN")
                .requestMatchers(HttpMethod.PUT,    "/api/staff/*").hasAnyRole("BUSINESS_OWNER", "ADMIN")
                .requestMatchers(HttpMethod.DELETE, "/api/staff/*").hasAnyRole("BUSINESS_OWNER", "ADMIN")
                .requestMatchers(HttpMethod.GET,    "/api/staff/*/queues").hasAnyRole("BUSINESS_OWNER", "ADMIN")
                // Everything else requires valid Supabase JWT
                .anyRequest().authenticated()
            )
            .addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class)
            .addFilterBefore(rateLimitFilter, JwtAuthFilter.class);

        return http.build();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration config = new CorsConfiguration();
        String[] origins = allowedOriginsStr.split(",");
        config.setAllowedOrigins(Arrays.asList(origins));
        config.setAllowedMethods(List.of("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"));
        config.setAllowedHeaders(List.of("*"));
        config.setAllowCredentials(true);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", config);
        return source;
    }
}
