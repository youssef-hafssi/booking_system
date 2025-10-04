package com.web4jobs.bookingsystem.controller;

import com.web4jobs.bookingsystem.dto.common.PagedResponse;
import com.web4jobs.bookingsystem.dto.mapper.UserMapper;
import com.web4jobs.bookingsystem.dto.request.CreateUserRequest;
import com.web4jobs.bookingsystem.dto.request.UpdateUserRequest;
import com.web4jobs.bookingsystem.dto.request.UserRequest;
import com.web4jobs.bookingsystem.dto.response.UserResponse;
import com.web4jobs.bookingsystem.model.User;
import com.web4jobs.bookingsystem.security.JwtUtils;
import com.web4jobs.bookingsystem.service.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.security.access.prepost.PreAuthorize;

import java.util.List;
import java.util.stream.Collectors;

/**
 * Controller for managing users.
 */
@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {

    private static final Logger logger = LoggerFactory.getLogger(UserController.class);

    private final UserService userService;
    private final UserMapper userMapper;
    private final JwtUtils jwtUtils;

    /**
     * Get all users with pagination support.
     *
     * @param page Page number (0-based)
     * @param size Page size
     * @return Paginated list of users
     */
    @GetMapping
    public ResponseEntity<PagedResponse<UserResponse>> getAllUsers(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        
        logger.debug("Getting all users with pagination, page={}, size={}", page, size);
        
        try {
        Page<User> userPage = userService.findAllUsers(PageRequest.of(page, size));
        
        List<UserResponse> responses = userPage.getContent().stream()
                .map(userMapper::toResponse)
                .collect(Collectors.toList());
        
        PagedResponse<UserResponse> pagedResponse = PagedResponse.<UserResponse>builder()
                .content(responses)
                .page(page)
                .size(size)
                .totalElements(userPage.getTotalElements())
                .totalPages(userPage.getTotalPages())
                .last(userPage.isLast())
                .build();
        
            logger.debug("Retrieved {} users out of {}", responses.size(), userPage.getTotalElements());
        return ResponseEntity.ok(pagedResponse);
        } catch (Exception e) {
            logger.error("Error getting all users: ", e);
            throw e;
        }
    }

    /**
     * Get a user by ID.
     *
     * @param id The user ID
     * @return The user with the given ID
     */
    @GetMapping("/{id}")
    public ResponseEntity<UserResponse> getUserById(@PathVariable Long id) {
        logger.debug("Getting user with id: {}", id);
        
        try {
        User user = userService.findUserById(id)
                .orElseThrow(() -> new IllegalArgumentException("User not found with id: " + id));
        UserResponse response = userMapper.toResponse(user);
            logger.debug("Retrieved user: {}", response);
        return ResponseEntity.ok(response);
        } catch (Exception e) {
            logger.error("Error getting user with id {}: ", id, e);
            throw e;
        }
    }

    /**
     * Create a new user.
     *
     * @param createUserRequest The user data for creation
     * @return The created user
     */
    @PostMapping
    public ResponseEntity<UserResponse> createUser(
            @Valid @RequestBody CreateUserRequest createUserRequest) {
        
        logger.info("Creating new user with email: {}, role: {}", 
                createUserRequest.getEmail(), createUserRequest.getRole());
        
        try {
            logger.debug("User request details: {}", createUserRequest);
        User user = userMapper.toEntity(createUserRequest);
            logger.debug("Mapped entity: {}", user);
        User savedUser = userService.createUser(user);
            logger.debug("Saved user: {}", savedUser);
        UserResponse response = userMapper.toResponse(savedUser);
            logger.info("Successfully created user with email: {}", createUserRequest.getEmail());
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
        } catch (Exception e) {
            logger.error("Error creating user: ", e);
            throw e;
        }
    }

    /**
     * Update a user.
     *
     * @param id The user ID
     * @param updateUserRequest The updated user data
     * @return The updated user
     */
    @PutMapping("/{id}")
    public ResponseEntity<UserResponse> updateUser(
            @PathVariable Long id,
            @Valid @RequestBody UpdateUserRequest updateUserRequest) {
        
        logger.info("Updating user with id: {}", id);
        
        try {
            logger.debug("Update request details: {}", updateUserRequest);
        User existingUser = userService.findUserById(id)
                .orElseThrow(() -> new IllegalArgumentException("User not found with id: " + id));
        User updatedUser = userMapper.updateEntityFromRequest(existingUser, updateUserRequest);
            logger.debug("Updated entity: {}", updatedUser);
        User savedUser = userService.updateUser(id, updatedUser);
        UserResponse response = userMapper.toResponse(savedUser);
            logger.info("Successfully updated user with id: {}", id);
        return ResponseEntity.ok(response);
        } catch (Exception e) {
            logger.error("Error updating user with id {}: ", id, e);
            throw e;
        }
    }

    /**
     * Delete a user.
     *
     * @param id The user ID
     * @return No content
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteUser(@PathVariable Long id) {
        logger.info("Deleting user with id: {}", id);
        
        try {
        userService.deleteUser(id);
            logger.info("Successfully deleted user with id: {}", id);
        return ResponseEntity.noContent().build();
        } catch (Exception e) {
            logger.error("Error deleting user with id {}: ", id, e);
            throw e;
        }
    }

    /**
     * Get a user by email.
     *
     * @param email The user's email
     * @return The user with the given email
     */
    @GetMapping("/email/{email}")
    public ResponseEntity<UserResponse> getUserByEmail(@PathVariable String email) {
        logger.debug("Getting user with email: {}", email);
        
        try {
        User user = userService.findUserByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("User not found with email: " + email));
        UserResponse response = userMapper.toResponse(user);
            logger.debug("Retrieved user: {}", response);
        return ResponseEntity.ok(response);
        } catch (Exception e) {
            logger.error("Error getting user with email {}: ", email, e);
            throw e;
        }
    }

    /**
     * Count all users.
     *
     * @return The count of all users
     */
    @GetMapping("/count")
    @PreAuthorize("hasAnyRole('ADMIN', 'CENTER_MANAGER', 'ASSET_MANAGER', 'PEDAGOGICAL_MANAGER', 'EXECUTIVE_DIRECTOR')")
    public ResponseEntity<Integer> countUsers() {
        logger.info("Counting all users");
        int count = (int) userService.countUsers();
        return ResponseEntity.ok(count);
    }
    
    /**
     * Get the currently authenticated user.
     *
     * @param authorization The Authorization header containing the JWT token
     * @return The current user
     */
    @GetMapping("/current")
    public ResponseEntity<UserResponse> getCurrentUser(
            @org.springframework.security.core.annotation.AuthenticationPrincipal org.springframework.security.core.userdetails.UserDetails userDetails,
            org.springframework.security.core.Authentication authentication,
            @RequestHeader(value = "Authorization", required = false) String authorization) {
        
        // Determine the username from various sources
        final String username = determineUsername(userDetails, authentication, authorization);
        
        // If we still don't have a username, return unauthorized
        if (username == null) {
            logger.error("No authentication information available");
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        
        logger.info("Getting current user with username: {}", username);
        
        try {
            User user = userService.findUserByEmail(username)
                    .orElseThrow(() -> new IllegalArgumentException("User not found with email: " + username));
            
            UserResponse response = userMapper.toResponse(user);
            logger.debug("Retrieved current user: {}", response);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            logger.error("Error getting current user: ", e);
            throw e;
        }
    }
    
    /**
     * Helper method to determine the username from various authentication sources.
     * 
     * @param userDetails Spring Security UserDetails
     * @param authentication Spring Security Authentication
     * @param authorization Authorization header
     * @return Username or null if not found
     */
    private String determineUsername(
            org.springframework.security.core.userdetails.UserDetails userDetails,
            org.springframework.security.core.Authentication authentication,
            String authorization) {
            
        // Try to get username from UserDetails
        if (userDetails != null) {
            String username = userDetails.getUsername();
            logger.debug("Found username from UserDetails: {}", username);
            return username;
        } 
        // Try to get username from Authentication object
        else if (authentication != null) {
            String username = authentication.getName();
            logger.debug("Found username from Authentication: {}", username);
            return username;
        } 
        // Try to extract from JWT token directly
        else if (authorization != null && authorization.startsWith("Bearer ")) {
            try {
                String token = authorization.substring(7);
                String username = jwtUtils.extractEmail(token);
                logger.debug("Found username from JWT token: {}", username);
                return username;
            } catch (Exception e) {
                logger.error("Error extracting username from JWT token", e);
            }
        }
        
        return null;
    }

    /**
     * Get count of users by center.
     *
     * @param centerId The ID of the center
     * @return Count of users in the center
     */
    @GetMapping("/center/{centerId}/count")
    @PreAuthorize("hasAnyRole('ADMIN', 'CENTER_MANAGER')")
    public ResponseEntity<Integer> countUsersByCenter(@PathVariable Long centerId) {
        logger.debug("Getting user count for center: {}", centerId);
        
        try {
            int count = userService.countUsersByCenter(centerId);
            logger.debug("Found {} users in center {}", count, centerId);
            return ResponseEntity.ok(count);
        } catch (Exception e) {
            logger.error("Error getting user count for center {}: ", centerId, e);
            throw e;
        }
    }

    /**
     * Get users by center with pagination support.
     *
     * @param centerId The ID of the center
     * @param page Page number (0-based)
     * @param size Page size
     * @return Paginated list of users in the center
     */
    @GetMapping("/center/{centerId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'CENTER_MANAGER')")
    public ResponseEntity<PagedResponse<UserResponse>> getUsersByCenter(
            @PathVariable Long centerId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        
        logger.debug("Getting users for center: {}, page={}, size={}", centerId, page, size);
        
        try {
            Page<User> userPage = userService.findUsersByCenter(centerId, PageRequest.of(page, size));
            
            List<UserResponse> responses = userPage.getContent().stream()
                    .map(userMapper::toResponse)
                    .collect(Collectors.toList());
            
            PagedResponse<UserResponse> pagedResponse = PagedResponse.<UserResponse>builder()
                    .content(responses)
                    .page(page)
                    .size(size)
                    .totalElements(userPage.getTotalElements())
                    .totalPages(userPage.getTotalPages())
                    .last(userPage.isLast())
                    .build();
            
            logger.debug("Retrieved {} users out of {} for center {}", 
                    responses.size(), userPage.getTotalElements(), centerId);
            return ResponseEntity.ok(pagedResponse);
        } catch (Exception e) {
            logger.error("Error getting users for center {}: ", centerId, e);
            throw e;
        }
    }
}