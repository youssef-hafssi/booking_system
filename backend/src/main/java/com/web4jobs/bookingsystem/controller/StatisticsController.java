package com.web4jobs.bookingsystem.controller;

import com.web4jobs.bookingsystem.dto.statistics.CenterUsageStatistics;
import com.web4jobs.bookingsystem.dto.statistics.ReservationStatistics;
import com.web4jobs.bookingsystem.dto.statistics.WorkStationUsageStatistics;
import com.web4jobs.bookingsystem.dto.response.ActivityLogResponse;
import com.web4jobs.bookingsystem.dto.response.AnalyticsResponse;
import com.web4jobs.bookingsystem.dto.response.ReservationStatsResponse;
import com.web4jobs.bookingsystem.service.StatisticsService;
import com.web4jobs.bookingsystem.service.ReservationService;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

/**
 * REST controller for statistics and reporting.
 * Provides endpoints for retrieving various statistics about workstations, reservations, and usage.
 */
@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class StatisticsController {

    private static final Logger logger = LoggerFactory.getLogger(StatisticsController.class);

    private final StatisticsService statisticsService;
    private final ReservationService reservationService;

    /**
     * Get overall reservation statistics.
     *
     * @return Reservation statistics
     */
    @GetMapping("/statistics/reservations")
    public ResponseEntity<ReservationStatistics> getReservationStatistics() {
        ReservationStatistics statistics = statisticsService.getReservationStatistics();
        return ResponseEntity.ok(statistics);
    }

    /**
     * Get reservation statistics for a specific date range.
     *
     * @param startDate The start date
     * @param endDate The end date
     * @return Reservation statistics for the date range
     */
    @GetMapping("/reservations/date-range")
    public ResponseEntity<ReservationStatistics> getReservationStatisticsByDateRange(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate) {
        ReservationStatistics statistics = statisticsService.getReservationStatisticsByDateRange(startDate, endDate);
        return ResponseEntity.ok(statistics);
    }

    /**
     * Get workstation usage statistics.
     *
     * @return Workstation usage statistics
     */
    @GetMapping("/workstations/usage")
    public ResponseEntity<WorkStationUsageStatistics> getWorkStationUsageStatistics() {
        WorkStationUsageStatistics statistics = statisticsService.getWorkStationUsageStatistics();
        return ResponseEntity.ok(statistics);
    }

    /**
     * Get workstation usage statistics for a specific center.
     *
     * @param centerId The center ID
     * @return Workstation usage statistics for the center
     */
    @GetMapping("/workstations/usage/center/{centerId}")
    public ResponseEntity<WorkStationUsageStatistics> getWorkStationUsageStatisticsByCenter(
            @PathVariable Long centerId) {
        WorkStationUsageStatistics statistics = statisticsService.getWorkStationUsageStatisticsByCenter(centerId);
        return ResponseEntity.ok(statistics);
    }

    /**
     * Get center usage statistics.
     *
     * @return Center usage statistics
     */
    @GetMapping("/centers/usage")
    public ResponseEntity<CenterUsageStatistics> getCenterUsageStatistics() {
        CenterUsageStatistics statistics = statisticsService.getCenterUsageStatistics();
        return ResponseEntity.ok(statistics);
    }

    /**
     * Get center usage statistics for a specific date range.
     *
     * @param startDate The start date
     * @param endDate The end date
     * @return Center usage statistics for the date range
     */
    @GetMapping("/centers/usage/date-range")
    public ResponseEntity<CenterUsageStatistics> getCenterUsageStatisticsByDateRange(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate) {
        CenterUsageStatistics statistics = statisticsService.getCenterUsageStatisticsByDateRange(startDate, endDate);
        return ResponseEntity.ok(statistics);
    }

    /**
     * Get user activity statistics.
     *
     * @return User activity statistics
     */
    @GetMapping("/users/activity")
    public ResponseEntity<Object> getUserActivityStatistics() {
        Object statistics = statisticsService.getUserActivityStatistics();
        return ResponseEntity.ok(statistics);
    }

    /**
     * Get user activity statistics for a specific user.
     *
     * @param userId The user ID
     * @return User activity statistics for the user
     */
    @GetMapping("/users/{userId}/activity")
    public ResponseEntity<Object> getUserActivityStatisticsById(@PathVariable Long userId) {
        Object statistics = statisticsService.getUserActivityStatisticsById(userId);
        return ResponseEntity.ok(statistics);
    }

    /**
     * Get reservation statistics.
     *
     * @return Reservation statistics
     */
    @GetMapping("/reservations/stats")
    @PreAuthorize("hasAnyRole('ADMIN', 'CENTER_MANAGER', 'ASSET_MANAGER', 'PEDAGOGICAL_MANAGER', 'EXECUTIVE_DIRECTOR')")
    public ResponseEntity<ReservationStatsResponse> getReservationStats() {
        logger.info("Fetching reservation statistics");
        ReservationStatsResponse stats = reservationService.getReservationStats();
        return ResponseEntity.ok(stats);
    }

    /**
     * Get detailed analytics data.
     *
     * @param timeframe The timeframe for the analytics (day, week, month, year)
     * @return Analytics data
     */
    @GetMapping("/statistics")
    @PreAuthorize("hasAnyRole('ADMIN', 'CENTER_MANAGER', 'ASSET_MANAGER', 'PEDAGOGICAL_MANAGER', 'EXECUTIVE_DIRECTOR')")
    public ResponseEntity<AnalyticsResponse> getAnalytics(@RequestParam(defaultValue = "week") String timeframe) {
        logger.info("Fetching analytics data for timeframe: {}", timeframe);
        AnalyticsResponse analytics = statisticsService.getAnalyticsData(timeframe);
        return ResponseEntity.ok(analytics);
    }

    /**
     * Get recent activity logs.
     *
     * @param limit Maximum number of logs to return
     * @return List of activity logs
     */
    @GetMapping("/activity/recent")
    @PreAuthorize("hasAnyRole('ADMIN', 'CENTER_MANAGER', 'ASSET_MANAGER', 'PEDAGOGICAL_MANAGER', 'EXECUTIVE_DIRECTOR')")
    public ResponseEntity<List<ActivityLogResponse>> getRecentActivity(
            @RequestParam(defaultValue = "10") int limit) {
        logger.info("Fetching recent activity logs, limit: {}", limit);
        List<ActivityLogResponse> activityLogs = statisticsService.getRecentActivity(limit);
        return ResponseEntity.ok(activityLogs);
    }
}