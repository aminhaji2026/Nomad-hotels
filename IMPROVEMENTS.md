# Suggested improvements

Built without the original inspiration images / brief (skipped on upload). These are the highest-leverage next steps once real design assets or product constraints are available.

## Product

1. **Replace mock inventory with a real catalog API** — destinations, availability calendars, and live monthly rates.
2. **Nomad-native filters** — timezone overlap with a home base, backup LTE, monitor rental, quiet-hours score, visa-friendly stay length.
3. **Verified Wi‑Fi proofs** — upload speed tests / host SLA instead of a single Mbps number.
4. **Booking flow** — request → host confirm → deposit; support 2–12 week stays, not only nightly hotel UX.
5. **Community layer** — nearby cowork partners, weekly dinners, and “who’s in-house this month.”

## Design / UX

1. **Align to the skipped inspiration set** — re-skin tokens, photography, and type once mockups arrive.
2. **Map + list dual view** for explore (neighborhood context matters more than star ratings for nomads).
3. **Comparison mode** for 2–3 stays (Wi‑Fi, desk, price/month, min nights).
4. **Mobile stay request** as a sticky bottom bar with date + month toggle.
5. **Empty / loading / error states** with skeleton media and offline-friendly caching.

## Engineering

1. **Auth + saved stays** (magic link is enough for MVP).
2. **CMS or admin** for hosts to update photos, Mbps, and monthly price.
3. **Image CDN / responsive `srcset`** — current Unsplash URLs are placeholders.
4. **Analytics** on filter usage (especially Wi‑Fi threshold) to tune inventory.
5. **E2E tests** for search → detail → request path; add Playwright when booking exists.
6. **`.cursor/environment.json`** with `npm install` for faster Cloud Agent boots.

## Positioning

Lead with **measured work setup + monthly clarity**, not another generic hotel marketplace. The differentiator should stay visible in every listing card: Mbps, desk, min nights, monthly from.
