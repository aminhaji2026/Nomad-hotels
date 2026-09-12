# 9. Performance notes

## Observed hotspots

| Path | Notes |
| --- | --- |
| Search / availability | Nights × room-type × rate-plan loops; keep inventory/rate rows indexed by `(roomTypeId, date)` / `(ratePlanId, date)` |
| Booking create | Serializable/conditional inventory updates — correct for correctness; keep transactions short |
| Statements / reports | Aggregate queries over payments/refunds/commissions; add date-range indexes in production |
| Front desk lists | Filter by property + date on reservation `checkIn`/`checkOut` |

## Guidance

- Cache destination lists and public property cards (short TTL).
- Consider Redis for hold expiry workers (BullMQ already in stack).
- Paginate staff lists / audit logs (already capped in several services).
- Load-test targets before launch: search p95 < 300ms, booking p95 < 800ms at expected concurrency.
- Use `EXPLAIN ANALYZE` on search + booking paths against production-sized inventory (~1y × rooms).

## Suggested load scenarios

1. 100 concurrent searches for popular city / weekend dates  
2. 20 concurrent booking attempts on last room (expect 1 success)  
3. Front desk check-in burst (50 ops/min/property)  
4. Statement generation for 90-day windows across 50 properties
