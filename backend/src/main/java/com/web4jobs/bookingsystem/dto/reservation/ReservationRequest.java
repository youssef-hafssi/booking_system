package com.web4jobs.bookingsystem.dto.reservation;

import com.web4jobs.bookingsystem.model.ReservationStatus;
import jakarta.validation.constraints.FutureOrPresent;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * DTO for receiving reservation data from clients.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class ReservationRequest {

    @NotNull(message = "User ID is required")
    private Long userId;

    @NotNull(message = "WorkStation ID is required")
    private Long workStationId;

    @NotNull(message = "Start time is required")
    // Temporarily removed @FutureOrPresent to debug timezone issues
    // @FutureOrPresent(message = "Start time must be in the present or future")
    private LocalDateTime startTime;

    @NotNull(message = "End time is required")
    // Temporarily removed @FutureOrPresent to debug timezone issues
    // @FutureOrPresent(message = "End time must be in the present or future")
    private LocalDateTime endTime;

    private ReservationStatus status; // Optional, will default to PENDING if not provided

    private String notes; // Optional notes about the reservation
}