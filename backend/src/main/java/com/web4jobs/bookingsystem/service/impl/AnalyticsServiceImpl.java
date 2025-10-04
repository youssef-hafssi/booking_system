package com.web4jobs.bookingsystem.service.impl;

import com.web4jobs.bookingsystem.dto.reservation.ReservationResponse;
import com.web4jobs.bookingsystem.mapper.ReservationMapper;
import com.web4jobs.bookingsystem.model.*;
import com.web4jobs.bookingsystem.repository.*;
import com.web4jobs.bookingsystem.service.AnalyticsService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.io.ByteArrayOutputStream;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Map;
import java.util.HashMap;
import java.util.Optional;
import java.util.ArrayList;
import java.util.stream.Collectors;

// PDF generation imports
import com.itextpdf.text.*;
import com.itextpdf.text.pdf.*;
import java.util.Base64;

/**
 * Implementation of enhanced analytics service with filtering, visualization, and export capabilities.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class AnalyticsServiceImpl implements AnalyticsService {

    private final ReservationRepository reservationRepository;
    private final UserRepository userRepository;
    private final CenterRepository centerRepository;
    private final ReservationMapper reservationMapper;

    @Override
    public List<ReservationResponse> getFilteredReservations(
            Long centerId, Long userId, LocalDate startDate, LocalDate endDate, 
            String status, String timeType) {
        
        log.info("Filtering reservations with criteria: centerId={}, userId={}, startDate={}, endDate={}, status={}, timeType={}", 
                centerId, userId, startDate, endDate, status, timeType);

        // Start with all reservations and log the initial count
        List<Reservation> reservations = reservationRepository.findAll();
        log.info("Total reservations in database: {}", reservations.size());

        // Convert LocalDate to LocalDateTime for time comparisons
        LocalDateTime startDateTime = startDate != null ? startDate.atStartOfDay() : null;
        LocalDateTime endDateTime = endDate != null ? endDate.atTime(23, 59, 59) : null;
        LocalDateTime now = LocalDateTime.now();

        // Apply filters
        reservations = reservations.stream()
                .filter(reservation -> {
                    // Filter by center
                    if (centerId != null) {
                        Long reservationCenterId = reservation.getWorkStation() != null &&
                                reservation.getWorkStation().getRoom() != null &&
                                reservation.getWorkStation().getRoom().getCenter() != null
                                ? reservation.getWorkStation().getRoom().getCenter().getId()
                                : null;
                        if (!centerId.equals(reservationCenterId)) {
                            return false;
                        }
                    }

                    // Filter by user
                    if (userId != null && !userId.equals(reservation.getUser().getId())) {
                        return false;
                    }

                    // Filter by date range
                    if (startDateTime != null && reservation.getStartTime().isBefore(startDateTime)) {
                        return false;
                    }
                    if (endDateTime != null && reservation.getEndTime().isAfter(endDateTime)) {
                        return false;
                    }

                    // Filter by status
                    if (status != null && !status.equalsIgnoreCase("all")) {
                        try {
                            ReservationStatus reservationStatus = ReservationStatus.valueOf(status.toUpperCase());
                            if (!reservationStatus.equals(reservation.getStatus())) {
                                return false;
                            }
                        } catch (IllegalArgumentException e) {
                            log.warn("Invalid status filter: {}", status);
                            return false;
                        }
                    }

                    // Filter by time type
                    switch (timeType.toLowerCase()) {
                        case "past":
                            return reservation.getEndTime().isBefore(now);
                        case "upcoming":
                            return reservation.getStartTime().isAfter(now);
                        case "all":
                        default:
                            return true;
                    }
                })
                .sorted((r1, r2) -> r2.getCreatedAt().compareTo(r1.getCreatedAt())) // Sort by creation date, newest first
                .collect(Collectors.toList());

        log.info("Found {} reservations matching criteria", reservations.size());

        return reservations.stream()
                .map(reservationMapper::toReservationResponse)
                .collect(Collectors.toList());
    }

    @Override
    public Map<String, Object> getReservationChartData(
            Long centerId, Long userId, LocalDate startDate, LocalDate endDate, 
            String groupBy, String timeType) {
        
        log.info("Generating chart data with groupBy={}", groupBy);

        List<ReservationResponse> reservations = getFilteredReservations(
                centerId, userId, startDate, endDate, null, timeType);

        Map<String, Object> chartData = new HashMap<>();
        
        switch (groupBy.toLowerCase()) {
            case "day":
                chartData = generateDayChartData(reservations);
                break;
            case "week":
                chartData = generateWeekChartData(reservations);
                break;
            case "month":
                chartData = generateMonthChartData(reservations);
                break;
            case "user":
                chartData = generateUserChartData(reservations);
                break;
            case "center":
                chartData = generateCenterChartData(reservations);
                break;
            case "status":
                chartData = generateStatusChartData(reservations);
                break;
            default:
                chartData = generateDayChartData(reservations);
        }

        chartData.put("totalCount", reservations.size());
        chartData.put("groupBy", groupBy);
        Map<String, Object> filters = new HashMap<>();
        filters.put("centerId", centerId);
        filters.put("userId", userId);
        filters.put("startDate", startDate);
        filters.put("endDate", endDate);
        filters.put("timeType", timeType);
        chartData.put("filters", filters);

        return chartData;
    }

    @Override
    public byte[] exportReservationsToPdf(
            Long centerId, Long userId, LocalDate startDate, LocalDate endDate, 
            String status, String timeType) {
        
        List<ReservationResponse> reservations = getFilteredReservations(
                centerId, userId, startDate, endDate, status, timeType);

        try {
            Document document = new Document(PageSize.A4, 50, 50, 50, 50);
            ByteArrayOutputStream baos = new ByteArrayOutputStream();
            PdfWriter writer = PdfWriter.getInstance(document, baos);

            document.open();

            // Title
            Font titleFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 18, BaseColor.BLACK);
            Paragraph title = new Paragraph("Reservations Report", titleFont);
            title.setAlignment(Element.ALIGN_CENTER);
            title.setSpacingAfter(20);
            document.add(title);

            // Filters summary
            Font headerFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 12, BaseColor.BLACK);
            Font normalFont = FontFactory.getFont(FontFactory.HELVETICA, 10, BaseColor.BLACK);

            Paragraph filterInfo = new Paragraph("Filter Information:", headerFont);
            filterInfo.setSpacingAfter(10);
            document.add(filterInfo);

            StringBuilder filterText = new StringBuilder();
            if (centerId != null) filterText.append("Center ID: ").append(centerId).append("\n");
            if (userId != null) filterText.append("User ID: ").append(userId).append("\n");
            if (startDate != null) filterText.append("Start Date: ").append(startDate).append("\n");
            if (endDate != null) filterText.append("End Date: ").append(endDate).append("\n");
            if (status != null) filterText.append("Status: ").append(status).append("\n");
            filterText.append("Time Type: ").append(timeType).append("\n");
            filterText.append("Total Records: ").append(reservations.size());

            Paragraph filters = new Paragraph(filterText.toString(), normalFont);
            filters.setSpacingAfter(10);
            document.add(filters);

            // Note: Reservations table will be added after charts

            document.close();
            writer.close();

            log.info("Generated PDF report with {} reservations", reservations.size());
            return baos.toByteArray();

        } catch (Exception e) {
            log.error("Error generating PDF report", e);
            throw new RuntimeException("Failed to generate PDF report", e);
        }
    }

    @Override
    public byte[] exportReservationsToPdfWithCharts(
            Long centerId, Long userId, LocalDate startDate, LocalDate endDate, 
            String status, String timeType, List<Map<String, Object>> charts) {
        
        List<ReservationResponse> reservations = getFilteredReservations(
                centerId, userId, startDate, endDate, status, timeType);
        
        log.info("PDF Generation - Found {} reservations after filtering", reservations.size());
        if (reservations.isEmpty()) {
            log.warn("No reservations found for PDF generation with filters: centerId={}, userId={}, startDate={}, endDate={}, status={}, timeType={}", 
                    centerId, userId, startDate, endDate, status, timeType);
        } else {
            log.info("Sample reservation for PDF: User={}, WorkStation={}", 
                    reservations.get(0).getUser() != null ? reservations.get(0).getUser().getFirstName() : "null",
                    reservations.get(0).getWorkStation() != null ? reservations.get(0).getWorkStation().getName() : "null");
        }

        try {
            Document document = new Document(PageSize.A4, 50, 50, 50, 50);
            ByteArrayOutputStream baos = new ByteArrayOutputStream();
            PdfWriter writer = PdfWriter.getInstance(document, baos);

            document.open();

            // Title
            Font titleFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 18, BaseColor.BLACK);
            Paragraph title = new Paragraph("Reservations Report with Charts", titleFont);
            title.setAlignment(Element.ALIGN_CENTER);
            title.setSpacingAfter(20);
            document.add(title);

            // Filters summary
            Font headerFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 12, BaseColor.BLACK);
            Font normalFont = FontFactory.getFont(FontFactory.HELVETICA, 10, BaseColor.BLACK);

            Paragraph filterInfo = new Paragraph("Filter Information:", headerFont);
            filterInfo.setSpacingAfter(10);
            document.add(filterInfo);

            StringBuilder filterText = new StringBuilder();
            if (centerId != null) filterText.append("Center ID: ").append(centerId).append("\n");
            if (userId != null) filterText.append("User ID: ").append(userId).append("\n");
            if (startDate != null) filterText.append("Start Date: ").append(startDate).append("\n");
            if (endDate != null) filterText.append("End Date: ").append(endDate).append("\n");
            if (status != null) filterText.append("Status: ").append(status).append("\n");
            filterText.append("Time Type: ").append(timeType).append("\n");
            filterText.append("Total Records: ").append(reservations.size());

            Paragraph filterDetails = new Paragraph(filterText.toString(), normalFont);
            filterDetails.setSpacingAfter(20);
            document.add(filterDetails);

            // Add charts if available (excluding pie charts)
            if (charts != null && !charts.isEmpty()) {
                // Filter out pie charts and doughnut charts completely
                List<Map<String, Object>> filteredCharts = charts.stream()
                    .filter(chart -> {
                        String chartType = chart.get("type") != null ? chart.get("type").toString().toLowerCase() : "";
                        String chartTitle = chart.get("title") != null ? chart.get("title").toString().toLowerCase() : "";
                        
                        // Log chart details for debugging
                        log.info("Checking chart - Type: '{}', Title: '{}'", chartType, chartTitle);
                        
                        // ONLY ALLOW BAR CHARTS - exclude everything else
                        boolean isBarChart = chartType.contains("bar") || 
                                           chartType.equals("bar") ||
                                           chartTitle.contains("chart") ||
                                           chartTitle.contains("comparison") ||
                                           chartTitle.contains("analysis");
                                           
                        // Exclude everything that's not explicitly a bar chart
                        boolean isPieChart = !isBarChart;
                        
                        if (isPieChart) {
                            log.info("EXCLUDING chart - Type: '{}', Title: '{}'", chartType, chartTitle);
                        } else {
                            log.info("INCLUDING chart - Type: '{}', Title: '{}'", chartType, chartTitle);
                        }
                        
                        return !isPieChart;
                    })
                    .collect(Collectors.toList());

                if (!filteredCharts.isEmpty()) {
                    log.info("Processing {} charts for PDF export (filtered from {} total)", filteredCharts.size(), charts.size());
                Paragraph chartsHeader = new Paragraph("Charts and Visualizations:", headerFont);
                chartsHeader.setSpacingAfter(10);
                document.add(chartsHeader);

                    for (int i = 0; i < filteredCharts.size(); i++) {
                        Map<String, Object> chart = filteredCharts.get(i);
                    try {
                        log.debug("Processing chart {}: {}", i + 1, chart.get("title"));
                        String title_str = (String) chart.get("title");
                        String base64Image = (String) chart.get("image");
                        
                        // Add chart title regardless of image
                        if (title_str != null && !title_str.isEmpty()) {
                            Paragraph chartTitle = new Paragraph(title_str, headerFont);
                            chartTitle.setAlignment(Element.ALIGN_CENTER);
                            chartTitle.setSpacingBefore(10);
                            chartTitle.setSpacingAfter(5);
                            document.add(chartTitle);
                        }
                        
                        if (base64Image != null && base64Image.startsWith("data:image/")) {
                            // Remove data URL prefix
                            String base64Data = base64Image.substring(base64Image.indexOf(',') + 1);
                            byte[] imageBytes = Base64.getDecoder().decode(base64Data);
                            
                            // Create image
                            Image pdfImage = Image.getInstance(imageBytes);
                            
                            // Scale image to fit page
                            float maxWidth = document.getPageSize().getWidth() - 100;
                            float maxHeight = 300;
                            
                            if (pdfImage.getWidth() > maxWidth) {
                                float scale = maxWidth / pdfImage.getWidth();
                                pdfImage.scalePercent(scale * 100);
                            }
                            if (pdfImage.getScaledHeight() > maxHeight) {
                                float scale = maxHeight / pdfImage.getScaledHeight();
                                pdfImage.scalePercent(scale * 100);
                            }
                            
                            // Center the image
                            pdfImage.setAlignment(Element.ALIGN_CENTER);
                            pdfImage.setSpacingAfter(20);
                            document.add(pdfImage);
                        } else {
                            // Add placeholder for chart when no image is available
                            Paragraph placeholder = new Paragraph("[Chart: " + (title_str != null ? title_str : "Untitled") + " - Image not available]", normalFont);
                            placeholder.setAlignment(Element.ALIGN_CENTER);
                            placeholder.setSpacingAfter(20);
                            document.add(placeholder);
                        }
                    } catch (Exception e) {
                        log.warn("Failed to add chart {} to PDF: {}", i + 1, e.getMessage(), e);
                        // Continue with other charts
                    }
                    }
                }
            }

            // Add reservations table after charts
            Paragraph tableHeader = new Paragraph("Reservations Details:", headerFont);
            tableHeader.setSpacingBefore(20);
            tableHeader.setSpacingAfter(10);
            document.add(tableHeader);

            // Create table
            PdfPTable table = new PdfPTable(7); // 7 columns
            table.setWidthPercentage(100);
            table.setWidths(new float[]{1f, 2f, 1.5f, 1.5f, 2f, 2.5f, 1.5f});

            // Add headers
            Font headerCellFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 9, BaseColor.WHITE);
            BaseColor headerColor = new BaseColor(52, 152, 219); // Blue header

            String[] headers = {"ID", "User", "Center", "Room", "Workstation", "Time Period", "Status"};
            for (String header : headers) {
                PdfPCell cell = new PdfPCell(new Phrase(header, headerCellFont));
                cell.setBackgroundColor(headerColor);
                cell.setPadding(8);
                cell.setHorizontalAlignment(Element.ALIGN_CENTER);
                table.addCell(cell);
            }

            // Add data rows
            Font cellFont = FontFactory.getFont(FontFactory.HELVETICA, 8, BaseColor.BLACK);
            DateTimeFormatter formatter = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm");
            
            for (ReservationResponse reservation : reservations) {
                // ID
                String reservationId = reservation.getId() != null ? reservation.getId().toString() : "N/A";
                table.addCell(new PdfPCell(new Phrase(reservationId, cellFont)));
                
                // User name
                String userName = "N/A";
                if (reservation.getUser() != null) {
                    String firstName = reservation.getUser().getFirstName() != null ? reservation.getUser().getFirstName() : "";
                    String lastName = reservation.getUser().getLastName() != null ? reservation.getUser().getLastName() : "";
                    userName = (firstName + " " + lastName).trim();
                    if (userName.isEmpty()) userName = "N/A";
                }
                table.addCell(new PdfPCell(new Phrase(userName, cellFont)));
                
                // Center name
                String centerName = "N/A";
                if (reservation.getWorkStation() != null && reservation.getWorkStation().getCenterName() != null) {
                    centerName = reservation.getWorkStation().getCenterName();
                }
                table.addCell(new PdfPCell(new Phrase(centerName, cellFont)));
                
                // Room name
                String roomName = "N/A";
                if (reservation.getWorkStation() != null && reservation.getWorkStation().getRoomName() != null) {
                    roomName = reservation.getWorkStation().getRoomName();
                }
                table.addCell(new PdfPCell(new Phrase(roomName, cellFont)));
                
                // Workstation name
                String workstationName = "N/A";
                if (reservation.getWorkStation() != null && reservation.getWorkStation().getName() != null) {
                    workstationName = reservation.getWorkStation().getName();
                }
                table.addCell(new PdfPCell(new Phrase(workstationName, cellFont)));
                
                // Time Period (Start - End)
                String timePeriod = "N/A";
                if (reservation.getStartTime() != null && reservation.getEndTime() != null) {
                    timePeriod = reservation.getStartTime().format(formatter) + " - " + 
                               reservation.getEndTime().format(formatter);
                }
                table.addCell(new PdfPCell(new Phrase(timePeriod, cellFont)));
                
                // Status
                String reservationStatus = reservation.getStatus() != null ? reservation.getStatus().toString() : "N/A";
                table.addCell(new PdfPCell(new Phrase(reservationStatus, cellFont)));
            }

            document.add(table);

            // Footer
            Paragraph footer = new Paragraph("Generated on: " + 
                    LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss")), 
                    normalFont);
            footer.setAlignment(Element.ALIGN_RIGHT);
            footer.setSpacingBefore(20);
            document.add(footer);

            document.close();
            writer.close();

            log.info("Generated PDF report with {} reservations and {} charts", reservations.size(), 
                    charts != null ? charts.size() : 0);
            return baos.toByteArray();

        } catch (Exception e) {
            log.error("Error generating PDF report with charts: {}", e.getMessage(), e);
            throw new RuntimeException("Failed to generate PDF report with charts: " + e.getMessage(), e);
        }
    }

    @Override
    public Map<String, Object> getUserStatsByCenter(Long centerId) {
        Map<String, Object> result = new HashMap<>();
        
        if (centerId != null) {
            // Get users for specific center
            Optional<Center> center = centerRepository.findById(centerId);
            if (center.isPresent()) {
                List<User> users = userRepository.findByAssignedCenter(center.get());
                result.put("centerName", center.get().getName());
                result.put("totalUsers", users.size());
                result.put("users", users.stream()
                        .map(user -> {
                            Map<String, Object> userMap = new HashMap<>();
                            userMap.put("id", user.getId());
                            userMap.put("name", user.getFirstName() + " " + user.getLastName());
                            userMap.put("email", user.getEmail());
                            userMap.put("role", user.getRole().toString());
                            return userMap;
                        })
                        .collect(Collectors.toList()));
            }
        } else {
            // Get stats for all centers
            List<Center> centers = centerRepository.findAll();
            List<Map<String, Object>> centerStats = centers.stream()
                    .map(center -> {
                        List<User> users = userRepository.findByAssignedCenter(center);
                        Map<String, Object> centerMap = new HashMap<>();
                        centerMap.put("centerId", center.getId());
                        centerMap.put("centerName", center.getName());
                        centerMap.put("userCount", users.size());
                        centerMap.put("city", center.getCity() != null ? center.getCity() : "Unknown");
                        return centerMap;
                    })
                    .collect(Collectors.toList());
            
            result.put("centers", centerStats);
            result.put("totalCenters", centers.size());
        }
        
        return result;
    }

    @Override
    public Map<String, Object> getReservationTrends(Long centerId, int days) {
        LocalDateTime endDate = LocalDateTime.now();
        LocalDateTime startDate = endDate.minusDays(days);
        
        List<Reservation> reservations = reservationRepository.findAll().stream()
                .filter(r -> r.getCreatedAt().isAfter(startDate) && r.getCreatedAt().isBefore(endDate))
                .filter(r -> centerId == null || (r.getWorkStation() != null &&
                        r.getWorkStation().getRoom() != null &&
                        r.getWorkStation().getRoom().getCenter() != null &&
                        r.getWorkStation().getRoom().getCenter().getId().equals(centerId)))
                .collect(Collectors.toList());

        Map<String, Object> trends = new HashMap<>();
        
        // Daily counts
        Map<String, Long> dailyCounts = reservations.stream()
                .collect(Collectors.groupingBy(
                        r -> r.getCreatedAt().toLocalDate().toString(),
                        Collectors.counting()));
        
        trends.put("dailyCounts", dailyCounts);
        trends.put("totalReservations", reservations.size());
        trends.put("averagePerDay", reservations.size() / (double) days);
        trends.put("periodStart", startDate);
        trends.put("periodEnd", endDate);
        
        return trends;
    }

    // Helper methods for chart data generation
    private Map<String, Object> generateDayChartData(List<ReservationResponse> reservations) {
        Map<String, Long> dailyCounts = reservations.stream()
                .collect(Collectors.groupingBy(
                        r -> r.getStartTime().toLocalDate().toString(),
                        Collectors.counting()));

        List<Map<String, Object>> chartData = dailyCounts.entrySet().stream()
                .sorted(Map.Entry.comparingByKey())
                .map(entry -> {
                    Map<String, Object> item = new HashMap<>();
                    item.put("label", entry.getKey());
                    item.put("value", entry.getValue());
                    return item;
                })
                .collect(Collectors.toList());

        Map<String, Object> result = new HashMap<>();
        result.put("type", "bar");
        result.put("data", chartData);
        result.put("title", "Reservations by Day");
        return result;
    }

    private Map<String, Object> generateWeekChartData(List<ReservationResponse> reservations) {
        Map<String, Long> weeklyCounts = reservations.stream()
                .collect(Collectors.groupingBy(
                        r -> "Week " + r.getStartTime().toLocalDate().atStartOfDay().until(
                                LocalDate.of(r.getStartTime().getYear(), 1, 1).atStartOfDay(), 
                                ChronoUnit.WEEKS),
                        Collectors.counting()));

        List<Map<String, Object>> chartData = weeklyCounts.entrySet().stream()
                .sorted(Map.Entry.comparingByKey())
                .map(entry -> {
                    Map<String, Object> item = new HashMap<>();
                    item.put("label", entry.getKey());
                    item.put("value", entry.getValue());
                    return item;
                })
                .collect(Collectors.toList());

        Map<String, Object> result = new HashMap<>();
        result.put("type", "bar");
        result.put("data", chartData);
        result.put("title", "Reservations by Week");
        return result;
    }

    private Map<String, Object> generateMonthChartData(List<ReservationResponse> reservations) {
        Map<String, Long> monthlyCounts = reservations.stream()
                .collect(Collectors.groupingBy(
                        r -> r.getStartTime().getYear() + "-" + String.format("%02d", r.getStartTime().getMonthValue()),
                        Collectors.counting()));

        List<Map<String, Object>> chartData = monthlyCounts.entrySet().stream()
                .sorted(Map.Entry.comparingByKey())
                .map(entry -> {
                    Map<String, Object> item = new HashMap<>();
                    item.put("label", entry.getKey());
                    item.put("value", entry.getValue());
                    return item;
                })
                .collect(Collectors.toList());

        Map<String, Object> result = new HashMap<>();
        result.put("type", "bar");
        result.put("data", chartData);
        result.put("title", "Reservations by Month");
        return result;
    }

    private Map<String, Object> generateUserChartData(List<ReservationResponse> reservations) {
        Map<String, Long> userCounts = reservations.stream()
                .collect(Collectors.groupingBy(
                        r -> r.getUser().getFirstName() + " " + r.getUser().getLastName(),
                        Collectors.counting()));

        List<Map<String, Object>> chartData = userCounts.entrySet().stream()
                .sorted(Map.Entry.<String, Long>comparingByValue().reversed())
                .limit(10) // Top 10 users
                .map(entry -> {
                    Map<String, Object> item = new HashMap<>();
                    item.put("label", entry.getKey());
                    item.put("value", entry.getValue());
                    return item;
                })
                .collect(Collectors.toList());

        Map<String, Object> result = new HashMap<>();
        result.put("type", "bar");
        result.put("data", chartData);
        result.put("title", "Top 10 Users by Reservations");
        return result;
    }

    private Map<String, Object> generateCenterChartData(List<ReservationResponse> reservations) {
        Map<String, Long> centerCounts = reservations.stream()
                .collect(Collectors.groupingBy(
                        r -> r.getWorkStation().getCenterName() != null ? r.getWorkStation().getCenterName() : "Unknown",
                        Collectors.counting()));

        List<Map<String, Object>> chartData = centerCounts.entrySet().stream()
                .sorted(Map.Entry.<String, Long>comparingByValue().reversed())
                .map(entry -> {
                    Map<String, Object> item = new HashMap<>();
                    item.put("label", entry.getKey());
                    item.put("value", entry.getValue());
                    return item;
                })
                .collect(Collectors.toList());

        Map<String, Object> result = new HashMap<>();
        result.put("type", "pie");
        result.put("data", chartData);
        result.put("title", "Reservations by Center");
        return result;
    }

    private Map<String, Object> generateStatusChartData(List<ReservationResponse> reservations) {
        Map<String, Long> statusCounts = reservations.stream()
                .collect(Collectors.groupingBy(
                        r -> r.getStatus().toString(),
                        Collectors.counting()));

        List<Map<String, Object>> chartData = statusCounts.entrySet().stream()
                .map(entry -> {
                    Map<String, Object> item = new HashMap<>();
                    item.put("label", entry.getKey());
                    item.put("value", entry.getValue());
                    return item;
                })
                .collect(Collectors.toList());

        Map<String, Object> result = new HashMap<>();
        result.put("type", "pie");
        result.put("data", chartData);
        result.put("title", "Reservations by Status");
        return result;
    }

}