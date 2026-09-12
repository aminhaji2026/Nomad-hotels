# 7. Implementation checklist

## Phase 1 (this delivery) — Auth, RBAC, onboarding, property & rooms
- [x] Architecture docs
- [x] Prisma schema + migration
- [x] Seed roles/permissions + demo users/properties
- [x] Auth (register/login/refresh/logout/OTP/password reset/sessions)
- [x] RBAC guards + property scoping
- [x] Hotel group & property CRUD
- [x] Staff invitations & memberships
- [x] Onboarding application workflow + platform review
- [x] Buildings/floors/room types/physical rooms
- [x] Media metadata model ready (upload adapter Phase 1 stub via MediaAsset)
- [x] Audit logging
- [x] Swagger, health, Docker Compose, `.env.example`
- [x] Auth smoke verified live; e2e scaffold added (expand in Phase 6)

## Phase 2 — Rates, inventory, search, reservations
- [x] Rate plans, daily rates & restrictions
- [x] Inventory calendar + holds + expiry + atomic booking guards
- [x] Public search + hotel detail offers (availability-priced)
- [x] Reservation create/cancel/modify lifecycle with idempotency

## Phase 3 — Payments, commission, payouts
- [ ] Gateway abstraction (Stripe + sandbox)
- [ ] Refunds, statements, payouts

## Phase 4 — Operations & messaging
- [ ] Front desk, housekeeping, maintenance
- [ ] Notifications + messaging

## Phase 5 — Reviews, promos, support, reporting, super-admin
- [ ] Reviews moderation
- [ ] Promotions/coupons
- [ ] Support tickets
- [ ] Reports + platform controls

## Phase 6 — Hardening
- [ ] Full critical scenario suite
- [ ] Security review, perf, CI, production runbooks

**Rule:** a feature is only marked complete when end-to-end DB-backed flow works and tests pass.