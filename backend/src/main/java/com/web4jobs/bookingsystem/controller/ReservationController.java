package com.web4jobs.bookingsystem.controller;

import com.web4jobs.bookingsystem.dto.reservation.ReservationRequest;
import com.web4jobs.bookingsystem.dto.reservation.ReservationResponse;
import com.web4jobs.bookingsystem.dto.response.ReservationStatsResponse;
import com.web4jobs.bookingsystem.mapper.ReservationMapper;
import com.web4jobs.bookingsystem.model.Reservation;
import com.web4jobs.bookingsystem.model.ReservationStatus;
import com.web4jobs.bookingsystem.model.User;
import com.web4jobs.bookingsystem.model.UserRole;
import com.web4jobs.bookingsystem.service.AccessControlService;
import com.web4jobs.bookingsystem.service.ReservationService;
import com.web4jobs.bookingsystem.service.UserService;
import jakarta.validation.Valid;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.time.ZoneId;
import java.time.ZonedDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.stream.Collectors;
import com.web4jobs.bookingsystem.dto.CancellationRequest;
import java.util.Map;
import java.util.HashMap;
import java.time.LocalDate;
import java.util.ArrayList;
import com.web4jobs.bookingsystem.repository.ReservationRepository;
import com.web4jobs.bookingsystem.repository.WorkStationRepository;
import com.web4jobs.bookingsystem.model.WorkStation;

/**
 * REST controller for managing reservations.
 * Provides endpoints for CRUD operations and specialized queries.
 */
@RestController
@RequestMapping("/api/reservations")
public class ReservationController {

    private static final Logger logger = LoggerFactory.getLogger(ReservationController.class);

    private final ReservationService reservationService;
    private final ReservationMapper reservationMapper;
    private final UserService userService;
    private final AccessControlService accessControlService;
    private final ReservationRepository reservationRepository;
    private final WorkStationRepository workStationRepository;

    @Autowired
    public ReservationController(
            ReservationService reservationService, 
            ReservationMapper reservationMapper,
            UserService userService,
            AccessControlService accessControlService,
            ReservationRepository reservationRepository,
            WorkStationRepository workStationRepository) {
        this.reservationService = reservationService;
        this.reservationMapper = reservationMapper;
        this.userService = userService;
        this.accessControlService = accessControlService;
        this.reservationRepository = reservationRepository;
        this.workStationRepository = workStationRepository;
    }

    /**
     * Get all reservations.
     * For CENTER_MANAGER users, only returns reservations from their assigned center.
     *
     * @param authentication The current user's authentication
     * @return List of reservations based on user role
     */
    @GetMapping
    public ResponseEntity<List<ReservationResponse>> getAllReservations(Authentication authentication) {
        List<Reservation> reservations;
        
        // Check if user is authenticated
        if (authentication != null) {
            // Get current user
            String username = authentication.getName();
            User currentUser = userService.findUserByEmail(username)
                    .orElse(null);
            
            // Check if user is CENTER_MANAGER with assigned center
            if (currentUser != null && 
                currentUser.getRole() == UserRole.CENTER_MANAGER && 
                currentUser.getAssignedCenter() != null) {
                
                logger.info("CENTER_MANAGER accessing reservations. Limiting to center ID: {}", 
                        currentUser.getAssignedCenter().getId());
                
                // Get only reservations for this center
                reservations = reservationService.findReservationsByCenter(
                        currentUser.getAssignedCenter().getId());
            } else {
                // For admins and other roles, return all reservations
                logger.info("User with role {} accessing all reservations", 
                        currentUser != null ? currentUser.getRole() : "UNKNOWN");
                reservations = reservationService.findAllReservations();
            }
        } else {
            // No authentication, return all (for development/testing)
            logger.warn("Unauthenticated access to reservations endpoint");
            reservations = reservationService.findAllReservations();
        }
        
        List<ReservationResponse> reservationResponses = reservations.stream()
                .map(reservationMapper::toReservationResponse)
                .collect(Collectors.toList());
        
        logger.info("Returning {} reservations", reservationResponses.size());
        return ResponseEntity.ok(reservationResponses);
    }

