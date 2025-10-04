package com.web4jobs.bookingsystem.service;

import com.web4jobs.bookingsystem.dto.statistics.CenterUsageStatistics;
import com.web4jobs.bookingsystem.dto.statistics.ReservationStatistics;
import com.web4jobs.bookingsystem.dto.statistics.WorkStationUsageStatistics;
import com.web4jobs.bookingsystem.dto.response.ActivityLogResponse;
import com.web4jobs.bookingsystem.dto.response.AnalyticsResponse;

import java.time.LocalDate;
import java.util.List;

/**
 * Service interface for statistics and reporting functionality.
 */
public interface StatisticsService {

    /**
     * Get overall reservation statistics.
     *
     * @return Reservation statistics
     */
    ReservationStatistics getReservationStatistics();

    /**
     * Get reservation statistics for a specific date range.
     *
     * @param startDate The start date
     * @param endDate The end date
     * @return Reservation statistics for the date range
     */
    ReservationStatistics getReservationStatisticsByDateRange(LocalDate startDate, LocalDate endDate);

    /**
     * Get workstation usage statistics.
     *
     * @return Workstation usage statistics
     */
    WorkStationUsageStatistics getWorkStationUsageStatistics();

    /**
     * Get workstation usage statistics for a specific center.
     *
     * @param centerId The center ID
     * @return Workstation usage statistics for the center
     */
    WorkStationUsageStatistics getWorkStationUsageStatisticsByCenter(Long centerId);

    /**
     * Get center usage statistics.
     *
     * @return Center usage statistics
     */
    CenterUsageStatistics getCenterUsageStatistics();

    /**
     * Get center usage statistics for a specific date range.
     *
     * @param startDate The start date
     * @param endDate The end date
     * @return Center usage statistics for the date range
     */
    CenterUsageStatistics getCenterUsageStatisticsByDateRange(LocalDate startDate, LocalDate endDate);

    /**
     * Get user activity statistics.
     *
     * @return User activity statistics
     */
    Object getUserActivityStatistics();

    /**
     * Get user activity statistics for a specific user.
     *
     * @param userId The user ID
     * @return User activity statistics for the user
     */
    Object getUserActivityStatisticsById(Long userId);

    /**
     * Get analytics data for the specified timeframe.
     *
     * @param timeframe The timeframe (day, week, month, year)
     * @return Analytics data
     */
    AnalyticsResponse getAnalyticsData(String timeframe);

    /**
     * Get recent activity logs.
     *
     * @param limit Maximum number of logs to return
     * @return List of activity logs
     */
    List<ActivityLogResponse> getRecentActivity(int limit);
}