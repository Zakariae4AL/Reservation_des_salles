<div align="center">

# 🏢 Salles — Meeting room booking

**Find a free room, book it in two clicks, never double-book again.**
A full-stack app with a Spring Boot API and an Angular front-end, for members and administrators.

[![CI](https://github.com/Zakariae4AL/Reservation_des_salles/actions/workflows/ci.yml/badge.svg)](https://github.com/Zakariae4AL/Reservation_des_salles/actions/workflows/ci.yml)
![Java](https://img.shields.io/badge/Java-21-ED8B00?logo=openjdk&logoColor=white)
![Spring Boot](https://img.shields.io/badge/Spring%20Boot-4.1-6DB33F?logo=springboot&logoColor=white)
![Angular](https://img.shields.io/badge/Angular-22-DD0031?logo=angular&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-6-3178C6?logo=typescript&logoColor=white)
![MySQL](https://img.shields.io/badge/MySQL-8-4479A1?logo=mysql&logoColor=white)
![License](https://img.shields.io/badge/license-MIT-blue)

🇬🇧 English · [🇫🇷 Français](README.fr.md)

![Book a room](docs/screenshots/rooms.png)

</div>

## Table of contents

- [Features](#features)
- [Screenshots](#screenshots)
- [Tech stack](#tech-stack)
- [Architecture](#architecture)
- [Getting started](#getting-started)
- [Configuration](#configuration)
- [API](#api)
- [Security](#security)
- [Tests](#tests)
- [Project structure](#project-structure)
- [Authors](#authors)

## Features

**Members**
- 🔎 Search rooms by **date and time slot**, number of people and equipment — only rooms that are free for the whole slot are shown.
- 📅 Book in a dialog (title, attendees). The API refuses overlaps, past slots, bookings over 12 h and rooms that are too small.
- 🗂️ **My reservations**: upcoming, in progress, finished and cancelled, with one-click cancel.
- 👤 Profile page with your role and upcoming bookings.

**Administrators**
- 📊 **Dashboard**: rooms, bookable rooms, users, upcoming and ongoing bookings, next bookings, user list.
- 🏗️ **Room management**: create, edit, close (keeps history) or delete rooms.
- 📋 **All reservations** with a status filter; admins can cancel any booking.

**Everyone**
- 🌍 English / French interface, remembered per browser.
- 🌗 Light and dark theme, follows the system by default.
- 📱 Responsive, keyboard friendly (skip link, focus styles, real `<dialog>`, ARIA labels).

## Screenshots

| Booking a room | My reservations |
| :---: | :---: |
| ![Booking dialog](docs/screenshots/booking.png) | ![My reservations](docs/screenshots/my-reservations.png) |
| **Admin dashboard** | **Room management** |
| ![Admin dashboard](docs/screenshots/admin-dashboard.png) | ![Room management](docs/screenshots/admin-rooms.png) |
| **All reservations** | **Sign in** |
| ![All reservations](docs/screenshots/admin-reservations.png) | ![Sign in](docs/screenshots/login.png) |
| **Dark theme, in French** | **Dark theme, room search** |
| ![Dark dashboard in French](docs/screenshots/admin-dashboard-dark-fr.png) | ![Dark room search in French](docs/screenshots/rooms-dark-fr.png) |

<p align="center">
  <img src="docs/screenshots/mobile-rooms.png" alt="Mobile room search" width="260" />
  &nbsp;&nbsp;
  <img src="docs/screenshots/mobile-reservations.png" alt="Mobile reservations" width="260" />
</p>

## Tech stack

| Layer | Technologies |
| --- | --- |
| **Backend** | Java 21, Spring Boot 4.1, Spring Security, Spring Data JPA (Hibernate), Bean Validation, JWT (jjwt), Actuator |
| **Database** | MySQL 8 in production, H2 for local development and tests |
| **Frontend** | Angular 22 (standalone components, signals, zoneless), Reactive Forms, functional interceptor and guards |
| **Tests** | JUnit 5, MockMvc, AssertJ · Vitest, Angular TestBed, HttpTestingController |
| **Tooling** | Maven wrapper, Prettier, GitHub Actions, Docker |

## Architecture

```mermaid
flowchart LR
    U[Browser<br/>Angular 22] -- "JSON + Bearer JWT" --> A
    subgraph A[Spring Boot API :8080]
        F[Rate limit filter] --> J[JWT filter] --> S[Security rules<br/>USER / ADMIN]
        S --> C[Controllers] --> SV[Services<br/>booking rules]
        SV --> R[JPA repositories]
    end
    R --> D[(MySQL / H2)]
```

**How double bookings are prevented.** Two bookings overlap when `existing.start < new.end` **and** `existing.end > new.start`. Before checking, the service takes a **row lock on the room** (`SELECT … FOR UPDATE`), so two people clicking "Book" at the same moment are handled one after the other. Back-to-back bookings (10:00–11:00 then 11:00–12:00) are allowed.

## Getting started

### Requirements

- **Java 21** (for example [Temurin](https://adoptium.net/))
- **Node.js 24** (or 22.22+) and npm
- MySQL 8 only for production — development uses an H2 file database, nothing to install.

### 1. Start the API

```bash
cd backend
./mvnw spring-boot:run        # Windows: mvnw.cmd spring-boot:run
```

The API runs on <http://localhost:8080>, with demo data:

| Account | Email | Password |
| --- | --- | --- |
| Administrator | `admin@salles.dev` | `Demo1234` |
| Member | `user@salles.dev` | `Demo1234` |

### 2. Start the front-end

```bash
cd frontend
npm install
npm start
```

Open <http://localhost:4200>. In development, `/api` calls are proxied to port 8080 (`frontend/proxy.conf.json`), so there is no CORS setup to do.

### Production

```bash
# API with MySQL
export SPRING_PROFILES_ACTIVE=prod
export DB_URL="jdbc:mysql://localhost:3306/salles"
export DB_USERNAME=salles DB_PASSWORD='a-strong-password'
export JWT_SECRET="$(openssl rand -base64 48)"
export CORS_ORIGINS="https://salles.example.com"
cd backend && ./mvnw -B package && java -jar target/*.jar

# Or with Docker
docker build -t salles-api backend

# Front-end: static files to serve behind the same domain (/api → the API)
cd frontend && npm ci && npm run build   # output in dist/frontend/browser
```

## Configuration

All settings come from environment variables (see `backend/src/main/resources/application*.properties`).

| Variable | Default (dev) | Description |
| --- | --- | --- |
| `PORT` | `8080` | HTTP port of the API |
| `DB_URL` | H2 file in `./data` | JDBC URL (required in `prod`) |
| `DB_USERNAME` / `DB_PASSWORD` | `sa` / empty | Database credentials (required in `prod`) |
| `JWT_SECRET` | dev-only value | HMAC key, **at least 32 bytes**. The app refuses to start in `prod` with the dev value |
| `JWT_TTL` | `8h` | Token lifetime |
| `CORS_ORIGINS` | `http://localhost:4200` | Allowed front-end origins, comma separated |
| `AUTH_RATE_LIMIT` | `10` | Login / register attempts per minute per IP |
| `SEED_DEMO` | `true` (`false` in `prod`) | Create the demo accounts, rooms and bookings |

## API

Base URL: `/api/v1`. Send `Authorization: Bearer <token>` on every call except register and login. Errors use [RFC 9457 Problem Details](https://www.rfc-editor.org/rfc/rfc9457).

| Method | Endpoint | Access | Description |
| --- | --- | --- | --- |
| `POST` | `/auth/register` | Public | Create a member account, returns a token |
| `POST` | `/auth/login` | Public | Sign in, returns a token |
| `GET` | `/auth/me` | Signed in | Current user |
| `GET` | `/rooms?from&to&minCapacity&equipment` | Signed in | Rooms, optionally only those free between `from` and `to` |
| `GET` | `/rooms/{id}` | Signed in | One room |
| `GET` | `/rooms/{id}/schedule?from&to` | Signed in | Busy slots of a room |
| `POST` | `/rooms` | Admin | Create a room |
| `PUT` | `/rooms/{id}` | Admin | Update a room |
| `DELETE` | `/rooms/{id}` | Admin | Delete a room without bookings (otherwise close it) |
| `GET` | `/reservations/mine` | Signed in | My reservations |
| `POST` | `/reservations` | Signed in | Book a room |
| `POST` | `/reservations/{id}/cancel` | Owner / Admin | Cancel a reservation |
| `GET` | `/admin/stats` | Admin | Dashboard numbers |
| `GET` | `/admin/users` | Admin | All users |
| `GET` | `/admin/reservations?status` | Admin | All reservations |
| `GET` | `/actuator/health` | Public | Health check |

<details>
<summary>Example: book a room</summary>

```http
POST /api/v1/reservations
Authorization: Bearer eyJhbGciOiJIUzI1NiJ9...
Content-Type: application/json

{ "roomId": 1, "title": "Sprint review", "attendees": 6,
  "startAt": "2026-12-01T09:00:00Z", "endAt": "2026-12-01T10:30:00Z" }
```

```http
HTTP/1.1 409 Conflict
Content-Type: application/problem+json

{ "type": "about:blank", "title": "Conflict", "status": 409,
  "detail": "This room is already booked during that time." }
```
</details>

## Security

| Risk | What the app does |
| --- | --- |
| Stolen database | Passwords hashed with **BCrypt**, never returned by the API |
| Becoming admin by yourself | The role is **forced to `USER`** at sign-up; admin routes are checked by the API (`403`) |
| Forged or expired tokens | JWT signed with HMAC-SHA256, expiry checked, `alg: none` rejected, user reloaded on every request (a deleted account loses access at once) |
| Password guessing | Login / register **rate limited per IP**; same message and the same hashing work for an unknown email and a wrong password |
| Reading someone else's data | A user only sees and cancels **their own** reservations (`404` for others) |
| Double booking (race condition) | **Row lock** on the room + interval overlap check in one transaction |
| Leaked secrets | DB credentials and JWT secret from environment variables; `prod` refuses the dev secret |
| Bad input | Bean Validation on every request body; clear `400` with a per-field `errors` map |
| Information leaks | No stack traces in responses; only `/actuator/health` is exposed |
| Open redirect after login | `?next=` is only followed for paths inside the app |
| XSS | Angular escapes all rendered values; the token is only sent to the API's own URL |

## Tests

```bash
cd backend && ./mvnw verify     # 30 integration and unit tests (H2 in memory)
cd frontend && npm test         # 33 component and service tests (Vitest)
```

The backend tests start the whole application and send real HTTP requests through the security filters: registration and login, forged / expired / unsigned tokens, admin vs member access, room filters, every booking rule (overlaps, back-to-back, past, too long, capacity, closed room), cancel rules, admin stats and rate limiting.

GitHub Actions runs both suites, the type check, formatting check and production build on every push and pull request.

## Project structure

```
.
├── backend/                     Spring Boot API
│   ├── src/main/java/reservationsalles/
│   │   ├── auth/                JWT, filters, register / login
│   │   ├── room/                rooms, search, schedule
│   │   ├── reservation/         booking rules, cancel
│   │   ├── admin/               stats, users, all reservations
│   │   ├── user/                accounts and roles
│   │   ├── common/              errors (Problem Details)
│   │   └── config/              security, CORS, demo data
│   └── src/test/java/           integration and unit tests
├── frontend/                    Angular app
│   └── src/app/
│       ├── core/                API client, auth, guards, i18n, theme
│       ├── layout/              header, navigation, toasts, confirm dialog
│       ├── pages/               rooms, reservations, profile, admin/*
│       └── shared/              status badge, toasts, confirm
├── docs/screenshots/
└── .github/workflows/ci.yml
```

## Authors

- **Zakariae** — [@Zakariae4AL](https://github.com/Zakariae4AL)
- **Asmae Abouhadid** — co-author of the first version

Released under the [MIT License](LICENSE).