    /**
     * Get all reservations for a specific center.
     * Used by CENTER_MANAGER to view only the reservations in their center.
     *
     * @param centerId The ID of the center
     * @return List of reservations for the specified center
     */
    @GetMapping("/center/{centerId}")
    public ResponseEntity<List<ReservationResponse>> getReservationsByCenter(@PathVariable Long centerId) {
        List<Reservation> reservations = reservationService.findReservationsByCenter(centerId);
        List<ReservationResponse> reservationResponses = reservations.stream()
                .map(reservationMapper::toReservationResponse)
                .collect(Collectors.toList());
        return ResponseEntity.ok(reservationResponses);
    }

    /**
     * Get a reservation by ID.
     *
     * @param id The ID of the reservation
     * @param authentication The current user's authentication
     * @return The reservation if found and user has access
     */
    @GetMapping("/{id}")
    public ResponseEntity<ReservationResponse> getReservationById(
            @PathVariable Long id, 
            Authentication authentication) {
            
        // Get the reservation
        Reservation reservation = reservationService.findReservationById(id)
                .orElseThrow(() -> new IllegalArgumentException("Reservation not found with id: " + id));
        
        // Check if user is authenticated
        if (authentication != null) {
            // Get current user
            String username = authentication.getName();
            User currentUser = userService.findUserByEmail(username)
                    .orElseThrow(() -> new IllegalArgumentException("User not found with email: " + username));
            
            // Check if user is CENTER_MANAGER
            if (currentUser.getRole() == UserRole.CENTER_MANAGER) {
                // Verify the reservation belongs to the manager's center
                if (currentUser.getAssignedCenter() == null) {
                    logger.error("CENTER_MANAGER without assigned center attempted to access reservation {}", id);
                    return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
                }
                
                Long centerId = currentUser.getAssignedCenter().getId();
                
                // Check if workstation's center matches the user's center
                boolean hasAccess = reservation.getWorkStation() != null && (
                    // Direct center ID
                    (reservation.getWorkStation().getRoom() != null &&
                     reservation.getWorkStation().getRoom().getCenter() != null &&
                     reservation.getWorkStation().getRoom().getCenter().getId().equals(centerId))
                );
                
                if (!hasAccess) {
                    logger.error("CENTER_MANAGER for center {} attempted to access reservation {} from another center", 
                            centerId, id);
                    return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
                }
                
                logger.info("CENTER_MANAGER for center {} accessed reservation {}", centerId, id);
            }
        }
        
        return ResponseEntity.ok(reservationMapper.toReservationResponse(reservation));
    }

    /**
     * Get all reservations for a specific user.
     *
     * @param userId The ID of the user
     * @return List of reservations for the user
     */
    @GetMapping("/user/{userId}")
    public ResponseEntity<List<ReservationResponse>> getReservationsByUser(@PathVariable Long userId) {
        List<Reservation> reservations = reservationService.findReservationsByUser(userId);
        List<ReservationResponse> reservationResponses = reservations.stream()
                .map(reservationMapper::toReservationResponse)
                .collect(Collectors.toList());
        return ResponseEntity.ok(reservationResponses);
    }

    /**
     * Get all upcoming reservations for a specific user.
     *
     * @param userId The ID of the user
     * @return List of upcoming reservations for the user
     */
    @GetMapping("/user/{userId}/upcoming")
    public ResponseEntity<List<ReservationResponse>> getUpcomingReservationsForUser(@PathVariable Long userId) {
        List<Reservation> reservations = reservationService.findUpcomingReservationsForUser(userId);
        List<ReservationResponse> reservationResponses = reservations.stream()
                .map(reservationMapper::toReservationResponse)
                .collect(Collectors.toList());
        return ResponseEntity.ok(reservationResponses);
    }

    /**
     * Get all reservations for a specific workstation.
     *
     * @param workStationId The ID of the workstation
     * @return List of reservations for the workstation
     */
    @GetMapping("/workstation/{workStationId}")
    public ResponseEntity<List<ReservationResponse>> getReservationsByWorkStation(@PathVariable Long workStationId) {
        List<Reservation> reservations = reservationService.findReservationsByWorkStation(workStationId);
        List<ReservationResponse> reservationResponses = reservations.stream()
                .map(reservationMapper::toReservationResponse)
                .collect(Collectors.toList());
        return ResponseEntity.ok(reservationResponses);
    }

