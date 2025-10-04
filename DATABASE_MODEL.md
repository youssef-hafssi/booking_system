# Modèle de Données - Système de Réservation de Postes de Travail

Ce document décrit la structure de la base de données pour le système de réservation de postes de travail.

## Entités Principales

### User (Utilisateur)
```
User {
  id: Long (PK)
  email: String (unique)
  password: String (encodé)
  firstName: String
  lastName: String
  role: Enum (STUDENT, MANAGER, ADMIN)
  phoneNumber: String (optional)
  createdAt: DateTime
  updatedAt: DateTime
  lastLogin: DateTime
  enabled: Boolean
}
```

### Center (Centre de Coding)
```
Center {
  id: Long (PK)
  name: String
  address: String
  city: String
  postalCode: String
  phoneNumber: String
  email: String
  createdAt: DateTime
  updatedAt: DateTime
}
```

### Room (Salle)
```
Room {
  id: Long (PK)
  name: String
  floor: Integer
  capacity: Integer
  centerId: Long (FK -> Center)
  createdAt: DateTime
  updatedAt: DateTime
}
```

### WorkStation (Poste de Travail)
```
WorkStation {
  id: Long (PK)
  name: String
  description: String
  type: Enum (DESKTOP, LAPTOP, SPECIALIZED)
  specifications: String (JSON)
  status: Enum (AVAILABLE, MAINTENANCE, RESERVED)
  roomId: Long (FK -> Room)
  position: String (coordonnées dans la salle)
  createdAt: DateTime
  updatedAt: DateTime
}
```

### Reservation (Réservation)
```
Reservation {
  id: Long (PK)
  userId: Long (FK -> User)
  workStationId: Long (FK -> WorkStation)
  startTime: DateTime
  endTime: DateTime
  status: Enum (PENDING, CONFIRMED, CANCELLED, COMPLETED)
  notes: String
  createdAt: DateTime
  updatedAt: DateTime
}
```

### Notification
```
Notification {
  id: Long (PK)
  userId: Long (FK -> User)
  reservationId: Long (FK -> Reservation)
  type: Enum (CONFIRMATION, REMINDER, CANCELLATION, MODIFICATION)
  message: String
  sentAt: DateTime
  readAt: DateTime
  channel: Enum (EMAIL, SMS, IN_APP)
  status: Enum (PENDING, SENT, FAILED)
}
```

### UserPreference (Préférences Utilisateur)
```
UserPreference {
  id: Long (PK)
  userId: Long (FK -> User)
  preferredWorkStationType: Enum (DESKTOP, LAPTOP, SPECIALIZED)
  preferredRoomIds: String (JSON array of Room IDs)
  preferredTimeSlots: String (JSON)
  notificationPreferences: String (JSON)
  createdAt: DateTime
  updatedAt: DateTime
}
```

### ReservationHistory (Historique des Réservations)
```
ReservationHistory {
  id: Long (PK)
  userId: Long (FK -> User)
  workStationId: Long (FK -> WorkStation)
  startTime: DateTime
  endTime: DateTime
  status: Enum (COMPLETED, CANCELLED, NO_SHOW)
  feedback: String
  rating: Integer (1-5)
  createdAt: DateTime
}
```

## Relations

1. **User - Reservation**: Un utilisateur peut avoir plusieurs réservations (One-to-Many)
2. **WorkStation - Reservation**: Un poste de travail peut avoir plusieurs réservations (One-to-Many)
3. **Center - Room**: Un centre peut avoir plusieurs salles (One-to-Many)
4. **Room - WorkStation**: Une salle peut avoir plusieurs postes de travail (One-to-Many)
5. **User - UserPreference**: Un utilisateur a une préférence (One-to-One)
6. **User - Notification**: Un utilisateur peut recevoir plusieurs notifications (One-to-Many)
7. **Reservation - Notification**: Une réservation peut générer plusieurs notifications (One-to-Many)

## Indices et Contraintes

- Index sur `User.email` pour recherche rapide
- Index sur `Reservation.startTime` et `Reservation.endTime` pour recherche de disponibilité
- Contrainte d'unicité sur `WorkStation.name` dans une même salle
- Contrainte de vérification pour s'assurer que `Reservation.endTime` > `Reservation.startTime`
- Contrainte de vérification pour s'assurer qu'un poste n'est pas réservé deux fois sur la même période

## Diagramme Simplifié

```
User 1 --- * Reservation * --- 1 WorkStation
                                    |
                                    |
                                    v
                                  Room
                                    |
                                    |
                                    v
                                  Center
```

Ce modèle de données est conçu pour être flexible et extensible, permettant d'ajouter facilement de nouvelles fonctionnalités à l'avenir.