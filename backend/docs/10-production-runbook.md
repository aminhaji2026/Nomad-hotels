# 10. Production runbook

## Services

| Service | Port | Notes |
| --- | --- | --- |
| API | `4000` | Nest modular monolith |
| Postgres | `5432` | Primary datastore |
| Redis | `6379` | Throttle / future queues |

## Deploy

```bash
cd backend
cp .env.example .env   # fill production secrets
docker compose up -d postgres redis
npm ci
npx prisma migrate deploy
npm run seed           # first environment only; disable afterwards
npm run build
npm run start:prod
```

Health: `GET /api/v1/health` · Ready: `GET /api/v1/health/ready`  
Swagger: `/docs` (disable or protect in prod)

## Seed accounts (dev/staging only)

| Email | Password | Role |
| --- | --- | --- |
| `superadmin@nomadstay.local` | `ChangeMe123!` | Platform superadmin |
| `owner@demo-hotel.local` | `ChangeMe123!` | Demo hotel owner |

## Migrations

```bash
npx prisma migrate deploy
npx prisma generate
```

Never use `migrate reset` in production.

## Incident playbooks

### API unhealthy
1. Check `GET /api/v1/health/ready`  
2. Verify Postgres/Redis connectivity  
3. Inspect process logs for migration or env validation errors  
4. Roll back to previous container image if deploy-related

### Double booking reports
1. Confirm inventory conditional update path still deployed  
2. Query overlapping `ReservationRoom` + inventory days  
3. Prefer compensating cancel + guest recovery over silent inventory edits

### Payment / refund mismatch
1. Locate `Payment` + `Refund` + `WebhookEvent` by `idempotencyKey` / `providerRef`  
2. Re-drive sandbox/provider webhook only if `processedAt` is null  
3. Adjust ledger via finance endpoints with audit note

### Cross-tenant data leak suspicion
1. Pull `AuditLog` for actor  
2. Verify memberships / platform flag  
3. Rotate JWT secrets if token theft suspected

## Backups

- Nightly Postgres logical dumps + WAL archiving  
- Test restore monthly into staging  
- Redis is ephemeral — do not store sole source of truth there

## Rollback

1. Redeploy previous image/tag  
2. If migration is incompatible, restore DB snapshot taken pre-deploy  
3. Smoke: health, login, search, one sandbox payment capture
