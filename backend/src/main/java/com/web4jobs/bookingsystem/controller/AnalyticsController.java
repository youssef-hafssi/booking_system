package com.web4jobs.bookingsystem.controller;

import com.web4jobs.bookingsystem.dto.reservation.ReservationResponse;
import com.web4jobs.bookingsystem.service.AnalyticsService;
import com.web4jobs.bookingsystem.service.ReservationService;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * Enhanced Analytics Controller with advanced filtering and export capabilities.
 */
@RestController
@RequestMapping("/api/analytics")
@RequiredArgsConstructor
public class AnalyticsController {

    private final AnalyticsService analyticsService;
    private final ReservationService reservationService;

    /**
     * Get filtered reservations with advanced filtering options.
     *
     * @param centerId Filter by center (optional)
     * @param userId Filter by user (optional)
     * @param startDate Start date for filtering (optional)
     * @param endDate End date for filtering (optional)
     * @param status Filter by reservation status (optional)
     * @param timeType Filter by time type: 'past', 'upcoming', 'all' (default: 'all')
     * @return Filtered reservations
     */
    @GetMapping("/reservations/filtered")
    @PreAuthorize("hasAnyRole('ADMIN', 'CENTER_MANAGER', 'ASSET_MANAGER', 'PEDAGOGICAL_MANAGER', 'EXECUTIVE_DIRECTOR')")
    public ResponseEntity<List<ReservationResponse>> getFilteredReservations(
            @RequestParam(required = false) Long centerId,
            @RequestParam(required = false) Long userId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate,
            @RequestParam(required = false) String status,
            @RequestParam(defaultValue = "all") String timeType) {
        
        List<ReservationResponse> reservations = analyticsService.getFilteredReservations(
                centerId, userId, startDate, endDate, status, timeType);
        
        return ResponseEntity.ok(reservations);
    }

    /**
     * Get analytics data for filtered reservations (for charts/histograms).
     *
     * @param centerId Filter by center (optional)
     * @param userId Filter by user (optional)
     * @param startDate Start date for filtering (optional)
     * @param endDate End date for filtering (optional)
     * @param groupBy Group data by: 'day', 'week', 'month', 'user', 'center', 'status'
     * @param timeType Filter by time type: 'past', 'upcoming', 'all'
     * @return Analytics data for visualization
     */
    @GetMapping("/reservations/chart-data")
    @PreAuthorize("hasAnyRole('ADMIN', 'CENTER_MANAGER', 'ASSET_MANAGER', 'PEDAGOGICAL_MANAGER', 'EXECUTIVE_DIRECTOR')")
    public ResponseEntity<Map<String, Object>> getReservationChartData(
            @RequestParam(required = false) Long centerId,
            @RequestParam(required = false) Long userId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate,
            @RequestParam(defaultValue = "day") String groupBy,
            @RequestParam(defaultValue = "all") String timeType) {
        
        Map<String, Object> chartData = analyticsService.getReservationChartData(
                centerId, userId, startDate, endDate, groupBy, timeType);
        
        return ResponseEntity.ok(chartData);
    }

    /**
     * Export filtered reservations as PDF.
     *
     * @param centerId Filter by center (optional)
     * @param userId Filter by user (optional)
     * @param startDate Start date for filtering (optional)
     * @param endDate End date for filtering (optional)
     * @param status Filter by reservation status (optional)
     * @param timeType Filter by time type: 'past', 'upcoming', 'all'
     * @return PDF file containing filtered reservations
     */
    @GetMapping("/reservations/export/pdf")
    @PreAuthorize("hasAnyRole('ADMIN', 'CENTER_MANAGER', 'ASSET_MANAGER', 'PEDAGOGICAL_MANAGER', 'EXECUTIVE_DIRECTOR')")
    public ResponseEntity<byte[]> exportReservationsToPdf(
            @RequestParam(required = false) Long centerId,
            @RequestParam(required = false) Long userId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate,
            @RequestParam(required = false) String status,
            @RequestParam(defaultValue = "all") String timeType) {
        
        byte[] pdfBytes = analyticsService.exportReservationsToPdf(
                centerId, userId, startDate, endDate, status, timeType);
        
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_PDF);
        headers.setContentDispositionFormData("attachment", "reservations-report.pdf");
        headers.setContentLength(pdfBytes.length);
        
