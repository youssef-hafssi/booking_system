package com.web4jobs.bookingsystem.service;

import com.web4jobs.bookingsystem.model.Center;
import com.web4jobs.bookingsystem.model.Room;
import com.web4jobs.bookingsystem.model.WorkStation;
import com.web4jobs.bookingsystem.model.WorkStationStatus;
import com.web4jobs.bookingsystem.repository.CenterRepository;
import com.web4jobs.bookingsystem.repository.RoomRepository;
import com.web4jobs.bookingsystem.repository.WorkStationRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

/**
 * Service for managing WorkStation entities.
 * Provides business logic for workstation management operations.
 */
@Service
public class WorkStationService {

    private final WorkStationRepository workStationRepository;
    private final RoomRepository roomRepository;
    private final CenterRepository centerRepository;

    @Autowired
    public WorkStationService(WorkStationRepository workStationRepository, 
                             RoomRepository roomRepository,
                             CenterRepository centerRepository) {
        this.workStationRepository = workStationRepository;
        this.roomRepository = roomRepository;
        this.centerRepository = centerRepository;
    }

    /**
     * Find all workstations in the system.
     *
     * @return A list of all workstations
     */
    public List<WorkStation> findAllWorkStations() {
        return workStationRepository.findAll();
    }

    /**
     * Find a workstation by its ID.
     *
     * @param id The ID of the workstation to find
     * @return An Optional containing the workstation if found, or empty if not found
     */
    public Optional<WorkStation> findWorkStationById(Long id) {
        return workStationRepository.findById(id);
    }

    /**
     * Find a workstation by its ID with room and center data eagerly loaded.
     * This avoids LazyInitializationException when accessing nested entities.
     *
     * @param id The ID of the workstation to find
     * @return The workstation with all related data loaded, or null if not found
     */
    public WorkStation findWorkStationByIdWithRoomAndCenter(Long id) {
        return workStationRepository.findByIdWithRoomAndCenter(id);
    }

    /**
     * Find all workstations in a specific room.
     *
     * @param roomId The ID of the room to filter by
     * @return A list of workstations in the specified room
     * @throws IllegalArgumentException if the room does not exist
     */
    public List<WorkStation> findWorkStationsByRoom(Long roomId) {
        Room room = roomRepository.findById(roomId)
                .orElseThrow(() -> new IllegalArgumentException("Room not found with id: " + roomId));
        
        return workStationRepository.findByRoom(room);
    }

    /**
     * Find all workstations with a specific status.
     *
     * @param status The status to filter by
     * @return A list of workstations with the specified status
     */
    public List<WorkStation> findWorkStationsByStatus(WorkStationStatus status) {
        return workStationRepository.findByStatus(status);
    }

    /**
     * Find all available workstations for a specific time period.
     *
     * @param startTime The start time of the period
     * @param endTime The end time of the period
     * @return A list of available workstations
     */
    public List<WorkStation> findAvailableWorkStations(LocalDateTime startTime, LocalDateTime endTime) {
        return workStationRepository.findAvailableWorkStations(startTime, endTime);
    }

    /**
     * Find all available workstations in a specific room for a specific time period.
     *
     * @param roomId The ID of the room to filter by
     * @param startTime The start time of the period
     * @param endTime The end time of the period
     * @return A list of available workstations in the specified room
     * @throws IllegalArgumentException if the room does not exist
     */
    public List<WorkStation> findAvailableWorkStationsInRoom(Long roomId, LocalDateTime startTime, LocalDateTime endTime) {
        Room room = roomRepository.findById(roomId)
                .orElseThrow(() -> new IllegalArgumentException("Room not found with id: " + roomId));
        
        return workStationRepository.findAvailableWorkStationsInRoom(room, startTime, endTime);
    }

    /**
     * Search for workstations by name.
     *
     * @param searchTerm The search term to look for in workstation names
     * @return A list of matching workstations
     */
    public List<WorkStation> searchWorkStationsByName(String searchTerm) {
        return workStationRepository.findByNameContainingIgnoreCase(searchTerm);
    }

