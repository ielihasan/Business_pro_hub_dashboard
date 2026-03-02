package com.businessprohub.backend.repository;

import com.businessprohub.backend.entity.Business;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface BusinessRepository extends JpaRepository<Business, String> {
    List<Business> findByIsActive(Boolean isActive);
    Optional<Business> findByIdAndIsActive(String id, Boolean isActive);
}
