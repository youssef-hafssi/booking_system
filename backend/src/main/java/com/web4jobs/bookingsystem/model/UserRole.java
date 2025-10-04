package com.web4jobs.bookingsystem.model;

/**
 * Enum representing the different user roles in the system.
 * Expanded to provide more granular access control based on specific responsibilities.
 */
public enum UserRole {
    STUDENT,                // Apprenant
    CENTER_MANAGER,         // Responsable du Centre de Coding
    PEDAGOGICAL_MANAGER,    // Responsable Pédagogique
    ASSET_MANAGER,          // Responsable Patrimoine
    EXECUTIVE_DIRECTOR,     // Directeur Exécutif
    ADMIN                   // Administrateur système
}