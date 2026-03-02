package com.businessprohub.backend.service;

import com.businessprohub.backend.entity.AppUser;
import com.businessprohub.backend.entity.Business;
import com.businessprohub.backend.entity.Queue;
import com.businessprohub.backend.exception.BadRequestException;
import com.businessprohub.backend.exception.ResourceNotFoundException;
import com.businessprohub.backend.repository.AppUserRepository;
import com.businessprohub.backend.repository.BusinessRepository;
import com.businessprohub.backend.repository.QueueRepository;
import org.springframework.stereotype.Service;

import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.util.*;

@Service
public class QueueService {

    private final QueueRepository queueRepo;
    private final BusinessRepository businessRepo;
    private final AppUserRepository appUserRepo;

    public QueueService(QueueRepository queueRepo,
                        BusinessRepository businessRepo,
                        AppUserRepository appUserRepo) {
        this.queueRepo = queueRepo;
        this.businessRepo = businessRepo;
        this.appUserRepo = appUserRepo;
    }

    /** GET /api/queue?business_id=&status=&date= */
    public Map<String, Object> getQueue(String businessId, String status, String date) {
        OffsetDateTime dayStart = todayStart(date);
        List<Queue> entries = queueRepo.findByBusinessIdAndCreatedAtAfterOrderByPositionAsc(businessId, dayStart);

        if (status != null && !status.isBlank() && !"all".equals(status)) {
            List<String> dbStatuses = mapUiStatusToDb(status);
            entries = entries.stream()
                    .filter(q -> dbStatuses.contains(q.getStatus()))
                    .toList();
        }

        long waiting = entries.stream().filter(q -> "waiting".equals(q.getStatus())).count();
        long serving = entries.stream().filter(q -> List.of("in_progress", "called").contains(q.getStatus())).count();
        long completed = entries.stream().filter(q -> "completed".equals(q.getStatus())).count();

        Map<String, Object> result = new HashMap<>();
        result.put("data", entries);
        result.put("stats", Map.of(
                "total", entries.size(),
                "waiting", waiting,
                "serving", serving,
                "completed", completed
        ));
        return result;
    }

    /** POST /api/queue — walk-in customer */
    public Map<String, Object> addWalkIn(Map<String, Object> body) {
        String businessId = (String) body.get("business_id");
        String customerName = (String) body.get("customer_name");
        String customerPhone = (String) body.get("customer_phone");
        String queueTypeId = (String) body.get("queue_type_id");
        String queueTypeName = (String) body.get("queue_type_name");

        Business business = businessRepo.findByIdAndIsActive(businessId, true)
                .orElseThrow(() -> new ResourceNotFoundException("Business not found or inactive"));

        Queue entry = new Queue();
        entry.setBusinessId(businessId);
        entry.setCustomerName(customerName);
        entry.setCustomerPhone(customerPhone);
        entry.setCustomerEmail((String) body.get("customer_email"));
        entry.setServiceType(queueTypeId);
        entry.setNotes(buildNotes(queueTypeName, (String) body.get("notes")));
        entry.setPriority("normal");
        entry.setStatus("waiting");

        OffsetDateTime now = OffsetDateTime.now(ZoneOffset.UTC);
        entry.setJoinedAt(now);
        entry.setCreatedAt(now);

        int position = nextPosition(businessId, queueTypeId, now.toLocalDate().atStartOfDay().atOffset(ZoneOffset.UTC));
        entry.setPosition(position);

        Queue saved = queueRepo.save(entry);
        return buildTicketResponse(saved, business.getBusinessName(), queueTypeId, queueTypeName, position);
    }

