# NomadStay Platform API

Production-oriented NestJS modular monolith for a multi-hotel booking platform.

## Phase 1 (implemented)

- PostgreSQL + Prisma schema for the full platform domain
- Auth: register/login/refresh/logout, OTP, password reset, session list/revoke
- RBAC: platform + hotel roles/permissions with property/group scoping
- Hotel groups, properties, staff invitations
- Hotel onboarding workflow with platform review/approval
- Buildings, floors, room types, physical rooms
- Audit logging, Swagger, health endpoints, Docker Compose

## Phase 2 (implemented)

- Rate plans, daily rates, and stay restrictions
- Inventory calendar open/adjust/state, holds with TTL expiry
- Availability + pricing engine (occupancy-aware)
- Public hotel search and hotel detail offers
- Reservation create/cancel/modify with atomic inventory updates
- Idempotent booking keys and double-booking protection via conditional updates + serializable transactions

## Quick start

```bash
cp .env.example .env
# start Postgres/Redis (compose or local)
docker compose up -d postgres redis
npm install
npx prisma migrate deploy
npm run seed
npm run start:dev
```

- API: `http://localhost:4000/api/v1`
- Swagger: `http://localhost:4000/docs`

### Seed accounts

| Email | Password | Role |
| --- | --- | --- |
| `superadmin@nomadstay.local` | `ChangeMe123!` | SUPER_ADMIN |
| `owner@demo-hotel.local` | `ChangeMe123!` | HOTEL_OWNER |

Seed also opens ~90 days of inventory and a BAR rate plan for the demo property.

## Architecture docs

See `docs/` for assessment, architecture, ERD, permission matrix, endpoint map, and checklist.

## Coexistence with legacy Express app

The existing Vite SPA + Express JSON API in the repo root remain intact under `/api`.  
This Nest service is the new platform backend under `/api/v1`.

## Next phases

3. Payments, commission, payouts  
4. Front desk / HK / maintenance / messaging  
5. Reviews, promos, support, reporting  
6. Hardening, security review, performance, CI
