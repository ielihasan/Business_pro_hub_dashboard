package com.businessprohub.backend.entity;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.OffsetDateTime;

@Entity
@Table(name = "business_applications")
@Data
@NoArgsConstructor
public class BusinessApplication {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id")
    private String id;

    @Column(name = "user_id")
    private String userId; // auth.users UUID

    @Column(name = "full_name")
    private String fullName;

    @Column(name = "email", nullable = false)
    private String email;

    @Column(name = "business_name")
    private String businessName;

    @Column(name = "business_type")
    private String businessType;

    @Column(name = "business_phone")
    private String businessPhone;

    @Column(name = "business_address")
    private String businessAddress;

    @Column(name = "address_line")
    private String addressLine;

    @Column(name = "city")
    private String city;

    @Column(name = "state")
    private String state;

    @Column(name = "country")
    private String country;

    @Column(name = "business_description")
    private String businessDescription;

    @Column(name = "is_approved")
    private Boolean isApproved;

    @Column(name = "is_rejected")
    private Boolean isRejected;

    @Column(name = "rejection_reason")
    private String rejectionReason;

    @Column(name = "email_verified")
    private Boolean emailVerified;

    @Column(name = "verification_token")
    private String verificationToken;

    @Column(name = "verification_token_expires")
    private OffsetDateTime verificationTokenExpires;

    @Column(name = "created_at")
    private OffsetDateTime createdAt;

    @Column(name = "updated_at")
    private OffsetDateTime updatedAt;
}
