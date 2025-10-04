package com.web4jobs.bookingsystem.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.HashMap;
import java.util.Map;

/**
 * A simple test controller to verify the application setup and database connection.
 * This controller provides endpoints to check if the application is running and if the database connection is working.
 */
@RestController
@RequestMapping("/api/test")
public class TestController {

    private final JdbcTemplate jdbcTemplate;

    @Autowired
    public TestController(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    /**
     * Simple endpoint to check if the application is running.
     * @return A message indicating the application is running.
     */
    @GetMapping("/ping")
    public Map<String, String> ping() {
        Map<String, String> response = new HashMap<>();
        response.put("status", "success");
        response.put("message", "Application is running!");
        return response;
    }

    /**
     * Endpoint to test the database connection.
     * @return A message with the database connection status and version information.
     */
    @GetMapping("/db-connection")
    public Map<String, Object> testDatabaseConnection() {
        Map<String, Object> response = new HashMap<>();
        
        try {
            String dbVersion = jdbcTemplate.queryForObject("SELECT version()", String.class);
            response.put("status", "success");
            response.put("message", "Database connection successful!");
            response.put("databaseVersion", dbVersion);
        } catch (Exception e) {
            response.put("status", "error");
            response.put("message", "Database connection failed!");
            response.put("error", e.getMessage());
        }
        
        return response;
    }
}