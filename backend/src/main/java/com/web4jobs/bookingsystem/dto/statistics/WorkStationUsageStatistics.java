package com.web4jobs.bookingsystem.dto.statistics;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

/**
 * DTO for workstation usage statistics.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class WorkStationUsageStatistics {

    private Long totalWorkStations;
    private Long availableWorkStations;
    private Long occupiedWorkStations;
    private Long maintenanceWorkStations;
    private Long disabledWorkStations;
    
    private Double averageOccupancyRate; // Percentage
    private Double peakOccupancyRate; // Percentage
    private LocalDateTime peakOccupancyTime;
    
    // Most used workstations
    private List<WorkStationUsage> mostUsedWorkStations;
    
    // Least used workstations
    private List<WorkStationUsage> leastUsedWorkStations;
    
    // Usage by day of week (1=Monday, 7=Sunday)
    private Map<Integer, Double> usageByDayOfWeek;
    
    // Usage by hour of day (0-23)
    private Map<Integer, Double> usageByHourOfDay;
    
    // Period of the statistics
    private LocalDateTime periodStart;
    private LocalDateTime periodEnd;
    
    /**
     * Inner class for workstation usage details.
     */
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class WorkStationUsage {
        private Long workStationId;
        private String workStationName;
        private String workStationType;
        private String roomName;
        private String centerName;
        private Long reservationCount;
        private Double usageHours;
        private Double occupancyRate; // Percentage
    }
}