package com.web4jobs.bookingsystem.service;

import com.web4jobs.bookingsystem.dto.ai.BookingSuggestionRequest;
import com.web4jobs.bookingsystem.dto.ai.BookingSuggestionResponse;

/**
 * Service interface for AI-powered booking suggestions
 */
public interface AIBookingSuggestionService {
    
    /**
     * Generate intelligent booking suggestions based on user context and preferences
     * 
     * @param request The booking suggestion request with user context
     * @return AI-powered booking suggestion with reasoning
     */
    BookingSuggestionResponse generateBookingSuggestion(BookingSuggestionRequest request);
    
    /**
     * Get alternative suggestions if the primary recommendation is not suitable
     * 
     * @param request The original request
     * @param excludeWorkstationId Workstation to exclude from alternatives
     * @return List of alternative suggestions
     */
    BookingSuggestionResponse getAlternativeSuggestions(BookingSuggestionRequest request, Long excludeWorkstationId);
} 