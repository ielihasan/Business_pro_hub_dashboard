package com.businessprohub.backend.repository;

import com.businessprohub.backend.entity.Subscription;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface SubscriptionRepository extends JpaRepository<Subscription, String> {
    List<Subscription> findByBusinessId(String businessId);
    List<Subscription> findByStatus(String status);
}