    /**
     * Get all reservations with a specific status.
     *
     * @param status The status to filter by
     * @return List of reservations with the specified status
     */
    @GetMapping("/status/{status}")
    public ResponseEntity<List<ReservationResponse>> getReservationsByStatus(@PathVariable ReservationStatus status) {
        List<Reservation> reservations = reservationService.findReservationsByStatus(status);
        List<ReservationResponse> reservationResponses = reservations.stream()
                .map(reservationMapper::toReservationResponse)
                .collect(Collectors.toList());
        return ResponseEntity.ok(reservationResponses);
    }

    /**
     * Get all reservations within a specific date/time range.
     *
     * @param startTime The start of the date/time range
     * @param endTime The end of the date/time range
     * @return List of reservations within the specified date/time range
     */
    @GetMapping("/daterange")
    public ResponseEntity<List<ReservationResponse>> getReservationsInDateRange(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime startTime,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime endTime) {
        List<Reservation> reservations = reservationService.findReservationsInDateRange(startTime, endTime);
        List<ReservationResponse> reservationResponses = reservations.stream()
                .map(reservationMapper::toReservationResponse)
                .collect(Collectors.toList());
        return ResponseEntity.ok(reservationResponses);
    }

    /**
     * Check if a workstation is available for a specific time period.
     *
     * @param workStationId The ID of the workstation to check
     * @param startTime The start time of the period
     * @param endTime The end time of the period
     * @return true if the workstation is available, false otherwise
     */
    @GetMapping("/check-availability")
    public ResponseEntity<Boolean> checkWorkStationAvailability(
            @RequestParam Long workStationId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime startTime,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime endTime) {
        boolean isAvailable = reservationService.isWorkStationAvailable(workStationId, startTime, endTime);
        return ResponseEntity.ok(isAvailable);
    }

    /**
     * Create a new reservation.
     *
     * @param reservationRequest The reservation to create
     * @return The created reservation
     */
    @PostMapping
    public ResponseEntity<ReservationResponse> createReservation(@Valid @RequestBody ReservationRequest reservationRequest) {
        logger.info("=== RESERVATION CREATION DEBUG ===");
        logger.info("Creating reservation request: {}", reservationRequest);
        logger.info("Request startTime: {}, endTime: {}", reservationRequest.getStartTime(), reservationRequest.getEndTime());
        logger.info("Current time in default timezone: {}", LocalDateTime.now());
        logger.info("Default timezone: {}", java.util.TimeZone.getDefault().getID());
        logger.info("=====================================");
        
        try {
            Reservation reservation = reservationMapper.toReservation(reservationRequest);
            Reservation createdReservation = reservationService.createReservation(reservation);
            logger.info("Reservation created successfully with ID: {}", createdReservation.getId());
            return new ResponseEntity<>(reservationMapper.toReservationResponse(createdReservation), HttpStatus.CREATED);
        } catch (Exception e) {
            logger.error("Error creating reservation: {}", e.getMessage(), e);
            throw e;
        }
    }

