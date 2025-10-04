# Booking System

Projet de gestion de réservation de postes de travail  
Backend (Spring Boot) + Frontend (React + Vite) + MySQL  
Repository structuré en deux parties : `backend` et `frontend`.  

---

## Table des matières

1. [Fonctionnalités](#fonctionnalités)  
2. [Architecture & Technologies](#architecture--technologies)  
3. [Installation & Configuration](#installation--configuration)  
4. [Démarrage](#démarrage)  
5. [Usage](#usage)  
6. [Tests](#tests)  
7. [Structure du projet](#structure-du-projet)  
8. [Contribuer](#contribuer)  
9. [Licence](#licence)  

---

## Fonctionnalités

Voici quelques-unes des fonctionnalités attendues / déjà implémentées :

- Gestion des utilisateurs (inscription, authentification)  
- Gestion des postes de travail (création, modification, suppression)  
- Consultation des disponibilités  
- Réservation de poste de travail  
- Annulation et gestion des réservations  
- Notification / email (selon configuration)  
- Interface utilisateur responsive  
- Sécurité (authentification, autorisations)  

Vous pouvez ajouter ou retirer selon l’état réel de votre projet.

---

## Architecture & Technologies

- **Backend** : Spring Boot (Java)  
- **Frontend** : React + Vite  
- **Base de données** : MySQL  
- **Outils additionnels** : (ex : JPA / Hibernate, Spring Security, Axios dans le frontend, etc.)  

L’architecture proposée est de type multi-couches (contrôleurs, services, repositories) pour une séparation des responsabilités.

Vous trouverez aussi une image d’architecture (ex. `ARCHITECTURE_LOGICIELLE.png`) dans le repo.

---

## Installation & Configuration

### Prérequis

- Java JDK (version 11+ ou celle que vous utilisez)  
- Node.js / npm (ou yarn)  
- MySQL  
- (Optionnel) un outil pour envoyer des emails (SMTP)  
- (Optionnel) Postman pour l’API  

### Étapes

1. **Cloner le dépôt**

   ```bash
   git clone https://github.com/youssef-hafssi/booking_system.git
   cd booking_system

   Configurer la base de données

Créez une base MySQL (ex : booking_db)

Notez les informations : host, port, utilisateur, mot de passe

Modifiez les fichiers de configuration du backend pour pointer vers cette base (application.properties / application.yml)

Configurer les variables d’environnement / secrets

Exemple (backend) :

SPRING_DATASOURCE_URL=jdbc:mysql://localhost:3306/booking_db
SPRING_DATASOURCE_USERNAME=your_username
SPRING_DATASOURCE_PASSWORD=your_password
JWT_SECRET=une_clé_secrète_pour_tokénisation
EMAIL_HOST=smtp.exemple.com
EMAIL_PORT=587
EMAIL_USERNAME=...
EMAIL_PASSWORD=...


(Ajustez selon vos besoins)

Installer les dépendances frontend

cd frontend
npm install


(ou yarn selon le gestionnaire)

Démarrage
Backend
cd backend
./mvnw spring-boot:run


ou si vous utilisez Gradle / wrapper :

./gradlew bootRun

Frontend
cd frontend
npm run dev


Cela lancera le serveur de développement React + Vite (généralement sur http://localhost:3000 ou un port similaire).

Usage

Ouvrez votre navigateur à l’adresse du frontend (ex : http://localhost:3000)

Créez un compte / connectez-vous

Naviguez vers la section des postes de travail — voir les disponibilités

Faites une réservation

Gérez / annulez vos réservations

Vous pouvez tester les endpoints backend via Postman en important le fichier postman_collection.json fourni.

Tests

Si vous avez des tests (unitaires, d’intégration) :

Backend :

cd backend
./mvnw test


ou équivalent Gradle.

Frontend :
(Selon la configuration — ex : npm test ou yarn test)

Vous pouvez aussi avoir des scénarios de tests manuels décrits dans test_instructions.md.

Structure du projet
booking_system/
│
├── backend/             # code source Java / Spring Boot
├── frontend/            # code React / Vite
├── ARCHITECTURE_LOGICIELLE.*   # schémas d’architecture
├── postman_collection.json
├── test_instructions.md
└── README.md            # (vous êtes ici)


Vous pouvez avoir d’autres fichiers comme des guides (ex : EMAIL_SETUP_GUIDE.md, TIMEZONE_CONFIGURATION.md, etc.)

Contribuer

Les contributions sont les bienvenues ! Voici quelques étapes simples :

Fork du projet

Créer une branche : git checkout -b feature/ma-nouvelle-fonctionnalité

Faire vos modifications / ajouts

Ajouter des tests, documenter

Commit / push

Ouvrir une Pull Request

Merci de respecter le style de code existant, de documenter et de tester vos modifications.
