package com.businessprohub.backend.repository;

import com.businessprohub.backend.entity.Queue;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface QueueRepository extends JpaRepository<Queue, String> {
    List<Queue> findByBusinessId(String businessId);
    List<Queue> findByBusinessIdAndCreatedAtAfterOrderByPositionAsc(String businessId, java.time.OffsetDateTime after);
    List<Queue> findByBusinessIdAndStatus(String businessId, String status);
    List<Queue> findByBusinessIdAndStatusIn(String businessId, List<String> statuses);

    @org.springframework.data.jpa.repository.Query(
        "SELECT MAX(q.position) FROM Queue q WHERE q.businessId = :businessId AND q.createdAt >= :dayStart"
    )
    Optional<Integer> findMaxPositionForBusinessToday(String businessId, java.time.OffsetDateTime dayStart);

    @org.springframework.data.jpa.repository.Query(
        "SELECT MAX(q.position) FROM Queue q WHERE q.businessId = :businessId AND q.serviceType = :queueTypeId AND q.createdAt >= :dayStart"
    )
    Optional<Integer> findMaxPositionForQueueType(String businessId, String queueTypeId, java.time.OffsetDateTime dayStart);

    long countByBusinessIdAndStatusAndCreatedAtAfter(String businessId, String status, java.time.OffsetDateTime after);

    long countByBusinessIdAndStatusAndPositionLessThanAndCreatedAtAfter(
        String businessId, String status, int position, java.time.OffsetDateTime after
    );

    Optional<Queue> findFirstByBusinessIdAndStatusInOrderByStartedAtAsc(String businessId, List<String> statuses);

    List<Queue> findByBusinessIdAndStatusAndCreatedAtAfterOrderByPositionAsc(
        String businessId, String status, java.time.OffsetDateTime after
    );

    long countByServedByStaffIdAndStatus(String servedByStaffId, String status);
    long countByServedByStaffId(String servedByStaffId);

    long countByStatus(String status);

    @Query("SELECT COUNT(q) FROM Queue q WHERE q.status IN ('waiting', 'in_progress', 'called')")
    long countActiveQueues();
}
