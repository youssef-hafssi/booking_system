package com.web4jobs.bookingsystem.controller;

import com.web4jobs.bookingsystem.dto.center.CenterRequest;
import com.web4jobs.bookingsystem.dto.center.CenterResponse;
import com.web4jobs.bookingsystem.mapper.CenterMapper;
import com.web4jobs.bookingsystem.model.Center;
import com.web4jobs.bookingsystem.model.User;
import com.web4jobs.bookingsystem.model.UserRole;
import com.web4jobs.bookingsystem.service.AccessControlService;
import com.web4jobs.bookingsystem.service.CenterService;
import com.web4jobs.bookingsystem.service.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.Collections;
import java.util.List;
import java.util.stream.Collectors;

/**
 * REST controller for managing centers.
 * Provides endpoints for CRUD operations and specialized queries.
 */
@RestController
@RequestMapping("/api/centers")
@RequiredArgsConstructor
public class CenterController {

    private final CenterService centerService;
    private final CenterMapper centerMapper;
    private final UserService userService;
    private final AccessControlService accessControlService;
    private static final Logger logger = LoggerFactory.getLogger(CenterController.class);

    /**
     * Get centers based on user's access level.
     *
     * @param authentication The authentication object containing user details
     * @return List of centers the user has access to
     */
    @GetMapping
    public ResponseEntity<List<CenterResponse>> getAllCenters(Authentication authentication) {
        if (authentication == null) {
            // For development: return all centers without authentication
            List<Center> centers = centerService.findAllCenters();
            List<CenterResponse> centerResponses = centers.stream()
                    .map(centerMapper::toCenterResponse)
                    .collect(Collectors.toList());
            return ResponseEntity.ok(centerResponses);
        }
        
        User currentUser = userService.findUserByEmail(authentication.getName())
                .orElseThrow(() -> new IllegalArgumentException("User not found with email: " + authentication.getName()));
        List<Center> accessibleCenters = accessControlService.getAccessibleCenters(currentUser, centerService);
        
        List<CenterResponse> centerResponses = accessibleCenters.stream()
                .map(centerMapper::toCenterResponse)
                .collect(Collectors.toList());
        return ResponseEntity.ok(centerResponses);
    }

    /**
     * Get a center by ID if user has access.
     *
     * @param id The center ID
     * @param authentication The authentication object containing user details
     * @return The center with the given ID if the user has access
     */
    @GetMapping("/{id}")
    public ResponseEntity<CenterResponse> getCenterById(@PathVariable Long id, Authentication authentication) {
        if (authentication == null) {
            // For development: return center without authentication
            Center center = centerService.findCenterById(id)
                    .orElseThrow(() -> new IllegalArgumentException("Center not found with id: " + id));
            CenterResponse response = centerMapper.toCenterResponse(center);
            return ResponseEntity.ok(response);
        }
        
        User currentUser = userService.findUserByEmail(authentication.getName())
                .orElseThrow(() -> new IllegalArgumentException("User not found with email: " + authentication.getName()));
        Center center = centerService.findCenterById(id)
                .orElseThrow(() -> new IllegalArgumentException("Center not found with id: " + id));
        
        if (!accessControlService.canAccessCenter(currentUser, center)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }
        
        CenterResponse response = centerMapper.toCenterResponse(center);
        return ResponseEntity.ok(response);
    }

    /**
     * Get centers by city, filtered by user's access level.
     *
     * @param city The city to filter by
     * @param authentication The authentication object containing user details
     * @return List of centers in the specified city that the user has access to
     */
    @GetMapping("/city/{city}")
    public ResponseEntity<List<CenterResponse>> getCentersByCity(
            @PathVariable String city, 
            Authentication authentication) {
        if (authentication == null) {
            // For development: return centers without authentication
            List<Center> centers = centerService.findCentersByCity(city);
            List<CenterResponse> centerResponses = centers.stream()
                    .map(centerMapper::toCenterResponse)
                    .collect(Collectors.toList());
            return ResponseEntity.ok(centerResponses);
        }
        
        User currentUser = userService.findUserByEmail(authentication.getName())
                .orElseThrow(() -> new IllegalArgumentException("User not found with email: " + authentication.getName()));
        List<Center> centers = centerService.findCentersByCity(city);
        
        // Filter centers based on user's access
        List<Center> accessibleCenters = centers.stream()
                .filter(center -> accessControlService.canAccessCenter(currentUser, center))
                .collect(Collectors.toList());
        
        List<CenterResponse> centerResponses = accessibleCenters.stream()
                .map(centerMapper::toCenterResponse)
                .collect(Collectors.toList());
        return ResponseEntity.ok(centerResponses);
    }

