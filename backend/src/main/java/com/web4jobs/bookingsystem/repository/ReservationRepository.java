package com.web4jobs.bookingsystem.repository;

import com.web4jobs.bookingsystem.model.Reservation;
import com.web4jobs.bookingsystem.model.ReservationStatus;
import com.web4jobs.bookingsystem.model.User;
import com.web4jobs.bookingsystem.model.WorkStation;
import com.web4jobs.bookingsystem.model.Center;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

/**
 * Repository for managing Reservation entities.
 * Provides methods for CRUD operations and custom queries related to reservations.
 */
@Repository
public interface ReservationRepository extends JpaRepository<Reservation, Long> {
    
    /**
     * Find all reservations with eager loading of related entities (workstation, room, center)
     * to avoid LazyInitializationException.
     *
     * @return A list of all reservations with related entities loaded
     */
    @Query("SELECT r FROM Reservation r " +
           "LEFT JOIN FETCH r.workStation ws " +
           "LEFT JOIN FETCH ws.room rm " +
           "LEFT JOIN FETCH rm.center " +
           "ORDER BY r.createdAt DESC")
    List<Reservation> findAllWithWorkStationsAndRoomsAndCenters();
    
    /**
     * Find all active (non-cancelled) reservations with eager loading of related entities.
     * This is useful for availability checking and conflict detection.
     *
     * @return A list of active reservations with related entities loaded
     */
    @Query("SELECT r FROM Reservation r " +
           "LEFT JOIN FETCH r.workStation ws " +
           "LEFT JOIN FETCH ws.room rm " +
           "LEFT JOIN FETCH rm.center " +
           "WHERE r.status != 'CANCELLED' " +
           "ORDER BY r.createdAt DESC")
    List<Reservation> findAllActiveWithWorkStationsAndRoomsAndCenters();
    
    /**
     * Find all reservations for a specific center with eager loading of related entities.
     *
     * @param center The center to filter by
     * @return A list of reservations for the specified center with related entities loaded
     */
    @Query("SELECT r FROM Reservation r JOIN FETCH r.workStation ws JOIN FETCH ws.room rm JOIN FETCH rm.center c WHERE c = :center")
    List<Reservation> findByCenterWithEagerLoading(@Param("center") Center center);
    
    /**
     * Find all reservations for a specific user.
     * 
     * @param user The user to filter by
     * @return A list of reservations for the specified user
     */
    List<Reservation> findByUser(User user);
    
    /**
     * Find all reservations for a specific workstation.
     * 
     * @param workStation The workstation to filter by
     * @return A list of reservations for the specified workstation
     */
    List<Reservation> findByWorkStation(WorkStation workStation);
    
    /**
     * Find all reservations with a specific status.
     * 
     * @param status The status to filter by
     * @return A list of reservations with the specified status
     */
    List<Reservation> findByStatus(ReservationStatus status);
    
    /**
     * Find all reservations for a specific user with a specific status.
     * 
     * @param user The user to filter by
     * @param status The status to filter by
     * @return A list of reservations for the specified user with the specified status
     */
    List<Reservation> findByUserAndStatus(User user, ReservationStatus status);
    
    /**
     * Find all reservations for a specific user with specific statuses, ordered by end time descending.
     * Used for checking cooldown periods.
     * 
     * @param user The user to filter by
     * @param statuses The list of statuses to filter by
     * @return A list of reservations for the specified user with the specified statuses, ordered by end time descending
     */
    List<Reservation> findByUserAndStatusInOrderByEndTimeDesc(User user, List<ReservationStatus> statuses);
    
    /**
     * Find all active reservations for a specific user with specific statuses that end after a certain time.
     * Used for checking if a student has active reservations.
     * 
     * @param user The user to filter by
     * @param statuses The list of statuses to filter by
     * @param endTime The minimum end time (reservations must end after this time)
     * @return A list of active reservations for the specified user
     */
    List<Reservation> findByUserAndStatusInAndEndTimeAfter(User user, List<ReservationStatus> statuses, LocalDateTime endTime);
    
    /**
     * Find all reservations for a specific workstation with a specific status.
     * 
     * @param workStation The workstation to filter by
     * @param status The status to filter by
     * @return A list of reservations for the specified workstation with the specified status
     */
    List<Reservation> findByWorkStationAndStatus(WorkStation workStation, ReservationStatus status);
    
