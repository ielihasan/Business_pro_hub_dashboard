package com.businessprohub.backend.entity;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.OffsetDateTime;

@Entity
@Table(name = "staff")
@Data
@NoArgsConstructor
public class Staff {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id", columnDefinition = "uuid")
    private String id;

    @Column(name = "business_id", nullable = false, columnDefinition = "uuid")
    private String businessId;

    @Column(name = "auth_user_id")
    private String authUserId;

    @Column(name = "full_name", nullable = false)
    private String fullName;

    @Column(name = "email", nullable = false)
    private String email;

    @Column(name = "phone")
    private String phone;

    @Column(name = "position", nullable = false)
    private String position;

    @Column(name = "is_active", nullable = false)
    private Boolean isActive = true;

    @Column(name = "temp_password")
    private String tempPassword;

    @Column(name = "created_at")
    private OffsetDateTime createdAt;

    @Column(name = "updated_at")
    private OffsetDateTime updatedAt;
}