    /**
     * Create a new workstation.
     *
     * @param workStation The workstation to create
     * @return The created workstation with ID assigned
     * @throws IllegalArgumentException if the room does not exist
     */
    @Transactional
    public WorkStation createWorkStation(WorkStation workStation) {
        // Verify that the room exists
        if (workStation.getRoom() != null && workStation.getRoom().getId() != null) {
            // Load the complete Room entity with Center from the database
            Room room = roomRepository.findById(workStation.getRoom().getId())
                    .orElseThrow(() -> new IllegalArgumentException("Room not found with id: " + workStation.getRoom().getId()));
            
            // This ensures that the Room has its Center populated from the database
            workStation.setRoom(room);
        } else {
            throw new IllegalArgumentException("Room is required for a workstation");
        }
        
        // Set default status if not provided
        if (workStation.getStatus() == null) {
            workStation.setStatus(WorkStationStatus.AVAILABLE);
        }
        
        // Set creation and update timestamps
        LocalDateTime now = LocalDateTime.now();
        workStation.setCreatedAt(now);
        workStation.setUpdatedAt(now);
        
        return workStationRepository.save(workStation);
    }

    /**
     * Update an existing workstation.
     *
     * @param id The ID of the workstation to update
     * @param workStationDetails The updated workstation details
     * @return The updated workstation
     * @throws IllegalArgumentException if the workstation does not exist or if the room does not exist
     */
    @Transactional
    public WorkStation updateWorkStation(Long id, WorkStation workStationDetails) {
        WorkStation workStation = workStationRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("WorkStation not found with id: " + id));
        
        // Update fields
        workStation.setName(workStationDetails.getName());
        workStation.setDescription(workStationDetails.getDescription());
        workStation.setSpecifications(workStationDetails.getSpecifications());
        workStation.setStatus(workStationDetails.getStatus());
        workStation.setPosition(workStationDetails.getPosition());
        
        // Update room if provided
        if (workStationDetails.getRoom() != null && workStationDetails.getRoom().getId() != null) {
            // Load the complete Room entity with Center from the database
            Room room = roomRepository.findById(workStationDetails.getRoom().getId())
                    .orElseThrow(() -> new IllegalArgumentException("Room not found with id: " + workStationDetails.getRoom().getId()));
            
            // This ensures that the Room has its Center populated from the database
            workStation.setRoom(room);
        }
        
        // Update timestamp
        workStation.setUpdatedAt(LocalDateTime.now());
        
        return workStationRepository.save(workStation);
    }

    /**
     * Update the status of a workstation.
     *
     * @param id The ID of the workstation
     * @param status The new status
     * @return The updated workstation
     * @throws IllegalArgumentException if the workstation does not exist
     */
    @Transactional
    public WorkStation updateWorkStationStatus(Long id, WorkStationStatus status) {
        WorkStation workStation = workStationRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("WorkStation not found with id: " + id));
        
        workStation.setStatus(status);
        workStation.setUpdatedAt(LocalDateTime.now());
        
        return workStationRepository.save(workStation);
    }

    /**
     * Delete a workstation by its ID.
     *
     * @param id The ID of the workstation to delete
     * @throws IllegalArgumentException if the workstation does not exist
     */
    @Transactional
    public void deleteWorkStation(Long id) {
        if (!workStationRepository.existsById(id)) {
            throw new IllegalArgumentException("WorkStation not found with id: " + id);
        }
        workStationRepository.deleteById(id);
    }

    /**
     * Count all workstations.
     *
     * @return The count of all workstations
     */
    public long countWorkStations() {
        return workStationRepository.count();
    }

    /**
     * Find all workstations in a specific center.
     *
     * @param centerId The ID of the center to filter by
     * @return A list of workstations in the specified center
     * @throws IllegalArgumentException if the center does not exist
     */
    public List<WorkStation> findWorkStationsByCenter(Long centerId) {
        Center center = centerRepository.findById(centerId)
                .orElseThrow(() -> new IllegalArgumentException("Center not found with id: " + centerId));
        
        // First get all rooms in this center
        List<Room> rooms = roomRepository.findByCenter(center);
        
        // Then get all workstations in these rooms
        return workStationRepository.findByRoomIn(rooms);
    }
}