package com.businessprohub.backend.service;

import com.businessprohub.backend.entity.AppUser;
import com.businessprohub.backend.entity.Business;
import com.businessprohub.backend.entity.Customer;
import com.businessprohub.backend.entity.Queue;
import com.businessprohub.backend.entity.QueuePricing;
import com.businessprohub.backend.exception.BadRequestException;
import com.businessprohub.backend.exception.ResourceNotFoundException;
import com.businessprohub.backend.repository.AppUserRepository;
import com.businessprohub.backend.repository.BusinessRepository;
import com.businessprohub.backend.repository.CustomerRepository;
import com.businessprohub.backend.repository.QueuePricingRepository;
import com.businessprohub.backend.repository.QueueRepository;
import com.businessprohub.backend.repository.ServiceEntityRepository;
import jakarta.persistence.EntityManager;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.util.*;
import java.util.OptionalDouble;
import java.util.stream.Collectors;

@Slf4j
@Service
public class QueueService {

    private final QueueRepository queueRepo;
    private final BusinessRepository businessRepo;
    private final AppUserRepository appUserRepo;
    private final ServiceEntityRepository serviceRepo;
    private final QueuePricingRepository pricingRepo;
    private final EntityManager entityManager;
    private final CustomerRepository customerRepo;

    public QueueService(QueueRepository queueRepo,
                        BusinessRepository businessRepo,
                        AppUserRepository appUserRepo,
                        ServiceEntityRepository serviceRepo,
                        QueuePricingRepository pricingRepo,
                        EntityManager entityManager,
                        CustomerRepository customerRepo) {
        this.queueRepo = queueRepo;
        this.businessRepo = businessRepo;
        this.appUserRepo = appUserRepo;
        this.serviceRepo = serviceRepo;
        this.pricingRepo = pricingRepo;
        this.entityManager = entityManager;
        this.customerRepo = customerRepo;
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
        long cancelled = entries.stream().filter(q -> "cancelled".equals(q.getStatus())).count();

        // Revenue from queue_pricing table (exclude cancelled/no_show entries)
        Set<String> billableIds = entries.stream()
                .filter(q -> !"cancelled".equals(q.getStatus()) && !"no_show".equals(q.getStatus()))
                .map(Queue::getId)
                .collect(Collectors.toSet());
        BigDecimal totalRevenue = billableIds.isEmpty() ? BigDecimal.ZERO :
                pricingRepo.findByQueueIdIn(billableIds).stream()
                        .map(p -> p.getTotalPrice() != null ? p.getTotalPrice() : BigDecimal.ZERO)
                        .reduce(BigDecimal.ZERO, BigDecimal::add);

        // Avg wait: average minutes between joined_at and started_at for served entries today
        OptionalDouble avgWait = entries.stream()
                .filter(q -> q.getJoinedAt() != null && q.getStartedAt() != null)
                .mapToLong(q -> java.time.Duration.between(q.getJoinedAt(), q.getStartedAt()).toMinutes())
                .filter(m -> m >= 0)
                .average();

        Map<String, Object> stats = new HashMap<>();
        stats.put("total", entries.size());
        stats.put("waiting", waiting);
        stats.put("serving", serving);
        stats.put("completed", completed);
        stats.put("cancelled", cancelled);
        stats.put("estimated_revenue", totalRevenue);
        stats.put("avg_wait_time", avgWait.isPresent() ? (long) avgWait.getAsDouble() : 0);

        Map<String, Object> result = new HashMap<>();
        result.put("data", entries);
        result.put("stats", stats);
        return result;
    }

