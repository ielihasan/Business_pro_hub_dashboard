package com.businessprohub.backend.repository;

import com.businessprohub.backend.entity.QueuePricing;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.Collection;
import java.util.List;
import java.util.Optional;

public interface QueuePricingRepository extends JpaRepository<QueuePricing, String> {

    Optional<QueuePricing> findByQueueId(String queueId);

    List<QueuePricing> findByQueueIdIn(Collection<String> queueIds);

    List<QueuePricing> findByBusinessId(String businessId);

    @Query("SELECT COALESCE(SUM(p.totalPrice), 0) FROM QueuePricing p " +
           "WHERE p.businessId = :businessId AND p.createdAt >= :after")
    BigDecimal sumTotalPriceByBusinessIdSince(String businessId, OffsetDateTime after);
}
