# NomadStay — suggested improvements

## Shipped in this iteration

- [x] Dual login portals: luxurious guest login (`/login`) and staff login (`/staff/login`)
- [x] Role-based access: `customer`, `hotel_admin`, `admin`
- [x] Hotel admin suite: dashboard, bookings, rooms & rates, calendar, property editor, messages
- [x] Platform admin suite: dashboard, hotels, users/roles, bookings, payments, Duffel Stay, settings
- [x] Creams-style payment gateways: Mock, ZAAD mobile money, International card (+ webhooks)
- [x] Duffel Stay API client with live token support and rich mock fallback
- [x] Booking flow payment method picker wired to gateway create/confirm

### Demo staff accounts

| Role | Email | Password |
| --- | --- | --- |
| Platform admin | `admin@nomadstay.com` | `NomadAdmin2026!` |
| Damal hotel admin | `hotel@damalhotel.com` | `DamalHost2026!` |
| Holiday hotel admin | `hotel@holidayhotel.so` | `HolidayHost2026!` |

## Recommended next enhancements

### For customers
1. **Magic-link / OTP auth** so trips and saved stays sync across devices without passwords
2. **Live map SDK** (Mapbox) with price pins and draw-to-search
3. **Flexible date search** and calendar heatmaps of lowest rates
4. **Guest messaging** with hotel concierge inside the trip detail
5. **Points redemption** at checkout (partial pay with loyalty)
6. **Push / WhatsApp booking updates** for Horn of Africa travelers
7. **Accessibility pass** on gold/grey contrast (WCAG AA)
8. **Responsive `srcset` / CDN** for hotel photography

### For hotel admins
1. **Availability calendar with inventory locks** and overbooking protection
2. **Rate plans** (BAR, non-refundable, corporate) per room type
3. **Housekeeping board** (dirty / clean / inspected)
4. **Channel manager sync** beyond Duffel (own website, OTAs)
5. **Payout ledger** showing ZAAD vs card settlements
6. **Guest CRM** notes, VIP tags, repeat-stay scores
7. **Staff sub-roles** (front desk, revenue, owner read-only)

### For platform admins
1. **Postgres + persistent volumes** instead of JSON file DB
2. **Fraud / velocity rules** on referrals and payment attempts
3. **Commission engine** and hotel settlement exports
4. **Feature flags** per market (ZAAD only in SO/SL, cards elsewhere)
5. **Audit log UI** with filters (already stored server-side)
6. **Duffel webhook handling** for booking status changes
7. **Playwright E2E**: search → book → pay → hotel confirm → admin revenue

## Integrations checklist

| Integration | Env vars | Status |
| --- | --- | --- |
| Mock payments | — | Ready |
| ZAAD | `ZAAD_API_KEY`, `ZAAD_MERCHANT_ID`, `ZAAD_BASE_URL` | Demo until keys set |
| International cards | `INTERNATIONAL_GATEWAY_KEY` or `STRIPE_SECRET_KEY` | Demo until keys set |
| Duffel Stay | `DUFFEL_ACCESS_TOKEN` (optional `DUFFEL_API_BASE`, `DUFFEL_VERSION`) | Mock until token set |
| Auth JWT | `JWT_SECRET`, `JWT_TTL` | Dev default present — rotate in prod |
