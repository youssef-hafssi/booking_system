package com.web4jobs.bookingsystem.model;

/**
 * Enum representing user status based on their reservation behavior.
 */
public enum UserStatus {
    GOOD,       // Good user (0-2 strikes)
    WARNING,    // Warning status (3-4 strikes)
    BAD         // Bad user (5+ strikes)
} 