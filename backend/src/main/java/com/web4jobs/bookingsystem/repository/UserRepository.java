package com.web4jobs.bookingsystem.repository;

import com.web4jobs.bookingsystem.model.Center;
import com.web4jobs.bookingsystem.model.User;
import com.web4jobs.bookingsystem.model.UserRole;
import com.web4jobs.bookingsystem.model.UserStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/**
 * Repository for managing User entities.
 * Provides methods for CRUD operations and custom queries related to users.
 */
@Repository
public interface UserRepository extends JpaRepository<User, Long> {
    
    /**
     * Find a user by their email address.
     * 
     * @param email The email address to search for
     * @return An Optional containing the user if found, or empty if not found
     */
    Optional<User> findByEmail(String email);
    
    /**
     * Find all users with a specific role.
     * 
     * @param role The role to filter by
     * @return A list of users with the specified role
     */
    List<User> findByRole(UserRole role);
    
    /**
     * Check if a user with the given email exists.
     * 
     * @param email The email to check
     * @return true if a user with the email exists, false otherwise
     */
    boolean existsByEmail(String email);
    
    /**
     * Find users by first name or last name containing the search term (case insensitive).
     * 
     * @param searchTerm The search term to look for in first or last names
     * @return A list of matching users
     */
    List<User> findByFirstNameContainingIgnoreCaseOrLastNameContainingIgnoreCase(String searchTerm, String searchTerm2);

    /**
     * Find users by assigned center with pagination.
     * 
     * @param centerId The ID of the center
     * @param pageable The pagination information
     * @return A page of users in the center
     */
    Page<User> findByAssignedCenterId(Long centerId, Pageable pageable);

    /**
     * Count users in a center.
     * 
     * @param centerId The ID of the center
     * @return The number of users in the center
     */
    int countByAssignedCenterId(Long centerId);

    /**
     * Find users by assigned center and role with pagination.
     * 
     * @param centerId The ID of the center
     * @param role The role to filter by
     * @param pageable The pagination information
     * @return A page of users in the center with the specified role
     */
    Page<User> findByAssignedCenterIdAndRole(Long centerId, UserRole role, Pageable pageable);

    /**
     * Count users in a center with a specific role.
     * 
     * @param centerId The ID of the center
     * @param role The role to filter by
     * @return The number of users in the center with the specified role
     */
    int countByAssignedCenterIdAndRole(Long centerId, UserRole role);

    /**
     * Find users by their status.
     * 
     * @param userStatus The user status to filter by
     * @return List of users with the specified status
     */
    List<User> findByUserStatus(UserStatus userStatus);

    /**
     * Find users with the most no-shows.
     * 
     * @param limit Maximum number of users to return
     * @return List of users ordered by total no-shows in descending order
     */
    @Query("SELECT u FROM User u ORDER BY u.totalNoShows DESC")
    List<User> findTopUsersByNoShows(@Param("limit") int limit);

    /**
     * Find users by assigned center.
     * 
     * @param center The center to filter by
     * @return List of users assigned to the center
     */
    List<User> findByAssignedCenter(Center center);

    /**
     * Find users with strikes greater than a threshold.
     * 
     * @param threshold The minimum number of strikes
     * @return List of users with strikes >= threshold
     */
    @Query("SELECT u FROM User u WHERE u.strikeCount >= :threshold ORDER BY u.strikeCount DESC")
    List<User> findUsersWithStrikesGreaterThan(@Param("threshold") int threshold);

    /**
     * Get penalty statistics for all users.
     * 
     * @return List of users with strike information
     */
    @Query("SELECT u FROM User u WHERE u.strikeCount > 0 ORDER BY u.strikeCount DESC, u.lastStrikeDate DESC")
    List<User> findUsersWithStrikes();
}