    /**
     * Get centers by postal code, filtered by user's access level.
     *
     * @param postalCode The postal code to filter by
     * @param authentication The authentication object containing user details
     * @return List of centers in the specified postal code area that the user has access to
     */
    @GetMapping("/postal-code/{postalCode}")
    public ResponseEntity<List<CenterResponse>> getCentersByPostalCode(
            @PathVariable String postalCode,
            Authentication authentication) {
        if (authentication == null) {
            // For development: return centers without authentication
            List<Center> centers = centerService.findCentersByPostalCode(postalCode);
            List<CenterResponse> centerResponses = centers.stream()
                    .map(centerMapper::toCenterResponse)
                    .collect(Collectors.toList());
            return ResponseEntity.ok(centerResponses);
        }
        
        User currentUser = userService.findUserByEmail(authentication.getName())
                .orElseThrow(() -> new IllegalArgumentException("User not found with email: " + authentication.getName()));
        List<Center> centers = centerService.findCentersByPostalCode(postalCode);
        
        // Filter centers based on user's access
        List<Center> accessibleCenters = centers.stream()
                .filter(center -> accessControlService.canAccessCenter(currentUser, center))
                .collect(Collectors.toList());
        
        List<CenterResponse> centerResponses = accessibleCenters.stream()
                .map(centerMapper::toCenterResponse)
                .collect(Collectors.toList());
        return ResponseEntity.ok(centerResponses);
    }

    /**
     * Get centers with available workstations, filtered by user's access level.
     *
     * @param authentication The authentication object containing user details
     * @return List of centers with available workstations that the user has access to
     */
    @GetMapping("/available-workstations")
    public ResponseEntity<List<CenterResponse>> getCentersWithAvailableWorkStations(Authentication authentication) {
        if (authentication == null) {
            // For development: return centers without authentication
            List<Center> centers = centerService.findCentersWithAvailableWorkStations();
            List<CenterResponse> centerResponses = centers.stream()
                    .map(centerMapper::toCenterResponse)
                    .collect(Collectors.toList());
            return ResponseEntity.ok(centerResponses);
        }
        
        User currentUser = userService.findUserByEmail(authentication.getName())
                .orElseThrow(() -> new IllegalArgumentException("User not found with email: " + authentication.getName()));
        List<Center> centers = centerService.findCentersWithAvailableWorkStations();
        
        // Filter centers based on user's access
        List<Center> accessibleCenters = centers.stream()
                .filter(center -> accessControlService.canAccessCenter(currentUser, center))
                .collect(Collectors.toList());
        
        List<CenterResponse> centerResponses = accessibleCenters.stream()
                .map(centerMapper::toCenterResponse)
                .collect(Collectors.toList());
        return ResponseEntity.ok(centerResponses);
    }

    /**
     * Get centers in a specific city with available workstations, filtered by user's access level.
     *
     * @param city The city to filter by
     * @param authentication The authentication object containing user details
     * @return List of centers in the specified city with available workstations that the user has access to
     */
    @GetMapping("/city/{city}/available-workstations")
    public ResponseEntity<List<CenterResponse>> getCentersInCityWithAvailableWorkStations(
            @PathVariable String city,
            Authentication authentication) {
        User currentUser = userService.findUserByEmail(authentication.getName())
                .orElseThrow(() -> new IllegalArgumentException("User not found with email: " + authentication.getName()));
        List<Center> centers = centerService.findCentersInCityWithAvailableWorkStations(city);
        
        // Filter centers based on user's access
        List<Center> accessibleCenters = centers.stream()
                .filter(center -> accessControlService.canAccessCenter(currentUser, center))
                .collect(Collectors.toList());
        
        List<CenterResponse> centerResponses = accessibleCenters.stream()
                .map(centerMapper::toCenterResponse)
                .collect(Collectors.toList());
        return ResponseEntity.ok(centerResponses);
    }

    /**
     * Search centers by name, filtered by user's access level.
     *
     * @param searchTerm The search term to look for in center names
     * @param authentication The authentication object containing user details
     * @return List of matching centers that the user has access to
     */
    @GetMapping("/search/name")
    public ResponseEntity<List<CenterResponse>> searchCentersByName(
            @RequestParam String searchTerm,
            Authentication authentication) {
        if (authentication == null) {
            // For development: return centers without authentication
            List<Center> centers = centerService.searchCentersByName(searchTerm);
            List<CenterResponse> centerResponses = centers.stream()
                    .map(centerMapper::toCenterResponse)
                    .collect(Collectors.toList());
            return ResponseEntity.ok(centerResponses);
        }
        
        User currentUser = userService.findUserByEmail(authentication.getName())
                .orElseThrow(() -> new IllegalArgumentException("User not found with email: " + authentication.getName()));
        List<Center> centers = centerService.searchCentersByName(searchTerm);
        
        // Filter centers based on user's access
        List<Center> accessibleCenters = centers.stream()
                .filter(center -> accessControlService.canAccessCenter(currentUser, center))
                .collect(Collectors.toList());
        
        List<CenterResponse> centerResponses = accessibleCenters.stream()
                .map(centerMapper::toCenterResponse)
                .collect(Collectors.toList());
        return ResponseEntity.ok(centerResponses);
    }

