package com.web4jobs.bookingsystem.mapper;

import com.web4jobs.bookingsystem.dto.notification.NotificationRequest;
import com.web4jobs.bookingsystem.dto.notification.NotificationResponse;
import com.web4jobs.bookingsystem.dto.user.UserSummaryResponse;
import com.web4jobs.bookingsystem.model.Notification;
import com.web4jobs.bookingsystem.model.User;
import org.springframework.stereotype.Component;

/**
 * Mapper for converting between Notification entities and DTOs.
 */
@Component
public class NotificationMapper {

    /**
     * Convert a NotificationRequest DTO to a Notification entity.
     *
     * @param request The NotificationRequest DTO
     * @return The Notification entity
     */
    public Notification toNotification(NotificationRequest request) {
        if (request == null) {
            return null;
        }
        
        Notification notification = new Notification();
        // Use message field instead of title (title doesn't exist in Notification)
        notification.setMessage(request.getTitle() + ": " + request.getMessage());
        notification.setType(request.getType());
        // New notifications have null readAt by default (not read)
        
        // Set user if userId is provided
        if (request.getUserId() != null) {
            User user = new User();
            user.setId(request.getUserId());
            notification.setUser(user);
        }
        
        return notification;
    }

    /**
     * Convert a Notification entity to a NotificationResponse DTO.
     *
     * @param notification The Notification entity
     * @return The NotificationResponse DTO
     */
    public NotificationResponse toNotificationResponse(Notification notification) {
        if (notification == null) {
            return null;
        }
        
        NotificationResponse response = new NotificationResponse();
        response.setId(notification.getId());
        // Extract title from message or use message as title
        String message = notification.getMessage();
        String title = message;
        if (message != null && message.contains(":")) {
            String[] parts = message.split(":", 2);
            title = parts[0].trim();
            message = parts.length > 1 ? parts[1].trim() : "";
        }
        response.setTitle(title);
        response.setMessage(message);
        response.setType(notification.getType());
        // A notification is read if readAt is not null
        response.setRead(notification.getReadAt() != null);
        response.setCreatedAt(notification.getCreatedAt());
        // Use createdAt as updatedAt since there's no updatedAt field
        response.setUpdatedAt(notification.getCreatedAt());
        
        // Set user information if available
        if (notification.getUser() != null) {
            User user = notification.getUser();
            UserSummaryResponse userSummary = new UserSummaryResponse();
            userSummary.setId(user.getId());
            userSummary.setFirstName(user.getFirstName());
            userSummary.setLastName(user.getLastName());
            userSummary.setEmail(user.getEmail());
            userSummary.setRole(user.getRole());
            response.setUser(userSummary);
        }
        
        return response;
    }
}