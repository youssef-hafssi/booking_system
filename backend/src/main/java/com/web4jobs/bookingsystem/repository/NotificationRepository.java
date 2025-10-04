package com.web4jobs.bookingsystem.repository;

import com.web4jobs.bookingsystem.model.Notification;
import com.web4jobs.bookingsystem.model.NotificationChannel;
import com.web4jobs.bookingsystem.model.NotificationStatus;
import com.web4jobs.bookingsystem.model.NotificationType;
import com.web4jobs.bookingsystem.model.Reservation;
import com.web4jobs.bookingsystem.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

/**
 * Repository for managing Notification entities.
 * Provides methods for CRUD operations and custom queries related to notifications.
 */
@Repository
public interface NotificationRepository extends JpaRepository<Notification, Long> {
    
    /**
     * Find all notifications for a specific user.
     * 
     * @param user The user to filter by
     * @return A list of notifications for the specified user
     */
    List<Notification> findByUser(User user);
    
    /**
     * Find all notifications for a specific reservation.
     * 
     * @param reservation The reservation to filter by
     * @return A list of notifications for the specified reservation
     */
    List<Notification> findByReservation(Reservation reservation);
    
    /**
     * Find all notifications with a specific status.
     * 
     * @param status The status to filter by
     * @return A list of notifications with the specified status
     */
    List<Notification> findByStatus(NotificationStatus status);
    
    /**
     * Find all notifications with a specific type.
     * 
     * @param type The type to filter by
     * @return A list of notifications with the specified type
     */
    List<Notification> findByType(NotificationType type);
    
    /**
     * Find all notifications for a specific user with a specific status.
     * 
     * @param user The user to filter by
     * @param status The status to filter by
     * @return A list of notifications for the specified user with the specified status
     */
    List<Notification> findByUserAndStatus(User user, NotificationStatus status);
    
    /**
     * Find all notifications for a specific user with a specific type.
     * 
     * @param user The user to filter by
     * @param type The type to filter by
     * @return A list of notifications for the specified user with the specified type
     */
    List<Notification> findByUserAndType(User user, NotificationType type);
    
    /**
     * Find all notifications for a specific user that have not been read yet.
     * 
     * @param user The user to filter by
     * @return A list of unread notifications for the specified user
     */
    @Query("SELECT n FROM Notification n WHERE n.user = :user AND n.readAt IS NULL ORDER BY n.sentAt DESC")
    List<Notification> findUnreadNotificationsForUser(@Param("user") User user);
    
    /**
     * Find all notifications for a specific user sent after a specific date/time.
     * 
     * @param user The user to filter by
     * @param sentAfter The date/time to filter by
     * @return A list of notifications for the specified user sent after the specified date/time
     */
    List<Notification> findByUserAndSentAtGreaterThanEqual(User user, LocalDateTime sentAfter);
    
    /**
     * Find all notifications for a specific channel.
     * 
     * @param channel The channel to filter by
     * @return A list of notifications for the specified channel
     */
    List<Notification> findByChannel(NotificationChannel channel);
    
    /**
     * Find all notifications that need to be sent (status = PENDING).
     * 
     * @return A list of notifications that need to be sent
     */
    List<Notification> findByStatusOrderByCreatedAtAsc(NotificationStatus status);
    
    /**
     * Find all failed notifications for a specific user.
     * 
     * @param user The user to filter by
     * @return A list of failed notifications for the specified user
     */
    List<Notification> findByUserAndStatusOrderBySentAtDesc(User user, NotificationStatus status);
}