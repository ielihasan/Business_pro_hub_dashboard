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

    // ── AI Wait Time Predictor ────────────────────────────────────────────────

    /** Average service duration (minutes) for a specific service type today. */
    @Query(value = """
        SELECT AVG(EXTRACT(EPOCH FROM (completed_at - started_at)) / 60.0)
        FROM queues
        WHERE business_id = :businessId
          AND service_type = :serviceType
          AND status = 'completed'
          AND started_at IS NOT NULL
          AND completed_at IS NOT NULL
          AND completed_at >= :dayStart
        """, nativeQuery = true)
    Double avgServiceMinutesByTypeToday(@org.springframework.data.repository.query.Param("businessId") String businessId,
                                        @org.springframework.data.repository.query.Param("serviceType") String serviceType,
                                        @org.springframework.data.repository.query.Param("dayStart") java.time.OffsetDateTime dayStart);

    /** Average service duration (minutes) across all service types today. */
    @Query(value = """
        SELECT AVG(EXTRACT(EPOCH FROM (completed_at - started_at)) / 60.0)
        FROM queues
        WHERE business_id = :businessId
          AND status = 'completed'
          AND started_at IS NOT NULL
          AND completed_at IS NOT NULL
          AND completed_at >= :dayStart
        """, nativeQuery = true)
    Double avgServiceMinutesToday(@org.springframework.data.repository.query.Param("businessId") String businessId,
                                  @org.springframework.data.repository.query.Param("dayStart") java.time.OffsetDateTime dayStart);

    /** How many completed entries have timing data today (confidence indicator). */
    @Query(value = """
        SELECT COUNT(*)
        FROM queues
        WHERE business_id = :businessId
          AND status = 'completed'
          AND started_at IS NOT NULL
          AND completed_at IS NOT NULL
          AND completed_at >= :dayStart
        """, nativeQuery = true)
    long countCompletedWithTimingToday(@org.springframework.data.repository.query.Param("businessId") String businessId,
                                       @org.springframework.data.repository.query.Param("dayStart") java.time.OffsetDateTime dayStart);
}