    /**
     * Search centers by city, filtered by user's access level.
     *
     * @param searchTerm The search term to look for in city names
     * @param authentication The authentication object containing user details
     * @return List of matching centers that the user has access to
     */
    @GetMapping("/search/city")
    public ResponseEntity<List<CenterResponse>> searchCentersByCity(
            @RequestParam String searchTerm,
            Authentication authentication) {
        if (authentication == null) {
            // For development: return centers without authentication
            List<Center> centers = centerService.searchCentersByCity(searchTerm);
            List<CenterResponse> centerResponses = centers.stream()
                    .map(centerMapper::toCenterResponse)
                    .collect(Collectors.toList());
            return ResponseEntity.ok(centerResponses);
        }
        
        User currentUser = userService.findUserByEmail(authentication.getName())
                .orElseThrow(() -> new IllegalArgumentException("User not found with email: " + authentication.getName()));
        List<Center> centers = centerService.searchCentersByCity(searchTerm);
        
        // Filter centers based on user's access
        List<Center> accessibleCenters = centers.stream()
                .filter(center -> accessControlService.canAccessCenter(currentUser, center))
                .collect(Collectors.toList());
        
        List<CenterResponse> centerResponses = accessibleCenters.stream()
                .map(centerMapper::toCenterResponse)
                .collect(Collectors.toList());
        return ResponseEntity.ok(centerResponses);
    }

    /**
     * Search centers by address, filtered by user's access level.
     *
     * @param searchTerm The search term to look for in addresses
     * @param authentication The authentication object containing user details
     * @return List of matching centers that the user has access to
     */
    @GetMapping("/search/address")
    public ResponseEntity<List<CenterResponse>> searchCentersByAddress(
            @RequestParam String searchTerm,
            Authentication authentication) {
        if (authentication == null) {
            // For development: return centers without authentication
            List<Center> centers = centerService.searchCentersByAddress(searchTerm);
            List<CenterResponse> centerResponses = centers.stream()
                    .map(centerMapper::toCenterResponse)
                    .collect(Collectors.toList());
            return ResponseEntity.ok(centerResponses);
        }
        
        User currentUser = userService.findUserByEmail(authentication.getName())
                .orElseThrow(() -> new IllegalArgumentException("User not found with email: " + authentication.getName()));
        List<Center> centers = centerService.searchCentersByAddress(searchTerm);
        
        // Filter centers based on user's access
        List<Center> accessibleCenters = centers.stream()
                .filter(center -> accessControlService.canAccessCenter(currentUser, center))
                .collect(Collectors.toList());
        
        List<CenterResponse> centerResponses = accessibleCenters.stream()
                .map(centerMapper::toCenterResponse)
                .collect(Collectors.toList());
        return ResponseEntity.ok(centerResponses);
    }

    /**
     * Create a new center. Only ADMIN, ASSET_MANAGER, and EXECUTIVE_DIRECTOR roles can create centers.
     *
     * @param centerRequest The center data
     * @param authentication The authentication object containing user details
     * @return The created center
     */
    @PostMapping
    public ResponseEntity<CenterResponse> createCenter(
            @Valid @RequestBody CenterRequest centerRequest,
            Authentication authentication) {
        if (authentication == null) {
            // For development: allow center creation without authentication
            Center center = centerMapper.toCenter(centerRequest);
            Center createdCenter = centerService.createCenter(center);
            CenterResponse response = centerMapper.toCenterResponse(createdCenter);
            return ResponseEntity.status(HttpStatus.CREATED).body(response);
        }
        
        User currentUser = userService.findUserByEmail(authentication.getName())
                .orElseThrow(() -> new IllegalArgumentException("User not found with email: " + authentication.getName()));
        
        // Check if user has permission to create centers
        if (currentUser.getRole() != UserRole.ADMIN && 
            currentUser.getRole() != UserRole.ASSET_MANAGER && 
            currentUser.getRole() != UserRole.EXECUTIVE_DIRECTOR) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }
        
