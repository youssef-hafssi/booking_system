package com.web4jobs.bookingsystem.dto.statistics;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

/**
 * DTO for center usage statistics.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class CenterUsageStatistics {

    private Long totalCenters;
    private Long totalRooms;
    private Long totalWorkStations;
    
    private Double averageCenterOccupancyRate; // Percentage
    private Double peakCenterOccupancyRate; // Percentage
    private LocalDateTime peakOccupancyTime;
    
    // Most used centers
    private List<CenterUsage> mostUsedCenters;
    
    // Least used centers
    private List<CenterUsage> leastUsedCenters;
    
    // Usage by city
    private Map<String, CityUsage> usageByCity;
    
    // Usage by day of week (1=Monday, 7=Sunday)
    private Map<Integer, Double> usageByDayOfWeek;
    
    // Usage by hour of day (0-23)
    private Map<Integer, Double> usageByHourOfDay;
    
    // Period of the statistics
    private LocalDateTime periodStart;
    private LocalDateTime periodEnd;
    
    /**
     * Inner class for center usage details.
     */
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class CenterUsage {
        private Long centerId;
        private String centerName;
        private String city;
        private String postalCode;
        private Long roomCount;
        private Long workStationCount;
        private Long reservationCount;
        private Double usageHours;
        private Double occupancyRate; // Percentage
    }
    
    /**
     * Inner class for city usage details.
     */
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class CityUsage {
        private String cityName;
        private Long centerCount;
        private Long roomCount;
        private Long workStationCount;
        private Long reservationCount;
        private Double averageOccupancyRate; // Percentage
        private Double totalUsageHours;
    }
}