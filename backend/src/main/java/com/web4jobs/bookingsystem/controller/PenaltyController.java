package com.web4jobs.bookingsystem.controller;

import com.web4jobs.bookingsystem.dto.response.UserResponse;
import com.web4jobs.bookingsystem.dto.mapper.UserMapper;
import com.web4jobs.bookingsystem.model.User;
import com.web4jobs.bookingsystem.model.UserStatus;
import com.web4jobs.bookingsystem.service.PenaltyService;
import com.web4jobs.bookingsystem.service.UserService;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * REST controller for managing user penalties and strikes.
 * Provides endpoints for admins to manage no-show penalties.
 */
@RestController
@RequestMapping("/api/penalties")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class PenaltyController {

    private static final Logger logger = LoggerFactory.getLogger(PenaltyController.class);

    private final PenaltyService penaltyService;
    private final UserService userService;
    private final UserMapper userMapper;

    /**
     * Mark a reservation as no-show and apply penalty.
     * 
     * @param reservationId The ID of the reservation to mark as no-show
     * @param authentication The authentication object containing admin details
     * @return Updated user information
     */
    @PostMapping("/mark-no-show/{reservationId}")
    public ResponseEntity<UserResponse> markReservationAsNoShow(
            @PathVariable Long reservationId,
            Authentication authentication) {
        
        User adminUser = userService.findUserByEmail(authentication.getName())
                .orElseThrow(() -> new IllegalArgumentException("Admin user not found"));
        
        logger.info("Admin {} marking reservation {} as no-show", adminUser.getEmail(), reservationId);
        
        User updatedUser = penaltyService.markReservationAsNoShow(reservationId, adminUser.getId());
        UserResponse userResponse = userMapper.toResponse(updatedUser);
        
        return ResponseEntity.ok(userResponse);
    }

    /**
     * Remove a strike from a user (admin forgiveness).
     * 
     * @param userId The ID of the user to forgive
     * @return Updated user information
     */
    @PostMapping("/remove-strike/{userId}")
    public ResponseEntity<UserResponse> removeStrike(@PathVariable Long userId) {
        logger.info("Removing strike from user {}", userId);
        
        User updatedUser = penaltyService.removeStrikeFromUser(userId);
        UserResponse userResponse = userMapper.toResponse(updatedUser);
        
        return ResponseEntity.ok(userResponse);
    }

    /**
     * Add a manual strike to a student.
     * 
     * @param userId The ID of the student to penalize
     * @param reason The reason for adding the strike
     * @return Updated user information
     */
    @PostMapping("/add-strike/{userId}")
    public ResponseEntity<UserResponse> addManualStrike(
            @PathVariable Long userId,
            @RequestParam String reason) {
        logger.info("Adding manual strike to student {} for reason: {}", userId, reason);
        
        User updatedUser = penaltyService.addManualStrike(userId, reason);
        UserResponse userResponse = userMapper.toResponse(updatedUser);
        
        return ResponseEntity.ok(userResponse);
    }

    /**
     * Reset all strikes for a user.
     * 
     * @param userId The ID of the user to reset
     * @return Updated user information
     */
    @PostMapping("/reset-strikes/{userId}")
    public ResponseEntity<UserResponse> resetStrikes(@PathVariable Long userId) {
        logger.info("Resetting all strikes for user {}", userId);
        
        User updatedUser = penaltyService.resetUserStrikes(userId);
        UserResponse userResponse = userMapper.toResponse(updatedUser);
        
        return ResponseEntity.ok(userResponse);
    }

    /**
     * Get users with bad status.
     * 
     * @return List of users with bad status
     */
    @GetMapping("/bad-users")
    public ResponseEntity<List<UserResponse>> getBadUsers() {
        List<User> badUsers = penaltyService.getUsersWithBadStatus();
        List<UserResponse> userResponses = badUsers.stream()
                .map(userMapper::toResponse)
                .collect(Collectors.toList());
        
        return ResponseEntity.ok(userResponses);
    }

    /**
     * Get users with warning status.
     * 
     * @return List of users with warning status
     */
    @GetMapping("/warning-users")
    public ResponseEntity<List<UserResponse>> getWarningUsers() {
        List<User> warningUsers = penaltyService.getUsersWithWarningStatus();
        List<UserResponse> userResponses = warningUsers.stream()
                .map(userMapper::toResponse)
                .collect(Collectors.toList());
        
        return ResponseEntity.ok(userResponses);
    }

    /**
     * Get users with most no-shows.
     * 
     * @param limit Maximum number of users to return (default: 10)
     * @return List of users with most no-shows
     */
    @GetMapping("/top-offenders")
    public ResponseEntity<List<UserResponse>> getTopOffenders(
            @RequestParam(defaultValue = "10") int limit) {
        
        List<User> topOffenders = penaltyService.getUsersWithMostNoShows(limit);
        List<UserResponse> userResponses = topOffenders.stream()
                .map(userMapper::toResponse)
                .collect(Collectors.toList());
        
        return ResponseEntity.ok(userResponses);
    }

    /**
     * Get penalty statistics for a specific user.
     * 
     * @param userId The ID of the user
     * @return Penalty statistics for the user
     */
    @GetMapping("/stats/{userId}")
    public ResponseEntity<PenaltyService.PenaltyStats> getUserPenaltyStats(@PathVariable Long userId) {
        PenaltyService.PenaltyStats stats = penaltyService.getUserPenaltyStats(userId);
        return ResponseEntity.ok(stats);
    }

    /**
     * Get overall penalty statistics.
     * 
     * @return Overall penalty statistics
     */
    @GetMapping("/stats")
    public ResponseEntity<Map<String, Object>> getOverallPenaltyStats() {
        List<User> badUsers = penaltyService.getUsersWithBadStatus();
        List<User> warningUsers = penaltyService.getUsersWithWarningStatus();
        List<User> topOffenders = penaltyService.getUsersWithMostNoShows(5);
        
        Map<String, Object> stats = new HashMap<>();
        stats.put("badUsersCount", badUsers.size());
        stats.put("warningUsersCount", warningUsers.size());
        stats.put("badUsers", badUsers.stream()
                .map(userMapper::toResponse)
                .collect(Collectors.toList()));
        stats.put("warningUsers", warningUsers.stream()
                .map(userMapper::toResponse)
                .collect(Collectors.toList()));
        stats.put("topOffenders", topOffenders.stream()
                .map(userMapper::toResponse)
                .collect(Collectors.toList()));
        
        return ResponseEntity.ok(stats);
    }

    /**
     * Check if a user can make reservations.
     * 
     * @param userId The ID of the user to check
     * @return Boolean indicating if user can make reservations
     */
    @GetMapping("/can-reserve/{userId}")
    public ResponseEntity<Map<String, Boolean>> canUserMakeReservations(@PathVariable Long userId) {
        User user = userService.findUserById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found with id: " + userId));
        
        boolean canReserve = penaltyService.canUserMakeReservations(user);
        
        Map<String, Boolean> response = new HashMap<>();
        response.put("canMakeReservations", canReserve);
        
        return ResponseEntity.ok(response);
    }
}