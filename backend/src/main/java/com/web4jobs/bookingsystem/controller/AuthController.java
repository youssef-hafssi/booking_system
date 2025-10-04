package com.web4jobs.bookingsystem.controller;

import com.web4jobs.bookingsystem.dto.mapper.UserMapper;
import com.web4jobs.bookingsystem.dto.request.UserRequest;
import com.web4jobs.bookingsystem.dto.response.UserResponse;
import com.web4jobs.bookingsystem.model.User;
import com.web4jobs.bookingsystem.security.JwtUtils;
import com.web4jobs.bookingsystem.service.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger; 
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

/**
 * Controller for handling authentication operations.
 */
@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private static final Logger logger = LoggerFactory.getLogger(AuthController.class);

    private final UserService userService;
    private final UserMapper userMapper;
    private final JwtUtils jwtUtils;

    /**
     * Register a new user.
     *
     * @param userRequest The user registration data
     * @return The created user
     */
    @PostMapping("/register")
    public ResponseEntity<UserResponse> registerUser(@Valid @RequestBody UserRequest userRequest) {
        logger.info("Registering new user with email: {}", userRequest.getEmail());
        
        try {
            User user = userMapper.toEntity(userRequest);
            User createdUser = userService.createUser(user);
            UserResponse response = userMapper.toResponse(createdUser);
            logger.info("User registered successfully: {}", userRequest.getEmail());
            return ResponseEntity.status(HttpStatus.CREATED).body(response);
        } catch (Exception e) {
            logger.error("Error registering user: {}", e.getMessage(), e);
            throw e;
        }
    }

    /**
     * Authenticate a user.
     *
     * @param credentials The login credentials
     * @return Authentication result with JWT token
     */
    @PostMapping("/login")
    public ResponseEntity<Map<String, Object>> login(@RequestBody Map<String, String> credentials) {
        String email = credentials.get("email");
        String password = credentials.get("password");
        
        logger.info("Login attempt for user: {}", email);
        
        try {
            // Authenticate user
            User user = userService.authenticateUser(email, password);
            UserResponse userResponse = userMapper.toResponse(user);
            
            // Generate JWT token
            String token = jwtUtils.generateToken(user);
            
            Map<String, Object> response = new HashMap<>();
            response.put("user", userResponse);
            response.put("token", token);
            
            logger.info("Login successful for user: {}", email);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            logger.error("Login failed for user {}: {}", email, e.getMessage(), e);
            throw e;
        }
    }

    /**
     * Check if the current authentication token is valid.
     *
     * @return Validation result
     */
    @GetMapping("/validate")
    public ResponseEntity<Map<String, Object>> validateToken(@RequestHeader("Authorization") String authHeader) {
        try {
            // Extract token from Authorization header (remove "Bearer " prefix)
            if (authHeader == null || !authHeader.startsWith("Bearer ")) {
                logger.warn("Invalid Authorization header format");
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("valid", false));
            }
            
            String token = authHeader.substring(7);
            
            logger.debug("Validating token: {}", token.substring(0, Math.min(10, token.length())) + "...");
            
            boolean isValid = jwtUtils.validateToken(token);
            Map<String, Object> response = new HashMap<>();
            response.put("valid", isValid);
            
            if (isValid) {
                String email = jwtUtils.extractEmail(token);
                String role = jwtUtils.extractClaim(token, claims -> claims.get("role", String.class));
                
                response.put("email", email);
                response.put("role", role);
                
                logger.info("Token validated successfully for user: {}", email);
            } else {
                logger.warn("Invalid token provided");
            }
            
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            logger.error("Error validating token: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("valid", false, "error", e.getMessage()));
        }
    }
}