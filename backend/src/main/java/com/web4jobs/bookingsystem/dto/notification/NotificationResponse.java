package com.web4jobs.bookingsystem.dto.notification;

import com.web4jobs.bookingsystem.dto.user.UserSummaryResponse;
import com.web4jobs.bookingsystem.model.NotificationType;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * Data Transfer Object for notification responses.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class NotificationResponse {

    private Long id;
    private String title;
    private String message;
    private NotificationType type;
    private boolean read;
    private UserSummaryResponse user;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}