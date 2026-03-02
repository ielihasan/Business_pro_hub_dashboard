package com.businessprohub.backend.repository;

import com.businessprohub.backend.entity.Admin;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface AdminRepository extends JpaRepository<Admin, Integer> {
    Optional<Admin> findByIdAndRole(String id, String role);
    List<Admin> findByRole(String role);
    List<Admin> findByRoleAndIsApproved(String role, Boolean isApproved);
    Optional<Admin> findByEmail(String email);
    void deleteByIdAndRole(String id, String role);
}
