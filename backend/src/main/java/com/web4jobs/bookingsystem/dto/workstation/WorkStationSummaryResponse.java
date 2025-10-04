package com.web4jobs.bookingsystem.dto.workstation;

import com.web4jobs.bookingsystem.model.WorkStationStatus;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * DTO for sending simplified workstation information to clients.
 * Used when workstation data is included in other responses.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class WorkStationSummaryResponse {

    private Long id;
    private String name;
    private WorkStationStatus status;
    private Long roomId;
    private String roomName;
    private Long centerId;
    private String centerName;
}