# 2. Proposed architecture

## Style

**Modular monolith** (NestJS + TypeScript) with clear bounded contexts. Each module owns its domain services, controllers, DTOs, and Prisma access patterns. Modules may later extract to microservices behind the same HTTP/WS contracts.

```
Clients (Web / Mobile / Admin)
        │
        ▼
   API Gateway layer (Nest)
   /api/v1 + Swagger + throttling + idempotency
        │
   ┌────┴────┬──────────┬───────────┐
   Auth/RBAC │ Hotels   │ Inventory │ Reservations │ Payments │ Ops │ Support
   └────┬────┴──────────┴───────────┘
        │
   PostgreSQL ◄── Prisma
   Redis      ◄── sessions / cache / BullMQ
   S3         ◄── media
   WS gateway ◄── room status / messaging
```

## Cross-cutting

- **Auth**: JWT access (short) + refresh (rotating, revocable) stored hashed in DB; device sessions.
- **Authorization**: global roles + property/group scoped permissions via CASL-style checks (`@Permissions()`).
- **Validation**: `class-validator` DTOs + `ValidationPipe`.
- **Errors**: centralized `HttpExceptionFilter` with `{ code, message, requestId, details? }`.
- **Logging**: request ID middleware; structured JSON logs.
- **Idempotency**: `Idempotency-Key` header for booking/payment/refund/webhook mutations.
- **Audit**: append-only `AuditLog` for sensitive actions.
- **Jobs**: BullMQ queues for email/SMS, hold expiry, webhooks, reports.

## Coexistence with legacy Express

| Surface | Port / path | Purpose |
| --- | --- | --- |
| Legacy Express | `:3001` `/api` | Existing SPA |
| Nest API | `:4000` `/api/v1` | Platform backend |
| Compose | postgres, redis, minio, api, worker | Local prod-parity |

## Phased delivery

See `07-implementation-checklist.md`. Phase 1 delivers auth, RBAC, onboarding, property & room management on real Postgres.