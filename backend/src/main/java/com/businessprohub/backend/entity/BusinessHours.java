package com.businessprohub.backend.entity;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "business_hours")
@Data
@NoArgsConstructor
public class BusinessHours {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id")
    private String id;

    @Column(name = "business_id", nullable = false)
    private String businessId;

    @Column(name = "day_of_week")
    private Integer dayOfWeek; // 0=Sun, 1=Mon, ...6=Sat

    @Column(name = "open_time")
    private String openTime; // "09:00"

    @Column(name = "close_time")
    private String closeTime; // "18:00"

    @Column(name = "is_open")
    private Boolean isOpen;

    @Column(name = "break_start")
    private String breakStart;

    @Column(name = "break_end")
    private String breakEnd;
}
