# NomadStay

Premium travel booking experience with a React frontend and Express API — loyalty points, referrals, image uploads, and Horn of Africa inventory including **Damal Hotel Hargeisa** and **Holiday Hotel Mogadishu**.

## Live

https://workspace-production-3ef2.up.railway.app

## Run locally

```bash
npm install
npm run dev:all   # Vite :5173 + API :3001 (proxied)
```

Or separately:

```bash
npm run dev:api   # API on :3000 (or PORT)
npm run dev       # Vite with /api proxy → :3001 if using dev:all
```

Production:

```bash
npm run build
npm start         # Express serves API + dist SPA
```

## Features

- Explore / results / stay detail / booking / trips / saved / map / profile
- **Loyalty points** — welcome bonus, booking earn rate ($1 → 10 pts)
- **Referral points** — share code; referrer +500, friend +250
- **Host console** (`/host`) — upload hotel images and edit info
- Seeded listings for Damal Hotel (Hargeisa) and Holiday Hotel (Mogadishu)

## API

| Method | Path | Purpose |
| --- | --- | --- |
| GET | `/api/stays` | List stays (`?city=`) |
| GET | `/api/stays/:id` | Stay detail |
| POST/PATCH | `/api/stays` | Create / update + image upload |
| POST | `/api/uploads` | Upload images |
| POST | `/api/auth/session` | Create/get loyalty user |
| POST | `/api/referrals/redeem` | Apply referral code |
| POST | `/api/bookings` | Request stay + award points |

## Improvements

See [IMPROVEMENTS.md](./IMPROVEMENTS.md).
