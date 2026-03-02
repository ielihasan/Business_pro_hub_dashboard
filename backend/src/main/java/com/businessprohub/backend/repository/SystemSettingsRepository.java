package com.businessprohub.backend.repository;

import com.businessprohub.backend.entity.SystemSettings;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface SystemSettingsRepository extends JpaRepository<SystemSettings, String> {
    Optional<SystemSettings> findByKey(String key);
}
