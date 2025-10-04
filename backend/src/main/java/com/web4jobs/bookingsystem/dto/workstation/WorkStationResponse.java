package com.web4jobs.bookingsystem.dto.workstation;

import com.web4jobs.bookingsystem.dto.room.RoomSummaryResponse;
import com.web4jobs.bookingsystem.model.WorkStationStatus;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * DTO for sending workstation data to clients.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class WorkStationResponse {

    private Long id;
    private String name;
    private String description;
    private String specifications; // JSON string with workstation specifications
    private WorkStationStatus status;
    private RoomSummaryResponse room; // Simplified room information
    private String position; // Position coordinates within the room
    private String imageUrl; // URL or path to workstation image
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private boolean currentlyAvailable; // Calculated field based on reservations
}