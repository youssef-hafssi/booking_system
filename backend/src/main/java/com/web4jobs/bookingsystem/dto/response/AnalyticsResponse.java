package com.web4jobs.bookingsystem.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/**
 * Response DTO for analytics data.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AnalyticsResponse {
    private List<DailyReservationData> reservationsByDay;
    private List<WorkstationUsageData> workstationUsage;
    private List<CenterComparisonData> centerComparison;
    private List<UserActivityData> topUsers;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class DailyReservationData {
        private String day;
        private int count;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class WorkstationUsageData {
        private String name;
        private int usage;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class CenterComparisonData {
        private String name;
        private int workstations;
        private int reservations;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class UserActivityData {
        private String name;
        private int reservations;
    }
} 