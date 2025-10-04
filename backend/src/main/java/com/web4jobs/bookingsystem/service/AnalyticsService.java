package com.web4jobs.bookingsystem.service;

import com.web4jobs.bookingsystem.dto.reservation.ReservationResponse;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

/**
 * Service interface for enhanced analytics functionality.
 * Provides advanced filtering, visualization data, and export capabilities.
 */
public interface AnalyticsService {

    /**
     * Get filtered reservations based on multiple criteria.
     *
     * @param centerId Filter by center (optional)
     * @param userId Filter by user (optional)
     * @param startDate Start date for filtering (optional)
     * @param endDate End date for filtering (optional)
     * @param status Filter by reservation status (optional)
     * @param timeType Filter by time type: 'past', 'upcoming', 'all'
     * @return List of filtered reservation responses
     */
    List<ReservationResponse> getFilteredReservations(
            Long centerId, Long userId, LocalDate startDate, LocalDate endDate, 
            String status, String timeType);

    /**
     * Get chart data for filtered reservations.
     *
     * @param centerId Filter by center (optional)
     * @param userId Filter by user (optional)
     * @param startDate Start date for filtering (optional)
     * @param endDate End date for filtering (optional)
     * @param groupBy Group data by: 'day', 'week', 'month', 'user', 'center', 'status'
     * @param timeType Filter by time type: 'past', 'upcoming', 'all'
     * @return Chart data structure for visualization
     */
    Map<String, Object> getReservationChartData(
            Long centerId, Long userId, LocalDate startDate, LocalDate endDate, 
            String groupBy, String timeType);

    /**
     * Export filtered reservations as PDF.
     *
     * @param centerId Filter by center (optional)
     * @param userId Filter by user (optional)
     * @param startDate Start date for filtering (optional)
     * @param endDate End date for filtering (optional)
     * @param status Filter by reservation status (optional)
     * @param timeType Filter by time type: 'past', 'upcoming', 'all'
     * @return PDF file as byte array
     */
    byte[] exportReservationsToPdf(
            Long centerId, Long userId, LocalDate startDate, LocalDate endDate, 
            String status, String timeType);

    /**
     * Export filtered reservations as PDF with charts.
     *
     * @param centerId Filter by center (optional)
     * @param userId Filter by user (optional)
     * @param startDate Start date for filtering (optional)
     * @param endDate End date for filtering (optional)
     * @param status Filter by reservation status (optional)
     * @param timeType Filter by time type: 'past', 'upcoming', 'all'
     * @param charts List of chart data with base64 images
     * @return PDF file as byte array
     */
    byte[] exportReservationsToPdfWithCharts(
            Long centerId, Long userId, LocalDate startDate, LocalDate endDate, 
            String status, String timeType, List<Map<String, Object>> charts);

    /**
     * Get user statistics grouped by center.
     *
     * @param centerId Center ID (optional, if not provided returns all centers)
     * @return User statistics by center
     */
    Map<String, Object> getUserStatsByCenter(Long centerId);

    /**
     * Get reservation trends over time.
     *
     * @param centerId Filter by center (optional)
     * @param days Number of days to look back
     * @return Reservation trends data
     */
    Map<String, Object> getReservationTrends(Long centerId, int days);
}