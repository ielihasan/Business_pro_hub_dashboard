package com.businessprohub.backend.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;

import java.util.List;
import java.util.Map;

@Service
public class EmailService {

    private final WebClient webClient;

    @Value("${resend.api-key}")
    private String resendApiKey;

    @Value("${resend.from-email}")
    private String fromEmail;

    @Value("${app.url}")
    private String appUrl;

    public EmailService(WebClient.Builder builder) {
        this.webClient = builder.baseUrl("https://api.resend.com").build();
    }

    public void sendEmail(String to, String subject, String html) {
        webClient.post()
                .uri("/emails")
                .header("Authorization", "Bearer " + resendApiKey)
                .header("Content-Type", "application/json")
                .bodyValue(Map.of(
                        "from", fromEmail,
                        "to", List.of(to),
                        "subject", subject,
                        "html", html
                ))
                .retrieve()
                .toBodilessEntity()
                .block();
    }

    public void sendVerificationEmail(String to, String token, String businessName) {
        String verifyUrl = appUrl + "/verify-email?token=" + token;
        String html = "<h2>Verify your email</h2>" +
                "<p>Hello " + businessName + ",</p>" +
                "<p>Please verify your email address by clicking the link below:</p>" +
                "<a href='" + verifyUrl + "' style='background:#1a1a1a;color:#fff;padding:12px 24px;text-decoration:none;border-radius:6px;'>Verify Email</a>" +
                "<p>This link expires in 24 hours.</p>";
        sendEmail(to, "Verify your BusinessHub Pro email", html);
    }

    public void sendApprovalEmail(String to, String businessName) {
        String html = "<h2>Application Approved!</h2>" +
                "<p>Congratulations " + businessName + "!</p>" +
                "<p>Your BusinessHub Pro application has been approved. You can now log in to your dashboard.</p>" +
                "<a href='" + appUrl + "/auth/v1/login' style='background:#16a34a;color:#fff;padding:12px 24px;text-decoration:none;border-radius:6px;'>Log In to Dashboard</a>";
        sendEmail(to, "Your BusinessHub Pro application is approved", html);
    }

    public void sendRejectionEmail(String to, String businessName, String reason) {
        String html = "<h2>Application Update</h2>" +
                "<p>Hello " + businessName + ",</p>" +
                "<p>Unfortunately, your BusinessHub Pro application was not approved at this time.</p>" +
                (reason != null ? "<p>Reason: " + reason + "</p>" : "") +
                "<p>Please contact support if you have questions.</p>";
        sendEmail(to, "Update on your BusinessHub Pro application", html);
    }
}
