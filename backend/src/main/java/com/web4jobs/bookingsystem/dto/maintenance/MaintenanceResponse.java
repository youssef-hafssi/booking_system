package com.web4jobs.bookingsystem.dto.maintenance;

import lombok.Data;
import java.time.LocalDateTime;

@Data
public class MaintenanceResponse {
    private Long id;
    private String title;
    private String description;
    private LocalDateTime startDate;
    private LocalDateTime endDate;
    private Long centerId;
    private String centerName;
    private boolean active;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
} 