    /** POST /api/queue/join — QR / mobile app join */
    public Map<String, Object> joinQueue(Map<String, Object> body) {
        String businessId = (String) body.get("business_id");
        String userId = (String) body.get("user_id");
        String queueTypeId = (String) body.get("queue_type_id");
        String queueTypeName = (String) body.get("queue_type_name");

        Business business = businessRepo.findByIdAndIsActive(businessId, true)
                .orElseThrow(() -> new ResourceNotFoundException("Business not found or is inactive"));

        String resolvedName = (String) body.get("customer_name");
        String resolvedPhone = (String) body.get("customer_phone");
        String resolvedEmail = (String) body.get("customer_email");

        if (userId != null) {
            AppUser user = appUserRepo.findById(userId)
                    .orElseThrow(() -> new ResourceNotFoundException("User not found"));
            resolvedName = user.getFullName() != null ? user.getFullName() : resolvedName;
            resolvedPhone = user.getPhoneNumber() != null ? user.getPhoneNumber() : resolvedPhone;
            resolvedEmail = user.getEmail() != null ? user.getEmail() : resolvedEmail;
        }

        final String finalPhone = resolvedPhone;

        if (resolvedName == null || resolvedName.isBlank()) {
            throw new BadRequestException("Business ID and customer name are required");
        }
        if (userId == null && (resolvedPhone == null || resolvedPhone.isBlank())) {
            throw new BadRequestException("Phone number is required for non-app users");
        }

        // Check duplicate
        OffsetDateTime dayStart = OffsetDateTime.now(ZoneOffset.UTC).toLocalDate()
                .atStartOfDay().atOffset(ZoneOffset.UTC);
        List<Queue> existing = queueRepo.findByBusinessIdAndStatusIn(businessId,
                List.of("waiting", "in_progress", "called"));
        Optional<Queue> duplicate = existing.stream()
                .filter(q -> q.getCreatedAt().isAfter(dayStart))
                .filter(q -> {
                    if (userId != null) return userId.equals(q.getCustomerId());
                    return finalPhone.equals(q.getCustomerPhone());
                })
                .filter(q -> queueTypeId == null || queueTypeId.equals(q.getServiceType()))
                .findFirst();

        if (duplicate.isPresent()) {
            throw new BadRequestException("You are already in the queue");
        }

        int position = nextPosition(businessId, queueTypeId, dayStart);

        Queue entry = new Queue();
        entry.setBusinessId(businessId);
        entry.setCustomerId(userId);
        entry.setCustomerName(resolvedName);
        entry.setCustomerPhone(resolvedPhone);
        entry.setCustomerEmail(resolvedEmail);
        entry.setServiceType(queueTypeId);
        entry.setNotes(buildNotes(queueTypeName, (String) body.get("notes")));
        entry.setPriority("normal");
        entry.setPosition(position);
        entry.setStatus("waiting");
        OffsetDateTime now = OffsetDateTime.now(ZoneOffset.UTC);
        entry.setJoinedAt(now);
        entry.setCreatedAt(now);

        Queue saved = queueRepo.save(entry);

        // Estimate wait time
        long peopleAhead = queueRepo.countByBusinessIdAndStatusAndPositionLessThanAndCreatedAtAfter(
                businessId, "waiting", position, dayStart);
        int estimatedWait = (int)(peopleAhead * 5);

        Map<String, Object> data = buildTicketResponse(saved, business.getBusinessName(), queueTypeId, queueTypeName, position);
        data.put("people_ahead", peopleAhead);
        data.put("estimated_wait_minutes", estimatedWait);
        return Map.of("data", data, "message", "Successfully joined the queue!");
    }

    /** GET /api/queue/info?business_id=&queue_type_id= */
    public Map<String, Object> getQueueInfo(String businessId, String queueTypeId) {
        Business business = businessRepo.findById(businessId)
                .orElseThrow(() -> new ResourceNotFoundException("Business not found"));

        OffsetDateTime dayStart = OffsetDateTime.now(ZoneOffset.UTC).toLocalDate()
                .atStartOfDay().atOffset(ZoneOffset.UTC);

        long waitingCount = queueRepo.countByBusinessIdAndStatusAndCreatedAtAfter(businessId, "waiting", dayStart);

        Optional<Queue> serving = queueRepo.findFirstByBusinessIdAndStatusInOrderByStartedAtAsc(
                businessId, List.of("in_progress", "called"));

        return Map.of("data", Map.of(
                "business_name", business.getBusinessName(),
                "is_open", true,
                "current_serving_number", serving.map(q -> pad(q.getPosition())).orElse(""),
                "current_serving_name", serving.map(q -> q.getCustomerName() != null ? q.getCustomerName() : "").orElse(""),
                "total_waiting", waitingCount,
                "avg_wait_time", 5
        ));
    }

    /** GET /api/queue/status?ticket=&phone=&business_id= */
    public Map<String, Object> getStatus(String ticket, String phone, String businessId) {
        OffsetDateTime dayStart = OffsetDateTime.now(ZoneOffset.UTC).toLocalDate()
                .atStartOfDay().atOffset(ZoneOffset.UTC);

        Queue entry;
        if (ticket != null) {
            entry = queueRepo.findById(ticket)
                    .orElseThrow(() -> new ResourceNotFoundException("Queue entry not found"));
        } else {
            entry = queueRepo.findByBusinessIdAndStatusIn(businessId, List.of("waiting", "in_progress", "called"))
                    .stream()
                    .filter(q -> Objects.equals(phone, q.getCustomerPhone()))
                    .filter(q -> q.getCreatedAt().isAfter(dayStart))
                    .findFirst()
                    .orElseThrow(() -> new ResourceNotFoundException("Queue entry not found"));
        }

        Business business = businessRepo.findById(entry.getBusinessId()).orElse(null);
        long peopleAhead = queueRepo.countByBusinessIdAndStatusAndPositionLessThanAndCreatedAtAfter(
                entry.getBusinessId(), "waiting", entry.getPosition(), dayStart);
        long waitingCount = queueRepo.countByBusinessIdAndStatusAndCreatedAtAfter(entry.getBusinessId(), "waiting", dayStart);
        Optional<Queue> serving = queueRepo.findFirstByBusinessIdAndStatusInOrderByStartedAtAsc(
                entry.getBusinessId(), List.of("in_progress", "called"));

        String uiStatus = mapDbStatusToUi(entry.getStatus());

        Map<String, Object> data = new HashMap<>();
        data.put("id", entry.getId());
        data.put("ticket_number", entry.getId());
        data.put("customer_name", entry.getCustomerName());
        data.put("display_number", pad(entry.getPosition()));
        data.put("position", entry.getPosition());
        data.put("status", uiStatus);
        data.put("people_ahead", peopleAhead);
        data.put("estimated_wait_minutes", peopleAhead * 5);
        data.put("business_name", business != null ? business.getBusinessName() : "");
        data.put("service_type", entry.getServiceType());

        Map<String, Object> queueInfo = new HashMap<>();
        queueInfo.put("current_serving_number", serving.map(q -> pad(q.getPosition())).orElse(null));
        queueInfo.put("current_serving_name", serving.map(Queue::getCustomerName).orElse(null));
        queueInfo.put("total_waiting", waitingCount);

        return Map.of("data", data, "queue_info", queueInfo);
    }