    /** POST /api/queue — walk-in customer (added by staff via dashboard) */
    @Transactional
    public Map<String, Object> addWalkIn(Map<String, Object> body) {
        String businessId = (String) body.get("business_id");
        String customerName = (String) body.get("customer_name");
        String customerPhone = (String) body.get("customer_phone");
        String queueTypeId = (String) body.get("queue_type_id");
        String queueTypeName = (String) body.get("queue_type_name");
        int quantity = body.get("quantity") != null ? Integer.parseInt(body.get("quantity").toString()) : 1;

        Business business = businessRepo.findByIdAndIsActive(businessId, true)
                .orElseThrow(() -> new ResourceNotFoundException("Business not found or inactive"));

        // For walk-ins, resolve price server-side from services table
        BigDecimal unitPrice = resolvePrice(queueTypeId);
        BigDecimal totalPrice = unitPrice.multiply(BigDecimal.valueOf(quantity));

        Queue entry = new Queue();
        entry.setBusinessId(businessId);
        entry.setCustomerName(customerName);
        entry.setCustomerPhone(customerPhone);
        entry.setCustomerEmail((String) body.get("customer_email"));
        entry.setServiceType(queueTypeId);
        entry.setNotes(buildNotes(queueTypeName, (String) body.get("notes")));
        entry.setPriority("normal");
        entry.setStatus("waiting");
        entry.setQuantity(quantity);
        entry.setUnitPrice(unitPrice);
        entry.setTotalPrice(totalPrice);
        entry.setAdvancePaid(BigDecimal.ZERO);   // walk-in: no advance paid upfront
        entry.setPaymentLeft(totalPrice);          // full amount due at counter

        OffsetDateTime now = OffsetDateTime.now(ZoneOffset.UTC);
        entry.setJoinedAt(now);
        entry.setCreatedAt(now);

        int position = nextPosition(businessId, queueTypeId, now.toLocalDate().atStartOfDay().atOffset(ZoneOffset.UTC));
        entry.setPosition(position);

        Queue saved = queueRepo.save(entry);

        // Store pricing in queue_pricing table
        savePricing(saved.getId(), businessId, quantity, unitPrice, totalPrice, now);

        Map<String, Object> data = buildTicketResponse(saved, business.getBusinessName(), queueTypeId, queueTypeName, position, unitPrice, totalPrice);
        return Map.of("data", data, "message", "Customer added to queue");
    }

