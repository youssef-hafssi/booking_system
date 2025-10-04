package com.web4jobs.bookingsystem.service.impl;

import com.web4jobs.bookingsystem.dto.response.ReservationStatsResponse;
import com.web4jobs.bookingsystem.model.Reservation;
import com.web4jobs.bookingsystem.model.ReservationStatus;
import com.web4jobs.bookingsystem.model.User;
import com.web4jobs.bookingsystem.model.UserRole;
import com.web4jobs.bookingsystem.model.UserStatus;
import com.web4jobs.bookingsystem.model.WorkStation;
import com.web4jobs.bookingsystem.model.WorkStationStatus;
import com.web4jobs.bookingsystem.model.NotificationType;
import com.web4jobs.bookingsystem.model.Center;
import com.web4jobs.bookingsystem.repository.ReservationRepository;
import com.web4jobs.bookingsystem.repository.UserRepository;
import com.web4jobs.bookingsystem.repository.WorkStationRepository;
import com.web4jobs.bookingsystem.repository.CenterRepository;
import com.web4jobs.bookingsystem.service.ReservationService;
import com.web4jobs.bookingsystem.service.NotificationService;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class ReservationServiceImpl implements ReservationService {

    private static final Logger logger = LoggerFactory.getLogger(ReservationServiceImpl.class);

    private final ReservationRepository reservationRepository;
    private final WorkStationRepository workStationRepository;
    private final UserRepository userRepository;
    private final NotificationService notificationService;
    private final CenterRepository centerRepository;

    @Override
    public List<Reservation> findAllReservations() {
        // Use the repository method that eagerly loads workstation, room, and center data
        return reservationRepository.findAllWithWorkStationsAndRoomsAndCenters();
    }

    @Override
    public Optional<Reservation> findReservationById(Long id) {
        return reservationRepository.findById(id);
    }

    @Override
    public List<Reservation> findReservationsByUser(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found with id: " + userId));
        
        return reservationRepository.findByUser(user);
    }

    @Override
    public List<Reservation> findReservationsByWorkStation(Long workStationId) {
        WorkStation workStation = workStationRepository.findById(workStationId)
                .orElseThrow(() -> new IllegalArgumentException("WorkStation not found with id: " + workStationId));
        
        return reservationRepository.findByWorkStation(workStation);
    }

    @Override
    public List<Reservation> findReservationsByStatus(ReservationStatus status) {
        return reservationRepository.findByStatus(status);
    }

    @Override
    public List<Reservation> findReservationsInDateRange(LocalDateTime startTime, LocalDateTime endTime) {
        return reservationRepository.findByStartTimeGreaterThanEqualAndEndTimeLessThanEqual(startTime, endTime);
    }

    @Override
    public List<Reservation> findUpcomingReservationsForUser(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found with id: " + userId));
        
        return reservationRepository.findUpcomingReservationsForUser(user, LocalDateTime.now());
    }

    @Override
    public boolean isWorkStationAvailable(Long workStationId, LocalDateTime startTime, LocalDateTime endTime) {
        // Validate time period
        if (startTime.isAfter(endTime)) {
            throw new IllegalArgumentException("Start time must be before end time");
        }
        
        // Check if workstation exists
        WorkStation workStation = workStationRepository.findById(workStationId)
                .orElseThrow(() -> new IllegalArgumentException("WorkStation not found with id: " + workStationId));
        
        // Check if workstation is in maintenance or permanently unavailable
        if (workStation.getStatus() == WorkStationStatus.MAINTENANCE ||
            workStation.getStatus() == WorkStationStatus.UNAVAILABLE) {
            return false;
        }
        
        // For AVAILABLE or RESERVED workstations, check for overlapping reservations
        // A workstation can be RESERVED but still available for other time slots
        List<Reservation> overlappingReservations = reservationRepository.findOverlappingReservationsForWorkStation(
                workStation, startTime, endTime);
        
        // Debug logging for overlap detection (INCLUSIVE end time logic)
        if (!overlappingReservations.isEmpty()) {
            logger.debug("Found {} overlapping reservations (INCLUSIVE) for workstation {} between {} and {}", 
                overlappingReservations.size(), workStationId, startTime, endTime);
            for (Reservation overlap : overlappingReservations) {
                logger.debug("  - Reservation {}: {} to {} (status: {})", 
                    overlap.getId(), overlap.getStartTime(), overlap.getEndTime(), overlap.getStatus());
            }
        } else {
            logger.debug("No overlapping reservations found for workstation {} between {} and {}", 
                workStationId, startTime, endTime);
        }
        
        return overlappingReservations.isEmpty();
    }

    @Override
    public boolean isReservationDurationValid(LocalDateTime startTime, LocalDateTime endTime, UserRole userRole) {
        if (startTime.isAfter(endTime) || startTime.isEqual(endTime)) {
            return false; // Invalid time range
        }
        
        long durationHours = java.time.Duration.between(startTime, endTime).toHours();
        
        // Students are limited to 2 hours maximum
        if (userRole == UserRole.STUDENT) {
            return durationHours <= 2;
        }
        
        // Other roles can have longer reservations (you can adjust this as needed)
        return durationHours <= 8; // Maximum 8 hours for non-students
    }

    @Override
    public boolean hasActiveReservations(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found with id: " + userId));
        
        // Only check for students - other roles can have multiple active reservations
        if (user.getRole() != UserRole.STUDENT) {
            return false;
        }
        
        // Find active reservations (PENDING or CONFIRMED) that haven't ended yet
        List<Reservation> activeReservations = reservationRepository
                .findByUserAndStatusInAndEndTimeAfter(
                    user, 
                    List.of(ReservationStatus.PENDING, ReservationStatus.CONFIRMED),
                    LocalDateTime.now()
                );
        
        return !activeReservations.isEmpty();
    }

    @Override
    @Transactional
    public Reservation createReservation(Reservation reservation) {
        // Validate user
        User user = userRepository.findById(reservation.getUser().getId())
                .orElseThrow(() -> new IllegalArgumentException("User not found with id: " + reservation.getUser().getId()));
        
        // Check if user has penalty status that prevents reservations
        if (user.getUserStatus() == UserStatus.BAD) {
            throw new IllegalArgumentException("User has too many no-show strikes and cannot make new reservations. Please contact an administrator.");
        }
        
        // Check if student already has active reservations
        if (user.getRole() == UserRole.STUDENT && hasActiveReservations(user.getId())) {
            throw new IllegalArgumentException("Students can only have one active reservation at a time");
        }
        
        // Validate workstation
        WorkStation workStation = workStationRepository.findById(reservation.getWorkStation().getId())
                .orElseThrow(() -> new IllegalArgumentException("WorkStation not found with id: " + reservation.getWorkStation().getId()));
        
        // Validate time period
        if (reservation.getStartTime().isAfter(reservation.getEndTime())) {
            throw new IllegalArgumentException("Start time must be before end time");
        }
        
        // Validate reservation duration
        if (!isReservationDurationValid(reservation.getStartTime(), reservation.getEndTime(), user.getRole())) {
            if (user.getRole() == UserRole.STUDENT) {
                throw new IllegalArgumentException("Student reservations cannot exceed 2 hours");
            } else {
                throw new IllegalArgumentException("Reservation duration is too long");
            }
        }
        
        // Check student cooldown period
        if (!canStudentMakeReservation(user.getId(), reservation.getStartTime())) {
            throw new IllegalArgumentException("Students must wait 1 hour after their last reservation ends before making a new one");
        }
        
        // Check if workstation is available (not in maintenance or permanently unavailable)
        if (workStation.getStatus() == WorkStationStatus.MAINTENANCE ||
            workStation.getStatus() == WorkStationStatus.UNAVAILABLE) {
            throw new IllegalArgumentException("WorkStation is not available");
        }
        
        // Check for overlapping reservations
        List<Reservation> overlappingReservations = reservationRepository.findOverlappingReservationsForWorkStation(
                workStation, reservation.getStartTime(), reservation.getEndTime());
        
        if (!overlappingReservations.isEmpty()) {
            throw new IllegalArgumentException("WorkStation is not available for the requested time period");
        }
        
        // Set user and workstation
        reservation.setUser(user);
        reservation.setWorkStation(workStation);
        
        // Set default status based on user role
        if (reservation.getStatus() == null) {
            // Auto-confirm reservations for students, others stay pending for manual approval
            if (user.getRole() == UserRole.STUDENT) {
                reservation.setStatus(ReservationStatus.CONFIRMED);
            } else {
                reservation.setStatus(ReservationStatus.PENDING);
            }
        }
        
        // Set creation and update timestamps
        LocalDateTime now = LocalDateTime.now();
        reservation.setCreatedAt(now);
        reservation.setUpdatedAt(now);
        
        // Don't change workstation status permanently - availability is determined by overlapping reservations
        // The workstation remains AVAILABLE but has reservations that block specific time slots
        
        // Save the reservation
        Reservation savedReservation = reservationRepository.save(reservation);
        
        // Send appropriate notification based on status
        String notificationMessage;
        if (savedReservation.getStatus() == ReservationStatus.CONFIRMED) {
            notificationMessage = "Your reservation for " + workStation.getName() + 
                                 " has been automatically confirmed. Enjoy your session!";
        } else {
            notificationMessage = "Your reservation for " + workStation.getName() + 
                                 " has been created and is pending confirmation.";
        }
        
        notificationService.sendReservationNotification(
                savedReservation, 
                NotificationType.CONFIRMATION, 
                notificationMessage);
        
        return savedReservation;
    }

    @Override
    public boolean canStudentCancelReservation(Long reservationId, Long userId) {
        Reservation reservation = reservationRepository.findById(reservationId)
                .orElseThrow(() -> new IllegalArgumentException("Reservation not found with id: " + reservationId));
        
        // Check if the reservation belongs to the user
        if (!reservation.getUser().getId().equals(userId)) {
            throw new IllegalArgumentException("User can only check their own reservations");
        }
        
        // Check if user is a student
        if (reservation.getUser().getRole() != UserRole.STUDENT) {
            return true; // Non-students can cancel anytime (subject to other business rules)
        }
        
        // Students cannot cancel within 1 hour of the start time
        LocalDateTime oneHourBeforeStart = reservation.getStartTime().minusHours(1);
        LocalDateTime now = LocalDateTime.now();
        
        return now.isBefore(oneHourBeforeStart);
    }

    @Override
    public boolean canStudentMakeReservation(Long userId, LocalDateTime proposedStartTime) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found with id: " + userId));
        
        // Only apply cooldown for students
        if (user.getRole() != UserRole.STUDENT) {
            return true;
        }
        
        // Find the user's most recent completed or confirmed reservation
        List<Reservation> recentReservations = reservationRepository
                .findByUserAndStatusInOrderByEndTimeDesc(
                    user, 
                    List.of(ReservationStatus.CONFIRMED, ReservationStatus.COMPLETED)
                );
        
        if (recentReservations.isEmpty()) {
            return true; // No previous reservations, can make new one
        }
        
        Reservation lastReservation = recentReservations.get(0);
        LocalDateTime lastReservationEnd = lastReservation.getEndTime();
        LocalDateTime cooldownEnd = lastReservationEnd.plusHours(1);
        
        // Check if the proposed start time is after the cooldown period
        return proposedStartTime.isAfter(cooldownEnd) || proposedStartTime.isEqual(cooldownEnd);
    }

    @Override
    @Transactional
    public Reservation updateReservation(Long id, Reservation reservationDetails) {
        Reservation reservation = reservationRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Reservation not found with id: " + id));
        
        // Check if time period is being changed
        boolean timeChanged = !reservation.getStartTime().equals(reservationDetails.getStartTime()) || 
                             !reservation.getEndTime().equals(reservationDetails.getEndTime());
        
        // Check if workstation is being changed
        boolean workStationChanged = !reservation.getWorkStation().getId().equals(reservationDetails.getWorkStation().getId());
        
        // If time period or workstation is being changed, check availability
        if (timeChanged || workStationChanged) {
            // Validate workstation
            WorkStation workStation = workStationRepository.findById(reservationDetails.getWorkStation().getId())
                    .orElseThrow(() -> new IllegalArgumentException("WorkStation not found with id: " + reservationDetails.getWorkStation().getId()));
            
            // Validate time period
            if (reservationDetails.getStartTime().isAfter(reservationDetails.getEndTime())) {
                throw new IllegalArgumentException("Start time must be before end time");
            }
            
            // Check if workstation is available (excluding this reservation)
            List<Reservation> overlappingReservations = reservationRepository.findOverlappingReservationsForWorkStation(
                    workStation, reservationDetails.getStartTime(), reservationDetails.getEndTime());
            
            // Remove this reservation from the list
            overlappingReservations.removeIf(r -> r.getId().equals(id));
            
            if (!overlappingReservations.isEmpty()) {
                throw new IllegalArgumentException("WorkStation is not available for the requested time period");
            }
            
            // Update workstation
            reservation.setWorkStation(workStation);
        }
        
        // Update fields
        reservation.setStartTime(reservationDetails.getStartTime());
        reservation.setEndTime(reservationDetails.getEndTime());
        reservation.setStatus(reservationDetails.getStatus());
        reservation.setNotes(reservationDetails.getNotes());
        
        // Update timestamp
        reservation.setUpdatedAt(LocalDateTime.now());
        
        // Save the reservation
        Reservation updatedReservation = reservationRepository.save(reservation);
        
        // Send modification notification
        notificationService.sendReservationNotification(
                updatedReservation, 
                NotificationType.MODIFICATION, 
                "Your reservation for " + updatedReservation.getWorkStation().getName() + " has been updated.");
        
        return updatedReservation;
    }

    @Override
    @Transactional
    public Reservation confirmReservation(Long id) {
        Reservation reservation = reservationRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Reservation not found with id: " + id));
        
        if (reservation.getStatus() != ReservationStatus.PENDING) {
            throw new IllegalArgumentException("Only pending reservations can be confirmed. Current status: " + reservation.getStatus());
        }
        
        reservation.setStatus(ReservationStatus.CONFIRMED);
        reservation.setUpdatedAt(LocalDateTime.now());
        
        Reservation confirmedReservation = reservationRepository.save(reservation);
        
        // Send confirmation notification
        notificationService.sendReservationNotification(
                confirmedReservation, 
                NotificationType.CONFIRMATION, 
                "Your reservation for " + confirmedReservation.getWorkStation().getName() + " has been confirmed.");
        
        return confirmedReservation;
    }

    @Override
    @Transactional
    public Reservation cancelReservation(Long id) {
        Reservation reservation = reservationRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Reservation not found with id: " + id));
        
        // Check if the user is a student and if they can still cancel
        if (reservation.getUser().getRole() == UserRole.STUDENT) {
            LocalDateTime oneHourBeforeStart = reservation.getStartTime().minusHours(1);
            LocalDateTime now = LocalDateTime.now();
            
            if (now.isAfter(oneHourBeforeStart) || now.isEqual(oneHourBeforeStart)) {
                throw new IllegalArgumentException("Students cannot cancel reservations within 1 hour of the start time");
            }
        }
        
        // No need to change workstation status - it should remain AVAILABLE
        // Availability is determined by active reservations, not workstation status
        
        reservation.setStatus(ReservationStatus.CANCELLED);
        reservation.setUpdatedAt(LocalDateTime.now());
        reservation.setCancelledAt(LocalDateTime.now());
        
        return reservationRepository.save(reservation);
    }

    @Override
    @Transactional
    public Reservation cancelReservationWithReason(Long id, String reason, Long cancelledByUserId) {
        if (reason == null || reason.trim().isEmpty()) {
            throw new IllegalArgumentException("Cancellation reason is required");
        }
        
        Reservation reservation = reservationRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Reservation not found with id: " + id));
        
        User cancelledByUser = userRepository.findById(cancelledByUserId)
                .orElseThrow(() -> new IllegalArgumentException("User not found with id: " + cancelledByUserId));
        
        // Verify that the user has permission to cancel reservations
        UserRole userRole = cancelledByUser.getRole();
        if (userRole != UserRole.PEDAGOGICAL_MANAGER && 
            userRole != UserRole.ASSET_MANAGER && 
            userRole != UserRole.EXECUTIVE_DIRECTOR && 
            userRole != UserRole.ADMIN) {
            throw new IllegalArgumentException("User does not have permission to cancel reservations");
        }
        
        // No need to change workstation status - it should remain AVAILABLE
        // Availability is determined by active reservations, not workstation status
        
        // Set cancellation details
        reservation.setStatus(ReservationStatus.CANCELLED);
        reservation.setCancellationReason(reason.trim());
        reservation.setCancelledBy(cancelledByUser);
        reservation.setCancelledAt(LocalDateTime.now());
        reservation.setUpdatedAt(LocalDateTime.now());
        
        Reservation savedReservation = reservationRepository.save(reservation);
        
        // Send cancellation notification with reason
        notificationService.sendReservationNotification(
                savedReservation,
                NotificationType.CANCELLATION,
                "Your reservation for " + savedReservation.getWorkStation().getName() + " has been cancelled. Reason: " + reason);
        
        return savedReservation;
    }

    @Override
    @Transactional
    public void deleteReservation(Long id) {
        Reservation reservation = reservationRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Reservation not found with id: " + id));
        
        // No need to change workstation status - it should remain AVAILABLE
        // Availability is determined by active reservations, not workstation status
        
        reservationRepository.delete(reservation);
    }

    @Override
    @Transactional
    public void deleteReservationForStudent(Long id, Long currentUserId) {
        Reservation reservation = reservationRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Reservation not found with id: " + id));
        
        // Verify ownership
        if (!reservation.getUser().getId().equals(currentUserId)) {
            throw new IllegalArgumentException("User can only delete their own reservations");
        }
        
        // No need to change workstation status - it should remain AVAILABLE
        // Availability is determined by active reservations, not workstation status
        
        reservationRepository.delete(reservation);
    }

    @Override
    @Transactional
    public void sendReservationReminder(Long id) {
        Reservation reservation = reservationRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Reservation not found with id: " + id));
        
        notificationService.sendReservationNotification(
                reservation, 
                NotificationType.REMINDER, 
                "Reminder: You have a reservation for " + reservation.getWorkStation().getName() + 
                " starting at " + reservation.getStartTime() + ".");
    }

    @Override
    @Transactional
    public Reservation updateReservationStatus(Long id, ReservationStatus status) {
        Reservation reservation = reservationRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Reservation not found with id: " + id));
        
        reservation.setStatus(status);
        reservation.setUpdatedAt(LocalDateTime.now());
        
        Reservation updatedReservation = reservationRepository.save(reservation);
        
        // Send status update notification
        String statusMessage = "Your reservation for " + updatedReservation.getWorkStation().getName() + 
                              " has been updated to " + status + " status.";
        
        NotificationType notificationType;
        switch (status) {
            case CONFIRMED:
                notificationType = NotificationType.CONFIRMATION;
                break;
            case CANCELLED:
                notificationType = NotificationType.CANCELLATION;
                break;
            default:
                notificationType = NotificationType.MODIFICATION;
        }
        
        notificationService.sendReservationNotification(
                updatedReservation, 
                notificationType, 
                statusMessage);
        
        return updatedReservation;
    }

    @Override
    public ReservationStatsResponse getReservationStats() {
        // Count total reservations
        long total = reservationRepository.count();
        
        // Count reservations by status
        long active = reservationRepository.countByStatus(ReservationStatus.CONFIRMED);
        long pending = reservationRepository.countByStatus(ReservationStatus.PENDING);
        long completed = reservationRepository.countByStatus(ReservationStatus.COMPLETED);
        long cancelled = reservationRepository.countByStatus(ReservationStatus.CANCELLED);
        
        return ReservationStatsResponse.builder()
                .total((int) total)
                .active((int) active)
                .pending((int) pending)
                .completed((int) completed)
                .cancelled((int) cancelled)
                .build();
    }

    @Override
    public List<Reservation> findReservationsByCenter(Long centerId) {
        Center center = centerRepository.findById(centerId)
                .orElseThrow(() -> new IllegalArgumentException("Center not found with id: " + centerId));
        // Use the eager loading method that includes ALL reservations (including cancelled ones)
        return reservationRepository.findByCenterWithEagerLoadingIncludingCancelled(center);
    }

    @Override
    @Transactional
    public Reservation updateReservationForStudent(Long id, Reservation reservationDetails, Long currentUserId) {
        // Find the reservation
        Reservation reservation = reservationRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Reservation not found with id: " + id));
        
        // Verify ownership
        if (!reservation.getUser().getId().equals(currentUserId)) {
            throw new IllegalArgumentException("User can only update their own reservations");
        }
        
        // Check if time period is being changed
        boolean timeChanged = !reservation.getStartTime().equals(reservationDetails.getStartTime()) || 
                            !reservation.getEndTime().equals(reservationDetails.getEndTime());
        
        // Check if workstation is being changed
        boolean workStationChanged = reservationDetails.getWorkStation() != null && 
                                   !reservation.getWorkStation().getId().equals(reservationDetails.getWorkStation().getId());
        
        WorkStation workStation = reservation.getWorkStation();
        
        // If workstation is being changed, validate and update it
        if (workStationChanged) {
            // Get and validate the new workstation
            workStation = workStationRepository.findById(reservationDetails.getWorkStation().getId())
                    .orElseThrow(() -> new IllegalArgumentException("WorkStation not found with id: " +
                            reservationDetails.getWorkStation().getId()));
            
            // Verify workstation is not in maintenance or permanently unavailable
            if (workStation.getStatus() == WorkStationStatus.MAINTENANCE ||
                workStation.getStatus() == WorkStationStatus.UNAVAILABLE) {
                throw new IllegalArgumentException("Selected workstation is not available");
            }
        }
        
        // If time period or workstation is being changed, check availability
        if (timeChanged || workStationChanged) {
            // Validate time period
            if (reservationDetails.getStartTime().isAfter(reservationDetails.getEndTime())) {
                throw new IllegalArgumentException("Start time must be before end time");
            }
            
            if (reservationDetails.getStartTime().isBefore(LocalDateTime.now())) {
                throw new IllegalArgumentException("Cannot set reservation start time in the past");
            }
            
            // Check if workstation is available (excluding this reservation)
            List<Reservation> overlappingReservations = reservationRepository.findOverlappingReservationsForWorkStation(
                    workStation, 
                    reservationDetails.getStartTime(), 
                    reservationDetails.getEndTime());
            
            // Remove this reservation from the list
            overlappingReservations.removeIf(r -> r.getId().equals(id));
            
            if (!overlappingReservations.isEmpty()) {
                throw new IllegalArgumentException("WorkStation is not available for the requested time period");
            }
        }
        
        // Update allowed fields
        if (timeChanged) {
            reservation.setStartTime(reservationDetails.getStartTime());
            reservation.setEndTime(reservationDetails.getEndTime());
        }
        
        if (workStationChanged) {
            reservation.setWorkStation(workStation);
        }
        
        if (reservationDetails.getNotes() != null) {
            reservation.setNotes(reservationDetails.getNotes());
        }
        
        // Update timestamp
        reservation.setUpdatedAt(LocalDateTime.now());
        
        // Save the reservation
        Reservation updatedReservation = reservationRepository.save(reservation);
        
        // Send modification notification
        notificationService.sendReservationNotification(
                updatedReservation,
                NotificationType.MODIFICATION,
                "Your reservation for " + workStation.getName() + " has been updated.");
        
        return updatedReservation;
    }

    @Override
    public ReservationStatsResponse getReservationStatsByCenter(Long centerId) {
        Center center = centerRepository.findById(centerId)
                .orElseThrow(() -> new IllegalArgumentException("Center not found with id: " + centerId));

        // Get all reservations for this center
        List<Reservation> centerReservations = findReservationsByCenter(centerId);

        // Count reservations by status
        long total = centerReservations.size();
        long active = centerReservations.stream()
                .filter(r -> r.getStatus() == ReservationStatus.CONFIRMED)
                .count();
        long pending = centerReservations.stream()
                .filter(r -> r.getStatus() == ReservationStatus.PENDING)
                .count();
        long completed = centerReservations.stream()
                .filter(r -> r.getStatus() == ReservationStatus.COMPLETED)
                .count();
        long cancelled = centerReservations.stream()
                .filter(r -> r.getStatus() == ReservationStatus.CANCELLED)
                .count();

        return ReservationStatsResponse.builder()
                .total((int) total)
                .active((int) active)
                .pending((int) pending)
                .completed((int) completed)
                .cancelled((int) cancelled)
                .build();
    }
} 