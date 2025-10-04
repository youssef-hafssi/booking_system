package com.web4jobs.bookingsystem.dto.workstation;

import com.web4jobs.bookingsystem.model.WorkStationStatus;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * DTO for receiving workstation data from clients.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class WorkStationRequest {

    @NotBlank(message = "Name is required")
    private String name;

    private String description;

    private String specifications; // JSON string with workstation specifications

    private WorkStationStatus status; // Optional, will default to AVAILABLE if not provided

    @NotNull(message = "Room ID is required")
    private Long roomId;

    private String position; // Position coordinates within the room
    
    private String imageUrl; // URL or path to workstation image
}