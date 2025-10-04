package com.web4jobs.bookingsystem.service;

import com.web4jobs.bookingsystem.model.*;
import com.web4jobs.bookingsystem.repository.ReservationRepository;
import com.web4jobs.bookingsystem.repository.UserRepository;
import com.web4jobs.bookingsystem.repository.WorkStationRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import com.web4jobs.bookingsystem.dto.response.ReservationStatsResponse;

/**
 * Service interface for managing Reservation entities.
 * Provides business logic for reservation management operations.
 */
public interface ReservationService {

    /**
     * Find all reservations in the system.
     *
     * @return A list of all reservations
     */
    List<Reservation> findAllReservations();

    /**
     * Find a reservation by its ID.
     *
     * @param id The ID of the reservation to find
     * @return An Optional containing the reservation if found, or empty if not found
     */
    Optional<Reservation> findReservationById(Long id);

    /**
     * Find all reservations for a specific user.
     *
     * @param userId The ID of the user to filter by
     * @return A list of reservations for the specified user
     * @throws IllegalArgumentException if the user does not exist
     */
    List<Reservation> findReservationsByUser(Long userId);

    /**
     * Find all reservations for a specific workstation.
     *
     * @param workStationId The ID of the workstation to filter by
     * @return A list of reservations for the specified workstation
     * @throws IllegalArgumentException if the workstation does not exist
     */
    List<Reservation> findReservationsByWorkStation(Long workStationId);

    /**
     * Find all reservations with a specific status.
     *
     * @param status The status to filter by
     * @return A list of reservations with the specified status
     */
    List<Reservation> findReservationsByStatus(ReservationStatus status);

    /**
     * Find all reservations within a specific date/time range.
     *
     * @param startTime The start of the date/time range
     * @param endTime The end of the date/time range
     * @return A list of reservations within the specified date/time range
     */
    List<Reservation> findReservationsInDateRange(LocalDateTime startTime, LocalDateTime endTime);

    /**
     * Find all upcoming reservations for a specific user.
     *
     * @param userId The ID of the user to filter by
     * @return A list of upcoming reservations for the specified user
     * @throws IllegalArgumentException if the user does not exist
     */
    List<Reservation> findUpcomingReservationsForUser(Long userId);

    /**
     * Check if a workstation is available for a specific time period.
     *
     * @param workStationId The ID of the workstation to check
     * @param startTime The start time of the period
     * @param endTime The end time of the period
     * @return true if the workstation is available, false otherwise
     * @throws IllegalArgumentException if the workstation does not exist or if the time period is invalid
     */
    boolean isWorkStationAvailable(Long workStationId, LocalDateTime startTime, LocalDateTime endTime);

    /**
     * Create a new reservation.
     * This method checks if the workstation is available for the requested time period before creating the reservation.
     *
     * @param reservation The reservation to create
     * @return The created reservation with ID assigned
     * @throws IllegalArgumentException if the user or workstation does not exist, or if the workstation is not available
     */
    Reservation createReservation(Reservation reservation);

    /**
     * Update an existing reservation.
     * This method checks if the workstation is available for the requested time period before updating the reservation.
     *
     * @param id The ID of the reservation to update
     * @param reservationDetails The updated reservation details
     * @return The updated reservation
     * @throws IllegalArgumentException if the reservation does not exist, or if the workstation is not available
     */
    Reservation updateReservation(Long id, Reservation reservationDetails);

    /**
     * Confirm a pending reservation.
     *
     * @param id The ID of the reservation to confirm
     * @return The confirmed reservation
     * @throws IllegalArgumentException if the reservation does not exist or is not in PENDING status
     */
    Reservation confirmReservation(Long id);

    /**
     * Cancel a reservation.
     *
     * @param id The ID of the reservation to cancel
     * @return The cancelled reservation
     * @throws IllegalArgumentException if the reservation does not exist
     */
    Reservation cancelReservation(Long id);

