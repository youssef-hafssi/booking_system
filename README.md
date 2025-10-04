# Booking System

A web application to manage workstation / desk bookings (gestion de réservation de postes de travail).

## Table of Contents

- [About](#about)  
- [Technologies](#technologies)  
- [Architecture & Structure](#architecture--structure)  
- [Getting Started](#getting-started)  
  - [Prerequisites](#prerequisites)  
  - [Environment Setup](#environment-setup)  
  - [Database Setup & Migrations](#database-setup--migrations)  
  - [Running Locally](#running-locally)  
- [Usage](#usage)  
  - [API Endpoints](#api-endpoints)  
  - [Frontend Routes / Views](#frontend-routes--views)  
- [Testing](#testing)  
- [Project Roadmap / TODOs](#project-roadmap--todos)  
- [Contributing](#contributing)  
- [License](#license)  

---

## About

This is a full-stack web application for managing reservations of workstations or desks. Users can make, cancel, or view bookings; administrators can manage availability, users, and view occupancy statistics.

The project is composed of a **Spring Boot** backend and a **React / Vite** frontend, with **MySQL** as the database.

---

## Technologies

- **Backend**: Spring Boot (Java)  
- **Frontend**: React (with Vite)  
- **Database**: MySQL  
- **Other**:  
  - JPA / Hibernate (for ORM)  
  - RESTful API design  
  - Axios or Fetch on frontend for HTTP  
  - PCORS, JWT / session-based auth 

---

## Architecture & Structure
booking_system/
├── backend # Spring Boot backend project
├── frontend # React / Vite frontend project
├── tools # Optional utility scripts/tools
├── ARCHITECTURE_MVC.png (or .svg / .jpg)
├── DATABASE_MODEL.md
├── EMAIL_SETUP_GUIDE.md
├── TEST_INSTRUCTIONS.md
└── README.md ← (this file)


- The backend handles business logic, data persistence, and exposes REST APIs.
- The frontend consumes those APIs and renders UI for users and admins.
- The `tools` folder may contain scripts (e.g. seeding, helpers).
- Supporting documentation (architecture diagram, database schema, email setup) is included in separate markdown or image files.

---

## Getting Started

### Prerequisites

Make sure you have installed:

- Java (JDK 11 or later recommended)  
- Maven or Gradle (depending on your backend build tool)  
- Node.js & npm (or yarn)  
- MySQL (or a compatible relational DB)  

### Environment Setup

You might need environment variables or property files like:

| Key | Description | Example |
|-----|-------------|---------|
| `DB_HOST` | IP / hostname of MySQL server | `localhost` |
| `DB_PORT` | MySQL port | `3306` |
| `DB_NAME` | Database name | `booking_db` |
| `DB_USER` | DB username | `user` |
| `DB_PASS` | DB password | `password` |
| `JWT_SECRET` | Secret key for JWT (if used) | `someVerySecretKey` |
| `FRONTEND_URL` | URL that frontend runs on (for CORS) | `http://localhost:3000` |

In Spring Boot, you can set them in `application.properties` or `application.yml` or via environment variables.

### Database Setup & Migrations

1. Create the database schema (e.g. `booking_db`) in MySQL.  
2. Use JPA / Hibernate auto DDL or run SQL / migration scripts to create tables.  
3. (Optional) Seed initial data (users, days, workstations) — you can include a SQL seed file or script in `tools/`.

### Running Locally

**Backend**  
```bash
cd backend
./mvnw spring-boot:run  
# or if using Gradle: ./gradlew bootRun

**Frontend** 
cd frontend
npm install
npm run dev