    /** PATCH /api/queue/{id} — update status */
    public Queue updateEntry(String id, Map<String, Object> body) {
        Queue entry = queueRepo.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Queue entry not found"));

        if (body.containsKey("status")) {
            String uiStatus = (String) body.get("status");
            // Map UI → DB
            String dbStatus = switch (uiStatus) {
                case "serving" -> "in_progress";
                case "waiting" -> "waiting";
                case "completed" -> "completed";
                case "cancelled" -> "cancelled";
                case "no_show" -> "no_show";
                default -> uiStatus;
            };
            entry.setStatus(dbStatus);
            if ("in_progress".equals(dbStatus) && entry.getStartedAt() == null) {
                entry.setStartedAt(OffsetDateTime.now(ZoneOffset.UTC));
            }
            if ("completed".equals(dbStatus) && entry.getCompletedAt() == null) {
                entry.setCompletedAt(OffsetDateTime.now(ZoneOffset.UTC));
            }
        }
        if (body.containsKey("notes")) entry.setNotes((String) body.get("notes"));
        if (body.containsKey("priority")) entry.setPriority((String) body.get("priority"));
        entry.setUpdatedAt(OffsetDateTime.now(ZoneOffset.UTC));
        return queueRepo.save(entry);
    }

    // ── helpers ──────────────────────────────────────────────────────────────

    private int nextPosition(String businessId, String queueTypeId, OffsetDateTime dayStart) {
        if (queueTypeId != null && !queueTypeId.isBlank()) {
            return queueRepo.findMaxPositionForQueueType(businessId, queueTypeId, dayStart)
                    .map(m -> m + 1).orElse(1);
        }
        return queueRepo.findMaxPositionForBusinessToday(businessId, dayStart)
                .map(m -> m + 1).orElse(1);
    }

    private String buildNotes(String queueTypeName, String notes) {
        if (queueTypeName != null && !queueTypeName.isBlank()) {
            return "[" + queueTypeName + "]" + (notes != null ? " " + notes : "");
        }
        return notes;
    }

    private String pad(int n) {
        return String.format("%03d", n);
    }

    private String mapDbStatusToUi(String dbStatus) {
        return switch (dbStatus) {
            case "in_progress", "called" -> "serving";
            default -> dbStatus;
        };
    }

    private List<String> mapUiStatusToDb(String uiStatus) {
        return switch (uiStatus) {
            case "serving" -> List.of("in_progress", "called");
            default -> List.of(uiStatus);
        };
    }

    private Map<String, Object> buildTicketResponse(Queue entry, String businessName,
                                                      String queueTypeId, String queueTypeName,
                                                      int position) {
        Map<String, Object> data = new HashMap<>();
        data.put("id", entry.getId());
        data.put("ticket_number", entry.getId());
        data.put("business_name", businessName);
        data.put("display_number", pad(position));
        data.put("position", position);
        data.put("status", entry.getStatus());
        data.put("queue_type_id", queueTypeId);
        data.put("queue_type_name", queueTypeName);
        data.put("customer_name", entry.getCustomerName());
        data.put("customer_phone", entry.getCustomerPhone());
        return data;
    }

    private OffsetDateTime todayStart(String date) {
        if (date != null && !date.isBlank()) {
            try {
                return java.time.LocalDate.parse(date).atStartOfDay().atOffset(ZoneOffset.UTC);
            } catch (Exception ignored) {}
        }
        return OffsetDateTime.now(ZoneOffset.UTC).toLocalDate()
                .atStartOfDay().atOffset(ZoneOffset.UTC);
    }
}
