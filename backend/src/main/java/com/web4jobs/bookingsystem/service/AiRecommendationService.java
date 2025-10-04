package com.web4jobs.bookingsystem.service;

import com.web4jobs.bookingsystem.dto.ai.RecommendationRequest;
import com.web4jobs.bookingsystem.dto.ai.RecommendationResponse;
import com.web4jobs.bookingsystem.dto.ai.UserBookingProfile;

public interface AiRecommendationService {
    
    /**
     * Generate workstation recommendations for a user
     */
    RecommendationResponse generateRecommendations(RecommendationRequest request);
    
    /**
     * Analyze user booking history to create a profile
     */
    UserBookingProfile analyzeUserBookingProfile(Long userId);
    
    /**
     * Get real-time context information for better recommendations
     */
    String getCurrentContextAnalysis(Long centerId);
} 