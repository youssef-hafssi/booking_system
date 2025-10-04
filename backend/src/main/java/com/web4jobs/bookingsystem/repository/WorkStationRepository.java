package com.web4jobs.bookingsystem.repository;
import com.web4jobs.bookingsystem.model.Room;
import com.web4jobs.bookingsystem.model.WorkStation;
import com.web4jobs.bookingsystem.model.WorkStationStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

/**
 * Repository for managing WorkStation entities.
 * Provides methods for CRUD operations and custom queries related to workstations.
 */
@Repository
public interface WorkStationRepository extends JpaRepository<WorkStation, Long> {
    
    /**
     * Find all workstations in a specific room.
     * 
     * @param room The room to filter by
     * @return A list of workstations in the specified room
     */
    List<WorkStation> findByRoom(Room room);
    
    /**
     * Find all workstations in any of the specified rooms.
     * 
     * @param rooms The list of rooms to filter by
     * @return A list of workstations in any of the specified rooms
     */
    List<WorkStation> findByRoomIn(List<Room> rooms);
    
    /**
     * Find all workstations with a specific status.
     * 
     * @param status The status to filter by
     * @return A list of workstations with the specified status
     */
    List<WorkStation> findByStatus(WorkStationStatus status);
    
    /**
     * Find all workstations in a specific room with a specific status.
     * 
     * @param room The room to filter by
     * @param status The status to filter by
     * @return A list of workstations in the specified room with the specified status
     */
    List<WorkStation> findByRoomAndStatus(Room room, WorkStationStatus status);
    
    /**
     * Count all workstations with a specific status.
     * 
     * @param status The status to filter by
     * @return The count of workstations with the specified status
     */
    long countByStatus(WorkStationStatus status);
    
    /**
     * Find all workstations by name containing the search term (case insensitive).
     * 
     * @param searchTerm The search term to look for in workstation names
     * @return A list of matching workstations
     */
    List<WorkStation> findByNameContainingIgnoreCase(String searchTerm);
    
    /**
     * Find all available workstations (not reserved) for a specific time period.
     * This query checks that there are no overlapping reservations for the workstation
     * during the specified time period.
     * 
     * @param startTime The start time of the period
     * @param endTime The end time of the period
     * @return A list of available workstations
     */
    @Query("SELECT DISTINCT ws FROM WorkStation ws WHERE ws.status = 'AVAILABLE' AND ws.id NOT IN " +
           "(SELECT r.workStation.id FROM Reservation r WHERE " +
           "r.status <> 'CANCELLED' AND " +
           "((r.startTime <= :endTime AND r.endTime >= :startTime)))")
    List<WorkStation> findAvailableWorkStations(@Param("startTime") LocalDateTime startTime, 
                                               @Param("endTime") LocalDateTime endTime);
    
    /**
     * Find all available workstations in a specific room for a specific time period.
     * 
     * @param room The room to filter by
     * @param startTime The start time of the period
     * @param endTime The end time of the period
     * @return A list of available workstations in the specified room
     */
    @Query("SELECT DISTINCT ws FROM WorkStation ws WHERE ws.status = 'AVAILABLE' AND ws.room = :room AND ws.id NOT IN " +
           "(SELECT r.workStation.id FROM Reservation r WHERE " +
           "r.status <> 'CANCELLED' AND " +
           "((r.startTime <= :endTime AND r.endTime >= :startTime)))")
    List<WorkStation> findAvailableWorkStationsInRoom(@Param("room") Room room,
                                                     @Param("startTime") LocalDateTime startTime, 
                                                     @Param("endTime") LocalDateTime endTime);

    /**
     * Find workstations by room's center ID.
     *
     * @param centerId The center ID
     * @return List of workstations in the given center
     */
    List<WorkStation> findByRoomCenterId(Long centerId);
    
    /**
     * Find a workstation by ID and eagerly load all related data (room and center).
     * This ensures all data is loaded in a single query to avoid LazyInitializationException.
     *
     * @param id The workstation ID
     * @return The workstation with all related data loaded
     */
    @Query("SELECT ws FROM WorkStation ws JOIN FETCH ws.room r JOIN FETCH r.center WHERE ws.id = :id")
    WorkStation findByIdWithRoomAndCenter(@Param("id") Long id);
    
    /**
     * Count workstations by center ID.
     * Used for AI context analysis.
     * 
     * @param centerId The center ID to filter by
     * @return The count of workstations in the center
     */
    @Query("SELECT COUNT(ws) FROM WorkStation ws " +
           "JOIN ws.room r " +
           "WHERE r.center.id = :centerId")
    long countByRoomCenterId(@Param("centerId") Long centerId);
    

}