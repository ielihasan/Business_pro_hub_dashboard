package com.businessprohub.backend.repository;

import com.businessprohub.backend.entity.BusinessHours;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface BusinessHoursRepository extends JpaRepository<BusinessHours, String> {
    List<BusinessHours> findByBusinessId(String businessId);
    List<BusinessHours> findByBusinessIdAndDayOfWeek(String businessId, Integer dayOfWeek);
}
