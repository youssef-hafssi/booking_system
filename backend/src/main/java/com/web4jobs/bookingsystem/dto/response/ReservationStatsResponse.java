package com.web4jobs.bookingsystem.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Response DTO for reservation statistics.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ReservationStatsResponse {
    private int total;
    private int active;
    private int pending;
    private int completed;
    private int cancelled;
} 