        return new ResponseEntity<>(pdfBytes, headers, HttpStatus.OK);
    }

    /**
     * Export filtered reservations as PDF with charts.
     *
     * @param request Request containing filters and chart images
     * @return PDF file containing filtered reservations with charts
     */
    @PostMapping("/reservations/export/pdf-with-charts")
    @PreAuthorize("hasAnyRole('ADMIN', 'CENTER_MANAGER', 'ASSET_MANAGER', 'PEDAGOGICAL_MANAGER', 'EXECUTIVE_DIRECTOR')")
    public ResponseEntity<byte[]> exportReservationsToPdfWithCharts(@RequestBody Map<String, Object> request) {
        
        if (request == null) {
            throw new IllegalArgumentException("Request body cannot be null");
        }
        
        // Extract filters
        Map<String, Object> filters = (Map<String, Object>) request.get("filters");
        if (filters == null) {
            filters = new HashMap<>();
        }
        Long centerId = filters.get("centerId") != null ? Long.valueOf(filters.get("centerId").toString()) : null;
        Long userId = filters.get("userId") != null ? Long.valueOf(filters.get("userId").toString()) : null;
        LocalDate startDate = filters.get("startDate") != null ? LocalDate.parse(filters.get("startDate").toString()) : null;
        LocalDate endDate = filters.get("endDate") != null ? LocalDate.parse(filters.get("endDate").toString()) : null;
        String status = filters.get("status") != null ? filters.get("status").toString() : null;
        String timeType = filters.get("timeType") != null ? filters.get("timeType").toString() : "all";
        
        // Extract charts
        List<Map<String, Object>> charts = (List<Map<String, Object>>) request.get("charts");
        
        byte[] pdfBytes = analyticsService.exportReservationsToPdfWithCharts(
                centerId, userId, startDate, endDate, status, timeType, charts);
        
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_PDF);
        headers.setContentDispositionFormData("attachment", "reservations-report-with-charts.pdf");
        headers.setContentLength(pdfBytes.length);
        
        return new ResponseEntity<>(pdfBytes, headers, HttpStatus.OK);
    }

    /**
     * Get user statistics by center.
     *
     * @param centerId Center ID (optional, if not provided returns all centers)
     * @return User statistics grouped by center
     */
    @GetMapping("/users/by-center")
    @PreAuthorize("hasAnyRole('ADMIN', 'CENTER_MANAGER', 'ASSET_MANAGER', 'PEDAGOGICAL_MANAGER', 'EXECUTIVE_DIRECTOR')")
    public ResponseEntity<Map<String, Object>> getUserStatsByCenter(
            @RequestParam(required = false) Long centerId) {
        
        Map<String, Object> userStats = analyticsService.getUserStatsByCenter(centerId);
        return ResponseEntity.ok(userStats);
    }

    /**
     * Get reservation trends over time.
     *
     * @param centerId Filter by center (optional)
     * @param days Number of days to look back (default: 30)
     * @return Reservation trends data
     */
    @GetMapping("/reservations/trends")
    @PreAuthorize("hasAnyRole('ADMIN', 'CENTER_MANAGER', 'ASSET_MANAGER', 'PEDAGOGICAL_MANAGER', 'EXECUTIVE_DIRECTOR')")
    public ResponseEntity<Map<String, Object>> getReservationTrends(
            @RequestParam(required = false) Long centerId,
            @RequestParam(defaultValue = "30") int days) {

        Map<String, Object> trends = analyticsService.getReservationTrends(centerId, days);
        return ResponseEntity.ok(trends);
    }
}