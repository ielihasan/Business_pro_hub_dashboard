package com.businessprohub.backend.repository;

import com.businessprohub.backend.entity.Order;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface OrderRepository extends JpaRepository<Order, String> {
    List<Order> findByBusinessId(String businessId);
    List<Order> findByBusinessIdAndStatus(String businessId, String status);
}
