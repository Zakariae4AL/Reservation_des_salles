# Changelog

## 2.0.0 — 2026-11

Full rewrite of the project into one monorepo (`backend/` + `frontend/`).

### Security
- Passwords are hashed with BCrypt; they were stored and returned in plain text.
- Stateless JWT authentication; every API route used to be public.
- The role can no longer be picked at sign-up: new accounts are always `USER`.
- Admin-only routes are enforced by the API, not only hidden in the UI.
- Login and register are rate limited (10 requests per minute per IP by default).
- Database credentials and the JWT secret come from environment variables; the app refuses to start in `prod` with the dev secret.
- Errors follow RFC 9457 (Problem Details) and never leak stack traces.

### Fixed
- Double bookings: the overlap check only looked at reservations *starting* inside the new range. It now uses a proper interval test with a row lock on the room.
- The frontend called port 8009 while the API ran on 8080.
- The register form sent nothing; the profile page showed a hard-coded admin.

### Added
- Room search by time slot, capacity and equipment, showing only free rooms.
- My reservations with cancel, admin dashboard with stats, room management, all reservations view.
- English / French interface, light and dark theme, responsive layout.
- Demo data, integration tests (JUnit + MockMvc), component tests (Vitest), GitHub Actions CI.

### Changed
- Spring Boot 3.4 / Java 17 → Spring Boot 4.1 / Java 21. Angular 18 (SSR) → Angular 22 (standalone, signals, zoneless).
- The two separate front-ends (admin and user) are merged into one app with role-based navigation.

## 1.0.0

First version: Spring Boot API and Angular admin front-end on separate branches.
