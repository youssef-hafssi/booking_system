package com.web4jobs.bookingsystem.dto.center;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * Data Transfer Object for center responses.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class CenterResponse {

    private Long id;
    private String name;
    private String address;
    private String city;
    private String postalCode;
    private String phoneNumber;
    private String email;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    
    // Calculated fields
    private Integer roomCount;
    private Integer workStationCount;
}