    /**
     * Update an existing reservation.
     *
     * @param id The ID of the reservation to update
     * @param request The updated reservation details
     * @param authentication The current user's authentication
     * @return The updated reservation
     */
    @PatchMapping("/{id}")
    public ResponseEntity<ReservationResponse> updateReservation(
            @PathVariable Long id,
            @Valid @RequestBody ReservationRequest request,
            Authentication authentication) {
        
        if (authentication == null) {
            logger.error("No authentication found for reservation update request");
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        String username = authentication.getName();
        User currentUser = userService.findUserByEmail(username)
                .orElseThrow(() -> new IllegalArgumentException("User not found with email: " + username));

        logger.info("User {} attempting to update reservation {}", username, id);
        
        Reservation reservationDetails = reservationMapper.toReservation(request);
        Reservation updatedReservation;

        // If user is a student, use student-specific update method
        if (currentUser.getRole() == UserRole.STUDENT) {
            updatedReservation = reservationService.updateReservationForStudent(id, reservationDetails, currentUser.getId());
        } else {
            // For admin and managers, use standard update
            updatedReservation = reservationService.updateReservation(id, reservationDetails);
        }

        return ResponseEntity.ok(reservationMapper.toReservationResponse(updatedReservation));
    }

    /**
     * Update the status of a reservation.
     *
     * @param id The ID of the reservation
     * @param status The new status
     * @return The updated reservation
     */
    @PatchMapping("/{id}/status")
    public ResponseEntity<ReservationResponse> updateReservationStatus(
            @PathVariable Long id,
            @RequestParam ReservationStatus status) {
        Reservation updatedReservation = reservationService.updateReservationStatus(id, status);
        return ResponseEntity.ok(reservationMapper.toReservationResponse(updatedReservation));
    }

    /**
     * Cancel a reservation.
     *
     * @param id The ID of the reservation to cancel
     * @return The cancelled reservation
     */
    @PostMapping("/{id}/cancel")
    public ResponseEntity<ReservationResponse> cancelReservation(@PathVariable Long id) {
        Reservation cancelledReservation = reservationService.cancelReservation(id);
        return ResponseEntity.ok(reservationMapper.toReservationResponse(cancelledReservation));
    }

    /**
     * Cancel a reservation with reason (for authorized roles only).
     * Only PEDAGOGICAL_MANAGER, ASSET_MANAGER, EXECUTIVE_DIRECTOR, and ADMIN can use this endpoint.
     *
     * @param id The ID of the reservation to cancel
     * @param request The cancellation request containing the reason
     * @param authentication The current user's authentication
     * @return The cancelled reservation
     */
    @PostMapping("/{id}/cancel-with-reason")
    @PreAuthorize("hasAnyRole('PEDAGOGICAL_MANAGER', 'ASSET_MANAGER', 'EXECUTIVE_DIRECTOR', 'ADMIN')")
    public ResponseEntity<ReservationResponse> cancelReservationWithReason(
            @PathVariable Long id,
            @RequestBody @Valid CancellationRequest request,
            Authentication authentication) {
        
        User currentUser = userService.findUserByEmail(authentication.getName())
                .orElseThrow(() -> new IllegalArgumentException("User not found with email: " + authentication.getName()));
        
        Reservation cancelledReservation = reservationService.cancelReservationWithReason(
                id, request.getReason(), currentUser.getId());
        
        return ResponseEntity.ok(reservationMapper.toReservationResponse(cancelledReservation));
    }

    /**
     * Check if a student can cancel their reservation.
     *
     * @param id The ID of the reservation
     * @param authentication The current user's authentication
     * @return Boolean indicating if cancellation is allowed
     */
    @GetMapping("/{id}/can-cancel")
    public ResponseEntity<Map<String, Object>> canCancelReservation(
            @PathVariable Long id,
            Authentication authentication) {
        
        User currentUser = userService.findUserByEmail(authentication.getName())
                .orElseThrow(() -> new IllegalArgumentException("User not found with email: " + authentication.getName()));
        
        try {
            boolean canCancel = reservationService.canStudentCancelReservation(id, currentUser.getId());
            Map<String, Object> response = new HashMap<>();
            response.put("canCancel", canCancel);
            response.put("message", canCancel ? "Cancellation is allowed" : "Cannot cancel within 1 hour of start time");
            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("canCancel", false);
            errorResponse.put("message", e.getMessage());
            return ResponseEntity.badRequest().body(errorResponse);
        }
    }

    /**
     * Check if a student can make a new reservation (cooldown check).
     *
     * @param startTime The proposed start time for the new reservation
     * @param authentication The current user's authentication
     * @return Boolean indicating if new reservation is allowed
     */
    @GetMapping("/can-reserve")
    public ResponseEntity<Map<String, Object>> canMakeReservation(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime startTime,
            Authentication authentication) {
        
        User currentUser = userService.findUserByEmail(authentication.getName())
                .orElseThrow(() -> new IllegalArgumentException("User not found with email: " + authentication.getName()));
        
        boolean canReserve = reservationService.canStudentMakeReservation(currentUser.getId(), startTime);
        Map<String, Object> response = new HashMap<>();
        response.put("canReserve", canReserve);
        
        if (!canReserve) {
            response.put("message", "You must wait 1 hour after your last reservation ends before making a new one");
        } else {
            response.put("message", "You can make a new reservation");
        }
        
        return ResponseEntity.ok(response);
    }

    /**
     * Check if a user has active reservations (for students - one reservation limit).
     *
     * @param authentication The current user's authentication
     * @return Boolean indicating if user has active reservations
     */
    @GetMapping("/has-active")
    public ResponseEntity<Map<String, Object>> hasActiveReservations(Authentication authentication) {
        User currentUser = userService.findUserByEmail(authentication.getName())
                .orElseThrow(() -> new IllegalArgumentException("User not found with email: " + authentication.getName()));
        
        boolean hasActive = reservationService.hasActiveReservations(currentUser.getId());
        Map<String, Object> response = new HashMap<>();
        response.put("hasActive", hasActive);
        
        if (hasActive && currentUser.getRole() == UserRole.STUDENT) {
            response.put("message", "You already have an active reservation. Students can only have one active reservation at a time.");
        } else {
            response.put("message", "You can make a new reservation");
        }
        
        return ResponseEntity.ok(response);
    }

    /**
     * Validate reservation duration for the current user.
     *
     * @param startTime The start time of the reservation
     * @param endTime The end time of the reservation
     * @param authentication The current user's authentication
     * @return Boolean indicating if duration is valid
     */
    @GetMapping("/validate-duration")
    public ResponseEntity<Map<String, Object>> validateReservationDuration(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime startTime,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime endTime,
            Authentication authentication) {
        
        User currentUser = userService.findUserByEmail(authentication.getName())
                .orElseThrow(() -> new IllegalArgumentException("User not found with email: " + authentication.getName()));
        
        boolean isValid = reservationService.isReservationDurationValid(startTime, endTime, currentUser.getRole());
        Map<String, Object> response = new HashMap<>();
        response.put("isValid", isValid);
        
        if (!isValid) {
            if (currentUser.getRole() == UserRole.STUDENT) {
                response.put("message", "Student reservations cannot exceed 2 hours");
            } else {
                response.put("message", "Reservation duration is invalid");
            }
        } else {
            response.put("message", "Reservation duration is valid");
        }
        
        return ResponseEntity.ok(response);
    }

    /**
     * Delete a reservation.
     *
     * @param id The ID of the reservation to delete
     * @return No content response
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteReservation(
            @PathVariable Long id,
            Authentication authentication) {
        
        if (authentication == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        String username = authentication.getName();
        User currentUser = userService.findUserByEmail(username)
                .orElseThrow(() -> new IllegalArgumentException("User not found with email: " + username));

        // If user is a student, use student-specific delete method
        if (currentUser.getRole() == UserRole.STUDENT) {
            reservationService.deleteReservationForStudent(id, currentUser.getId());
            return ResponseEntity.noContent().build();
        }

        // For admin and managers, check authorization
        boolean isAuthorized = currentUser.getRole() == UserRole.ADMIN ||
                             currentUser.getRole() == UserRole.CENTER_MANAGER ||
                             currentUser.getRole() == UserRole.PEDAGOGICAL_MANAGER;

        if (!isAuthorized) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }

        reservationService.deleteReservation(id);
        return ResponseEntity.noContent().build();
    }

    /**
     * Get reservation statistics for a specific center.
     *
     * @param centerId The ID of the center
     * @return ReservationStatsResponse containing reservation statistics for the center
     */
    @GetMapping("/center/{centerId}/stats")
    @PreAuthorize("hasAnyRole('ADMIN', 'CENTER_MANAGER', 'ASSET_MANAGER', 'PEDAGOGICAL_MANAGER', 'EXECUTIVE_DIRECTOR')")
    public ResponseEntity<ReservationStatsResponse> getReservationStatsByCenter(@PathVariable Long centerId) {
        logger.info("Fetching reservation statistics for center {}", centerId);
        ReservationStatsResponse stats = reservationService.getReservationStatsByCenter(centerId);
        return ResponseEntity.ok(stats);
    }

    /**
     * Get user reservation statistics.
     *
     * @param userId The ID of the user
     * @return User reservation statistics
     */
    @GetMapping("/user/{userId}/stats")
    public ResponseEntity<Map<String, Object>> getUserReservationStats(@PathVariable Long userId) {
        try {
            // Get all user reservations - this method validates the user exists
            List<Reservation> allReservations = reservationService.findReservationsByUser(userId);
            
            LocalDateTime now = LocalDateTime.now();
            
            // Count active reservations (ongoing right now)
            long activeReservations = allReservations.stream()
                .filter(r -> r.getStatus() == ReservationStatus.CONFIRMED)
                .filter(r -> r.getStartTime().isBefore(now) && r.getEndTime().isAfter(now))
                .count();
            
            // Count upcoming reservations (confirmed and in the future)
            long upcomingReservations = allReservations.stream()
                .filter(r -> r.getStatus() == ReservationStatus.CONFIRMED || r.getStatus() == ReservationStatus.PENDING)
                .filter(r -> r.getStartTime().isAfter(now))
                .count();
            
            // Count past reservations (completed or ended)
            long pastReservations = allReservations.stream()
                .filter(r -> r.getStatus() == ReservationStatus.COMPLETED || 
                           (r.getStatus() == ReservationStatus.CONFIRMED && r.getEndTime().isBefore(now)))
                .count();
            
            // Get favorite workstations (most frequently reserved)
            Map<String, Long> workstationCounts = allReservations.stream()
                .filter(r -> r.getStatus() == ReservationStatus.COMPLETED || r.getStatus() == ReservationStatus.CONFIRMED)
                .collect(Collectors.groupingBy(
                    r -> r.getWorkStation().getName(),
                    Collectors.counting()
                ));
            
            List<String> favoriteWorkstations = workstationCounts.entrySet().stream()
                .sorted(Map.Entry.<String, Long>comparingByValue().reversed())
                .limit(3)
                .map(Map.Entry::getKey)
                .collect(Collectors.toList());
            
            Map<String, Object> stats = new HashMap<>();
            stats.put("activeReservations", (int) activeReservations);
            stats.put("upcomingReservations", (int) upcomingReservations);
            stats.put("pastReservations", (int) pastReservations);
            stats.put("favoriteWorkstations", favoriteWorkstations);
            
            return ResponseEntity.ok(stats);
        } catch (Exception e) {
            logger.error("Error getting user reservation stats for user {}: {}", userId, e.getMessage());
            
            // Return default stats if there's an error
            Map<String, Object> defaultStats = new HashMap<>();
            defaultStats.put("activeReservations", 0);
            defaultStats.put("upcomingReservations", 0);
            defaultStats.put("pastReservations", 0);
            defaultStats.put("favoriteWorkstations", new ArrayList<>());
            
            return ResponseEntity.ok(defaultStats);
        }
    }

    /**
     * Get available time slots for a specific workstation on a specific day.
     * Returns hourly time slots with availability status (like Google Calendar).
     *
     * @param workStationId The ID of the workstation
     * @param date The date to check (format: yyyy-MM-dd)
     * @return List of time slots with availability status
     */
    @GetMapping("/time-slots")
    public ResponseEntity<List<Map<String, Object>>> getAvailableTimeSlots(
            @RequestParam Long workStationId,
            @RequestParam @DateTimeFormat(pattern = "yyyy-MM-dd") LocalDate date) {
        
        logger.info("Fetching time slots for workstation {} on date {}", workStationId, date);
        
        List<Map<String, Object>> timeSlots = new ArrayList<>();
        
        // Verify workstation exists
        if (!workStationRepository.existsById(workStationId)) {
            logger.error("Workstation not found with id: {}", workStationId);
            return ResponseEntity.notFound().build();
        }
        
        // Define timezone - use Africa/Casablanca for user's local timezone
        ZoneId timezone = ZoneId.of("Africa/Casablanca");
        logger.info("Using timezone: {} for date calculations", timezone);
        
        // Generate hourly slots from 8 AM to 6 PM (business hours)
        for (int hour = 8; hour < 18; hour++) {
            // Create LocalDateTime in the specified timezone
            LocalDateTime slotStart = date.atTime(hour, 0);
            LocalDateTime slotEnd = slotStart.plusHours(1);
            
            // Convert to ZonedDateTime for proper timezone handling
            ZonedDateTime zonedStart = slotStart.atZone(timezone);
            ZonedDateTime zonedEnd = slotEnd.atZone(timezone);
            
            logger.debug("Checking availability for slot: {} - {} (timezone: {})", 
                zonedStart, zonedEnd, timezone);
            
            // Check if this slot is available (using LocalDateTime for business logic)
            boolean isAvailable = reservationService.isWorkStationAvailable(workStationId, slotStart, slotEnd);
            
            Map<String, Object> slot = new HashMap<>();
            
            // Return ISO 8601 formatted strings with timezone information
            slot.put("startTime", zonedStart.format(DateTimeFormatter.ISO_OFFSET_DATE_TIME));
            slot.put("endTime", zonedEnd.format(DateTimeFormatter.ISO_OFFSET_DATE_TIME));
            slot.put("hour", hour);
            slot.put("timeLabel", String.format("%02d:00", hour));
            slot.put("available", isAvailable);
            
            logger.debug("Created slot: {} - {} (available: {})", 
                slot.get("startTime"), slot.get("endTime"), isAvailable);

            if (!isAvailable) {
                try {
                    List<Reservation> overlapping = reservationRepository.findOverlappingReservationsForWorkStation(
                        workStationRepository.findById(workStationId).orElse(null),
                        slotStart,
                        slotEnd
                    );
                    
                    if (!overlapping.isEmpty()) {
                        Reservation reservation = overlapping.get(0);
                        slot.put("reservedBy", reservation.getUser().getFirstName() + " " + reservation.getUser().getLastName());
                        slot.put("reservationStatus", reservation.getStatus());
                        slot.put("reservationId", reservation.getId());
                        logger.debug("Slot {} reserved by {}", hour, reservation.getUser().getEmail());
                    } else {
                        slot.put("reservedBy", "Unavailable");
                        logger.debug("Slot {} unavailable but no overlapping reservation found", hour);
                    }
                } catch (Exception e) {
                    logger.error("Error getting reservation details for slot {}: {}", hour, e.getMessage());
                    slot.put("reservedBy", "Unavailable");
                }
            } else {
                logger.debug("Slot {} is available", hour);
            }
            
            timeSlots.add(slot);
        }
        
        logger.info("Returning {} time slots for workstation {} on date {} (timezone: {})", 
            timeSlots.size(), workStationId, date, timezone);
        return ResponseEntity.ok(timeSlots);
    }

    /**
     * Debug endpoint to check stored reservation times
     */
    @GetMapping("/debug/recent")
    public ResponseEntity<List<Map<String, Object>>> getRecentReservationsDebug() {
        List<Reservation> recentReservations = reservationRepository.findAll()
            .stream()
            .sorted((r1, r2) -> r2.getCreatedAt().compareTo(r1.getCreatedAt()))
            .limit(10)
            .collect(Collectors.toList());
        
        List<Map<String, Object>> debugInfo = recentReservations.stream()
            .map(reservation -> {
                Map<String, Object> info = new HashMap<>();
                info.put("id", reservation.getId());
                info.put("user", reservation.getUser().getFirstName() + " " + reservation.getUser().getLastName());
                info.put("workstation", reservation.getWorkStation().getName());
                info.put("startTime", reservation.getStartTime().toString());
                info.put("endTime", reservation.getEndTime().toString());
                info.put("status", reservation.getStatus());
                info.put("createdAt", reservation.getCreatedAt().toString());
                return info;
            })
            .collect(Collectors.toList());
        
        logger.info("Recent reservations debug: {}", debugInfo);
        return ResponseEntity.ok(debugInfo);
    }

    /**
     * Debug endpoint to test INCLUSIVE overlap detection
     */
    @GetMapping("/debug/overlap-test")
    public ResponseEntity<Map<String, Object>> testOverlapDetection(
            @RequestParam Long workStationId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime startTime,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime endTime) {
        
        Map<String, Object> result = new HashMap<>();
        result.put("testPeriod", startTime + " to " + endTime);
        result.put("workStationId", workStationId);
        result.put("overlapLogic", "INCLUSIVE - End time boundaries are considered overlapping");
        
        boolean isAvailable = reservationService.isWorkStationAvailable(workStationId, startTime, endTime);
        result.put("isAvailable", isAvailable);
        
        // Get overlapping reservations
        WorkStation workStation = workStationRepository.findById(workStationId).orElse(null);
        if (workStation != null) {
            List<Reservation> overlapping = reservationRepository.findOverlappingReservationsForWorkStation(
                workStation, startTime, endTime);
            
            List<Map<String, Object>> overlappingInfo = overlapping.stream()
                .map(r -> {
                    Map<String, Object> info = new HashMap<>();
                    info.put("id", r.getId());
                    info.put("startTime", r.getStartTime().toString());
                    info.put("endTime", r.getEndTime().toString());
                    info.put("status", r.getStatus());
                    return info;
                })
                .collect(Collectors.toList());
                
            result.put("overlappingReservations", overlappingInfo);
            result.put("overlappingCount", overlapping.size());
        }
        
        logger.info("Overlap test result: {}", result);
        return ResponseEntity.ok(result);
    }
}