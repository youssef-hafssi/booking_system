package com.web4jobs.bookingsystem.dto.reservation;

import com.web4jobs.bookingsystem.dto.user.UserSummaryResponse;
import com.web4jobs.bookingsystem.dto.workstation.WorkStationSummaryResponse;
import com.web4jobs.bookingsystem.model.ReservationStatus;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * DTO for sending reservation data to clients.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class ReservationResponse {

    private Long id;
    private UserSummaryResponse user;
    private WorkStationSummaryResponse workStation;
    private LocalDateTime startTime;
    private LocalDateTime endTime;
    private ReservationStatus status;
    private String notes;
    private String cancellationReason;
    private UserSummaryResponse cancelledBy;
    private LocalDateTime cancelledAt;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private boolean canCancel; // Calculated field based on reservation status and time
}