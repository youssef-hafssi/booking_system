# Guide IA - Assistant Intelligent de Réservation

## Vue d'ensemble

L'Assistant IA utilise l'intelligence artificielle (OpenAI GPT-3.5) pour analyser l'historique des utilisateurs, la disponibilité des postes et le contexte actuel afin de proposer automatiquement les créneaux et postes optimaux.

## Fonctionnalités

### ✅ **Analyse Intelligente**
- **Historique utilisateur** : Analyse des 6 derniers mois de réservations
- **Préférences temporelles** : Heures préférées, jours de la semaine, durée moyenne
- **Types de postes** : Préférences DESKTOP, LAPTOP, ou SPECIALIZED
- **Comportement** : Ponctualité, taux d'annulation, avance de réservation

### ✅ **Contexte en Temps Réel**
- **Affluence actuelle** : Taux d'occupation par heure
- **Heures de pointe** : Identification des créneaux chargés
- **Disponibilité** : Postes disponibles en temps réel
- **Environnement** : Espaces calmes vs collaboratifs

### ✅ **Recommandations Personnalisées**
- **Top 3 suggestions** : Classées par score de compatibilité (0-100%)
- **Justification** : Explication détaillée de chaque recommandation
- **Avantages** : Points forts de chaque option
- **Flexibilité** : Adaptation selon vos contraintes

## Comment Utiliser

### 1. **Suggestion Rapide**
```
1. Aller sur "Find & Book Workstations"
2. Cliquer sur "Suggérer pour moi"
3. Sélectionner "Suggestion Rapide"
4. L'IA propose immédiatement 3 options optimales
```

### 2. **Recommandations Personnalisées**
```
1. Cliquer sur "Suggérer pour moi"
2. Remplir le formulaire de préférences :
   - Date et heure préférées
   - Durée souhaitée
   - Type de poste
   - Objectif (étude, travail, réunion, projet)
   - Flexibilité horaire (1-5)
   - Environnement calme ou non
3. Cliquer sur "Générer les Recommandations"
4. Examiner les 3 suggestions avec scores et justifications
5. Sélectionner la recommandation souhaitée
```

## API Endpoints

### **POST** `/api/ai/recommendations`
Génère des recommandations basées sur une requête détaillée.

**Request Body:**
```json
{
  "userId": 1,
  "centerId": 1,
  "preferredDate": "2024-01-15",
  "preferredStartTime": "09:00",
  "preferredDuration": 2,
  "preferredWorkStationType": "DESKTOP",
  "preferQuietEnvironment": true,
  "purpose": "study",
  "flexibility": 3
}
```

**Response:**
```json
{
  "recommendations": [
    {
      "workstationId": 5,
      "workstationName": "WS-A-01",
      "workstationType": "DESKTOP",
      "roomName": "Salle A",
      "floor": 1,
      "suggestedStartTime": "2024-01-15T09:00:00",
      "suggestedEndTime": "2024-01-15T11:00:00",
      "duration": 2,
      "score": 95.0,
      "reason": "Parfait pour vos habitudes matinales et préférences de poste fixe",
      "advantages": ["Environnement calme", "Équipement haute performance", "Heure optimale"],
      "specifications": "Intel i7, 16GB RAM, Écran 24\"",
      "isOptimalTime": true
    }
  ],
  "reasoning": "Basé sur votre préférence pour les créneaux matinaux et les postes fixes...",
  "confidenceScore": 0.92,
  "aiSuggestion": "AI-powered recommendation based on your booking history and current context"
}
```

### **POST** `/api/ai/quick-recommend`
Suggestion rapide avec paramètres minimaux.

**Parameters:**
- `userId` (required): ID de l'utilisateur
- `centerId` (required): ID du centre
- `duration` (optional): Durée en heures (défaut: 2)

### **GET** `/api/ai/profile/{userId}`
Profil d'analyse de l'utilisateur.

**Response:**
```json
{
  "userId": 1,
  "totalBookings": 25,
  "averageDuration": 2.5,
  "preferredStartTime": "09:30",
  "preferredDaysOfWeek": [1, 2, 3, 4, 5],
  "preferredTimeSlot": "morning",
  "mostUsedWorkstationType": "DESKTOP",
  "punctualityScore": 92.0,
  "cancellationRate": 8.0,
  "averageAdvanceBooking": 2,
  "prefersQuietSpaces": true,
  "activityPattern": "consistent",
  "recentBookingsCount": 8,
  "recentTrend": "stable"
}
```

