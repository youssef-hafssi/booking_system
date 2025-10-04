package com.web4jobs.bookingsystem.service;

import com.web4jobs.bookingsystem.model.Center;
import com.web4jobs.bookingsystem.model.Room;
import com.web4jobs.bookingsystem.model.WorkStationStatus;
import com.web4jobs.bookingsystem.repository.CenterRepository;
import com.web4jobs.bookingsystem.repository.RoomRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

/**
 * Service for managing Room entities.
 * Provides business logic for room management operations.
 */
@Service
public class RoomService {

    private final RoomRepository roomRepository;
    private final CenterRepository centerRepository;

    @Autowired
    public RoomService(RoomRepository roomRepository, CenterRepository centerRepository) {
        this.roomRepository = roomRepository;
        this.centerRepository = centerRepository;
    }

    /**
     * Find all rooms in the system.
     *
     * @return A list of all rooms
     */
    public List<Room> findAllRooms() {
        return roomRepository.findAll();
    }

    /**
     * Find a room by its ID.
     *
     * @param id The ID of the room to find
     * @return An Optional containing the room if found, or empty if not found
     */
    public Optional<Room> findRoomById(Long id) {
        return roomRepository.findById(id);
    }

    /**
     * Find all rooms in a specific center.
     *
     * @param centerId The ID of the center to filter by
     * @return A list of rooms in the specified center
     * @throws IllegalArgumentException if the center does not exist
     */
    public List<Room> findRoomsByCenter(Long centerId) {
        Center center = centerRepository.findById(centerId)
                .orElseThrow(() -> new IllegalArgumentException("Center not found with id: " + centerId));
        
        return roomRepository.findByCenter(center);
    }

    /**
     * Find all rooms on a specific floor.
     *
     * @param floor The floor to filter by
     * @return A list of rooms on the specified floor
     */
    public List<Room> findRoomsByFloor(Integer floor) {
        return roomRepository.findByFloor(floor);
    }

    /**
     * Find all rooms with a capacity greater than or equal to the specified value.
     *
     * @param minCapacity The minimum capacity required
     * @return A list of rooms with sufficient capacity
     */
    public List<Room> findRoomsByMinCapacity(Integer minCapacity) {
        return roomRepository.findByCapacityGreaterThanEqual(minCapacity);
    }

    /**
     * Find all rooms in a specific center on a specific floor.
     *
     * @param centerId The ID of the center to filter by
     * @param floor The floor to filter by
     * @return A list of rooms in the specified center on the specified floor
     * @throws IllegalArgumentException if the center does not exist
     */
    public List<Room> findRoomsByCenterAndFloor(Long centerId, Integer floor) {
        Center center = centerRepository.findById(centerId)
                .orElseThrow(() -> new IllegalArgumentException("Center not found with id: " + centerId));
        
        return roomRepository.findByCenterAndFloor(center, floor);
    }

    /**
     * Count rooms in a specific center.
     *
     * @param center The center to count rooms for
     * @return The count of rooms in the specified center
     */
    public long countRoomsByCenter(Center center) {
        return roomRepository.countByCenter(center);
    }

    /**
     * Find all rooms in a specific center with a capacity greater than or equal to the specified value.
     *
     * @param centerId The ID of the center to filter by
     * @param minCapacity The minimum capacity required
     * @return A list of rooms in the specified center with sufficient capacity
     * @throws IllegalArgumentException if the center does not exist
     */
    public List<Room> findRoomsByCenterAndMinCapacity(Long centerId, Integer minCapacity) {
        Center center = centerRepository.findById(centerId)
                .orElseThrow(() -> new IllegalArgumentException("Center not found with id: " + centerId));
        
        return roomRepository.findByCenterAndCapacityGreaterThanEqual(center, minCapacity);
    }

    /**
     * Find all rooms with a specific capacity range.
     *
     * @param minCapacity The minimum capacity required
     * @param maxCapacity The maximum capacity required
     * @return A list of rooms within the specified capacity range
     */
    public List<Room> findRoomsByCapacityRange(Integer minCapacity, Integer maxCapacity) {
        return roomRepository.findByCapacityBetween(minCapacity, maxCapacity);
    }

    /**
     * Find all rooms in a specific center with available workstations.
     *
     * @param centerId The ID of the center to filter by
     * @return A list of rooms with at least one available workstation
     * @throws IllegalArgumentException if the center does not exist
     */
    public List<Room> findRoomsWithAvailableWorkStations(Long centerId) {
        Center center = centerRepository.findById(centerId)
                .orElseThrow(() -> new IllegalArgumentException("Center not found with id: " + centerId));
        
        return roomRepository.findRoomsWithAvailableWorkStations(center);
    }

    /**
     * Search for rooms by name.
     *
     * @param searchTerm The search term to look for in room names
     * @return A list of matching rooms
     */
    public List<Room> searchRoomsByName(String searchTerm) {
        return roomRepository.findByNameContainingIgnoreCase(searchTerm);
    }

    /**
     * Create a new room.
     *
     * @param room The room to create
     * @return The created room with ID assigned
     * @throws IllegalArgumentException if the center does not exist
     */
    @Transactional
    public Room createRoom(Room room) {
        // Verify that the center exists
        if (room.getCenter() != null && room.getCenter().getId() != null) {
            Center center = centerRepository.findById(room.getCenter().getId())
                    .orElseThrow(() -> new IllegalArgumentException("Center not found with id: " + room.getCenter().getId()));
            room.setCenter(center);
        } else {
            throw new IllegalArgumentException("Center is required for a room");
        }
        
        // Set creation and update timestamps
        LocalDateTime now = LocalDateTime.now();
        room.setCreatedAt(now);
        room.setUpdatedAt(now);
        
        return roomRepository.save(room);
    }

    /**
     * Update an existing room.
     *
     * @param id The ID of the room to update
     * @param roomDetails The updated room details
     * @return The updated room
     * @throws IllegalArgumentException if the room does not exist or if the center does not exist
     */
    @Transactional
    public Room updateRoom(Long id, Room roomDetails) {
        Room room = roomRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Room not found with id: " + id));
        
        // Update fields
        room.setName(roomDetails.getName());
        room.setFloor(roomDetails.getFloor());
        room.setCapacity(roomDetails.getCapacity());
        
        // Update center if provided
        if (roomDetails.getCenter() != null && roomDetails.getCenter().getId() != null) {
            Center center = centerRepository.findById(roomDetails.getCenter().getId())
                    .orElseThrow(() -> new IllegalArgumentException("Center not found with id: " + roomDetails.getCenter().getId()));
            room.setCenter(center);
        }
        
        // Update timestamp
        room.setUpdatedAt(LocalDateTime.now());
        
        return roomRepository.save(room);
    }

    /**
     * Delete a room by its ID.
     *
     * @param id The ID of the room to delete
     * @throws IllegalArgumentException if the room does not exist
     */
    @Transactional
    public void deleteRoom(Long id) {
        if (!roomRepository.existsById(id)) {
            throw new IllegalArgumentException("Room not found with id: " + id);
        }
        roomRepository.deleteById(id);
    }

    /**
     * Count all rooms in the system.
     *
     * @return The count of all rooms
     */
    public long countRooms() {
        return roomRepository.count();
    }
}