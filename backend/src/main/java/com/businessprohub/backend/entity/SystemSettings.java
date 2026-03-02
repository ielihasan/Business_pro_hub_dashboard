package com.businessprohub.backend.entity;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.OffsetDateTime;

@Entity
@Table(name = "system_settings")
@Data
@NoArgsConstructor
public class SystemSettings {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id")
    private String id;

    @Column(name = "key", unique = true, nullable = false)
    private String key;

    @Column(name = "value", columnDefinition = "jsonb")
    private String value; // JSON string value

    @Column(name = "updated_at")
    private OffsetDateTime updatedAt;
}
