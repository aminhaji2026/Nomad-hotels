# Suggested improvements

Aligned to the **NomadStay** premium dark/gold mockups (Explore, Results list/map, Stay detail, My Trips).

## Done in this iteration

- [x] Re-skin to NomadStay visual system (dark charcoal + gold, serif brand, bottom nav)
- [x] Map + list dual view on search results (+ dedicated Map tab)
- [x] Sticky booking bar on stay detail (“Check Availability”)
- [x] Booking request flow with availability check → confirmation reference
- [x] Saved stays (localStorage) across Explore / Results / Detail / Saved
- [x] Skeleton loading states on results
- [x] Destination-aware add-ons (“Elevate your stay”)
- [x] My Trips: countdown, itinerary, Manage Booking sheet
- [x] Profile shell with concierge / trust messaging
- [x] `.cursor/environment.json` for Cloud Agent installs
- [x] Express backend serving API + SPA on Railway
- [x] Loyalty points (welcome + booking earn)
- [x] Referral points (share / redeem codes)
- [x] Image upload + host console for hotel info
- [x] Damal Hotel Hargeisa + Holiday Hotel Mogadishu listings

## Still recommended

1. **Persistent volume / Postgres** for `data/` + `uploads/` across Railway redeploys
2. **Payments** (deposit / pay-in-full) and live booking mutations
3. **True map SDK** (Mapbox/Google) instead of demo pins
4. **Auth** (magic link) so saved stays and trips sync across devices
5. **Host / admin CMS** hardening (auth for `/host`)
6. **Playwright E2E** for search → detail → request → trips
7. **Accessibility pass** on gold/grey contrast for WCAG AA
8. **Responsive `srcset` / image CDN** for hero photography
