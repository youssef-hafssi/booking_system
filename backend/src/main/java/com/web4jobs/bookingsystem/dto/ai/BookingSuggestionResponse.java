package com.web4jobs.bookingsystem.dto.ai;

import lombok.Data;
import lombok.Builder;
import java.time.LocalDateTime;

/**
 * Response DTO for AI-powered booking suggestions
 */
@Data
@Builder
public class BookingSuggestionResponse {
    private Long recommendedWorkstationId;
    private String workstationName;
    private String roomName;
    private String centerName;
    private LocalDateTime suggestedStartTime;
    private LocalDateTime suggestedEndTime;
    private Integer confidenceScore; // 1-100
    private String reasoning; // AI-generated explanation
    private String workstationSpecs; // Brief specs description
    private String environmentDescription; // "Quiet area", "Collaborative space", etc.
    
    // Alternative suggestions
    private BookingSuggestionAlternative[] alternatives;
}

/**
 * Alternative suggestion for when primary recommendation isn't accepted
 */
@Data
@Builder
class BookingSuggestionAlternative {
    private Long workstationId;
    private String workstationName;
    private LocalDateTime startTime;
    private LocalDateTime endTime;
    private Integer score;
    private String reason;
} 