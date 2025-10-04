package com.web4jobs.bookingsystem.dto.request;

import com.web4jobs.bookingsystem.model.UserRole;
import jakarta.validation.constraints.Email;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * DTO for updating an existing user.
 * All fields are optional since updates may be partial.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UpdateUserRequest {

    @Email(message = "Invalid email format")
    private String email;

    private String password;
    private String firstName;
    private String lastName;
    private UserRole role;
    private String phoneNumber;
    private Boolean enabled;
    
    // Optional field to indicate the user has access to all centers (for certain manager roles)
    private Boolean allCenters;
    
    // Center ID for assignment
    private Long centerId;
}