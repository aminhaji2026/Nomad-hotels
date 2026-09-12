# 6. API endpoint map (Phase 1 + preview)

Base: **`/api/v1`**. Auth: `Bearer <accessToken>` unless marked public.

## Health
- `GET /health` · `GET /health/ready` · `GET /health/live`

## Auth
- `POST /auth/register` (customer)
- `POST /auth/login`
- `POST /auth/refresh`
- `POST /auth/logout`
- `POST /auth/otp/request`
- `POST /auth/otp/verify`
- `POST /auth/password/forgot`
- `POST /auth/password/reset`
- `GET /auth/sessions`
- `DELETE /auth/sessions/:id`
- `POST /auth/2fa/setup` · `POST /auth/2fa/verify` (hooks; TOTP adapter)
- `GET /auth/me`

## Users / RBAC
- `GET /users/me` · `PATCH /users/me`
- `GET /rbac/roles` · `GET /rbac/permissions`
- `POST /rbac/roles` (platform)
- `PUT /rbac/roles/:id/permissions` (platform)

## Hotel groups & properties
- `POST /hotel-groups`
- `GET /hotel-groups/:id`
- `PATCH /hotel-groups/:id`
- `POST /hotel-groups/:id/properties`
- `GET /properties` (scoped)
- `GET /properties/:id`
- `PATCH /properties/:id`
- `POST /properties/:id/amenities`
- `PUT /properties/:id/policies`
- `POST /properties/:id/media`
- `PATCH /properties/:id/media/reorder`
- `POST /properties/:id/staff/invitations`
- `GET /properties/:id/staff`
- `PATCH /properties/:id/staff/:membershipId`
- `DELETE /properties/:id/staff/:membershipId`

## Onboarding
- `POST /onboarding/applications`
- `GET /onboarding/applications/mine`
- `GET /onboarding/applications/:id`
- `PATCH /onboarding/applications/:id`
- `POST /onboarding/applications/:id/documents`
- `POST /onboarding/applications/:id/submit`
- `GET /onboarding/applications/:id/checklist`
- Platform:
  - `GET /platform/onboarding/applications`
  - `POST /platform/onboarding/applications/:id/review` (approve|reject|request_changes|suspend)
  - `GET /platform/onboarding/applications/:id/history`

## Rooms
- `POST /properties/:id/buildings` · floors
- `POST /properties/:id/room-types`
- `PATCH /room-types/:id`
- `POST /room-types/:id/photos`
- `POST /room-types/:id/rooms` (physical)
- `PATCH /rooms/:id` (OOS, connecting, assignment metadata)
- `GET /properties/:id/room-types`
- `GET /properties/:id/rooms`

## Media
- `POST /media/upload-url` (presign / local adapter)
- `POST /media/confirm`

## Audit
- `GET /audit-logs` (scoped / platform)

## Search & reservations (Phase 2)
- `GET /search/hotels` · `GET /search/hotels/:propertyId`
- `POST /reservations` · `GET /reservations/:id` · `POST /reservations/:id/cancel` · `PATCH /reservations/:id`

## Payments & finance (Phase 3)
- `POST /payments/intents` · `POST /payments/:id/capture` · `POST /payments/:id/refunds`
- `GET /reservations/:reservationId/payments` · `POST /webhooks/payments`
- `GET /properties/:propertyId/statements` · `POST /payouts` · `POST /payouts/:id/mark-paid` · `POST /ledger/adjustments`

## Operations (Phase 4)
- `GET /properties/:propertyId/arrivals|departures|in-house`
- `POST /bookings/:confirmationNumber/check-in|check-out|no-show`
- `POST /bookings/:confirmationNumber/rooms/:reservationRoomId/assign`
- `GET|POST /properties/:propertyId/housekeeping/tasks` · `PATCH /housekeeping/tasks/:id`
- `GET|POST /properties/:propertyId/maintenance/tickets` · `PATCH /maintenance/tickets/:id`
- `POST|GET /messages/threads` · `GET|POST /messages/threads/:id`
- `GET /me/notifications` · `POST /notifications/send` · `GET|POST /notification-templates`

## Growth & platform (Phase 5)
- `POST /reviews` · `GET /properties/:propertyId/reviews` · `POST /reviews/:id/reply` · `PATCH /reviews/:id/moderate`
- `POST|GET /promotions` · `POST /promotions/validate` · `PATCH /promotions/:id/deactivate`
- `POST|GET /support/tickets` · `GET|PATCH /support/tickets/:id` · `POST /support/tickets/:id/messages`
- `GET /properties/:propertyId/reports/occupancy|revenue` · `GET /platform/reports/overview`
- `GET|POST /platform/settings` · `GET /destinations` · `POST|PATCH /platform/destinations`
- `GET|POST /platform/exchange-rates` · `GET /platform/webhooks/events` · `GET /platform/audit-logs`
- `POST /platform/properties/:id/feature`