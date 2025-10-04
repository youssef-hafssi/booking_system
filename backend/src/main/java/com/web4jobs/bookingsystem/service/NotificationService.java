package com.web4jobs.bookingsystem.service;

import com.web4jobs.bookingsystem.model.*;
import com.web4jobs.bookingsystem.repository.NotificationRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

/**
 * Service for managing Notification entities.
 * Provides business logic for notification management operations.
 */
@Service
public class NotificationService {

    private final NotificationRepository notificationRepository;

    @Autowired
    public NotificationService(NotificationRepository notificationRepository) {
        this.notificationRepository = notificationRepository;
    }

    /**
     * Find all notifications in the system.
     *
     * @return A list of all notifications
     */
    public List<Notification> findAllNotifications() {
        return notificationRepository.findAll();
    }

    /**
     * Find a notification by its ID.
     *
     * @param id The ID of the notification to find
     * @return An Optional containing the notification if found, or empty if not found
     */
    public Optional<Notification> findNotificationById(Long id) {
        return notificationRepository.findById(id);
    }

    /**
     * Find all notifications for a specific user.
     *
     * @param user The user to filter by
     * @return A list of notifications for the specified user
     */
    public List<Notification> findNotificationsByUser(User user) {
        return notificationRepository.findByUser(user);
    }

    /**
     * Find all notifications for a specific reservation.
     *
     * @param reservation The reservation to filter by
     * @return A list of notifications for the specified reservation
     */
    public List<Notification> findNotificationsByReservation(Reservation reservation) {
        return notificationRepository.findByReservation(reservation);
    }

    /**
     * Find all notifications with a specific status.
     *
     * @param status The status to filter by
     * @return A list of notifications with the specified status
     */
    public List<Notification> findNotificationsByStatus(NotificationStatus status) {
        return notificationRepository.findByStatus(status);
    }

    /**
     * Find all notifications with a specific type.
     *
     * @param type The type to filter by
     * @return A list of notifications with the specified type
     */
    public List<Notification> findNotificationsByType(NotificationType type) {
        return notificationRepository.findByType(type);
    }

    /**
     * Find all unread notifications for a specific user.
     *
     * @param user The user to filter by
     * @return A list of unread notifications for the specified user
     */
    public List<Notification> findUnreadNotificationsForUser(User user) {
        return notificationRepository.findUnreadNotificationsForUser(user);
    }

    /**
     * Create a new notification.
     *
     * @param notification The notification to create
     * @return The created notification with ID assigned
     */
    @Transactional
    public Notification createNotification(Notification notification) {
        // Set creation timestamp
        notification.setCreatedAt(LocalDateTime.now());
        
        // Set default status if not provided
        if (notification.getStatus() == null) {
            notification.setStatus(NotificationStatus.PENDING);
        }
        
        return notificationRepository.save(notification);
    }

    /**
     * Send a notification for a reservation.
     * This method creates a new notification and sets its status to SENT.
     *
     * @param reservation The reservation the notification is for
     * @param type The type of notification
     * @param message The message to send
     * @return The created notification
     */
    @Transactional
    public Notification sendReservationNotification(Reservation reservation, NotificationType type, String message) {
        Notification notification = new Notification();
        notification.setUser(reservation.getUser());
        notification.setReservation(reservation);
        notification.setType(type);
        notification.setMessage(message);
        notification.setChannel(NotificationChannel.IN_APP); // Default to in-app notification
        
        // Create the notification
        Notification createdNotification = createNotification(notification);
        
        // Mark as sent
        markNotificationAsSent(createdNotification.getId());
        
        return createdNotification;
    }

    /**
     * Mark a notification as sent.
     *
     * @param id The ID of the notification
     * @return The updated notification
     * @throws IllegalArgumentException if the notification does not exist
     */
    @Transactional
    public Notification markNotificationAsSent(Long id) {
        Notification notification = notificationRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Notification not found with id: " + id));
        
        notification.markAsSent();
        return notificationRepository.save(notification);
    }

    /**
     * Mark a notification as read.
     *
     * @param id The ID of the notification
     * @return The updated notification
     * @throws IllegalArgumentException if the notification does not exist
     */
    @Transactional
    public Notification markNotificationAsRead(Long id) {
        Notification notification = notificationRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Notification not found with id: " + id));
        
        notification.markAsRead();
        return notificationRepository.save(notification);
    }

    /**
     * Mark a notification as failed.
     *
     * @param id The ID of the notification
     * @return The updated notification
     * @throws IllegalArgumentException if the notification does not exist
     */
    @Transactional
    public Notification markNotificationAsFailed(Long id) {
        Notification notification = notificationRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Notification not found with id: " + id));
        
        notification.markAsFailed();
        return notificationRepository.save(notification);
    }

    /**
     * Send all pending notifications.
     * This method finds all pending notifications and marks them as sent.
     * In a real application, this would actually send the notifications via the appropriate channel.
     *
     * @return The number of notifications sent
     */
    @Transactional
    public int sendPendingNotifications() {
        List<Notification> pendingNotifications = notificationRepository.findByStatusOrderByCreatedAtAsc(NotificationStatus.PENDING);
        
        int count = 0;
        for (Notification notification : pendingNotifications) {
            try {
                // In a real application, this would send the notification via the appropriate channel
                // For now, we just mark it as sent
                notification.markAsSent();
                notificationRepository.save(notification);
                count++;
            } catch (Exception e) {
                // If sending fails, mark the notification as failed
                notification.markAsFailed();
                notificationRepository.save(notification);
            }
        }
        
        return count;
    }

    /**
     * Delete a notification by its ID.
     *
     * @param id The ID of the notification to delete
     * @throws IllegalArgumentException if the notification does not exist
     */
    @Transactional
    public void deleteNotification(Long id) {
        if (!notificationRepository.existsById(id)) {
            throw new IllegalArgumentException("Notification not found with id: " + id);
        }
        notificationRepository.deleteById(id);
    }

    /**
     * Send a reminder notification for all upcoming reservations.
     * This method finds all confirmed reservations that start within the next 24 hours
     * and sends a reminder notification for each one.
     *
     * @return The number of reminders sent
     */
    @Transactional
    public int sendUpcomingReservationReminders() {
        LocalDateTime now = LocalDateTime.now();
        LocalDateTime tomorrow = now.plusDays(1);
        
        // Find all confirmed reservations that start within the next 24 hours
        List<Reservation> upcomingReservations = notificationRepository.findAll().stream()
                .filter(n -> n.getReservation() != null)
                .map(Notification::getReservation)
                .filter(r -> r.getStatus() == ReservationStatus.CONFIRMED)
                .filter(r -> r.getStartTime().isAfter(now) && r.getStartTime().isBefore(tomorrow))
                .toList();
        
        int count = 0;
        for (Reservation reservation : upcomingReservations) {
            try {
                sendReservationNotification(
                        reservation,
                        NotificationType.REMINDER,
                        "Reminder: You have a reservation for " + reservation.getWorkStation().getName() +
                        " starting at " + reservation.getStartTime() + ".");
                count++;
            } catch (Exception e) {
                // If sending fails, log the error
                System.err.println("Failed to send reminder for reservation " + reservation.getId() + ": " + e.getMessage());
            }
        }
        
        return count;
    }
}