package com.businessprohub.backend.repository;

import com.businessprohub.backend.entity.Customer;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface CustomerRepository extends JpaRepository<Customer, String> {
    List<Customer> findByBusinessId(String businessId);
    long countByBusinessId(String businessId);
    Optional<Customer> findByBusinessIdAndPhone(String businessId, String phone);
}
