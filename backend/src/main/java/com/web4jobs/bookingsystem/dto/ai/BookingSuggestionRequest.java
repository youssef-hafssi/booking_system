package com.web4jobs.bookingsystem.dto.ai;

import lombok.Data;
import java.time.LocalDate;
import java.time.LocalTime;

/**
 * Request DTO for AI-powered booking suggestions
 */
@Data
public class BookingSuggestionRequest {
    private Long userId;
    private Long centerId;
    private LocalDate preferredDate;
    private LocalTime preferredStartTime;
    private Integer durationHours;
    private String workType; // "development", "design", "meeting", "study", etc.
    private String environmentPreference; // "quiet", "collaborative", "any"
    private String specificRequirements; // Free text for special needs
} 