    /**
     * Cancel a reservation with a reason (for authorized roles only).
     * This method should be used by PEDAGOGICAL_MANAGER, ASSET_MANAGER, EXECUTIVE_DIRECTOR, or ADMIN
     * when cancelling a student's reservation.
     *
     * @param id The ID of the reservation to cancel
     * @param reason The reason for cancellation (mandatory)
     * @param cancelledByUserId The ID of the user performing the cancellation
     * @return The cancelled reservation
     * @throws IllegalArgumentException if the reservation does not exist or reason is empty
     */
    Reservation cancelReservationWithReason(Long id, String reason, Long cancelledByUserId);

    /**
     * Validate if a student can cancel their reservation (must be more than 1 hour before start time).
     *
     * @param reservationId The ID of the reservation to check
     * @param userId The ID of the user trying to cancel
     * @return true if cancellation is allowed, false otherwise
     * @throws IllegalArgumentException if the reservation does not exist
     */
    boolean canStudentCancelReservation(Long reservationId, Long userId);

    /**
     * Validate if a student can make a new reservation (cooldown period check).
     * Students must wait 1 hour after their last reservation ends before making a new one.
     *
     * @param userId The ID of the student
     * @param proposedStartTime The proposed start time for the new reservation
     * @return true if the student can make a reservation, false otherwise
     */
    boolean canStudentMakeReservation(Long userId, LocalDateTime proposedStartTime);

    /**
     * Validate reservation duration (maximum 2 hours for students).
     *
     * @param startTime The start time of the reservation
     * @param endTime The end time of the reservation
     * @param userRole The role of the user making the reservation
     * @return true if duration is valid, false otherwise
     */
    boolean isReservationDurationValid(LocalDateTime startTime, LocalDateTime endTime, UserRole userRole);

    /**
     * Check if a student has any active reservations (PENDING or CONFIRMED).
     * Students should only be allowed one active reservation at a time.
     *
     * @param userId The ID of the student
     * @return true if the student has active reservations, false otherwise
     */
    boolean hasActiveReservations(Long userId);

    /**
     * Delete a reservation.
     *
     * @param id The ID of the reservation to delete
     * @throws IllegalArgumentException if the reservation does not exist
     */
    void deleteReservation(Long id);

    /**
     * Send a reminder for a reservation.
     *
     * @param id The ID of the reservation to send a reminder for
     * @throws IllegalArgumentException if the reservation does not exist
     */
    void sendReservationReminder(Long id);

    /**
     * Update the status of a reservation.
     *
     * @param id The ID of the reservation to update
     * @param status The new status
     * @return The updated reservation
     * @throws IllegalArgumentException if the reservation does not exist
     */
    Reservation updateReservationStatus(Long id, ReservationStatus status);

    /**
     * Get reservation statistics.
     *
     * @return ReservationStatsResponse containing reservation statistics
     */
    ReservationStatsResponse getReservationStats();

    /**
     * Updates a reservation with authorization check for students.
     * Students can only update their own reservations and cannot change the status.
     *
     * @param id The ID of the reservation to update
     * @param reservationDetails The updated reservation details
     * @param currentUserId The ID of the user making the update
     * @return The updated reservation
     * @throws IllegalArgumentException if the reservation is not found or if the user is not authorized
     */
    Reservation updateReservationForStudent(Long id, Reservation reservationDetails, Long currentUserId);

    /**
     * Find all reservations for a specific center.
     *
     * @param centerId The ID of the center to filter by
     * @return A list of reservations for the specified center
     * @throws IllegalArgumentException if the center does not exist
     */
    List<Reservation> findReservationsByCenter(Long centerId);

    /**
     * Delete a reservation with authorization check for students.
     * Students can only delete their own reservations.
     *
     * @param id The ID of the reservation to delete
     * @param currentUserId The ID of the user making the deletion request
     * @throws IllegalArgumentException if the reservation is not found or if the user is not authorized
     */
    void deleteReservationForStudent(Long id, Long currentUserId);

    /**
     * Get reservation statistics for a specific center.
     *
     * @param centerId The ID of the center
     * @return ReservationStatsResponse containing reservation statistics for the center
     */
    ReservationStatsResponse getReservationStatsByCenter(Long centerId);
}