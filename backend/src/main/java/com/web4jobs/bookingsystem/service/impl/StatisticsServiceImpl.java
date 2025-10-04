package com.web4jobs.bookingsystem.service.impl;

import com.web4jobs.bookingsystem.dto.response.ActivityLogResponse;
import com.web4jobs.bookingsystem.dto.response.AnalyticsResponse;
import com.web4jobs.bookingsystem.dto.response.AnalyticsResponse.*;
import com.web4jobs.bookingsystem.dto.statistics.CenterUsageStatistics;
import com.web4jobs.bookingsystem.dto.statistics.ReservationStatistics;
import com.web4jobs.bookingsystem.dto.statistics.WorkStationUsageStatistics;
import com.web4jobs.bookingsystem.model.Center;
import com.web4jobs.bookingsystem.model.Reservation;
import com.web4jobs.bookingsystem.model.ReservationStatus;
import com.web4jobs.bookingsystem.model.User;
import com.web4jobs.bookingsystem.model.WorkStation;
import com.web4jobs.bookingsystem.model.WorkStationStatus;
import com.web4jobs.bookingsystem.repository.CenterRepository;
import com.web4jobs.bookingsystem.repository.ReservationRepository;
import com.web4jobs.bookingsystem.repository.UserRepository;
import com.web4jobs.bookingsystem.repository.WorkStationRepository;
import com.web4jobs.bookingsystem.service.StatisticsService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.format.TextStyle;
import java.time.temporal.TemporalAdjusters;
import java.util.*;
import java.util.stream.Collectors;

