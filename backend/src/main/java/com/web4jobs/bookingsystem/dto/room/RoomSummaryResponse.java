package com.web4jobs.bookingsystem.dto.room;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * DTO for sending simplified room information to clients.
 * Used when room data is included in other responses.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class RoomSummaryResponse {

    private Long id;    private String name;
    private Integer floor;
    private Long centerId;
    private String centerName;
}