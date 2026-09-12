# NomadStay

Premium travel booking with a React guest app and Express API — dual logins, hotel + platform admin suites, Creams-style payments (Mock / ZAAD / cards), and Duffel Stay inventory.

## Live

https://workspace-production-3ef2.up.railway.app

## Run locally

```bash
cp .env.example .env
npm install
npm run dev:all   # Vite :5173 + API :3001 (proxied)
```

Production:

```bash
npm run build
npm start         # Express serves API + dist SPA
```

## Logins

| Portal | URL | Demo |
| --- | --- | --- |
| Guests | `/login` | Register, or continue with loyalty session from Profile |
| Staff (hotel + platform) | `/staff/login` | Use demo accounts below |

| Role | Email | Password |
| --- | --- | --- |
| Platform admin | `admin@nomadstay.com` | `NomadAdmin2026!` |
| Damal hotel admin | `hotel@damalhotel.com` | `DamalHost2026!` |
| Holiday hotel admin | `hotel@holidayhotel.so` | `HolidayHost2026!` |

## Features


### Guests
- Explore / results / stay detail / booking / trips / saved / map / profile
- Luxurious guest login & membership
- Loyalty + referral points
- Payment method picker (demo, ZAAD, international card)

### Hotel admin (`/hotel-admin`)
- Dashboard (revenue, arrivals, occupancy hint)
- Bookings (confirm / check-in / cancel + notes)
- Rooms & rates, calendar, property editor, messages

### Platform admin (`/admin`)
- Network dashboard, hotels, users/roles, bookings
- Payments ledger + gateway readiness
- Duffel Stay search console + platform settings

### Integrations
- **Payments** — Creams-style Mock / ZAAD / International (`server/payments.js`)
- **Duffel Stay** — search → rates → quote → book (`server/duffel.js`); mock mode without token

## Env

See [`.env.example`](./.env.example). Key vars: `JWT_SECRET`, `DUFFEL_ACCESS_TOKEN`, `ZAAD_API_KEY`, `INTERNATIONAL_GATEWAY_KEY`.

## Improvements

See [IMPROVEMENTS.md](./IMPROVEMENTS.md) for shipped work and recommended next enhancements for customers, hotel admins, and platform admins.
