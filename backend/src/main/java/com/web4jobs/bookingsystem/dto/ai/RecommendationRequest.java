package com.web4jobs.bookingsystem.dto.ai;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import jakarta.validation.constraints.NotNull;
import java.time.LocalDate;
import java.time.LocalTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RecommendationRequest {
    
    @NotNull(message = "User ID is required")
    private Long userId;
    
    @NotNull(message = "Center ID is required")
    private Long centerId;
    
    private LocalDate preferredDate;
    private LocalTime preferredStartTime;
    private Integer preferredDuration; // in hours
    
    // User preferences
    private String preferredWorkStationType; // DESKTOP, LAPTOP, SPECIALIZED
    private Boolean preferQuietEnvironment;
    private String specialRequirements;
    
    // Context information
    private String purpose; // "study", "work", "meeting", etc.
    private Integer flexibility; // 1-5 scale for time flexibility
} 