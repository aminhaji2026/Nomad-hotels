# 1. Existing repository assessment

## Summary

NomadStay today is a **Vite + React 19 SPA** with a co-located **Express 5 JSON-file API** (`server/`). It is a strong product demo (guest booking, hotel admin, platform admin, mock payments, Duffel Stay), but it is **not** a production multi-hotel PMS/OTA backend.

| Area | Current state |
| --- | --- |
| Frontend | React SPA in `/src` — keep and continue to serve via Express or Vite |
| Legacy API | Express in `/server` — JWT (single token), 3 roles, JSON DB |
| Persistence | `data/nomadstay.json` full-file rewrite — no ACID, races, or migrations |
| Auth | `customer` / `hotel_admin` / `admin` — no refresh tokens, OTP, 2FA, or RBAC matrix |
| Inventory | Static room counts — no date-level allotment or holds |
| Deploy | Railway single process (`npm start` serves API + `dist`) |

## What must be preserved

1. Guest SPA routes and UX contracts in `src/api.ts` against legacy `/api/*` until adapters exist.
2. Demo hotel content (Damal / Holiday) and dual login portals.
3. Railway production SPA + legacy API remain runnable during migration.
4. Payment and Duffel abstractions remain available on the legacy path.

## Decision

Introduce a **NestJS modular monolith** at `/backend` with PostgreSQL + Prisma + Redis + BullMQ under **`/api/v1`**.

- Legacy Express stays at `/api` for the existing SPA.
- New platform capabilities ship on `/api/v1` without breaking the live app.
- Later phases can add a compatibility facade that maps legacy routes to Nest services.

## Gaps closed by this backend

Normalized multi-property hierarchy, RBAC, onboarding workflow, refresh-token sessions, audit logs, inventory-ready schema, payments/commission models, operations modules, OpenAPI, Docker Compose, and automated tests.