    /** POST /api/queue/join — QR / mobile app join (client sends calculated total_price) */
    @Transactional
    public Map<String, Object> joinQueue(Map<String, Object> body) {
        String businessId = (String) body.get("business_id");
        String userId = (String) body.get("user_id");
        String queueTypeId = (String) body.get("queue_type_id");
        String queueTypeName = (String) body.get("queue_type_name");
        int quantity = body.get("quantity") != null ? Integer.parseInt(body.get("quantity").toString()) : 1;

        // Mobile app sends unit_price + total_price (all calculations done client-side)
        BigDecimal unitPrice = parseBigDecimal(body.get("unit_price"), BigDecimal.ZERO);
        BigDecimal totalPrice = parseBigDecimal(body.get("total_price"), BigDecimal.ZERO);

        // Fallback: if client didn't send prices, resolve server-side
        if (unitPrice.compareTo(BigDecimal.ZERO) == 0) {
            unitPrice = resolvePrice(queueTypeId);
        }
        if (totalPrice.compareTo(BigDecimal.ZERO) == 0 && unitPrice.compareTo(BigDecimal.ZERO) > 0) {
            totalPrice = unitPrice.multiply(BigDecimal.valueOf(quantity));
        }

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
        entry.setQuantity(quantity);
        entry.setUnitPrice(unitPrice);
        entry.setTotalPrice(totalPrice);

        OffsetDateTime now = OffsetDateTime.now(ZoneOffset.UTC);
        entry.setJoinedAt(now);
        entry.setCreatedAt(now);

        Queue saved = queueRepo.save(entry);

        // Store pricing in queue_pricing table
        savePricing(saved.getId(), businessId, quantity, unitPrice, totalPrice, now);

        // AI Wait Time Predictor — real average from completed queues today
        long peopleAhead = queueRepo.countByBusinessIdAndStatusAndPositionLessThanAndCreatedAtAfter(
                businessId, "waiting", position, dayStart);
        double avgMinutes = calcAvgServiceMinutes(businessId, queueTypeId, dayStart);
        int estimatedWait = (int) Math.max(1, Math.ceil(peopleAhead * avgMinutes));
        long dataPoints = queueRepo.countCompletedWithTimingToday(businessId, dayStart);
        if (dataPoints == 0) dataPoints = queueRepo.countCompletedWithTimingToday(businessId, dayStart.minusDays(7));

        Map<String, Object> data = buildTicketResponse(saved, business.getBusinessName(), queueTypeId, queueTypeName, position, unitPrice, totalPrice);
        data.put("people_ahead", peopleAhead);
        data.put("estimated_wait_minutes", estimatedWait);
        data.put("avg_service_minutes", Math.round(avgMinutes * 10.0) / 10.0);
        data.put("wait_data_points", dataPoints);
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

        double avgMinutes = calcAvgServiceMinutes(businessId, queueTypeId, dayStart);
        long dataPoints = queueRepo.countCompletedWithTimingToday(businessId, dayStart);
        if (dataPoints == 0) dataPoints = queueRepo.countCompletedWithTimingToday(businessId, dayStart.minusDays(7));

        return Map.of("data", Map.of(
                "business_name", business.getBusinessName(),
                "is_open", true,
                "current_serving_number", serving.map(q -> pad(q.getPosition())).orElse(""),
                "current_serving_name", serving.map(q -> q.getCustomerName() != null ? q.getCustomerName() : "").orElse(""),
                "total_waiting", waitingCount,
                "avg_wait_time", (int) Math.ceil(avgMinutes),
                "wait_data_points", dataPoints
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

        // Load pricing
        Optional<QueuePricing> pricing = pricingRepo.findByQueueId(entry.getId());

        String uiStatus = mapDbStatusToUi(entry.getStatus());

        Map<String, Object> data = new HashMap<>();
        data.put("id", entry.getId());
        data.put("ticket_number", entry.getId());
        data.put("customer_name", entry.getCustomerName());
        data.put("display_number", pad(entry.getPosition()));
        data.put("position", entry.getPosition());
        data.put("status", uiStatus);
        double avgMinutesStatus = calcAvgServiceMinutes(entry.getBusinessId(), entry.getServiceType(), dayStart);
        long dataPointsStatus = queueRepo.countCompletedWithTimingToday(entry.getBusinessId(), dayStart);
        data.put("people_ahead", peopleAhead);
        data.put("estimated_wait_minutes", (int) Math.max(1, Math.ceil(peopleAhead * avgMinutesStatus)));
        data.put("avg_service_minutes", Math.round(avgMinutesStatus * 10.0) / 10.0);
        data.put("wait_data_points", dataPointsStatus);
        data.put("business_name", business != null ? business.getBusinessName() : "");
        data.put("service_type", entry.getServiceType());
        data.put("quantity", entry.getQuantity() != null ? entry.getQuantity() : 1);
        data.put("unit_price", pricing.map(p -> p.getUnitPrice() != null ? p.getUnitPrice() : BigDecimal.ZERO).orElse(BigDecimal.ZERO));
        data.put("total_price", pricing.map(p -> p.getTotalPrice() != null ? p.getTotalPrice() : BigDecimal.ZERO).orElse(BigDecimal.ZERO));
        // Keep estimated_price alias for backwards compat with frontend
        data.put("estimated_price", pricing.map(p -> p.getTotalPrice() != null ? p.getTotalPrice() : BigDecimal.ZERO).orElse(BigDecimal.ZERO));

        Map<String, Object> queueInfo = new HashMap<>();
        queueInfo.put("current_serving_number", serving.map(q -> pad(q.getPosition())).orElse(null));
        queueInfo.put("current_serving_name", serving.map(Queue::getCustomerName).orElse(null));
        queueInfo.put("total_waiting", waitingCount);

        return Map.of("data", data, "queue_info", queueInfo);
    }

    /** PATCH /api/queue/{id} — update status */
    @Transactional
    public Queue updateEntry(String id, Map<String, Object> body) {
        Queue entry = queueRepo.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Queue entry not found"));

        if (body.containsKey("status")) {
            String uiStatus = (String) body.get("status");
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
                upsertCustomer(entry);
            }
        }
        if (body.containsKey("notes"))        entry.setNotes((String) body.get("notes"));
        if (body.containsKey("priority"))     entry.setPriority((String) body.get("priority"));
        if (body.containsKey("advance_paid")) entry.setAdvancePaid(parseBigDecimal(body.get("advance_paid"), BigDecimal.ZERO));
        if (body.containsKey("payment_left")) entry.setPaymentLeft(parseBigDecimal(body.get("payment_left"), BigDecimal.ZERO));
        if (body.containsKey("customer_name"))  entry.setCustomerName((String) body.get("customer_name"));
        if (body.containsKey("customer_phone")) entry.setCustomerPhone((String) body.get("customer_phone"));
        if (body.containsKey("customer_email")) entry.setCustomerEmail((String) body.get("customer_email"));
        if (body.containsKey("service_type"))   entry.setServiceType((String) body.get("service_type"));
        entry.setUpdatedAt(OffsetDateTime.now(ZoneOffset.UTC));
        return queueRepo.save(entry);
    }

    // ── helpers ──────────────────────────────────────────────────────────────

    private void upsertCustomer(Queue entry) {
        if (entry.getBusinessId() == null) return;
        String phone = entry.getCustomerPhone();
        if (phone == null || phone.isBlank()) return;
        customerRepo.findByBusinessIdAndPhone(entry.getBusinessId(), phone).orElseGet(() -> {
            Customer c = new Customer();
            c.setBusinessId(entry.getBusinessId());
            c.setName(entry.getCustomerName());
            c.setPhone(phone);
            c.setEmail(entry.getCustomerEmail());
            c.setCreatedAt(OffsetDateTime.now(ZoneOffset.UTC));
            return customerRepo.save(c);
        });
    }

    /**
     * AI Wait Time Predictor — calculates real average service duration (minutes).
     * Priority: today by service type → today all types → last 7 days by type → last 7 days all → default 5 min.
     */
    private double calcAvgServiceMinutes(String businessId, String serviceType, OffsetDateTime dayStart) {
        final double DEFAULT_MINUTES = 5.0;
        // Try today first
        if (serviceType != null && !serviceType.isBlank()) {
            Double avg = queueRepo.avgServiceMinutesByTypeToday(businessId, serviceType, dayStart);
            if (avg != null && avg > 0) return Math.max(1.0, avg);
        }
        Double avgAll = queueRepo.avgServiceMinutesToday(businessId, dayStart);
        if (avgAll != null && avgAll > 0) return Math.max(1.0, avgAll);

        // Fall back to last 7 days if today has no completed data
        OffsetDateTime weekStart = dayStart.minusDays(7);
        if (serviceType != null && !serviceType.isBlank()) {
            Double avg7 = queueRepo.avgServiceMinutesByTypeToday(businessId, serviceType, weekStart);
            if (avg7 != null && avg7 > 0) return Math.max(1.0, avg7);
        }
        Double avgAll7 = queueRepo.avgServiceMinutesToday(businessId, weekStart);
        if (avgAll7 != null && avgAll7 > 0) return Math.max(1.0, avgAll7);

        return DEFAULT_MINUTES;
    }

    private void savePricing(String queueId, String businessId, int quantity,
                              BigDecimal unitPrice, BigDecimal totalPrice, OffsetDateTime now) {
        QueuePricing pricing = new QueuePricing();
        pricing.setQueueId(queueId);
        pricing.setBusinessId(businessId);
        pricing.setQuantity(quantity);
        pricing.setUnitPrice(unitPrice);
        pricing.setTotalPrice(totalPrice);
        pricing.setCreatedAt(now);
        pricing.setUpdatedAt(now);
        pricingRepo.save(pricing);
    }

    private int nextPosition(String businessId, String queueTypeId, OffsetDateTime dayStart) {
        // Acquire a per-business transaction-scoped advisory lock so that two
        // concurrent transactions cannot both read the same MAX(position) and
        // assign duplicate position numbers.
        long lockKey = businessId.replace("-", "").substring(0, 16)
                .chars().asLongStream().reduce(0L, (a, b) -> a * 31 + b);
        entityManager.createNativeQuery("SELECT pg_advisory_xact_lock(:key)")
                .setParameter("key", lockKey)
                .getSingleResult();

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
                                                      int position, BigDecimal unitPrice, BigDecimal totalPrice) {
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
        data.put("quantity", entry.getQuantity() != null ? entry.getQuantity() : 1);
        data.put("unit_price", unitPrice != null ? unitPrice : BigDecimal.ZERO);
        data.put("total_price", totalPrice != null ? totalPrice : BigDecimal.ZERO);
        // Keep estimated_price alias so existing frontend code still works
        data.put("estimated_price", totalPrice != null ? totalPrice : BigDecimal.ZERO);
        data.put("created_at", entry.getCreatedAt() != null ? entry.getCreatedAt().toString() : null);
        return data;
    }

    /** Resolve unit price from services table (used as fallback when client doesn't send price). */
    private BigDecimal resolvePrice(String queueTypeId) {
        if (queueTypeId == null || queueTypeId.isBlank()) return BigDecimal.ZERO;
        return serviceRepo.findById(queueTypeId)
                .map(s -> s.getPrice() != null ? s.getPrice() : BigDecimal.ZERO)
                .orElse(BigDecimal.ZERO);
    }

    private BigDecimal parseBigDecimal(Object value, BigDecimal fallback) {
        if (value == null) return fallback;
        try {
            return new BigDecimal(value.toString());
        } catch (NumberFormatException e) {
            return fallback;
        }
    }

    private OffsetDateTime todayStart(String date) {
        if (date != null && !date.isBlank()) {
            try {
                return java.time.LocalDate.parse(date).atStartOfDay().atOffset(ZoneOffset.UTC);
            } catch (Exception e) {
                log.debug("Invalid date string '{}' for todayStart filter, using current date: {}", date, e.getMessage());
            }
        }
        return OffsetDateTime.now(ZoneOffset.UTC).toLocalDate()
                .atStartOfDay().atOffset(ZoneOffset.UTC);
    }
}