    /**
     * Find all reservations that start after a specific date/time.
     * 
     * @param startTime The date/time to filter by
     * @return A list of reservations that start after the specified date/time
     */
    List<Reservation> findByStartTimeGreaterThanEqual(LocalDateTime startTime);
    
    /**
     * Find all reservations that end before a specific date/time.
     * 
     * @param endTime The date/time to filter by
     * @return A list of reservations that end before the specified date/time
     */
    List<Reservation> findByEndTimeLessThanEqual(LocalDateTime endTime);
    
    /**
     * Find all reservations within a specific date/time range.
     * 
     * @param startTime The start of the date/time range
     * @param endTime The end of the date/time range
     * @return A list of reservations within the specified date/time range
     */
    List<Reservation> findByStartTimeGreaterThanEqualAndEndTimeLessThanEqual(LocalDateTime startTime, LocalDateTime endTime);
    
    /**
     * Find all reservations for a specific user within a specific date/time range.
     * 
     * @param user The user to filter by
     * @param startTime The start of the date/time range
     * @param endTime The end of the date/time range
     * @return A list of reservations for the specified user within the specified date/time range
     */
    List<Reservation> findByUserAndStartTimeGreaterThanEqualAndEndTimeLessThanEqual(
            User user, LocalDateTime startTime, LocalDateTime endTime);
    
    /**
     * Find all reservations that overlap with a specific date/time range.
     * INCLUSIVE overlap logic: End time boundaries are considered overlapping.
     * Example: A 9:00-11:00 reservation will mark 09:00, 10:00, AND 11:00 slots as booked.
     * Only considers active (non-cancelled) reservations for availability checking.
     * 
     * @param startTime The start of the date/time range
     * @param endTime The end of the date/time range
     * @return A list of active reservations that overlap with the specified date/time range
     */
    @Query("SELECT r FROM Reservation r WHERE r.status <> 'CANCELLED' AND " +
           "r.startTime < :endTime AND r.endTime >= :startTime")
    List<Reservation> findOverlappingReservations(
            @Param("startTime") LocalDateTime startTime, 
            @Param("endTime") LocalDateTime endTime);
    
    /**
     * Find all reservations for a specific workstation that overlap with a specific date/time range.
     * INCLUSIVE overlap logic: End time boundaries are considered overlapping.
     * Example: A 9:00-11:00 reservation will mark 09:00, 10:00, AND 11:00 slots as booked.
     * Only considers active (non-cancelled) reservations for availability checking.
     * 
     * @param workStation The workstation to filter by
     * @param startTime The start of the date/time range
     * @param endTime The end of the date/time range
     * @return A list of active reservations for the specified workstation that overlap with the specified date/time range
     */
    @Query("SELECT r FROM Reservation r " +
           "WHERE r.workStation = :workStation " +
           "AND r.status != 'CANCELLED' " +
           "AND r.startTime < :endTime " +
           "AND r.endTime >= :startTime")
    List<Reservation> findOverlappingReservationsForWorkStation(
            @Param("workStation") WorkStation workStation,
            @Param("startTime") LocalDateTime startTime, 
            @Param("endTime") LocalDateTime endTime);
    
    /**
     * Find all upcoming reservations for a specific user.
     * 
     * @param user The user to filter by
     * @param currentTime The current date/time
     * @return A list of upcoming reservations for the specified user
     */
    @Query("SELECT r FROM Reservation r " +
           "WHERE r.user = :user " +
           "AND r.endTime > :now " +
           "AND r.status != 'CANCELLED' " +
           "ORDER BY r.startTime ASC")
    List<Reservation> findUpcomingReservationsForUser(@Param("user") User user, @Param("now") LocalDateTime now);
    
    /**
     * Count all reservations with a specific status.
     * 
     * @param status The status to filter by
     * @return The count of reservations with the specified status
     */
    long countByStatus(ReservationStatus status);

    /**
     * Find reservations between two dates.
     *
     * @param startTime The start time
     * @param endTime The end time
     * @return List of reservations between the given dates
     */
    List<Reservation> findByStartTimeBetween(LocalDateTime startTime, LocalDateTime endTime);

