package com.web4jobs.bookingsystem.dto.response;

import com.web4jobs.bookingsystem.model.UserRole;
import com.web4jobs.bookingsystem.model.UserStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * DTO for User responses.
 * Contains user data to be sent to clients, without sensitive information such as password.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserResponse {

    private Long id;
    private String email;
    private String firstName;
    private String lastName;
    private UserRole role;
    private String phoneNumber;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private LocalDateTime lastLogin;
    private Boolean enabled;
    private Long centerId;
    private String centerName;
    private UserStatus userStatus;
    private Integer strikeCount;
    private Integer totalNoShows;
    private LocalDateTime lastStrikeDate;
}