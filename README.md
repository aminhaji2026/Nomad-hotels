# NomadStay

Premium travel booking experience inspired by the NomadStay mobile UI — handpicked hotels, villas, vehicles, and concierge-ready trips.

## Live

https://workspace-production-3ef2.up.railway.app

## Run locally

```bash
npm install
npm run dev
```

```bash
npm run build
npm start   # serves dist on $PORT (Railway)
```

## App routes

| Route | Screen |
| --- | --- |
| `/` | Explore home (search, destinations, luxury, vehicles) |
| `/results` | Search results with **List / Map** toggle + filters |
| `/stay/:id` | Property detail, add-ons, sticky booking bar |
| `/book/:id` | Availability request → confirmation |
| `/trips` | My Trips itinerary + manage booking |
| `/saved` | Saved stays (local) |
| `/map` | Map browsing |
| `/profile` | Profile / concierge |

## Stack

Vite · React · TypeScript · React Router

## Improvements

See [IMPROVEMENTS.md](./IMPROVEMENTS.md) for completed work and next backend/product steps.
