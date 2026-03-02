package com.businessprohub.backend.entity;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.OffsetDateTime;

@Entity
@Table(name = "queues")
@Data
@NoArgsConstructor
public class Queue {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id")
    private String id;

    @Column(name = "business_id", nullable = false)
    private String businessId;

    @Column(name = "customer_id")
    private String customerId; // FK -> users.id (nullable)

    @Column(name = "customer_name")
    private String customerName;

    @Column(name = "customer_phone")
    private String customerPhone;

    @Column(name = "customer_email")
    private String customerEmail;

    @Column(name = "service_type")
    private String serviceType; // queue_type_id stored here

    @Column(name = "notes", columnDefinition = "TEXT")
    private String notes;

    @Column(name = "priority")
    private String priority; // "normal" | "high" | "vip"

    @Column(name = "position")
    private Integer position;

    @Column(name = "status")
    private String status; // "waiting" | "in_progress" | "called" | "completed" | "cancelled" | "no_show"

    @Column(name = "joined_at")
    private OffsetDateTime joinedAt;

    @Column(name = "started_at")
    private OffsetDateTime startedAt;

    @Column(name = "completed_at")
    private OffsetDateTime completedAt;

    @Column(name = "created_at")
    private OffsetDateTime createdAt;

    @Column(name = "updated_at")
    private OffsetDateTime updatedAt;
}
