package com.web4jobs.bookingsystem.controller;

import com.web4jobs.bookingsystem.dto.room.RoomRequest;
import com.web4jobs.bookingsystem.dto.room.RoomResponse;
import com.web4jobs.bookingsystem.mapper.RoomMapper;
import com.web4jobs.bookingsystem.model.Center;
import com.web4jobs.bookingsystem.model.Room;
import com.web4jobs.bookingsystem.repository.CenterRepository;
import com.web4jobs.bookingsystem.service.RoomService;
import jakarta.validation.Valid;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.security.access.prepost.PreAuthorize;

import java.util.List;
import java.util.stream.Collectors;

/**
 * REST controller for managing rooms.
 * Provides endpoints for CRUD operations and specialized queries.
 */
@RestController
@RequestMapping("/api/rooms")
public class RoomController {

    private static final Logger logger = LoggerFactory.getLogger(RoomController.class);

    private final RoomService roomService;
    private final RoomMapper roomMapper;
    private final CenterRepository centerRepository;

    @Autowired
    public RoomController(RoomService roomService, RoomMapper roomMapper, CenterRepository centerRepository) {
        this.roomService = roomService;
        this.roomMapper = roomMapper;
        this.centerRepository = centerRepository;
    }

    /**
     * Get all rooms.
     *
     * @return List of all rooms
     */
    @GetMapping
    public ResponseEntity<List<RoomResponse>> getAllRooms() {
        List<Room> rooms = roomService.findAllRooms();
        List<RoomResponse> roomResponses = rooms.stream()
                .map(roomMapper::toRoomResponse)
                .collect(Collectors.toList());
        return ResponseEntity.ok(roomResponses);
    }

    /**
     * Get the count of rooms in a specific center.
     *
     * @param centerId The ID of the center
     * @return The count of rooms in the specified center
     */
    @GetMapping("/count/center/{centerId}")
    public ResponseEntity<Long> getRoomCountByCenter(@PathVariable Long centerId) {
        Center center = centerRepository.findById(centerId)
                .orElseThrow(() -> new IllegalArgumentException("Center not found with id: " + centerId));
        
        long count = roomService.countRoomsByCenter(center);
        return ResponseEntity.ok(count);
    }

    /**
     * Get a room by ID.
     *
     * @param id The ID of the room
     * @return The room if found
     */
    @GetMapping("/{id}")
    public ResponseEntity<RoomResponse> getRoomById(@PathVariable Long id) {
        return roomService.findRoomById(id)
                .map(roomMapper::toRoomResponse)
                .map(ResponseEntity::ok)
                .orElseThrow(() -> new IllegalArgumentException("Room not found with id: " + id));
    }

    /**
     * Get all rooms in a specific center.
     *
     * @param centerId The ID of the center
     * @return List of rooms in the specified center
     */
    @GetMapping("/center/{centerId}")
    public ResponseEntity<List<RoomResponse>> getRoomsByCenter(@PathVariable Long centerId) {
        List<Room> rooms = roomService.findRoomsByCenter(centerId);
        List<RoomResponse> roomResponses = rooms.stream()
                .map(roomMapper::toRoomResponse)
                .collect(Collectors.toList());
        return ResponseEntity.ok(roomResponses);
    }

    /**
     * Get all rooms on a specific floor.
     *
     * @param floor The floor to filter by
     * @return List of rooms on the specified floor
     */
    @GetMapping("/floor/{floor}")
    public ResponseEntity<List<RoomResponse>> getRoomsByFloor(@PathVariable Integer floor) {
        List<Room> rooms = roomService.findRoomsByFloor(floor);
        List<RoomResponse> roomResponses = rooms.stream()
                .map(roomMapper::toRoomResponse)
                .collect(Collectors.toList());
        return ResponseEntity.ok(roomResponses);
    }

    /**
     * Get all rooms with a capacity greater than or equal to the specified value.
     *
     * @param minCapacity The minimum capacity required
     * @return List of rooms with sufficient capacity
     */
    @GetMapping("/capacity/{minCapacity}")
    public ResponseEntity<List<RoomResponse>> getRoomsByMinCapacity(@PathVariable Integer minCapacity) {
        List<Room> rooms = roomService.findRoomsByMinCapacity(minCapacity);
        List<RoomResponse> roomResponses = rooms.stream()
                .map(roomMapper::toRoomResponse)
                .collect(Collectors.toList());
        return ResponseEntity.ok(roomResponses);
    }

    /**
     * Get all rooms in a specific center on a specific floor.
     *
     * @param centerId The ID of the center
     * @param floor The floor to filter by
     * @return List of rooms in the specified center on the specified floor
     */
    @GetMapping("/center/{centerId}/floor/{floor}")
    public ResponseEntity<List<RoomResponse>> getRoomsByCenterAndFloor(
            @PathVariable Long centerId,
            @PathVariable Integer floor) {
        List<Room> rooms = roomService.findRoomsByCenterAndFloor(centerId, floor);
        List<RoomResponse> roomResponses = rooms.stream()
                .map(roomMapper::toRoomResponse)
                .collect(Collectors.toList());
        return ResponseEntity.ok(roomResponses);
    }

