package com.web4jobs.bookingsystem.dto.room;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Data Transfer Object for receiving room data from clients.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class RoomRequest {

    /**
     * The name of the room.
     */
    @NotBlank(message = "Room name is required")
    private String name;

    /**
     * The floor number where the room is located.
     */
    @NotNull(message = "Floor number is required")
    private Integer floor;

    /**
     * The maximum capacity of the room (number of workstations).
     */
    @NotNull(message = "Capacity is required")
    @Min(value = 1, message = "Capacity must be at least 1")
    private Integer capacity;

    /**
     * The ID of the center where the room is located.
     */
    @NotNull(message = "Center ID is required")
    private Long centerId;
}