# 7. Implementation checklist

## Phase 1 — Auth, RBAC, onboarding, property & rooms
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
- [x] Gateway abstraction (sandbox adapter; Stripe-shaped interface)
- [x] Payment intents, capture, refunds, webhook ingest
- [x] Commission records on capture
- [x] Property statements, payouts, ledger adjustments

## Phase 4 — Operations & messaging
- [x] Front desk arrivals/departures/in-house/check-in/out/assign/no-show
- [x] Housekeeping tasks + room status transitions
- [x] Maintenance tickets + OOO room flagging
- [x] Guest/property messaging threads
- [x] Notification templates + sandbox delivery

## Phase 5 — Reviews, promos, support, reporting, super-admin
- [x] Guest reviews + hotel reply + moderation
- [x] Promotions create/validate/deactivate
- [x] Support tickets + staff replies/internal notes
- [x] Occupancy/revenue reports + platform overview
- [x] Destinations, system settings, FX rates, audit/webhook views, feature property

## Phase 6 — Hardening
- [x] Critical scenario unit coverage (double-booking, refund caps, cross-hotel 403, review-without-stay)
- [x] Build/lint/test green for Phases 3–5 modules
- [ ] Broader e2e suite against live DB (follow-up)
- [ ] Security review, load testing, production runbooks (follow-up)

**Rule:** a feature is only marked complete when end-to-end DB-backed flow works and tests pass.
