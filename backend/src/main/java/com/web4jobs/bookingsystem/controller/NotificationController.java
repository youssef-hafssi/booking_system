package com.web4jobs.bookingsystem.controller;

import com.web4jobs.bookingsystem.dto.notification.NotificationRequest;
import com.web4jobs.bookingsystem.dto.notification.NotificationResponse;
import com.web4jobs.bookingsystem.mapper.NotificationMapper;
import com.web4jobs.bookingsystem.model.Notification;
import com.web4jobs.bookingsystem.model.User;
import com.web4jobs.bookingsystem.service.NotificationService;
import com.web4jobs.bookingsystem.service.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;

import java.util.List;
import java.util.stream.Collectors;

/**
 * REST controller for managing notifications.
 * Provides endpoints for creating, retrieving, and managing user notifications.
 */
@RestController
@RequestMapping("/api/notifications")
@RequiredArgsConstructor
public class NotificationController {

    private final NotificationService notificationService;
    private final NotificationMapper notificationMapper;
    private final UserService userService;

    /**
     * Get all notifications.
     *
     * @return List of all notifications
     */
    @GetMapping
    public ResponseEntity<List<NotificationResponse>> getAllNotifications() {
        List<Notification> notifications = notificationService.findAllNotifications();
        List<NotificationResponse> responses = notifications.stream()
                .map(notificationMapper::toNotificationResponse)
                .collect(Collectors.toList());
        return ResponseEntity.ok(responses);
    }

    /**
     * Get notifications for a specific user.
     *
     * @param userId The user ID
     * @return List of notifications for the user
     */
    @GetMapping("/user/{userId}")
    public ResponseEntity<List<NotificationResponse>> getNotificationsByUser(@PathVariable Long userId) {
        // First get the user by ID using UserService
        User user = userService.findUserById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found with id: " + userId));
        
        List<Notification> notifications = notificationService.findNotificationsByUser(user);
        List<NotificationResponse> responses = notifications.stream()
                .map(notificationMapper::toNotificationResponse)
                .collect(Collectors.toList());
        return ResponseEntity.ok(responses);
    }

    /**
     * Get unread notifications for a specific user.
     *
     * @param userId The user ID
     * @return List of unread notifications for the user
     */
    @GetMapping("/user/{userId}/unread")
    public ResponseEntity<List<NotificationResponse>> getUnreadNotificationsByUser(@PathVariable Long userId) {
        // First get the user by ID using UserService
        User user = userService.findUserById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found with id: " + userId));
        
        List<Notification> notifications = notificationService.findUnreadNotificationsForUser(user);
        List<NotificationResponse> responses = notifications.stream()
                .map(notificationMapper::toNotificationResponse)
                .collect(Collectors.toList());
        return ResponseEntity.ok(responses);
    }

    /**
     * Create a new notification.
     *
     * @param notificationRequest The notification data
     * @return The created notification
     */
    @PostMapping
    public ResponseEntity<NotificationResponse> createNotification(@Valid @RequestBody NotificationRequest notificationRequest) {
        Notification notification = notificationMapper.toNotification(notificationRequest);
        Notification createdNotification = notificationService.createNotification(notification);
        NotificationResponse response = notificationMapper.toNotificationResponse(createdNotification);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    /**
     * Mark a notification as read.
     *
     * @param id The notification ID
     * @return The updated notification
     */
    @PatchMapping("/{id}/read")
    public ResponseEntity<NotificationResponse> markNotificationAsRead(@PathVariable Long id) {
        // First get the notification by ID
        Notification notification = notificationService.findNotificationById(id)
                .orElseThrow(() -> new IllegalArgumentException("Notification not found with id: " + id));
        
        // Update the notification to mark it as read
        notification.markAsRead();
        
        // Save the updated notification
        Notification updatedNotification = notificationService.createNotification(notification); // Using createNotification to save
        
        NotificationResponse response = notificationMapper.toNotificationResponse(updatedNotification);
        return ResponseEntity.ok(response);
    }

    /**
     * Mark all notifications for a user as read.
     *
     * @param userId The user ID
     * @return No content
     */
    @PatchMapping("/user/{userId}/read-all")
    public ResponseEntity<Void> markAllNotificationsAsRead(@PathVariable Long userId) {
        // First get the user by ID using UserService
        User user = userService.findUserById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found with id: " + userId));
        
        // Get all unread notifications for the user
        List<Notification> unreadNotifications = notificationService.findUnreadNotificationsForUser(user);
        
        // Mark each notification as read and save
        for (Notification notification : unreadNotifications) {
            notification.markAsRead();
            notificationService.createNotification(notification); // Using createNotification to save
        }
        
        return ResponseEntity.noContent().build();
    }

    /**
     * Delete a notification.
     *
     * @param id The notification ID
     * @return No content
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteNotification(@PathVariable Long id) {
        notificationService.deleteNotification(id);
        return ResponseEntity.noContent().build();
    }
}