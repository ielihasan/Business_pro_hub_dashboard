package com.businessprohub.backend.repository;

import com.businessprohub.backend.entity.Staff;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface StaffRepository extends JpaRepository<Staff, String> {
    List<Staff> findByBusinessId(String businessId);
    List<Staff> findByBusinessIdAndIsActive(String businessId, Boolean isActive);
    Optional<Staff> findByAuthUserId(String authUserId);
    Optional<Staff> findByEmail(String email);
    long countByBusinessId(String businessId);
    boolean existsByEmailAndBusinessId(String email, String businessId);
}
