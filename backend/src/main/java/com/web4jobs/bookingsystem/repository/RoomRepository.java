package com.web4jobs.bookingsystem.repository;

import com.web4jobs.bookingsystem.model.Center;
import com.web4jobs.bookingsystem.model.Room;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

/**
 * Repository for managing Room entities.
 * Provides methods for CRUD operations and custom queries related to rooms.
 */
@Repository
public interface RoomRepository extends JpaRepository<Room, Long> {
    
    /**
     * Find all rooms in a specific center.
     * 
     * @param center The center to filter by
     * @return A list of rooms in the specified center
     */
    List<Room> findByCenter(Center center);
    
    /**
     * Find all rooms on a specific floor.
     * 
     * @param floor The floor to filter by
     * @return A list of rooms on the specified floor
     */
    List<Room> findByFloor(Integer floor);
    
    /**
     * Find all rooms with a capacity greater than or equal to the specified value.
     * 
     * @param minCapacity The minimum capacity required
     * @return A list of rooms with sufficient capacity
     */
    List<Room> findByCapacityGreaterThanEqual(Integer minCapacity);
    
    /**
     * Find all rooms in a specific center on a specific floor.
     * 
     * @param center The center to filter by
     * @param floor The floor to filter by
     * @return A list of rooms in the specified center on the specified floor
     */
    List<Room> findByCenterAndFloor(Center center, Integer floor);
    
    /**
     * Find all rooms in a specific center with a capacity greater than or equal to the specified value.
     * 
     * @param center The center to filter by
     * @param minCapacity The minimum capacity required
     * @return A list of rooms in the specified center with sufficient capacity
     */
    List<Room> findByCenterAndCapacityGreaterThanEqual(Center center, Integer minCapacity);
    
    /**
     * Count rooms in a specific center.
     * 
     * @param center The center to filter by
     * @return The count of rooms in the specified center
     */
    long countByCenter(Center center);
    
    /**
     * Find all rooms by name containing the search term (case insensitive).
     * 
     * @param searchTerm The search term to look for in room names
     * @return A list of matching rooms
     */
    List<Room> findByNameContainingIgnoreCase(String searchTerm);
    
    /**
     * Find all rooms in a specific center with available workstations.
     * 
     * @param center The center to filter by
     * @return A list of rooms with at least one available workstation
     */
    @Query("SELECT DISTINCT r FROM Room r JOIN r.workStations ws WHERE r.center = :center AND ws.status = 'AVAILABLE'")
    List<Room> findRoomsWithAvailableWorkStations(@Param("center") Center center);
    
    /**
     * Find all rooms with a specific capacity range.
     * 
     * @param minCapacity The minimum capacity required
     * @param maxCapacity The maximum capacity required
     * @return A list of rooms within the specified capacity range
     */
    List<Room> findByCapacityBetween(Integer minCapacity, Integer maxCapacity);
    
    /**
     * Find a room by ID and eagerly load its workstations.
     * 
     * @param id The ID of the room to find
     * @return The room with its workstations eagerly loaded
     */
    @Query("SELECT r FROM Room r LEFT JOIN FETCH r.workStations WHERE r.id = :id")
    Room findByIdWithWorkStations(@Param("id") Long id);
    
    /**
     * Find all rooms by center ID and eagerly load center data.
     * 
     * @param centerId The ID of the center
     * @return A list of rooms in the specified center with center data loaded
     */
    @Query("SELECT r FROM Room r JOIN FETCH r.center c WHERE c.id = :centerId")
    List<Room> findByCenterId(@Param("centerId") Long centerId);
}