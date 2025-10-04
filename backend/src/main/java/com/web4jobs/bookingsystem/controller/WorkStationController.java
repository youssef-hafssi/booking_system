package com.web4jobs.bookingsystem.controller;

import com.web4jobs.bookingsystem.dto.workstation.WorkStationRequest;
import com.web4jobs.bookingsystem.dto.workstation.WorkStationResponse;
import com.web4jobs.bookingsystem.mapper.WorkStationMapper;
import com.web4jobs.bookingsystem.model.WorkStation;
import com.web4jobs.bookingsystem.model.WorkStationStatus;
import com.web4jobs.bookingsystem.model.User;
import com.web4jobs.bookingsystem.model.UserRole;
import com.web4jobs.bookingsystem.model.Room;
import com.web4jobs.bookingsystem.repository.RoomRepository;
import com.web4jobs.bookingsystem.service.WorkStationService;
import com.web4jobs.bookingsystem.service.UserService;
import com.web4jobs.bookingsystem.service.AccessControlService;
import jakarta.validation.Valid;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * REST controller for managing workstations.
 * Provides endpoints for CRUD operations and specialized queries.
 */
@RestController
@RequestMapping("/api/workstations")
public class WorkStationController {

    private static final Logger logger = LoggerFactory.getLogger(WorkStationController.class);

    private final WorkStationService workStationService;
    private final WorkStationMapper workStationMapper;
    private final UserService userService;
    private final AccessControlService accessControlService;
    private final RoomRepository roomRepository;

    @Autowired
    public WorkStationController(WorkStationService workStationService, 
                                WorkStationMapper workStationMapper,
                                UserService userService,
                                AccessControlService accessControlService,
                                RoomRepository roomRepository) {
        this.workStationService = workStationService;
        this.workStationMapper = workStationMapper;
        this.userService = userService;
        this.accessControlService = accessControlService;
        this.roomRepository = roomRepository;
    }

    @GetMapping
    public ResponseEntity<List<WorkStationResponse>> getAllWorkStations(Authentication authentication) {
        if (authentication == null) {
            // For development: return all workstations without authentication
            List<WorkStation> workStations = workStationService.findAllWorkStations();
            List<WorkStationResponse> workStationResponses = workStations.stream()
                    .map(workStationMapper::toWorkStationResponse)
                    .collect(Collectors.toList());
            return ResponseEntity.ok(workStationResponses);
        }

        User currentUser = userService.findUserByEmail(authentication.getName())
                .orElseThrow(() -> new IllegalArgumentException("User not found with email: " + authentication.getName()));
        List<WorkStation> workStations = workStationService.findAllWorkStations();
        List<WorkStation> accessibleWorkStations = workStations.stream()
                .filter(workStation -> accessControlService.canAccessCenter(currentUser, workStation.getRoom().getCenter()))
                .collect(Collectors.toList());
        List<WorkStationResponse> workStationResponses = accessibleWorkStations.stream()
                .map(workStationMapper::toWorkStationResponse)
                .collect(Collectors.toList());
        return ResponseEntity.ok(workStationResponses);
    }

    @GetMapping("/{id}")
    public ResponseEntity<WorkStationResponse> getWorkStationById(@PathVariable Long id, Authentication authentication) {
        if (authentication == null) {
            // For development: return workstation without authentication
            WorkStation workStation = workStationService.findWorkStationByIdWithRoomAndCenter(id);
            if (workStation == null) {
                throw new IllegalArgumentException("WorkStation not found with id: " + id);
            }
            return ResponseEntity.ok(workStationMapper.toWorkStationResponse(workStation));
        }

        User currentUser = userService.findUserByEmail(authentication.getName())
                .orElseThrow(() -> new IllegalArgumentException("User not found with email: " + authentication.getName()));
        
        // Use the enhanced method that eagerly loads room and center data
        WorkStation workStation = workStationService.findWorkStationByIdWithRoomAndCenter(id);
        if (workStation == null) {
            throw new IllegalArgumentException("WorkStation not found with id: " + id);
        }
        
        if (!accessControlService.canAccessCenter(currentUser, workStation.getRoom().getCenter())) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }
        
