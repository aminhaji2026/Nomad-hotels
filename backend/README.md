# NomadStay Platform API

Production-oriented NestJS modular monolith for a multi-hotel booking platform.

## Implemented phases

1. **Auth / RBAC / onboarding / property & rooms**
2. **Rates / inventory / search / reservations**
3. **Payments / commission / statements / payouts**
4. **Front desk / housekeeping / maintenance / messaging / notifications**
5. **Reviews / promotions / support / reporting / platform admin**
6. **Hardening** — critical unit + DB e2e suites, security/perf notes, production runbook, CI

## Quick start

```bash
cp .env.example .env
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

## Tests

```bash
npm test          # unit
npm run test:e2e  # DB-backed e2e (requires migrate + seed)
```

## Docs

See `docs/` for architecture, ERD, permissions, API map, checklist, security review, performance notes, and production runbook.

## Coexistence with legacy Express app

The existing Vite SPA + Express JSON API in the repo root remain intact under `/api`.  
This Nest service is the new platform backend under `/api/v1`.
