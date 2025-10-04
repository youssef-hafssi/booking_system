package com.web4jobs.bookingsystem.service;

import com.web4jobs.bookingsystem.model.*;
import com.web4jobs.bookingsystem.model.UserRole;
import com.web4jobs.bookingsystem.repository.ReservationRepository;
import com.web4jobs.bookingsystem.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

/**
 * Service for managing user penalties and strikes based on no-show behavior.
 */
@Service
@RequiredArgsConstructor
public class PenaltyService {

    private static final Logger logger = LoggerFactory.getLogger(PenaltyService.class);
    
    // Strike thresholds
    private static final int WARNING_THRESHOLD = 3;
    private static final int BAD_USER_THRESHOLD = 5;
    
    private final UserRepository userRepository;
    private final ReservationRepository reservationRepository;

    /**
     * Mark a reservation as no-show and apply penalties to the user.
     * 
     * @param reservationId The ID of the reservation to mark as no-show
     * @param adminUserId The ID of the admin marking the no-show
     * @return Updated user with new strike count
     */
    @Transactional
    public User markReservationAsNoShow(Long reservationId, Long adminUserId) {
        Reservation reservation = reservationRepository.findById(reservationId)
                .orElseThrow(() -> new IllegalArgumentException("Reservation not found with id: " + reservationId));
        
        if (reservation.getStatus() == ReservationStatus.NO_SHOW) {
            throw new IllegalStateException("Reservation is already marked as no-show");
        }
        
        // Mark reservation as no-show
        reservation.setStatus(ReservationStatus.NO_SHOW);
        reservation.setUpdatedAt(LocalDateTime.now());
        reservationRepository.save(reservation);
        
        // Apply strike to user
        User user = reservation.getUser();
        return applyStrikeToUser(user);
    }

    /**
     * Apply a strike to a user and update their status.
     * 
     * @param user The user to apply strike to
     * @return Updated user
     */
    @Transactional
    public User applyStrikeToUser(User user) {
        if (user.getStrikeCount() == null) {
            user.setStrikeCount(0);
        }
        if (user.getTotalNoShows() == null) {
            user.setTotalNoShows(0);
        }
        if (user.getUserStatus() == null) {
            user.setUserStatus(UserStatus.GOOD);
        }
        
        user.setStrikeCount(user.getStrikeCount() + 1);
        user.setTotalNoShows(user.getTotalNoShows() + 1);
        user.setLastStrikeDate(LocalDateTime.now());
        
        // Update user status based on strike count
        updateUserStatus(user);
        
        logger.info("Applied strike to user {}. New strike count: {}, Status: {}", 
                user.getEmail(), user.getStrikeCount(), user.getUserStatus());
        
        return userRepository.save(user);
    }

    /**
     * Remove a strike from a user (admin forgiveness).
     * 
     * @param userId The ID of the user
     * @return Updated user
     */
    @Transactional
    public User removeStrikeFromUser(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found with id: " + userId));
        
        if (user.getStrikeCount() > 0) {
            user.setStrikeCount(user.getStrikeCount() - 1);
            updateUserStatus(user);
            
            logger.info("Removed strike from user {}. New strike count: {}, Status: {}", 
                    user.getEmail(), user.getStrikeCount(), user.getUserStatus());
        }
        
        return userRepository.save(user);
    }

    /**
     * Manually add a strike to a student (admin penalty).
     * 
     * @param userId The ID of the student
     * @param reason The reason for adding the strike
     * @return Updated user
     */
    @Transactional
    public User addManualStrike(Long userId, String reason) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found with id: " + userId));
        
        if (!user.getRole().equals(UserRole.STUDENT)) {
            throw new IllegalArgumentException("Strikes can only be added to students");
        }
        
        if (user.getStrikeCount() == null) {
            user.setStrikeCount(0);
        }
        if (user.getTotalNoShows() == null) {
            user.setTotalNoShows(0);
        }
        if (user.getUserStatus() == null) {
            user.setUserStatus(UserStatus.GOOD);
        }

        user.setStrikeCount(user.getStrikeCount() + 1);
        user.setLastStrikeDate(LocalDateTime.now());
        updateUserStatus(user);
        
        logger.info("Manually added strike to student {} for reason: {}. New strike count: {}, Status: {}", 
                user.getEmail(), reason, user.getStrikeCount(), user.getUserStatus());
        
        return userRepository.save(user);
    }

    /**
     * Reset all strikes for a user.
     * 
     * @param userId The ID of the user
     * @return Updated user
     */
    @Transactional
    public User resetUserStrikes(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found with id: " + userId));
        
        user.setStrikeCount(0);
        user.setUserStatus(UserStatus.GOOD);
        user.setLastStrikeDate(null);
        
        logger.info("Reset all strikes for user {}", user.getEmail());
        
        return userRepository.save(user);
    }

    /**
     * Update user status based on strike count.
     * 
     * @param user The user to update
     */
    private void updateUserStatus(User user) {
        int strikes = user.getStrikeCount();
        
        if (strikes >= BAD_USER_THRESHOLD) {
            user.setUserStatus(UserStatus.BAD);
        } else if (strikes >= WARNING_THRESHOLD) {
            user.setUserStatus(UserStatus.WARNING);
        } else {
            user.setUserStatus(UserStatus.GOOD);
        }
    }

    /**
     * Get users with bad status.
     * 
     * @return List of users with bad status
     */
    public List<User> getUsersWithBadStatus() {
        return userRepository.findByUserStatus(UserStatus.BAD);
    }

    /**
     * Get users with warning status.
     * 
     * @return List of users with warning status
     */
    public List<User> getUsersWithWarningStatus() {
        return userRepository.findByUserStatus(UserStatus.WARNING);
    }

    /**
     * Get users with most no-shows.
     * 
     * @param limit Maximum number of users to return
     * @return List of users ordered by no-show count
     */
    public List<User> getUsersWithMostNoShows(int limit) {
        return userRepository.findTopUsersByNoShows(limit);
    }

    /**
     * Check if user can make new reservations based on their status.
     * 
     * @param user The user to check
     * @return true if user can make reservations, false otherwise
     */
    public boolean canUserMakeReservations(User user) {
        return user.getUserStatus() != UserStatus.BAD;
    }

    /**
     * Get penalty statistics for a user.
     * 
     * @param userId The ID of the user
     * @return Penalty statistics
     */
    public PenaltyStats getUserPenaltyStats(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found with id: " + userId));
        
        List<Reservation> noShowReservations = reservationRepository
                .findByUserAndStatus(user, ReservationStatus.NO_SHOW);
        
        return PenaltyStats.builder()
                .userId(userId)
                .strikeCount(user.getStrikeCount())
                .totalNoShows(user.getTotalNoShows())
                .userStatus(user.getUserStatus())
                .lastStrikeDate(user.getLastStrikeDate())
                .noShowReservations(noShowReservations.size())
                .canMakeReservations(canUserMakeReservations(user))
                .build();
    }

    /**
     * Inner class for penalty statistics.
     */
    @lombok.Data
    @lombok.Builder
    public static class PenaltyStats {
        private Long userId;
        private Integer strikeCount;
        private Integer totalNoShows;
        private UserStatus userStatus;
        private LocalDateTime lastStrikeDate;
        private Integer noShowReservations;
        private Boolean canMakeReservations;
    }
}