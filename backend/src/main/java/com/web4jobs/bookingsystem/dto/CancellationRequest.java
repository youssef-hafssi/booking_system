package com.web4jobs.bookingsystem.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * DTO for cancellation requests with mandatory reason.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class CancellationRequest {
    
    @NotBlank(message = "Cancellation reason is required")
    @Size(min = 10, max = 500, message = "Cancellation reason must be between 10 and 500 characters")
    private String reason;
} 