package com.businessprohub.backend.entity;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.OffsetDateTime;

@Entity
@Table(name = "special_hours")
@Data
@NoArgsConstructor
public class SpecialHours {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id")
    private String id;

    @Column(name = "business_id", nullable = false)
    private String businessId;

    @Column(name = "date")
    private LocalDate date;

    @Column(name = "open_time")
    private String openTime;

    @Column(name = "close_time")
    private String closeTime;

    @Column(name = "is_open")
    private Boolean isOpen;

    @Column(name = "reason")
    private String reason;

    @Column(name = "created_at")
    private OffsetDateTime createdAt;
}
