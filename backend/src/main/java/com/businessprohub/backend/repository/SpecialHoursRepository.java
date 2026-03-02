package com.businessprohub.backend.repository;

import com.businessprohub.backend.entity.SpecialHours;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface SpecialHoursRepository extends JpaRepository<SpecialHours, String> {
    List<SpecialHours> findByBusinessId(String businessId);
}
