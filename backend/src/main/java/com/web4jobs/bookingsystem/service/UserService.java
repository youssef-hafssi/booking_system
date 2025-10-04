package com.web4jobs.bookingsystem.service;

import com.web4jobs.bookingsystem.model.User;
import com.web4jobs.bookingsystem.model.UserRole;
import com.web4jobs.bookingsystem.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

/**
 * Service for managing User entities.
 * Provides business logic for user management operations.
 */
@Service
public class UserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Autowired
    public UserService(UserRepository userRepository, PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    /**
     * Find all users in the system.
     *
     * @return A list of all users
     */
    public List<User> findAllUsers() {
        return userRepository.findAll();
    }
    
    /**
     * Find all users in the system with pagination.
     *
     * @param pageable The pagination information
     * @return A page of users
     */
    public Page<User> findAllUsers(Pageable pageable) {
        return userRepository.findAll(pageable);
    }

    /**
     * Find a user by their ID.
     *
     * @param id The ID of the user to find
     * @return An Optional containing the user if found, or empty if not found
     */
    public Optional<User> findUserById(Long id) {
        return userRepository.findById(id);
    }

    /**
     * Find a user by their email address.
     *
     * @param email The email address of the user to find
     * @return An Optional containing the user if found, or empty if not found
     */
    public Optional<User> findUserByEmail(String email) {
        return userRepository.findByEmail(email);
    }

    /**
     * Find all users with a specific role.
     *
     * @param role The role to filter by
     * @return A list of users with the specified role
     */
    public List<User> findUsersByRole(UserRole role) {
        return userRepository.findByRole(role);
    }

    /**
     * Create a new user.
     * The password will be encoded before saving.
     *
     * @param user The user to create
     * @return The created user with ID assigned
     * @throws IllegalArgumentException if a user with the same email already exists
     */
    @Transactional
    public User createUser(User user) {
        if (userRepository.existsByEmail(user.getEmail())) {
            throw new IllegalArgumentException("A user with this email already exists");
        }
        
        // Encode the password
        user.setPassword(passwordEncoder.encode(user.getPassword()));
        
        // Set creation and update timestamps
        LocalDateTime now = LocalDateTime.now();
        user.setCreatedAt(now);
        user.setUpdatedAt(now);
        
        return userRepository.save(user);
    }

    /**
     * Update an existing user.
     * If the password field is not null, it will be encoded before saving.
     *
     * @param id The ID of the user to update
     * @param userDetails The updated user details
     * @return The updated user
     * @throws IllegalArgumentException if the user does not exist or if trying to update to an email that is already in use by another user
     */
    @Transactional
    public User updateUser(Long id, User userDetails) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("User not found with id: " + id));
        
        // Check if email is being changed and if it's already in use
        if (!user.getEmail().equals(userDetails.getEmail()) && 
                userRepository.existsByEmail(userDetails.getEmail())) {
            throw new IllegalArgumentException("Email already in use");
        }
        
        // Update fields
        user.setEmail(userDetails.getEmail());
        user.setFirstName(userDetails.getFirstName());
        user.setLastName(userDetails.getLastName());
        user.setPhoneNumber(userDetails.getPhoneNumber());
        user.setRole(userDetails.getRole());
        
        // Only update password if it's provided
        if (userDetails.getPassword() != null && !userDetails.getPassword().isEmpty()) {
            user.setPassword(passwordEncoder.encode(userDetails.getPassword()));
        }
        
        // Update timestamp
        user.setUpdatedAt(LocalDateTime.now());
        
        return userRepository.save(user);
    }

    /**
     * Delete a user by their ID.
     *
     * @param id The ID of the user to delete
     * @throws IllegalArgumentException if the user does not exist
     */
    @Transactional
    public void deleteUser(Long id) {
        if (!userRepository.existsById(id)) {
            throw new IllegalArgumentException("User not found with id: " + id);
        }
        userRepository.deleteById(id);
    }

    /**
     * Search for users by name (first name or last name).
     *
     * @param searchTerm The search term to look for in user names
     * @return A list of matching users
     */
    public List<User> searchUsersByName(String searchTerm) {
        return userRepository.findByFirstNameContainingIgnoreCaseOrLastNameContainingIgnoreCase(
                searchTerm, searchTerm);
    }

    /**
     * Update the last login time for a user.
     *
     * @param id The ID of the user
     */
    @Transactional
    public void updateLastLogin(Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("User not found with id: " + id));
        
        user.setLastLogin(LocalDateTime.now());
        userRepository.save(user);
    }

    /**
     * Change a user's password.
     *
     * @param id The ID of the user
     * @param newPassword The new password
     * @throws IllegalArgumentException if the user does not exist
     */
    @Transactional
    public void changePassword(Long id, String newPassword) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("User not found with id: " + id));
        
        user.setPassword(passwordEncoder.encode(newPassword));
        user.setUpdatedAt(LocalDateTime.now());
        userRepository.save(user);
    }

    /**
     * Check if the provided password matches the stored password for a user.
     *
     * @param id The ID of the user
     * @param password The password to check
     * @return true if the password matches, false otherwise
     * @throws IllegalArgumentException if the user does not exist
     */
    public boolean checkPassword(Long id, String password) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("User not found with id: " + id));
        
        return passwordEncoder.matches(password, user.getPassword());
    }
    
    /**
     * Authenticate a user with email and password.
     * Updates the last login time if authentication is successful.
     *
     * @param email The user's email
     * @param password The user's password
     * @return The authenticated user
     * @throws IllegalArgumentException if the user does not exist or the password is incorrect
     */
    @Transactional
    public User authenticateUser(String email, String password) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("Invalid email or password"));
        
        if (!passwordEncoder.matches(password, user.getPassword())) {
            throw new IllegalArgumentException("Invalid email or password");
        }
        
        // Update last login time
        user.setLastLogin(LocalDateTime.now());
        userRepository.save(user);
        
        return user;
    }

    /**
     * Count all users in the system.
     *
     * @return The count of all users
     */
    public long countUsers() {
        return userRepository.count();
    }

    /**
     * Find users by center with pagination.
     * For CENTER_MANAGER role, only returns STUDENT users.
     *
     * @param centerId The ID of the center
     * @param pageable The pagination information
     * @return A page of users in the center
     */
    public Page<User> findUsersByCenter(Long centerId, Pageable pageable) {
        return userRepository.findByAssignedCenterIdAndRole(centerId, UserRole.STUDENT, pageable);
    }

    /**
     * Count users in a center.
     * For CENTER_MANAGER role, only counts STUDENT users.
     *
     * @param centerId The ID of the center
     * @return The number of users in the center
     */
    public int countUsersByCenter(Long centerId) {
        return userRepository.countByAssignedCenterIdAndRole(centerId, UserRole.STUDENT);
    }
}