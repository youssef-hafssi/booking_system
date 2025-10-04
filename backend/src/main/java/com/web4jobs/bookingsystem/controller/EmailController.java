package com.web4jobs.bookingsystem.controller;

import com.web4jobs.bookingsystem.service.EmailReminderService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/email")
@RequiredArgsConstructor
@Slf4j
@CrossOrigin(origins = "http://localhost:3000", allowCredentials = "true")
public class EmailController {

    private final EmailReminderService emailReminderService;

    /**
     * Test endpoint to send immediate reminder for a specific reservation
     */
    @PostMapping("/test-reminder/{reservationId}")
    @PreAuthorize("hasAuthority('ADMIN') or hasAuthority('MANAGER')")
    public ResponseEntity<String> testReminder(@PathVariable Long reservationId) {
        
        log.info("Testing reminder email for reservation: {}", reservationId);
        
        try {
            emailReminderService.sendImmediateReminder(reservationId);
            return ResponseEntity.ok("Reminder email sent successfully for reservation: " + reservationId);
        } catch (Exception e) {
            log.error("Error sending test reminder", e);
            return ResponseEntity.internalServerError()
                    .body("Failed to send reminder: " + e.getMessage());
        }
    }

    /**
     * Manually trigger reminder check (for testing)
     */
    @PostMapping("/check-reminders")
    @PreAuthorize("hasAuthority('ADMIN')")
    public ResponseEntity<String> checkReminders() {
        
        log.info("Manually triggering reminder check");
        
        try {
            emailReminderService.sendReservationReminders();
            return ResponseEntity.ok("Reminder check completed successfully");
        } catch (Exception e) {
            log.error("Error during manual reminder check", e);
            return ResponseEntity.internalServerError()
                    .body("Failed to check reminders: " + e.getMessage());
        }
    }

    /**
     * Simple test endpoint to verify email configuration
     */
    @PostMapping("/test-config")
    @PreAuthorize("hasAuthority('ADMIN')")
    public ResponseEntity<String> testEmailConfig(@RequestParam(required = false) String testEmail) {
        
        log.info("Testing email configuration");
        
        try {
            emailReminderService.sendTestEmail(testEmail);
            return ResponseEntity.ok("Test email sent successfully" + 
                (testEmail != null ? " to: " + testEmail : ""));
        } catch (Exception e) {
            log.error("Error sending test email", e);
            return ResponseEntity.internalServerError()
                    .body("Failed to send test email: " + e.getMessage());
        }
    }

    /**
     * Send test reminder emails to students with upcoming reservations
     */
    @PostMapping("/test-student-reminders")
    @PreAuthorize("hasAuthority('ADMIN')")
    public ResponseEntity<String> testStudentReminders() {
        
        log.info("Testing student reminder emails");
        
        try {
            int emailsSent = emailReminderService.sendTestStudentReminders();
            return ResponseEntity.ok("Test reminder emails sent to " + emailsSent + " students with upcoming reservations");
        } catch (Exception e) {
            log.error("Error sending test student reminders", e);
            return ResponseEntity.internalServerError()
                    .body("Failed to send test student reminders: " + e.getMessage());
        }
    }
} 