        Center center = centerMapper.toCenter(centerRequest);
        Center createdCenter = centerService.createCenter(center);
        CenterResponse response = centerMapper.toCenterResponse(createdCenter);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    /**
     * Update a center. Only ADMIN, ASSET_MANAGER, EXECUTIVE_DIRECTOR, and CENTER_MANAGER (for their assigned center) can update centers.
     *
     * @param id The center ID
     * @param centerRequest The updated center data
     * @param authentication The authentication object containing user details
     * @return The updated center
     */
    @PutMapping("/{id}")
    public ResponseEntity<CenterResponse> updateCenter(
            @PathVariable Long id,
            @Valid @RequestBody CenterRequest centerRequest,
            Authentication authentication) {
        if (authentication == null) {
            // For development: allow center update without authentication
            Center existingCenter = centerService.findCenterById(id)
                    .orElseThrow(() -> new IllegalArgumentException("Center not found with id: " + id));
            Center center = centerMapper.toCenter(centerRequest);
            Center updatedCenter = centerService.updateCenter(id, center);
            CenterResponse response = centerMapper.toCenterResponse(updatedCenter);
            return ResponseEntity.ok(response);
        }
        
        User currentUser = userService.findUserByEmail(authentication.getName())
                .orElseThrow(() -> new IllegalArgumentException("User not found with email: " + authentication.getName()));
        Center existingCenter = centerService.findCenterById(id)
                .orElseThrow(() -> new IllegalArgumentException("Center not found with id: " + id));
        
        // Check if user has permission to update this center
        if (!accessControlService.canAccessCenter(currentUser, existingCenter) || 
            (currentUser.getRole() != UserRole.ADMIN && 
             currentUser.getRole() != UserRole.ASSET_MANAGER && 
             currentUser.getRole() != UserRole.EXECUTIVE_DIRECTOR && 
             currentUser.getRole() != UserRole.CENTER_MANAGER &&
             currentUser.getRole() != UserRole.PEDAGOGICAL_MANAGER)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }
        
        Center center = centerMapper.toCenter(centerRequest);
        Center updatedCenter = centerService.updateCenter(id, center);
        CenterResponse response = centerMapper.toCenterResponse(updatedCenter);
        return ResponseEntity.ok(response);
    }

    /**
     * Delete a center. Only ADMIN, ASSET_MANAGER, and EXECUTIVE_DIRECTOR roles can delete centers.
     *
     * @param id The center ID
     * @param authentication The authentication object containing user details
     * @return No content
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteCenter(
            @PathVariable Long id,
            Authentication authentication) {
        if (authentication == null) {
            // For development: allow center deletion without authentication
            centerService.deleteCenter(id);
            return ResponseEntity.noContent().build();
        }
        
        User currentUser = userService.findUserByEmail(authentication.getName())
                .orElseThrow(() -> new IllegalArgumentException("User not found with email: " + authentication.getName()));
        
        // Check if user has permission to delete centers
        if (currentUser.getRole() != UserRole.ADMIN && 
            currentUser.getRole() != UserRole.ASSET_MANAGER && 
            currentUser.getRole() != UserRole.EXECUTIVE_DIRECTOR) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }
        
        centerService.deleteCenter(id);
        return ResponseEntity.noContent().build();
    }

    /**
     * Count all centers.
     *
     * @return The count of all centers
     */
    @GetMapping("/count")
    @PreAuthorize("hasAnyRole('ADMIN', 'CENTER_MANAGER', 'ASSET_MANAGER', 'PEDAGOGICAL_MANAGER', 'EXECUTIVE_DIRECTOR')")
    public ResponseEntity<Long> countCenters() {
        return ResponseEntity.ok(centerService.countCenters());
    }

    /**
     * Get all rooms in a specific center.
     *
     * @param centerId The ID of the center
     * @param authentication The authentication object containing user details
     * @return List of rooms in the specified center
     */
    @GetMapping("/{centerId}/rooms")
    public ResponseEntity<?> getRoomsByCenter(
            @PathVariable Long centerId,
            Authentication authentication) {
        try {
            logger.info("Getting rooms for center with ID: {}", centerId);
            
            if (authentication == null) {
                // For development: return all rooms for center without authentication
                return ResponseEntity.ok(centerService.findRoomsByCenter(centerId));
            }
            
            User currentUser = userService.findUserByEmail(authentication.getName())
                    .orElseThrow(() -> new IllegalArgumentException("User not found with email: " + authentication.getName()));
            
            // Check if user has access to the center
            Center center = centerService.findCenterById(centerId)
                    .orElseThrow(() -> new IllegalArgumentException("Center not found with id: " + centerId));
            
            if (!accessControlService.canAccessCenter(currentUser, center)) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN).body("You don't have access to this center");
            }
            
            // Get rooms for the center
            return ResponseEntity.ok(centerService.findRoomsByCenter(centerId));
        } catch (Exception e) {
            logger.error("Error getting rooms for center: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body("Error getting rooms: " + e.getMessage());
        }
    }
}