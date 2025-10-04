package com.web4jobs.bookingsystem.dto.room;

import com.web4jobs.bookingsystem.dto.center.CenterSummaryResponse;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * Data Transfer Object for sending room data to clients.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class RoomResponse {

    /**
     * The unique identifier of the room.
     */
    private Long id;

    /**
     * The name of the room.
     */
    private String name;

    /**
     * The floor number where the room is located.
     */
    private Integer floor;

    /**
     * The maximum capacity of the room (number of workstations).
     */
    private Integer capacity;

    /**
     * Summary information about the center where the room is located.
     */
    private CenterSummaryResponse center;

    /**
     * The total number of workstations in the room.
     */
    private Integer workStationCount;

    /**
     * The number of currently available workstations in the room.
     */
    private Integer availableWorkStationCount;

    /**
     * The timestamp when the room was created.
     */
    private LocalDateTime createdAt;

    /**
     * The timestamp when the room was last updated.
     */
    private LocalDateTime updatedAt;
}