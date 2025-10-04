package com.web4jobs.bookingsystem.dto.ai;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RecommendationResponse {
    
    private List<WorkstationRecommendation> recommendations;
    private String reasoning;
    private Double confidenceScore;
    private String aiSuggestion;
    
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class WorkstationRecommendation {
        private Long workstationId;
        private String workstationName;
        private String workstationType;
        private String roomName;
        private Integer floor;
        private LocalDateTime suggestedStartTime;
        private LocalDateTime suggestedEndTime;
        private Integer duration; // in hours
        private Double score; // 0-100 compatibility score
        private String reason;
        private List<String> advantages;
        private String specifications;
        
        // Context information
        private Integer expectedOccupancy; // 0-100 percentage
        private String environmentType; // "quiet", "collaborative", "mixed"
        private Boolean isOptimalTime;
    }
} 