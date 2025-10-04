package com.web4jobs.bookingsystem.dto.mapper;

import com.web4jobs.bookingsystem.dto.request.CreateUserRequest;
import com.web4jobs.bookingsystem.dto.request.UpdateUserRequest;
import com.web4jobs.bookingsystem.dto.request.UserRequest;
import com.web4jobs.bookingsystem.dto.response.UserResponse;
import com.web4jobs.bookingsystem.model.Center;
import com.web4jobs.bookingsystem.model.User;
import com.web4jobs.bookingsystem.model.UserStatus;
import com.web4jobs.bookingsystem.service.CenterService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

/**
 * Mapper class for converting between User entity and DTOs.
 */
@Component
public class UserMapper {

    private static final Logger logger = LoggerFactory.getLogger(UserMapper.class);

    private final CenterService centerService;

    @Autowired
    public UserMapper(CenterService centerService) {
        this.centerService = centerService;
    }

    /**
     * Convert a User entity to a UserResponse DTO.
     *
     * @param user The User entity to convert
     * @return The UserResponse DTO
     */
    public UserResponse toResponse(User user) {
        if (user == null) {
            return null;
        }
        
        UserResponse response = UserResponse.builder()
            .id(user.getId())
            .email(user.getEmail())
            .firstName(user.getFirstName())
            .lastName(user.getLastName())
            .role(user.getRole())
            .phoneNumber(user.getPhoneNumber())
            .createdAt(user.getCreatedAt())
            .updatedAt(user.getUpdatedAt())
            .lastLogin(user.getLastLogin())
            .enabled(user.getEnabled())
            .userStatus(user.getUserStatus())
            .strikeCount(user.getStrikeCount())
            .totalNoShows(user.getTotalNoShows())
            .lastStrikeDate(user.getLastStrikeDate())
            .build();
            
        if (user.getAssignedCenter() != null) {
            response.setCenterId(user.getAssignedCenter().getId());
            response.setCenterName(user.getAssignedCenter().getName());
        }
        
        return response;
    }

    /**
     * Convert a UserRequest DTO to a User entity.
     * Note: This does not set the ID, createdAt, updatedAt, or lastLogin fields.
     *
     * @param request The UserRequest DTO to convert
     * @return The User entity
     */
    public User toEntity(UserRequest request) {
        if (request == null) {
            return null;
        }
        
        User user = new User();
        user.setEmail(request.getEmail());
        user.setPassword(request.getPassword()); // Note: This will be encoded by the service
        user.setFirstName(request.getFirstName());
        user.setLastName(request.getLastName());
        user.setRole(request.getRole());
        user.setPhoneNumber(request.getPhoneNumber());
        user.setEnabled(true);
        
        // Set center if provided
        if (request.getCenterId() != null) {
            centerService.findCenterById(request.getCenterId())
                .ifPresent(user::setAssignedCenter);
        }
        
        return user;
    }
    
    /**
     * Convert a CreateUserRequest DTO to a User entity.
     * Note: This does not set the ID, createdAt, updatedAt, or lastLogin fields.
     *
     * @param request The CreateUserRequest DTO to convert
     * @return The User entity
     */
    public User toEntity(CreateUserRequest request) {
        if (request == null) {
            return null;
        }
        
        logger.debug("Converting CreateUserRequest to User entity. Role: {}", request.getRole());
        
        User user = new User();
        user.setEmail(request.getEmail());
        user.setPassword(request.getPassword()); // Note: This will be encoded by the service
        user.setFirstName(request.getFirstName());
        user.setLastName(request.getLastName());
        user.setRole(request.getRole());
        user.setPhoneNumber(request.getPhoneNumber());
        user.setEnabled(true);
        
        // Explicitly set penalty-related fields with default values
        user.setUserStatus(UserStatus.GOOD);
        user.setStrikeCount(0);
        user.setTotalNoShows(0);
        
        // For manager roles that have the allCenters flag set to true,
        // we don't assign a specific center as they have access to all centers
        if (request.getCenterId() != null && 
            (request.getAllCenters() == null || !request.getAllCenters())) {
            
            logger.debug("Assigning center ID: {}", request.getCenterId());
            centerService.findCenterById(request.getCenterId())
                .ifPresent(user::setAssignedCenter);
        } else {
            logger.debug("No center assigned or all centers flag is set: {}", request.getAllCenters());
        }
        
        logger.debug("Converted entity role: {}", user.getRole());
        
        return user;
    }

    /**
     * Update a User entity with data from a UserRequest DTO.
     * Note: This does not update the password field, as that requires special handling.
     *
     * @param user The User entity to update
     * @param request The UserRequest DTO with the new data
     * @return The updated User entity
     */
    public User updateEntityFromRequest(User user, UserRequest request) {
        if (user == null || request == null) {
            return user;
        }
        
        user.setEmail(request.getEmail());
        user.setFirstName(request.getFirstName());
        user.setLastName(request.getLastName());
        user.setRole(request.getRole());
        user.setPhoneNumber(request.getPhoneNumber());
        
        // Update center if provided
        if (request.getCenterId() != null) {
            centerService.findCenterById(request.getCenterId())
                .ifPresent(user::setAssignedCenter);
        }
        
        // Password is handled separately in the service
        
        return user;
    }
    
    /**
     * Update a User entity with data from an UpdateUserRequest DTO.
     * Only updates fields that are not null in the request.
     *
     * @param user The User entity to update
     * @param request The UpdateUserRequest DTO with the new data
     * @return The updated User entity
     */
    public User updateEntityFromRequest(User user, UpdateUserRequest request) {
        if (user == null || request == null) {
            return user;
        }
        
        if (request.getEmail() != null) {
            user.setEmail(request.getEmail());
        }
        
        if (request.getFirstName() != null) {
            user.setFirstName(request.getFirstName());
        }
        
        if (request.getLastName() != null) {
            user.setLastName(request.getLastName());
        }
        
        if (request.getRole() != null) {
            user.setRole(request.getRole());
        }
        
        if (request.getPhoneNumber() != null) {
            user.setPhoneNumber(request.getPhoneNumber());
        }
        
        if (request.getEnabled() != null) {
            user.setEnabled(request.getEnabled());
        }
        
        // For manager roles that can access all centers
        if (request.getCenterId() != null && 
            (request.getAllCenters() == null || !request.getAllCenters())) {
            // Only update center assignment if not set to "All Centers"
            logger.debug("Updating center assignment: {}", request.getCenterId());
            centerService.findCenterById(request.getCenterId())
                .ifPresent(user::setAssignedCenter);
        } else if (request.getAllCenters() != null && request.getAllCenters()) {
            // If allCenters is true, remove any center assignment
            logger.debug("Setting all centers access, removing specific center assignment");
            user.setAssignedCenter(null);
        }
        
        // Password is handled separately in the service
        
        return user;
    }
}