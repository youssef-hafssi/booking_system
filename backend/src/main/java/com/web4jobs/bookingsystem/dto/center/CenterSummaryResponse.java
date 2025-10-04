package com.web4jobs.bookingsystem.dto.center;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Data Transfer Object for simplified center information.
 * Used in other response DTOs to avoid deep nesting.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class CenterSummaryResponse {

    /**
     * The unique identifier of the center.
     */
    private Long id;

    /**
     * The name of the center.
     */
    private String name;

    /**
     * The location of the center.
     */
    private String location;

    /**
     * Contact information for the center.
     */
    private String contactInfo;
}