/**
 * Implementation of the StatisticsService interface.
 * This class provides statistics and reporting functionality for the booking system,
 * including reservation statistics, workstation usage, and center utilization metrics.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class StatisticsServiceImpl implements StatisticsService {

    private final ReservationRepository reservationRepository;
    private final WorkStationRepository workStationRepository;
    private final UserRepository userRepository;
    private final CenterRepository centerRepository;
    
    /**
     * Creates an empty ReservationStatistics object with properly initialized collections.
     * 
     * @param startDate The start date for the statistics period
     * @param endDate The end date for the statistics period
     * @return An initialized ReservationStatistics object
     */
    private ReservationStatistics createEmptyReservationStatistics(LocalDateTime startDate, LocalDateTime endDate) {
        Map<Integer, Long> emptyDayMap = new HashMap<>();
        Map<Integer, Long> emptyHourMap = new HashMap<>();
        Map<String, Long> emptyRoleMap = new HashMap<>();
        
        // Initialize day of week map (1=Monday, 7=Sunday)
        for (int i = 1; i <= 7; i++) {
            emptyDayMap.put(i, 0L);
        }
        
        // Initialize hour of day map (0-23)
        for (int i = 0; i < 24; i++) {
            emptyHourMap.put(i, 0L);
        }
        
        return new ReservationStatistics(
                0L, 0L, 0L, 0L, 0L,
                0.0, null, null,
                emptyDayMap, emptyHourMap, emptyRoleMap,
                startDate, endDate
        );
    }
    
    /**
     * Creates an empty WorkStationUsageStatistics object with properly initialized collections.
     * 
     * @param startDate The start date for the statistics period
     * @param endDate The end date for the statistics period
     * @return An initialized WorkStationUsageStatistics object
     */
    private WorkStationUsageStatistics createEmptyWorkStationStatistics(LocalDateTime startDate, LocalDateTime endDate) {
        List<WorkStationUsageStatistics.WorkStationUsage> emptyUsageList = new ArrayList<>();
        Map<Integer, Double> emptyDayMap = new HashMap<>();
        Map<Integer, Double> emptyHourMap = new HashMap<>();
        
        // Initialize day of week map (1=Monday, 7=Sunday)
        for (int i = 1; i <= 7; i++) {
            emptyDayMap.put(i, 0.0);
        }
        
        // Initialize hour of day map (0-23)
        for (int i = 0; i < 24; i++) {
            emptyHourMap.put(i, 0.0);
        }
        
        return new WorkStationUsageStatistics(
                0L, 0L, 0L, 0L, 0L,
                0.0, 0.0, null,
                emptyUsageList, emptyUsageList,
                emptyDayMap, emptyHourMap,
                startDate, endDate
        );
    }
    
    /**
     * Creates an empty CenterUsageStatistics object with properly initialized collections.
     * 
     * @param startDate The start date for the statistics period
     * @param endDate The end date for the statistics period
     * @return An initialized CenterUsageStatistics object
     */
    private CenterUsageStatistics createEmptyCenterStatistics(LocalDateTime startDate, LocalDateTime endDate) {
        List<CenterUsageStatistics.CenterUsage> emptyUsageList = new ArrayList<>();
        Map<String, CenterUsageStatistics.CityUsage> emptyCityMap = new HashMap<>();
        Map<Integer, Double> emptyDayMap = new HashMap<>();
        Map<Integer, Double> emptyHourMap = new HashMap<>();
        
        // Initialize day of week map (1=Monday, 7=Sunday)
        for (int i = 1; i <= 7; i++) {
            emptyDayMap.put(i, 0.0);
        }
        
        // Initialize hour of day map (0-23)
        for (int i = 0; i < 24; i++) {
            emptyHourMap.put(i, 0.0);
        }
        
        return new CenterUsageStatistics(
                0L, 0L, 0L,
                0.0, 0.0, null,
                emptyUsageList, emptyUsageList, emptyCityMap,
                emptyDayMap, emptyHourMap,
                startDate, endDate
        );
    }

    @Override
    @Cacheable(value = "reservationStatistics", key = "'all'", unless = "#result == null")
    public ReservationStatistics getReservationStatistics() {
        try {
            log.info("Calculating reservation statistics");
            
            // Set period dates
            LocalDateTime endDate = LocalDateTime.now();
            LocalDateTime startDate = endDate.minusDays(30);
            
            // Initialize statistics object
            ReservationStatistics statistics = createEmptyReservationStatistics(startDate, endDate);
            
            // Get reservation counts by status
            long totalReservations = reservationRepository.count();
            long pendingReservations = reservationRepository.countByStatus(ReservationStatus.PENDING);
            long confirmedReservations = reservationRepository.countByStatus(ReservationStatus.CONFIRMED);
            long completedReservations = reservationRepository.countByStatus(ReservationStatus.COMPLETED);
            long cancelledReservations = reservationRepository.countByStatus(ReservationStatus.CANCELLED);
            
            // Set basic statistics
            statistics.setTotalReservations(totalReservations);
            statistics.setPendingReservations(pendingReservations);
            statistics.setConfirmedReservations(confirmedReservations);
            statistics.setCompletedReservations(completedReservations);
            statistics.setCancelledReservations(cancelledReservations);
            
            // Calculate average reservation duration (if there are completed reservations)
            if (completedReservations > 0) {
                // This would ideally use a custom query in the repository
                // For now, we'll use a placeholder value
                double avgDuration = 2.5; // Placeholder: 2.5 hours average duration
                statistics.setAverageReservationDurationHours(avgDuration);
            }
            
            // Populate reservations by day of week (using placeholder data for now)
            // In a real implementation, this would use a query to group by day of week
            Map<Integer, Long> byDayOfWeek = statistics.getReservationsByDayOfWeek();
            // Monday has most reservations in this example
            byDayOfWeek.put(1, totalReservations / 3);
            byDayOfWeek.put(2, totalReservations / 6);
            byDayOfWeek.put(3, totalReservations / 6);
            byDayOfWeek.put(4, totalReservations / 8);
            byDayOfWeek.put(5, totalReservations / 4);
            
            // Populate reservations by hour of day (using placeholder data)
            Map<Integer, Long> byHourOfDay = statistics.getReservationsByHourOfDay();
            // 9 AM and 2 PM are peak hours in this example
            byHourOfDay.put(9, totalReservations / 4);
            byHourOfDay.put(10, totalReservations / 8);
            byHourOfDay.put(11, totalReservations / 10);
            byHourOfDay.put(14, totalReservations / 4);
            byHourOfDay.put(15, totalReservations / 8);
            
            // Set most popular times based on the data
            statistics.setMostPopularStartTime(LocalDateTime.now().withHour(9).withMinute(0));
            statistics.setMostPopularEndTime(LocalDateTime.now().withHour(17).withMinute(0));
            
            // Note: In a production implementation, we would:
            // 1. Add repository methods to get actual data grouped by day/hour
            // 2. Calculate real average duration from start/end times
            // 3. Determine actual most popular times from the data
            
            return statistics;
        } catch (Exception e) {
            log.error("Error calculating reservation statistics: {}", e.getMessage(), e);
            // Return empty statistics rather than throwing exception
            return createEmptyReservationStatistics(
                    LocalDateTime.now().minusDays(30), 
                    LocalDateTime.now());
        }
    }

    @Override
    @Cacheable(value = "reservationStatistics", key = "#startDate.toString() + '-' + #endDate.toString()", unless = "#result == null")
    public ReservationStatistics getReservationStatisticsByDateRange(LocalDate startDate, LocalDate endDate) {
        try {
            log.info("Calculating reservation statistics for period {} to {}", startDate, endDate);
            
            // Initialize statistics object
            ReservationStatistics statistics = createEmptyReservationStatistics(
                    startDate.atStartOfDay(), 
                    endDate.atTime(23, 59, 59));
            
            // Get reservation counts by status within date range
            // In a real implementation, these would use repository methods with date filtering
            // For now, we'll use placeholder data proportional to the date range length
            
            // Calculate number of days in the range to scale our placeholder data
            long daysBetween = java.time.temporal.ChronoUnit.DAYS.between(startDate, endDate) + 1;
            long scaleFactor = Math.max(1, daysBetween / 7); // Scale based on weeks
            
            // Set placeholder counts scaled by date range
            long totalReservations = 50 * scaleFactor;
            long pendingReservations = 10 * scaleFactor;
            long confirmedReservations = 20 * scaleFactor;
            long completedReservations = 15 * scaleFactor;
            long cancelledReservations = 5 * scaleFactor;
            
            // Set basic statistics
            statistics.setTotalReservations(totalReservations);
            statistics.setPendingReservations(pendingReservations);
            statistics.setConfirmedReservations(confirmedReservations);
            statistics.setCompletedReservations(completedReservations);
            statistics.setCancelledReservations(cancelledReservations);
            
            // Calculate average reservation duration
            double avgDuration = 2.5; // Placeholder: 2.5 hours average duration
            statistics.setAverageReservationDurationHours(avgDuration);
            
            // Populate day of week distribution (placeholder data)
            Map<Integer, Long> byDayOfWeek = statistics.getReservationsByDayOfWeek();
            byDayOfWeek.put(1, totalReservations / 3); // Monday
            byDayOfWeek.put(2, totalReservations / 6); // Tuesday
            byDayOfWeek.put(3, totalReservations / 6); // Wednesday
            byDayOfWeek.put(4, totalReservations / 8); // Thursday
            byDayOfWeek.put(5, totalReservations / 4); // Friday
            
            // Populate hour of day distribution (placeholder data)
            Map<Integer, Long> byHourOfDay = statistics.getReservationsByHourOfDay();
            byHourOfDay.put(9, totalReservations / 4);  // 9 AM
            byHourOfDay.put(10, totalReservations / 8); // 10 AM
            byHourOfDay.put(14, totalReservations / 4); // 2 PM
            byHourOfDay.put(15, totalReservations / 8); // 3 PM
            
            // Set most popular times
            LocalDateTime periodMiddle = startDate.atStartOfDay().plusDays(daysBetween / 2);
            statistics.setMostPopularStartTime(periodMiddle.withHour(9).withMinute(0));
            statistics.setMostPopularEndTime(periodMiddle.withHour(17).withMinute(0));
            
            // Note: In a production implementation, we would:
            // 1. Use repository methods with date range parameters
            // 2. Calculate actual statistics from real data within the range
            // 3. Implement proper aggregation queries for time-based metrics
            
            return statistics;
        } catch (Exception e) {
            log.error("Error calculating reservation statistics for period {} to {}: {}", 
                    startDate, endDate, e.getMessage(), e);
            // Return empty statistics rather than throwing exception
            return createEmptyReservationStatistics(
                    startDate.atStartOfDay(), 
                    endDate.atTime(23, 59, 59));
        }
    }

    @Override
    @Cacheable(value = "workStationStatistics", key = "'all'", unless = "#result == null")
    public WorkStationUsageStatistics getWorkStationUsageStatistics() {
        try {
            log.info("Calculating workstation usage statistics");
            
            // Set period dates
            LocalDateTime endDate = LocalDateTime.now();
            LocalDateTime startDate = endDate.minusDays(30);
            
            // Initialize statistics object
            WorkStationUsageStatistics statistics = createEmptyWorkStationStatistics(startDate, endDate);
            
            // Get workstation counts by status
            long totalWorkStations = workStationRepository.count();
            long availableWorkStations = workStationRepository.countByStatus(WorkStationStatus.AVAILABLE);
            long occupiedWorkStations = workStationRepository.countByStatus(WorkStationStatus.RESERVED);
            long maintenanceWorkStations = workStationRepository.countByStatus(WorkStationStatus.MAINTENANCE);
            // There is no DISABLED status in the enum, using 0 as placeholder
            long disabledWorkStations = 0L;
            
            // Set basic statistics
            statistics.setTotalWorkStations(totalWorkStations);
            statistics.setAvailableWorkStations(availableWorkStations);
            statistics.setOccupiedWorkStations(occupiedWorkStations);
            statistics.setMaintenanceWorkStations(maintenanceWorkStations);
            statistics.setDisabledWorkStations(disabledWorkStations);
            
            // Calculate occupancy rate if there are workstations
            if (totalWorkStations > 0) {
                double occupancyRate = (double) occupiedWorkStations / totalWorkStations * 100.0;
                statistics.setAverageOccupancyRate(occupancyRate);
                statistics.setPeakOccupancyRate(occupancyRate); // For now, use the same value
            }
            
            return statistics;
        } catch (Exception e) {
            log.error("Error calculating workstation usage statistics: {}", e.getMessage(), e);
            // Return empty statistics rather than throwing exception
            return createEmptyWorkStationStatistics(
                    LocalDateTime.now().minusDays(30), 
                    LocalDateTime.now());
        }
    }

    @Override
    @Cacheable(value = "workStationStatistics", key = "#centerId", unless = "#result == null")
    public WorkStationUsageStatistics getWorkStationUsageStatisticsByCenter(Long centerId) {
        try {
            log.info("Calculating workstation usage statistics for center {}", centerId);
            
            // Check if center exists
            if (!centerRepository.existsById(centerId)) {
                log.warn("Center with ID {} not found", centerId);
                // Return empty statistics with a note
                return createEmptyWorkStationStatistics(
                        LocalDateTime.now().minusDays(30), 
                        LocalDateTime.now());
            }
            
            // Set period dates
            LocalDateTime endDate = LocalDateTime.now();
            LocalDateTime startDate = endDate.minusDays(30);
            
            // Initialize statistics object
            WorkStationUsageStatistics statistics = createEmptyWorkStationStatistics(startDate, endDate);
            
            // Get workstations for this center
            // In a real implementation, we would use repository methods to get workstations by center
            // For now, we'll use placeholder data
            
            // Set basic workstation counts for this center (placeholder data)
            long totalWorkStations = 30; // Placeholder: 30 workstations in this center
            long availableWorkStations = 15;
            long occupiedWorkStations = 10;
            long maintenanceWorkStations = 5;
            
            // Set basic statistics
            statistics.setTotalWorkStations(totalWorkStations);
            statistics.setAvailableWorkStations(availableWorkStations);
            statistics.setOccupiedWorkStations(occupiedWorkStations);
            statistics.setMaintenanceWorkStations(maintenanceWorkStations);
            
            // Calculate occupancy rate
            double occupancyRate = (double) occupiedWorkStations / totalWorkStations;
            statistics.setAverageOccupancyRate(occupancyRate);
            statistics.setPeakOccupancyRate(occupancyRate);
            
            // Set peak usage time (placeholder data)
            statistics.setPeakOccupancyTime(LocalDateTime.now().withHour(9).withMinute(0)); // 9 AM Monday
            
            // Note: In a production implementation, we would:
            // 1. Query workstations filtered by center ID
            // 2. Join with reservations to calculate actual usage statistics
            // 3. Group by workstation type for type-specific metrics
            
            return statistics;
        } catch (Exception e) {
            log.error("Error calculating workstation usage statistics for center {}: {}", 
                    centerId, e.getMessage(), e);
            // Return empty statistics rather than throwing exception
            return createEmptyWorkStationStatistics(
                    LocalDateTime.now().minusDays(30), 
                    LocalDateTime.now());
        }
    }

    @Override
    @Cacheable(value = "centerStatistics", key = "'all'", unless = "#result == null")
    public CenterUsageStatistics getCenterUsageStatistics() {
        try {
            log.info("Calculating center usage statistics");
            
            // Set period dates
            LocalDateTime endDate = LocalDateTime.now();
            LocalDateTime startDate = endDate.minusDays(30);
            
            // Initialize statistics object
            CenterUsageStatistics statistics = createEmptyCenterStatistics(startDate, endDate);
            
            // Get basic counts
            long totalCenters = centerRepository.count();
            
            // In a real implementation, we would query the database for rooms and workstations
            // For now, we'll use placeholder data
            long totalRooms = 20;
            long totalWorkStations = 100;
            
            // Set basic statistics
            statistics.setTotalCenters(totalCenters);
            statistics.setTotalRooms(totalRooms);
            statistics.setTotalWorkStations(totalWorkStations);
            
            // Calculate occupancy rates (placeholder data)
            double avgOccupancyRate = 0.35; // 35% average occupancy
            double peakOccupancyRate = 0.75; // 75% peak occupancy
            
            statistics.setAverageCenterOccupancyRate(avgOccupancyRate);
            statistics.setPeakCenterOccupancyRate(peakOccupancyRate);
            
            // Set peak usage time (placeholder data)
            statistics.setPeakOccupancyTime(LocalDateTime.now().withHour(9).withMinute(0)); // 9 AM Monday
            
            // Populate usage by city (placeholder data)
            Map<String, CenterUsageStatistics.CityUsage> byCity = statistics.getUsageByCity();
            
            // Add Paris city statistics
            CenterUsageStatistics.CityUsage parisUsage = new CenterUsageStatistics.CityUsage();
            parisUsage.setCenterCount(2L);
            parisUsage.setRoomCount(10L);
            parisUsage.setWorkStationCount(50L);
            parisUsage.setReservationCount(200L);
            parisUsage.setAverageOccupancyRate(0.4); // 40% occupancy
            parisUsage.setTotalUsageHours(150.0); // Total usage hours
            byCity.put("Paris", parisUsage);
            
            // Add Lyon city statistics
            CenterUsageStatistics.CityUsage lyonUsage = new CenterUsageStatistics.CityUsage();
            lyonUsage.setCenterCount(1L);
            lyonUsage.setRoomCount(5L);
            lyonUsage.setWorkStationCount(25L);
            lyonUsage.setReservationCount(80L);
            lyonUsage.setAverageOccupancyRate(0.3); // 30% occupancy
            lyonUsage.setTotalUsageHours(60.0); // Total usage hours
            byCity.put("Lyon", lyonUsage);
            
            // Add Marseille city statistics
            CenterUsageStatistics.CityUsage marseilleUsage = new CenterUsageStatistics.CityUsage();
            marseilleUsage.setCenterCount(2L);
            marseilleUsage.setRoomCount(5L);
            marseilleUsage.setWorkStationCount(25L);
            marseilleUsage.setReservationCount(100L);
            marseilleUsage.setAverageOccupancyRate(0.35); // 35% occupancy
            marseilleUsage.setTotalUsageHours(90.0); // Total usage hours
            byCity.put("Marseille", marseilleUsage);
            
            // Populate usage by day of week (placeholder data)
            Map<Integer, Double> byDayOfWeek = statistics.getUsageByDayOfWeek();
            byDayOfWeek.put(1, 100.0); // Monday
            byDayOfWeek.put(2, 80.0);  // Tuesday
            byDayOfWeek.put(3, 75.0);  // Wednesday
            byDayOfWeek.put(4, 60.0);  // Thursday
            byDayOfWeek.put(5, 90.0);  // Friday
            
            // Populate usage by hour of day (placeholder data)
            Map<Integer, Double> byHourOfDay = statistics.getUsageByHourOfDay();
            byHourOfDay.put(9, 90.0);  // 9 AM
            byHourOfDay.put(10, 85.0); // 10 AM
            byHourOfDay.put(11, 70.0); // 11 AM
            byHourOfDay.put(14, 80.0); // 2 PM
            byHourOfDay.put(15, 75.0); // 3 PM
            byHourOfDay.put(16, 60.0); // 4 PM
            
            // Note: In a production implementation, we would:
            // 1. Query centers, rooms, and workstations from the database
            // 2. Join with reservations to calculate actual usage statistics
            // 3. Group by city, day of week, and hour of day for specific metrics
            
            return statistics;
        } catch (Exception e) {
            log.error("Error calculating center usage statistics: {}", e.getMessage(), e);
            // Return empty statistics rather than throwing exception
            return createEmptyCenterStatistics(
                    LocalDateTime.now().minusDays(30), 
                    LocalDateTime.now());
        }
    }

    @Override
    @Cacheable(value = "centerStatistics", key = "#startDate.toString() + '-' + #endDate.toString()", unless = "#result == null")
    public CenterUsageStatistics getCenterUsageStatisticsByDateRange(LocalDate startDate, LocalDate endDate) {
        try {
            log.info("Calculating center usage statistics for period {} to {}", startDate, endDate);
            
            // Initialize statistics object
            CenterUsageStatistics statistics = createEmptyCenterStatistics(
                    startDate.atStartOfDay(), 
                    endDate.atTime(23, 59, 59));
            
            // In a real implementation, we would query the database for centers, rooms, and workstations
            // within the specified date range
            // For now, we'll use placeholder data scaled by the date range
            
            // Calculate number of days in the range to scale our placeholder data
            long daysBetween = java.time.temporal.ChronoUnit.DAYS.between(startDate, endDate) + 1;
            long scaleFactor = Math.max(1, daysBetween / 7); // Scale based on weeks
            
            // Get basic counts from repository
            long totalCenters = centerRepository.count(); // Get actual center count
            
            // In a real implementation, we would query the database for rooms and workstations
            // For now, we'll use placeholder data
            long totalRooms = 20;  // Number of rooms doesn't change with date range
            long totalWorkStations = 100; // Number of workstations doesn't change with date range
            
            // Set basic statistics
            statistics.setTotalCenters(totalCenters);
            statistics.setTotalRooms(totalRooms);
            statistics.setTotalWorkStations(totalWorkStations);
            
            // Calculate occupancy rates for this period (placeholder data)
            // We'll assume slightly higher occupancy for shorter date ranges
            double avgOccupancyRate = 0.35 + (1.0 / daysBetween); // Adjust based on range length
            avgOccupancyRate = Math.min(0.5, avgOccupancyRate); // Cap at 50%
            
            double peakOccupancyRate = 0.75 + (2.0 / daysBetween); // Adjust based on range length
            peakOccupancyRate = Math.min(0.9, peakOccupancyRate); // Cap at 90%
            
            statistics.setAverageCenterOccupancyRate(avgOccupancyRate);
            statistics.setPeakCenterOccupancyRate(peakOccupancyRate);
            
            // Set peak usage time (placeholder data)
            // For date ranges, we'll use the middle of the range for reference
            LocalDateTime periodMiddle = startDate.atStartOfDay().plusDays(daysBetween / 2);
            int dayOfWeek = periodMiddle.getDayOfWeek().getValue();
            // Use actual day if weekday, otherwise Monday
            LocalDateTime peakTime = periodMiddle.withHour(9).withMinute(0);
            statistics.setPeakOccupancyTime(peakTime); // 9 AM peak
            
            // Populate usage by city (placeholder data scaled by date range)
            Map<String, CenterUsageStatistics.CityUsage> byCity = statistics.getUsageByCity();
            
            // Add Paris city statistics
            CenterUsageStatistics.CityUsage parisUsage = new CenterUsageStatistics.CityUsage();
            parisUsage.setCenterCount(2L);
            parisUsage.setRoomCount(10L);
            parisUsage.setWorkStationCount(50L);
            parisUsage.setReservationCount(200L * scaleFactor); // Scale reservations by date range
            parisUsage.setAverageOccupancyRate(0.4); // 40% occupancy
            parisUsage.setTotalUsageHours(150.0 * scaleFactor); // Total usage hours
            byCity.put("Paris", parisUsage);
            
            // Add Lyon city statistics
            CenterUsageStatistics.CityUsage lyonUsage = new CenterUsageStatistics.CityUsage();
            lyonUsage.setCenterCount(1L);
            lyonUsage.setRoomCount(5L);
            lyonUsage.setWorkStationCount(25L);
            lyonUsage.setReservationCount(80L * scaleFactor); // Scale reservations by date range
            lyonUsage.setAverageOccupancyRate(0.3); // 30% occupancy
            lyonUsage.setTotalUsageHours(60.0 * scaleFactor); // Total usage hours
            byCity.put("Lyon", lyonUsage);
            
            // Add Marseille city statistics
            CenterUsageStatistics.CityUsage marseilleUsage = new CenterUsageStatistics.CityUsage();
            marseilleUsage.setCenterCount(2L);
            marseilleUsage.setRoomCount(5L);
            marseilleUsage.setWorkStationCount(25L);
            marseilleUsage.setReservationCount(100L * scaleFactor); // Scale reservations by date range
            marseilleUsage.setAverageOccupancyRate(0.35); // 35% occupancy
            marseilleUsage.setTotalUsageHours(90.0 * scaleFactor); // Total usage hours
            byCity.put("Marseille", marseilleUsage);
            
            // Populate usage by day of week (placeholder data scaled by date range)
            Map<Integer, Double> byDayOfWeek = statistics.getUsageByDayOfWeek();
            byDayOfWeek.put(1, 100.0 * scaleFactor); // Monday
            byDayOfWeek.put(2, 80.0 * scaleFactor);  // Tuesday
            byDayOfWeek.put(3, 75.0 * scaleFactor);  // Wednesday
            byDayOfWeek.put(4, 60.0 * scaleFactor);  // Thursday
            byDayOfWeek.put(5, 90.0 * scaleFactor);  // Friday
            
            // Populate usage by hour of day (placeholder data scaled by date range)
            Map<Integer, Double> byHourOfDay = statistics.getUsageByHourOfDay();
            byHourOfDay.put(9, 90.0 * scaleFactor);  // 9 AM
            byHourOfDay.put(10, 85.0 * scaleFactor); // 10 AM
            byHourOfDay.put(11, 70.0 * scaleFactor); // 11 AM
            byHourOfDay.put(14, 80.0 * scaleFactor); // 2 PM
            byHourOfDay.put(15, 75.0 * scaleFactor); // 3 PM
            byHourOfDay.put(16, 60.0 * scaleFactor); // 4 PM
            
            // Note: In a production implementation, we would:
            // 1. Query centers, rooms, workstations, and reservations within the date range
            // 2. Calculate actual usage statistics based on the filtered data
            // 3. Implement proper aggregation queries for time-based metrics
            
            return statistics;
        } catch (Exception e) {
            log.error("Error calculating center usage statistics for period {} to {}: {}", 
                    startDate, endDate, e.getMessage(), e);
            // Return empty statistics rather than throwing exception
            return createEmptyCenterStatistics(
                    startDate.atStartOfDay(), 
                    endDate.atTime(23, 59, 59));
        }
    }

    @Override
    @Cacheable(value = "userActivityStatistics", key = "'all'", unless = "#result == null")
    public Object getUserActivityStatistics() {
        try {
            log.info("Calculating user activity statistics");
            
            // For now, return an empty map with proper initialization
            Map<String, Object> result = new HashMap<>();
            result.put("totalUsers", 0);
            result.put("activeUsers", 0);
            result.put("userActivities", new ArrayList<>());
            
            return result;
        } catch (Exception e) {
            log.error("Error calculating user activity statistics: {}", e.getMessage(), e);
            // Return empty map rather than throwing exception
            return new HashMap<String, Object>();
        }
    }

    @Override
    @Cacheable(value = "userActivityStatistics", key = "#userId", unless = "#result == null")
    public Object getUserActivityStatisticsById(Long userId) {
        try {
            log.info("Calculating user activity statistics for user {}", userId);
            
            // For now, return a basic map with user ID and activity count
            Map<String, Object> result = new HashMap<>();
            result.put("userId", userId);
            result.put("activityCount", 0);
            result.put("lastActivity", null);
            result.put("reservations", new ArrayList<>());
            
            return result;
        } catch (Exception e) {
            log.error("Error calculating user activity statistics for user {}: {}", 
                    userId, e.getMessage(), e);
            // Return basic map rather than throwing exception
            HashMap<String, Object> result = new HashMap<>();
            result.put("userId", userId);
            result.put("activityCount", 0);
            return result;
        }
    }

    @Override
    public AnalyticsResponse getAnalyticsData(String timeframe) {
        LocalDateTime startDate;
        LocalDateTime endDate = LocalDateTime.now();
        
        // Determine date range based on timeframe
        switch (timeframe) {
            case "day":
                startDate = LocalDateTime.of(LocalDate.now(), LocalTime.MIN);
                break;
            case "month":
                startDate = LocalDateTime.now().with(TemporalAdjusters.firstDayOfMonth()).with(LocalTime.MIN);
                break;
            case "year":
                startDate = LocalDateTime.now().with(TemporalAdjusters.firstDayOfYear()).with(LocalTime.MIN);
                break;
            case "week":
            default:
                startDate = LocalDateTime.now().with(TemporalAdjusters.previousOrSame(DayOfWeek.MONDAY)).with(LocalTime.MIN);
                break;
        }

        // Get reservations by day
        List<DailyReservationData> reservationsByDay = getReservationsByDay(startDate, endDate, timeframe);
        
        // Get workstation usage
        List<WorkstationUsageData> workstationUsage = getWorkstationUsage();
        
        // Get center comparison
        List<CenterComparisonData> centerComparison = getCenterComparison();
        
        // Get top users
        List<UserActivityData> topUsers = getTopUsers(startDate, endDate);
        
        return AnalyticsResponse.builder()
                .reservationsByDay(reservationsByDay)
                .workstationUsage(workstationUsage)
                .centerComparison(centerComparison)
                .topUsers(topUsers)
                .build();
    }

    @Override
    public List<ActivityLogResponse> getRecentActivity(int limit) {
        // In a real application, you would fetch this from an activity log table
        // For now, we'll create some sample data
        List<ActivityLogResponse> activityLogs = new ArrayList<>();
        
        // Get recent reservations
        List<Reservation> recentReservations = reservationRepository.findTop10ByOrderByCreatedAtDesc();
        
        for (Reservation reservation : recentReservations) {
            User user = reservation.getUser();
            String userName = user.getFirstName() + " " + user.getLastName();
            
            activityLogs.add(ActivityLogResponse.builder()
                    .user(userName)
                    .action("Created reservation")
                    .resource("Workstation #" + reservation.getWorkStation().getId())
                    .timestamp(reservation.getCreatedAt())
                    .build());
        }
        
        // Limit the results
        return activityLogs.stream()
                .limit(limit)
                .collect(Collectors.toList());
    }

    // Helper methods
    
    private List<DailyReservationData> getReservationsByDay(LocalDateTime startDate, LocalDateTime endDate, String timeframe) {
        List<DailyReservationData> result = new ArrayList<>();
        
        // Different grouping based on timeframe
        if ("day".equals(timeframe)) {
            // Group by hour
            Map<Integer, Long> hourCounts = reservationRepository
                    .findByStartTimeBetween(startDate, endDate)
                    .stream()
                    .collect(Collectors.groupingBy(
                            res -> res.getStartTime().getHour(),
                            Collectors.counting()
                    ));
            
            // Create data points for each hour
            for (int hour = 8; hour <= 18; hour++) {
                String hourLabel = hour + ":00";
                int count = hourCounts.getOrDefault(hour, 0L).intValue();
                
                result.add(new DailyReservationData(hourLabel, count));
            }
        } else if ("month".equals(timeframe)) {
            // Group by week
            for (int week = 1; week <= 4; week++) {
                LocalDateTime weekStart = startDate.plusWeeks(week - 1);
                LocalDateTime weekEnd = weekStart.plusWeeks(1);
                
                long count = reservationRepository
                        .findByStartTimeBetween(weekStart, weekEnd)
                        .size();
                
                result.add(new DailyReservationData("Week " + week, (int) count));
            }
        } else if ("year".equals(timeframe)) {
            // Group by month
            for (int month = 1; month <= 12; month++) {
                LocalDateTime monthStart = LocalDateTime.of(endDate.getYear(), month, 1, 0, 0);
                LocalDateTime monthEnd = monthStart.plusMonths(1).minusSeconds(1);
                
                long count = reservationRepository
                        .findByStartTimeBetween(monthStart, monthEnd)
                        .size();
                
                result.add(new DailyReservationData(
                        monthStart.getMonth().getDisplayName(TextStyle.SHORT, Locale.ENGLISH),
                        (int) count
                ));
            }
        } else {
            // Default: group by day of week
            for (DayOfWeek day : DayOfWeek.values()) {
                LocalDateTime dayStart = startDate.with(TemporalAdjusters.nextOrSame(day));
                LocalDateTime dayEnd = dayStart.plusDays(1).minusSeconds(1);
                
                long count = reservationRepository
                        .findByStartTimeBetween(dayStart, dayEnd)
                        .size();
                
                result.add(new DailyReservationData(
                        day.getDisplayName(TextStyle.FULL, Locale.ENGLISH),
                        (int) count
                ));
            }
        }
        
        return result;
    }
    
    private List<WorkstationUsageData> getWorkstationUsage() {
        List<WorkstationUsageData> result = new ArrayList<>();
        // All workstations are PCs, so just count all reservations for all workstations
        List<Long> workstationIds = workStationRepository.findAll().stream()
            .map(WorkStation::getId)
            .collect(Collectors.toList());
        int reservationCount = reservationRepository.countByWorkStationIdIn(workstationIds);
        result.add(new WorkstationUsageData("PC", reservationCount));
        return result;
    }
    
    private List<CenterComparisonData> getCenterComparison() {
        List<CenterComparisonData> result = new ArrayList<>();
        
        List<Center> centers = centerRepository.findAll();
        
        for (Center center : centers) {
            // Count workstations in this center
            List<WorkStation> workstations = workStationRepository.findByRoomCenterId(center.getId());
            int workstationCount = workstations.size();
            
            // Count reservations for these workstations
            List<Long> workstationIds = workstations.stream()
                    .map(WorkStation::getId)
                    .collect(Collectors.toList());
            
            int reservationCount = reservationRepository.countByWorkStationIdIn(workstationIds);
            
            result.add(new CenterComparisonData(
                    center.getName(),
                    workstationCount,
                    reservationCount
            ));
        }
        
        return result;
    }
    
    private List<UserActivityData> getTopUsers(LocalDateTime startDate, LocalDateTime endDate) {
        // Get all reservations in the time range
        List<Reservation> reservations = reservationRepository.findByStartTimeBetween(startDate, endDate);
        
        // Group by user and count
        Map<User, Long> userCounts = reservations.stream()
                .collect(Collectors.groupingBy(
                        Reservation::getUser,
                        Collectors.counting()
                ));
        
        // Sort by count (descending) and convert to DTOs
        return userCounts.entrySet().stream()
                .sorted(Map.Entry.<User, Long>comparingByValue().reversed())
                .limit(5) // Top 5 users
                .map(entry -> new UserActivityData(
                        entry.getKey().getFirstName() + " " + entry.getKey().getLastName(),
                        entry.getValue().intValue()
                ))
                .collect(Collectors.toList());
    }
}