        // Log to verify that the center data is loaded
        logger.info("Returning workstation with ID: {}, Room ID: {}, Center ID: {}", 
                   workStation.getId(),
                   workStation.getRoom().getId(),
                   workStation.getRoom().getCenter() != null ? workStation.getRoom().getCenter().getId() : "NULL");
        
        return ResponseEntity.ok(workStationMapper.toWorkStationResponse(workStation));
    }

    @GetMapping("/room/{roomId}")
    public ResponseEntity<List<WorkStationResponse>> getWorkStationsByRoom(@PathVariable Long roomId, Authentication authentication) {
        User currentUser = userService.findUserByEmail(authentication.getName())
                .orElseThrow(() -> new IllegalArgumentException("User not found with email: " + authentication.getName()));
        List<WorkStation> workStations = workStationService.findWorkStationsByRoom(roomId);
        List<WorkStation> accessibleWorkStations = workStations.stream()
                .filter(workStation -> accessControlService.canAccessCenter(currentUser, workStation.getRoom().getCenter()))
                .collect(Collectors.toList());
        List<WorkStationResponse> workStationResponses = accessibleWorkStations.stream()
                .map(workStationMapper::toWorkStationResponse)
                .collect(Collectors.toList());
        return ResponseEntity.ok(workStationResponses);
    }

    @GetMapping("/center/{centerId}")
    public ResponseEntity<List<WorkStationResponse>> getWorkStationsByCenter(@PathVariable Long centerId, Authentication authentication) {
        // Check if user has access to this center
        User currentUser = userService.findUserByEmail(authentication.getName())
                .orElseThrow(() -> new IllegalArgumentException("User not found with email: " + authentication.getName()));
                
        // Get workstations for this center
        List<WorkStation> workStations = workStationService.findWorkStationsByCenter(centerId);
        
        // Map to response DTO
        List<WorkStationResponse> workStationResponses = workStations.stream()
                .map(workStationMapper::toWorkStationResponse)
                .collect(Collectors.toList());
                
        return ResponseEntity.ok(workStationResponses);
    }

    @GetMapping("/status/{status}")
    public ResponseEntity<List<WorkStationResponse>> getWorkStationsByStatus(
            @PathVariable WorkStationStatus status,
            Authentication authentication) {
        User currentUser = userService.findUserByEmail(authentication.getName())
                .orElseThrow(() -> new IllegalArgumentException("User not found with email: " + authentication.getName()));
        List<WorkStation> workStations = workStationService.findWorkStationsByStatus(status);
        List<WorkStation> accessibleWorkStations = workStations.stream()
                .filter(workStation -> accessControlService.canAccessCenter(currentUser, workStation.getRoom().getCenter()))
                .collect(Collectors.toList());
        List<WorkStationResponse> workStationResponses = accessibleWorkStations.stream()
                .map(workStationMapper::toWorkStationResponse)
                .collect(Collectors.toList());
        return ResponseEntity.ok(workStationResponses);
    }

    @GetMapping("/available")
    public ResponseEntity<List<WorkStationResponse>> getAvailableWorkStations(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime startTime,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime endTime,
            Authentication authentication) {
        User currentUser = userService.findUserByEmail(authentication.getName())
                .orElseThrow(() -> new IllegalArgumentException("User not found with email: " + authentication.getName()));
        List<WorkStation> workStations = workStationService.findAvailableWorkStations(startTime, endTime);
        List<WorkStation> accessibleWorkStations = workStations.stream()
                .filter(workStation -> accessControlService.canAccessCenter(currentUser, workStation.getRoom().getCenter()))
                .collect(Collectors.toList());
        List<WorkStationResponse> workStationResponses = accessibleWorkStations.stream()
                .map(workStationMapper::toWorkStationResponse)
                .collect(Collectors.toList());
        return ResponseEntity.ok(workStationResponses);
    }

    @GetMapping("/available/room/{roomId}")
    public ResponseEntity<List<WorkStationResponse>> getAvailableWorkStationsInRoom(
            @PathVariable Long roomId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime startTime,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime endTime,
            Authentication authentication) {
        User currentUser = userService.findUserByEmail(authentication.getName())
                .orElseThrow(() -> new IllegalArgumentException("User not found with email: " + authentication.getName()));
        List<WorkStation> workStations = workStationService.findAvailableWorkStationsInRoom(roomId, startTime, endTime);
        List<WorkStation> accessibleWorkStations = workStations.stream()
                .filter(workStation -> accessControlService.canAccessCenter(currentUser, workStation.getRoom().getCenter()))
                .collect(Collectors.toList());
        List<WorkStationResponse> workStationResponses = accessibleWorkStations.stream()
                .map(workStationMapper::toWorkStationResponse)
                .collect(Collectors.toList());
        return ResponseEntity.ok(workStationResponses);
    }

    @GetMapping("/search")
    public ResponseEntity<List<WorkStationResponse>> searchWorkStationsByName(
            @RequestParam String searchTerm,
            Authentication authentication) {
        if (authentication == null) {
            // For development: search workstations without authentication
            List<WorkStation> workStations = workStationService.searchWorkStationsByName(searchTerm);
            List<WorkStationResponse> workStationResponses = workStations.stream()
                    .map(workStationMapper::toWorkStationResponse)
                    .collect(Collectors.toList());
            return ResponseEntity.ok(workStationResponses);
        }

        User currentUser = userService.findUserByEmail(authentication.getName())
                .orElseThrow(() -> new IllegalArgumentException("User not found with email: " + authentication.getName()));
        List<WorkStation> workStations = workStationService.searchWorkStationsByName(searchTerm);
        
        // Filter workstations based on user's access
        List<WorkStation> accessibleWorkStations = workStations.stream()
                .filter(workStation -> accessControlService.canAccessCenter(currentUser, workStation.getRoom().getCenter()))
                .collect(Collectors.toList());
        List<WorkStationResponse> workStationResponses = accessibleWorkStations.stream()
                .map(workStationMapper::toWorkStationResponse)
                .collect(Collectors.toList());
        return ResponseEntity.ok(workStationResponses);
    }

    @PostMapping
    public ResponseEntity<?> createWorkStation(
            @Valid @RequestBody WorkStationRequest workStationRequest,
            Authentication authentication) {
        if (authentication == null) {
            // For development: create workstation without authentication
            WorkStation workStation = workStationMapper.toWorkStation(workStationRequest);
            WorkStation createdWorkStation = workStationService.createWorkStation(workStation);
            return new ResponseEntity<>(workStationMapper.toWorkStationResponse(createdWorkStation), HttpStatus.CREATED);
        }

        User currentUser = userService.findUserByEmail(authentication.getName())
                .orElseThrow(() -> new IllegalArgumentException("User not found with email: " + authentication.getName()));
        
        // First check if user has required role permissions
        if (!accessControlService.hasGlobalAccess(currentUser) && 
            currentUser.getRole() != UserRole.CENTER_MANAGER) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }
        
        // Check room access permissions by room ID directly instead of through workstation
        Long roomId = workStationRequest.getRoomId();
        if (roomId == null) {
            throw new IllegalArgumentException("Room ID is required for workstation creation");
        }
        
        // Load the room with workstations to get its center and check access permissions
        Room room = roomRepository.findByIdWithWorkStations(roomId);
        if (room == null) {
            throw new IllegalArgumentException("Room not found with id: " + roomId);
        }
        
        if (!accessControlService.canAccessCenter(currentUser, room.getCenter())) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }
        
        // Check if room has reached its capacity
        if (room.getWorkStations() != null && room.getCapacity() != null) {
            int currentWorkstationCount = room.getWorkStations().size();
            if (currentWorkstationCount >= room.getCapacity()) {
                Map<String, Object> errorResponse = new HashMap<>();
                errorResponse.put("error", "Room capacity exceeded");
                errorResponse.put("message", "Room has reached its maximum capacity of " + room.getCapacity() + " workstations.");
                errorResponse.put("roomId", room.getId());
                errorResponse.put("roomName", room.getName());
                errorResponse.put("capacity", room.getCapacity());
                errorResponse.put("currentCount", currentWorkstationCount);
                
                return ResponseEntity
                    .status(HttpStatus.BAD_REQUEST)
                    .body(errorResponse);
            }
        }
        
        // Now create the workstation using the validated room ID
        WorkStation workStation = workStationMapper.toWorkStation(workStationRequest);
        WorkStation createdWorkStation = workStationService.createWorkStation(workStation);
        return new ResponseEntity<>(workStationMapper.toWorkStationResponse(createdWorkStation), HttpStatus.CREATED);
    }

    @PutMapping("/{id}")
    public ResponseEntity<WorkStationResponse> updateWorkStation(
            @PathVariable Long id,
            @Valid @RequestBody WorkStationRequest workStationRequest,
            Authentication authentication) {
        if (authentication == null) {
            // For development: update workstation without authentication
            WorkStation workStation = workStationMapper.toWorkStation(workStationRequest);
            WorkStation updatedWorkStation = workStationService.updateWorkStation(id, workStation);
            return ResponseEntity.ok(workStationMapper.toWorkStationResponse(updatedWorkStation));
        }

        User currentUser = userService.findUserByEmail(authentication.getName())
                .orElseThrow(() -> new IllegalArgumentException("User not found with email: " + authentication.getName()));
        WorkStation existingWorkStation = workStationService.findWorkStationById(id)
                .orElseThrow(() -> new IllegalArgumentException("WorkStation not found with id: " + id));
        
        // Check access to existing workstation
        if (!accessControlService.canAccessCenter(currentUser, existingWorkStation.getRoom().getCenter())) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }
        
        // Check role permissions
        if (!accessControlService.hasGlobalAccess(currentUser) && 
            currentUser.getRole() != UserRole.CENTER_MANAGER) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }
        
        // If room is being changed, check access to the new room
        Long newRoomId = workStationRequest.getRoomId();
        if (newRoomId != null && !newRoomId.equals(existingWorkStation.getRoom().getId())) {
            Room newRoom = roomRepository.findById(newRoomId)
                    .orElseThrow(() -> new IllegalArgumentException("Room not found with id: " + newRoomId));
            
            if (!accessControlService.canAccessCenter(currentUser, newRoom.getCenter())) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
            }
        }
        
        WorkStation workStation = workStationMapper.toWorkStation(workStationRequest);
        WorkStation updatedWorkStation = workStationService.updateWorkStation(id, workStation);
        return ResponseEntity.ok(workStationMapper.toWorkStationResponse(updatedWorkStation));
    }

    @PatchMapping("/{id}/status")
    public ResponseEntity<WorkStationResponse> updateWorkStationStatus(
            @PathVariable Long id,
            @RequestParam WorkStationStatus status,
            Authentication authentication) {
        if (authentication == null) {
            // For development: update workstation status without authentication
            WorkStation updatedWorkStation = workStationService.updateWorkStationStatus(id, status);
            return ResponseEntity.ok(workStationMapper.toWorkStationResponse(updatedWorkStation));
        }

        User currentUser = userService.findUserByEmail(authentication.getName())
                .orElseThrow(() -> new IllegalArgumentException("User not found with email: " + authentication.getName()));
        WorkStation existingWorkStation = workStationService.findWorkStationById(id)
                .orElseThrow(() -> new IllegalArgumentException("WorkStation not found with id: " + id));
        
        if (!accessControlService.canAccessCenter(currentUser, existingWorkStation.getRoom().getCenter())) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }
        
        if (!accessControlService.hasGlobalAccess(currentUser) && 
            currentUser.getRole() != UserRole.CENTER_MANAGER) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }
        
        WorkStation updatedWorkStation = workStationService.updateWorkStationStatus(id, status);
        return ResponseEntity.ok(workStationMapper.toWorkStationResponse(updatedWorkStation));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteWorkStation(
            @PathVariable Long id,
            Authentication authentication) {
        if (authentication == null) {
            // For development: delete workstation without authentication
            workStationService.deleteWorkStation(id);
            return ResponseEntity.noContent().build();
        }

        User currentUser = userService.findUserByEmail(authentication.getName())
                .orElseThrow(() -> new IllegalArgumentException("User not found with email: " + authentication.getName()));
        WorkStation workStation = workStationService.findWorkStationById(id)
                .orElseThrow(() -> new IllegalArgumentException("WorkStation not found with id: " + id));
        
        if (!accessControlService.canAccessCenter(currentUser, workStation.getRoom().getCenter())) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }
        
        // Allow both ADMIN users and CENTER_MANAGERs to delete workstations in their centers
        if (!accessControlService.hasGlobalAccess(currentUser) && 
            currentUser.getRole() != UserRole.CENTER_MANAGER) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }
        
        workStationService.deleteWorkStation(id);
        return ResponseEntity.noContent().build();
    }

    /**
     * Count all workstations.
     *
     * @return The count of all workstations
     */
    @GetMapping("/count")
    @PreAuthorize("hasAnyRole('ADMIN', 'CENTER_MANAGER', 'ASSET_MANAGER', 'PEDAGOGICAL_MANAGER', 'EXECUTIVE_DIRECTOR')")
    public ResponseEntity<Integer> countWorkStations() {
        logger.info("Counting all workstations");
        int count = (int) workStationService.countWorkStations();
        return ResponseEntity.ok(count);
    }

    /**
     * Count workstations in a specific center.
     *
     * @param centerId The ID of the center
     * @return The count of workstations in the center
     */
    @GetMapping("/center/{centerId}/count")
    @PreAuthorize("hasAnyRole('ADMIN', 'CENTER_MANAGER', 'ASSET_MANAGER', 'PEDAGOGICAL_MANAGER', 'EXECUTIVE_DIRECTOR')")
    public ResponseEntity<Integer> countWorkStationsByCenter(@PathVariable Long centerId) {
        logger.info("Counting workstations for center: {}", centerId);
        List<WorkStation> workstations = workStationService.findWorkStationsByCenter(centerId);
        return ResponseEntity.ok(workstations.size());
    }

    /**
     * Upload an image for a workstation.
     *
     * @param file The image file to upload
     * @return The URL/path of the uploaded image
     */
    @PostMapping("/upload-image")
    // Temporarily removed authorization for testing - add back: @PreAuthorize("hasAnyRole('ADMIN', 'CENTER_MANAGER', 'ASSET_MANAGER')")
    public ResponseEntity<?> uploadWorkstationImage(@RequestParam("file") MultipartFile file) {
        try {
            if (file.isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of("error", "Please select a file to upload"));
            }

            // Validate file type
            String contentType = file.getContentType();
            if (contentType == null || !contentType.startsWith("image/")) {
                return ResponseEntity.badRequest().body(Map.of("error", "Only image files are allowed"));
            }

            // Create uploads directory if it doesn't exist
            String uploadsDir = "uploads/workstations/";
            Path uploadPath = Paths.get(uploadsDir);
            if (!Files.exists(uploadPath)) {
                Files.createDirectories(uploadPath);
            }

            // Generate unique filename
            String originalFilename = file.getOriginalFilename();
            String extension = originalFilename != null && originalFilename.contains(".") 
                ? originalFilename.substring(originalFilename.lastIndexOf(".")) 
                : ".jpg";
            String filename = "workstation_" + System.currentTimeMillis() + extension;

            // Save file
            Path filePath = uploadPath.resolve(filename);
            Files.copy(file.getInputStream(), filePath, StandardCopyOption.REPLACE_EXISTING);

            // Return the relative URL path
            String imageUrl = "/uploads/workstations/" + filename;
            return ResponseEntity.ok(Map.of("imageUrl", imageUrl));

        } catch (IOException e) {
            logger.error("Error uploading file", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Failed to upload image: " + e.getMessage()));
        }
    }
}