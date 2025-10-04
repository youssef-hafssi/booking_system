package com.web4jobs.bookingsystem.dto.statistics;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.Map;

/**
 * DTO for reservation statistics.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class ReservationStatistics {

    private Long totalReservations;
    private Long pendingReservations;
    private Long confirmedReservations;
    private Long completedReservations;
    private Long cancelledReservations;
    
    private Double averageReservationDurationHours;
    private LocalDateTime mostPopularStartTime;
    private LocalDateTime mostPopularEndTime;
    
    // Statistics by day of week (1=Monday, 7=Sunday)
    private Map<Integer, Long> reservationsByDayOfWeek;
    
    // Statistics by hour of day (0-23)
    private Map<Integer, Long> reservationsByHourOfDay;
    
    // Statistics by user role
    private Map<String, Long> reservationsByUserRole;
    
    // Period of the statistics
    private LocalDateTime periodStart;
    private LocalDateTime periodEnd;
}