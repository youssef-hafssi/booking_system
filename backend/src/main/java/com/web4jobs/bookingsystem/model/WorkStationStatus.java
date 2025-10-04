package com.web4jobs.bookingsystem.model;

public enum WorkStationStatus {
    AVAILABLE,     // Disponible pour réservation
    MAINTENANCE,   // En maintenance, non disponible
    RESERVED,      // Déjà réservé
    UNAVAILABLE    // Non disponible pour réservation pour d'autres raisons
}