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

## Later phases (contract reserved)
`/search`, `/reservations`, `/payments`, `/front-desk`, `/housekeeping`, `/maintenance`, `/reviews`, `/promotions`, `/support`, `/reports`, `/platform/*`