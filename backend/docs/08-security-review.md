# 8. Security review notes

Date: 2026-09-12  
Scope: NomadStay NestJS API (`backend/`) Phases 1–6

## Controls already in place

| Area | Implementation |
| --- | --- |
| Transport defaults | Helmet enabled; CORS allow-list via `CORS_ORIGINS` |
| AuthN | JWT access + refresh rotation; password hashing (argon2/bcrypt); OTP hooks |
| AuthZ | Permission guards + property/group scoping via `AccessService` |
| Input | Global `ValidationPipe` (`whitelist`, `forbidNonWhitelisted`, transform) |
| Abuse | Nest throttler (`THROTTLE_*`) |
| Money ops | Idempotency keys on bookings/payments/refunds; atomic inventory updates |
| Audit | `AuditService` on sensitive mutations |
| Webhooks | Signature verification hook on payment webhooks (sandbox accepts `sandbox`) |
| Secrets | Env-validated JWT secrets; `.env.example` documents required vars |

## Findings / residual risks

1. **Optional JWT on public booking** — fixed so Bearer tokens on `@Public()` routes still hydrate `request.user` (guest bookings now set `customerId`).
2. **Sandbox payment gateway** — not for production card data; swap to Stripe/Adyen adapter before go-live.
3. **Refresh token storage** — ensure production uses HttpOnly cookies or hardened mobile storage; rotate secrets per environment.
4. **PII in logs** — avoid logging full guest payloads; keep request IDs only.
5. **Admin impersonation** — permission exists; require step-up auth / reason codes before enabling in prod.
6. **Rate limits** — tune per route (auth stricter than search).
7. **File uploads** — media adapter is metadata-only; enforce virus scan + signed URL TTL when S3 is enabled.

## Pre-production checklist

- [ ] Rotate all JWT/DB/Redis secrets; disable seed passwords
- [ ] Enforce TLS everywhere; HSTS at edge
- [ ] Restrict Swagger (`/docs`) to private networks
- [ ] Enable DB SSL + least-privilege DB role
- [ ] Turn on structured audit export / SIEM sink
- [ ] Pen-test auth, IDOR across properties, payment refund paths
