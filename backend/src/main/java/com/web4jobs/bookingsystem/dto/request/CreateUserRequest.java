package com.web4jobs.bookingsystem.dto.request;

import com.web4jobs.bookingsystem.model.UserRole;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * DTO for creating a new user.
 * Contains all required fields for user creation with appropriate validation.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CreateUserRequest {

    @NotBlank(message = "Email is required")
    @Email(message = "Invalid email format")
    private String email;

    @NotBlank(message = "Password is required")
    private String password;

    @NotBlank(message = "First name is required")
    private String firstName;

    @NotBlank(message = "Last name is required")
    private String lastName;

    @NotNull(message = "Role is required")
    private UserRole role;

    private String phoneNumber;
    
    // Optional field to indicate the user has access to all centers (for certain manager roles)
    private Boolean allCenters;
    
    // Center ID for assignment
    private Long centerId;
}