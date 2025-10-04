package com.web4jobs.bookingsystem.model;

public enum ReservationStatus {
    PENDING,     // En attente de confirmation
    CONFIRMED,   // Réservation confirmée
    CANCELLED,   // Réservation annulée
    COMPLETED,   // Réservation terminée
    NO_SHOW      // Utilisateur ne s'est pas présenté
}