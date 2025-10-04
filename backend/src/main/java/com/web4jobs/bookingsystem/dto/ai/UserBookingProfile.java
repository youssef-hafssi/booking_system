package com.web4jobs.bookingsystem.dto.ai;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalTime;
import java.util.List;
import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserBookingProfile {
    
    private Long userId;
    private Integer totalBookings;
    private Double averageDuration;
    
    // Time preferences
    private LocalTime preferredStartTime;
    private List<Integer> preferredDaysOfWeek; // 1=Monday, 7=Sunday
    private String preferredTimeSlot; // "morning", "afternoon", "evening"
    
    // Workstation preferences
    private String mostUsedWorkstationType;
    private List<String> preferredRooms;
    private Map<String, Integer> workstationTypeUsage; // type -> count
    
    // Behavioral patterns
    private Double punctualityScore; // 0-100
    private Double cancellationRate; // 0-100
    private Integer averageAdvanceBooking; // days in advance
    
    // Environment preferences (inferred from patterns)
    private Boolean prefersQuietSpaces;
    private Boolean prefersCollaborativeSpaces;
    private String activityPattern; // "consistent", "flexible", "sporadic"
    
    // Recent activity
    private Integer recentBookingsCount; // last 30 days
    private String recentTrend; // "increasing", "stable", "decreasing"
} 