    /**
     * Count reservations for workstations with the given IDs.
     *
     * @param workStationIds List of workstation IDs
     * @return The count of reservations for the given workstations
     */
    int countByWorkStationIdIn(List<Long> workStationIds);

    /**
     * Find the most recent reservations.
     *
     * @return List of the 10 most recent reservations
     */
    List<Reservation> findTop10ByOrderByCreatedAtDesc();

    /**
     * Find all reservations for a specific workstation and center.
     *
     * @param center The center to filter by
     * @return A list of reservations for the specified workstation and center
     */
    List<Reservation> findByWorkStationRoomCenter(Center center);
    
    /**
     * Find all reservations for a specific center with eager loading of related entities.
     * This method includes ALL reservations (including cancelled ones) for the center.
     *
     * @param center The center to filter by
     * @return A list of reservations for the specified center with related entities loaded
     */
    @Query("SELECT r FROM Reservation r " +
           "LEFT JOIN FETCH r.workStation ws " +
           "LEFT JOIN FETCH ws.room rm " +
           "LEFT JOIN FETCH rm.center c " +
           "WHERE c = :center " +
           "ORDER BY r.createdAt DESC")
    List<Reservation> findByCenterWithEagerLoadingIncludingCancelled(@Param("center") Center center);

    // AI-specific queries for booking suggestions
    /**
     * Find reservations by user ID ordered by creation date (for AI analysis)
     */
    List<Reservation> findByUserIdOrderByCreatedAtDesc(Long userId);
    
    /**
     * Find reservations by center and time range (for AI activity analysis)
     */
    @Query("SELECT r FROM Reservation r " +
           "LEFT JOIN FETCH r.workStation ws " +
           "LEFT JOIN FETCH ws.room rm " +
           "LEFT JOIN FETCH rm.center " +
           "WHERE rm.center.id = :centerId " +
           "AND r.startTime >= :startTime " +
           "AND r.endTime <= :endTime")
    List<Reservation> findByWorkStationRoomCenterIdAndStartTimeBetween(
            @Param("centerId") Long centerId,
            @Param("startTime") LocalDateTime startTime,
            @Param("endTime") LocalDateTime endTime);
    
    /**
     * Find reservations for a specific user created after a certain date.
     * Used for AI analysis of user booking history.
     * 
     * @param user The user to filter by
     * @param createdAt The minimum creation date
     * @return A list of reservations for the user after the specified date
     */
    List<Reservation> findByUserAndCreatedAtAfter(User user, LocalDateTime createdAt);
    
    /**
     * Find reservations in a specific center within a time range.
     * Used for AI context analysis.
     * 
     * @param center The center to filter by
     * @param startTime The start of the time range
     * @param endTime The end of the time range
     * @return A list of reservations in the center within the time range
     */
    @Query("SELECT r FROM Reservation r " +
           "JOIN r.workStation ws " +
           "JOIN ws.room rm " +
           "JOIN rm.center c " +
           "WHERE c = :center AND r.startTime >= :startTime AND r.startTime < :endTime")
    List<Reservation> findByWorkStationRoomCenterAndStartTimeBetween(
        @Param("center") Center center, 
        @Param("startTime") LocalDateTime startTime, 
        @Param("endTime") LocalDateTime endTime);
    
    /**
     * Find upcoming reservations that need reminder emails.
     * Used for automatic email reminders 1 hour before reservation.
     * 
     * @param startWindow The start of the time window
     * @param endWindow The end of the time window
     * @param status The reservation status to filter by
     * @return A list of reservations needing reminders
     */
    @Query("SELECT r FROM Reservation r " +
           "JOIN FETCH r.user u " +
           "JOIN FETCH r.workStation ws " +
           "JOIN FETCH ws.room rm " +
           "JOIN FETCH rm.center " +
           "WHERE r.startTime BETWEEN :startWindow AND :endWindow " +
           "AND r.status = :status")
    List<Reservation> findUpcomingReservationsForReminder(
        @Param("startWindow") LocalDateTime startWindow,
        @Param("endWindow") LocalDateTime endWindow,
        @Param("status") ReservationStatus status);
}