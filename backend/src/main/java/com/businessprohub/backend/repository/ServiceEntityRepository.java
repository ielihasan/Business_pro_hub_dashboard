package com.businessprohub.backend.repository;

import com.businessprohub.backend.entity.ServiceEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ServiceEntityRepository extends JpaRepository<ServiceEntity, String> {
    List<ServiceEntity> findByBusinessId(String businessId);
    List<ServiceEntity> findByBusinessIdAndIsActive(String businessId, Boolean isActive);
}
