package com.businessprohub.backend.repository;

import com.businessprohub.backend.entity.BusinessApplication;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface BusinessApplicationRepository extends JpaRepository<BusinessApplication, String> {
    Optional<BusinessApplication> findByEmail(String email);
    Optional<BusinessApplication> findByVerificationToken(String token);
    Optional<BusinessApplication> findByUserId(String userId);
    long countByIsApprovedFalseAndIsRejectedFalse();
}