    /**
     * Get all rooms in a specific center with a capacity greater than or equal to the specified value.
     *
     * @param centerId The ID of the center
     * @param minCapacity The minimum capacity required
     * @return List of rooms in the specified center with sufficient capacity
     */
    @GetMapping("/center/{centerId}/capacity/{minCapacity}")
    public ResponseEntity<List<RoomResponse>> getRoomsByCenterAndMinCapacity(
            @PathVariable Long centerId,
            @PathVariable Integer minCapacity) {
        List<Room> rooms = roomService.findRoomsByCenterAndMinCapacity(centerId, minCapacity);
        List<RoomResponse> roomResponses = rooms.stream()
                .map(roomMapper::toRoomResponse)
                .collect(Collectors.toList());
        return ResponseEntity.ok(roomResponses);
    }

    /**
     * Get all rooms with a specific capacity range.
     *
     * @param minCapacity The minimum capacity required
     * @param maxCapacity The maximum capacity required
     * @return List of rooms within the specified capacity range
     */
    @GetMapping("/capacity-range")
    public ResponseEntity<List<RoomResponse>> getRoomsByCapacityRange(
            @RequestParam Integer minCapacity,
            @RequestParam Integer maxCapacity) {
        List<Room> rooms = roomService.findRoomsByCapacityRange(minCapacity, maxCapacity);
        List<RoomResponse> roomResponses = rooms.stream()
                .map(roomMapper::toRoomResponse)
                .collect(Collectors.toList());
        return ResponseEntity.ok(roomResponses);
    }

    /**
     * Get all rooms in a specific center with available workstations.
     *
     * @param centerId The ID of the center
     * @return List of rooms with at least one available workstation
     */
    @GetMapping("/available-workstations/{centerId}")
    public ResponseEntity<List<RoomResponse>> getRoomsWithAvailableWorkStations(@PathVariable Long centerId) {
        List<Room> rooms = roomService.findRoomsWithAvailableWorkStations(centerId);
        List<RoomResponse> roomResponses = rooms.stream()
                .map(roomMapper::toRoomResponse)
                .collect(Collectors.toList());
        return ResponseEntity.ok(roomResponses);
    }

    /**
     * Search for rooms by name.
     *
     * @param searchTerm The search term to look for in room names
     * @return List of matching rooms
     */
    @GetMapping("/search")
    public ResponseEntity<List<RoomResponse>> searchRoomsByName(@RequestParam String searchTerm) {
        List<Room> rooms = roomService.searchRoomsByName(searchTerm);
        List<RoomResponse> roomResponses = rooms.stream()
                .map(roomMapper::toRoomResponse)
                .collect(Collectors.toList());
        return ResponseEntity.ok(roomResponses);
    }

    /**
     * Create a new room.
     *
     * @param roomRequest The room to create
     * @return The created room
     */
    @PostMapping
    public ResponseEntity<RoomResponse> createRoom(@Valid @RequestBody RoomRequest roomRequest) {
        Room room = roomMapper.toRoom(roomRequest);
        Room createdRoom = roomService.createRoom(room);
        return new ResponseEntity<>(roomMapper.toRoomResponse(createdRoom), HttpStatus.CREATED);
    }

    /**
     * Update an existing room.
     *
     * @param id The ID of the room to update
     * @param roomRequest The updated room details
     * @return The updated room
     */
    @PutMapping("/{id}")
    public ResponseEntity<RoomResponse> updateRoom(
            @PathVariable Long id,
            @Valid @RequestBody RoomRequest roomRequest) {
        Room room = roomMapper.toRoom(roomRequest);
        Room updatedRoom = roomService.updateRoom(id, room);
        return ResponseEntity.ok(roomMapper.toRoomResponse(updatedRoom));
    }

    /**
     * Delete a room.
     *
     * @param id The ID of the room to delete
     * @return No content response
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteRoom(@PathVariable Long id) {
        roomService.deleteRoom(id);
        return ResponseEntity.noContent().build();
    }

    /**
     * Count all rooms.
     *
     * @return The count of all rooms
     */
    @GetMapping("/count")
    @PreAuthorize("hasAnyRole('ADMIN', 'CENTER_MANAGER', 'ASSET_MANAGER', 'PEDAGOGICAL_MANAGER', 'EXECUTIVE_DIRECTOR')")
    public ResponseEntity<Integer> countRooms() {
        logger.info("Counting all rooms");
        int count = (int) roomService.countRooms();
        return ResponseEntity.ok(count);
    }

    /**
     * Count rooms in a specific center.
     *
     * @param centerId The ID of the center
     * @return The count of rooms in the specified center
     */
    @GetMapping("/center/{centerId}/count")
    @PreAuthorize("hasAnyRole('ADMIN', 'CENTER_MANAGER', 'ASSET_MANAGER', 'PEDAGOGICAL_MANAGER', 'EXECUTIVE_DIRECTOR')")
    public ResponseEntity<Integer> countRoomsByCenter(@PathVariable Long centerId) {
        logger.info("Counting rooms for center: {}", centerId);
        Center center = centerRepository.findById(centerId)
                .orElseThrow(() -> new IllegalArgumentException("Center not found with id: " + centerId));
        int count = (int) roomService.countRoomsByCenter(center);
        return ResponseEntity.ok(count);
    }
}