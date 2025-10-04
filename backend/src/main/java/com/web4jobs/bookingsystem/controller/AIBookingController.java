package com.web4jobs.bookingsystem.controller;

import com.web4jobs.bookingsystem.dto.ai.BookingSuggestionRequest;
import com.web4jobs.bookingsystem.dto.ai.BookingSuggestionResponse;
import com.web4jobs.bookingsystem.service.AIBookingSuggestionService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

/**
 * REST Controller for AI-powered booking suggestions
 */
@RestController
@RequestMapping("/api/ai")
@RequiredArgsConstructor
@Slf4j
public class AIBookingController {

    private final AIBookingSuggestionService aiBookingSuggestionService;

    /**
     * Generate intelligent booking suggestions
     */
    @PostMapping("/suggest-booking")
    @PreAuthorize("hasAnyRole('STUDENT', 'PEDAGOGICAL_MANAGER', 'ADMIN')")
    public ResponseEntity<BookingSuggestionResponse> generateBookingSuggestion(
            @RequestBody BookingSuggestionRequest request) {
        
        log.info("Received AI booking suggestion request for user {}", request.getUserId());
        
        try {
            BookingSuggestionResponse suggestion = aiBookingSuggestionService.generateBookingSuggestion(request);
            return ResponseEntity.ok(suggestion);
        } catch (Exception e) {
            log.error("Error generating booking suggestion", e);
            return ResponseEntity.badRequest().build();
        }
    }

    /**
     * Get alternative suggestions
     */
    @PostMapping("/suggest-alternatives")
    @PreAuthorize("hasAnyRole('STUDENT', 'PEDAGOGICAL_MANAGER', 'ADMIN')")
    public ResponseEntity<BookingSuggestionResponse> getAlternativeSuggestions(
            @RequestBody BookingSuggestionRequest request,
            @RequestParam Long excludeWorkstationId) {
        
        log.info("Received alternative suggestions request for user {}", request.getUserId());
        
        try {
            BookingSuggestionResponse alternatives = aiBookingSuggestionService
                    .getAlternativeSuggestions(request, excludeWorkstationId);
            return ResponseEntity.ok(alternatives);
        } catch (Exception e) {
            log.error("Error generating alternative suggestions", e);
            return ResponseEntity.badRequest().build();
        }
    }
} 