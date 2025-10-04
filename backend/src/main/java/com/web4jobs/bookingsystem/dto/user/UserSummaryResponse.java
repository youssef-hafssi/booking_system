package com.web4jobs.bookingsystem.dto.user;

import com.web4jobs.bookingsystem.model.UserRole;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * DTO for sending simplified user information to clients.
 * Used when user data is included in other responses.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class UserSummaryResponse {

    private Long id;
    private String firstName;
    private String lastName;
    private String email;
    private UserRole role;
}