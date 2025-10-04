package com.web4jobs.bookingsystem.controller;

import com.web4jobs.bookingsystem.dto.ai.RecommendationRequest;
import com.web4jobs.bookingsystem.dto.ai.RecommendationResponse;
import com.web4jobs.bookingsystem.dto.ai.UserBookingProfile;
import com.web4jobs.bookingsystem.service.AiRecommendationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/ai")
@RequiredArgsConstructor
@Slf4j
@CrossOrigin(origins = "http://localhost:3000", allowCredentials = "true")
public class AiRecommendationController {

    private final AiRecommendationService aiRecommendationService;

    /**
     * Generate AI-powered workstation recommendations
     */
    @PostMapping("/recommendations")
    @PreAuthorize("hasAuthority('STUDENT') or hasAuthority('MANAGER') or hasAuthority('ADMIN')")
    public ResponseEntity<RecommendationResponse> generateRecommendations(
            @Valid @RequestBody RecommendationRequest request) {
        
        log.info("Generating recommendations for user: {}", request.getUserId());
        
        try {
            RecommendationResponse response = aiRecommendationService.generateRecommendations(request);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("Error generating recommendations", e);
            return ResponseEntity.internalServerError().build();
        }
    }

    /**
     * Get user booking profile for analytics
     */
    @GetMapping("/profile/{userId}")
    @PreAuthorize("hasAuthority('STUDENT') or hasAuthority('MANAGER') or hasAuthority('ADMIN')")
    public ResponseEntity<UserBookingProfile> getUserBookingProfile(@PathVariable Long userId) {
        
        log.info("Getting booking profile for user: {}", userId);
        
        try {
            UserBookingProfile profile = aiRecommendationService.analyzeUserBookingProfile(userId);
            return ResponseEntity.ok(profile);
        } catch (Exception e) {
            log.error("Error getting user profile", e);
            return ResponseEntity.internalServerError().build();
        }
    }

    /**
     * Get current context analysis for a center
     */
    @GetMapping("/context/{centerId}")
    @PreAuthorize("hasAuthority('MANAGER') or hasAuthority('ADMIN')")
    public ResponseEntity<String> getContextAnalysis(@PathVariable Long centerId) {
        
        log.info("Getting context analysis for center: {}", centerId);
        
        try {
            String context = aiRecommendationService.getCurrentContextAnalysis(centerId);
            return ResponseEntity.ok(context);
        } catch (Exception e) {
            log.error("Error getting context analysis", e);
            return ResponseEntity.internalServerError().build();
        }
    }

    /**
     * Quick recommendation endpoint for simplified requests
     */
    @PostMapping("/quick-recommend")
    @PreAuthorize("hasAuthority('STUDENT') or hasAuthority('MANAGER') or hasAuthority('ADMIN')")
    public ResponseEntity<RecommendationResponse> quickRecommend(
            @RequestParam Long userId,
            @RequestParam Long centerId,
            @RequestParam(required = false) Integer duration) {
        
        log.info("Quick recommendation for user: {} in center: {}", userId, centerId);
        
        RecommendationRequest request = RecommendationRequest.builder()
                .userId(userId)
                .centerId(centerId)
                .preferredDuration(duration != null ? duration : 2)
                .flexibility(3) // Medium flexibility
                .build();
        
        try {
            RecommendationResponse response = aiRecommendationService.generateRecommendations(request);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("Error generating quick recommendations", e);
            return ResponseEntity.internalServerError().build();
        }
    }
} 