### **GET** `/api/ai/context/{centerId}`
Analyse contextuelle du centre.

## Configuration Technique

### **Backend (Spring Boot)**
```properties
# application.properties
openai.api.key=sk-proj-...
openai.api.url=https://api.openai.com/v1/chat/completions
openai.model=gpt-3.5-turbo
openai.max.tokens=500
openai.temperature=0.7
```

### **Composants Créés**
- `AiRecommendationService` : Service principal d'IA
- `AiRecommendationController` : API REST endpoints
- `RecommendationRequest/Response` : DTOs pour les requêtes/réponses
- `UserBookingProfile` : Profil d'analyse utilisateur
- `RecommendationModal` : Interface utilisateur React

### **Base de Données**
```sql
-- Migration V6: Ajout du type de poste
ALTER TABLE work_stations 
ADD COLUMN type VARCHAR(20) DEFAULT 'DESKTOP';
```

## Algorithme IA

### **1. Analyse du Profil Utilisateur**
```java
// Analyse des 6 derniers mois
List<Reservation> userReservations = reservationRepository
    .findByUserAndCreatedAtAfter(user, sixMonthsAgo);

// Extraction des patterns
- Heures préférées (moyenne des heures de début)
- Jours favoris (fréquence par jour de semaine)
- Types de postes (répartition DESKTOP/LAPTOP/SPECIALIZED)
- Durée moyenne des sessions
- Ponctualité et fiabilité
```

### **2. Analyse Contextuelle**
```java
// Contexte en temps réel
- Taux d'occupation actuel par heure
- Heures de pointe identifiées
- Postes disponibles dans le centre
- Répartition par étage et salle
```

### **3. Génération IA**
```java
// Prompt OpenAI structuré
String prompt = buildRecommendationPrompt(
    request,           // Préférences utilisateur
    userProfile,       // Analyse historique
    availableWorkstations, // Postes disponibles
    contextAnalysis    // Contexte temps réel
);

// Appel API OpenAI GPT-3.5
String aiResponse = callOpenAI(prompt);
```

### **4. Fallback Rule-Based**
En cas d'indisponibilité de l'IA, le système utilise un algorithme de règles simples basé sur la disponibilité et les préférences de base.

## Sécurité et Performance

### **Gestion d'Erreurs**
- Fallback automatique en cas d'échec OpenAI
- Validation des données d'entrée
- Logs détaillés pour debugging

### **Cache et Optimisation**
- Analyse de profil mise en cache (recommandé)
- Requêtes base de données optimisées
- Timeout configuré pour appels OpenAI

### **Permissions**
- Accès restreint aux rôles STUDENT, MANAGER, ADMIN
- Validation de l'appartenance au centre
- Protection des données utilisateur

## Métriques de Succès

### **Indicateurs de Performance**
- **Taux d'adoption** : % d'utilisateurs utilisant l'IA
- **Taux de satisfaction** : % de recommandations acceptées
- **Précision** : Score de compatibilité moyen des sélections
- **Temps de réponse** : Latence des recommandations

### **Analytics Recommandés**
```sql
-- Suivi d'utilisation
SELECT 
    COUNT(*) as total_ai_requests,
    AVG(confidence_score) as avg_confidence,
    COUNT(CASE WHEN selected = true THEN 1 END) as accepted_recommendations
FROM ai_recommendation_logs 
WHERE created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY);
```

## Prochaines Améliorations

### **Phase 2 IA (Optionnel)**
- [ ] Machine Learning local (sans OpenAI)
- [ ] Recommandations collaboratives (utilisateurs similaires)
- [ ] Prédiction de disponibilité future
- [ ] Optimisation automatique des plannings
- [ ] Interface vocale
- [ ] Notifications proactives

### **Intégrations Avancées**
- [ ] Calendrier personnel (Google/Outlook)
- [ ] Capteurs IoT d'occupation réelle
- [ ] Système de feedback utilisateur
- [ ] A/B testing des algorithmes

---

## ✅ **Statut : Implémenté et Fonctionnel**

L'Assistant IA est maintenant pleinement opérationnel et prêt à être utilisé. Les utilisateurs peuvent accéder aux recommandations intelligentes via le bouton **"Suggérer pour moi"** dans l'interface de recherche de postes. 