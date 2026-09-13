/**
 * Automatic split settlement when a guest pays:
 * platform keeps commission; property receives the remainder immediately.
 */

function roundMoney(n) {
  return Math.round(Number(n || 0) * 100) / 100
}

export function commissionRateForStay(db, stay) {
  const override = Number(stay?.commissionRate)
  if (Number.isFinite(override) && override >= 0) return override
  const fromSettings = Number(db.settings?.defaultCommissionRate ?? 0.12)
  return Number.isFinite(fromSettings) ? fromSettings : 0.12
}

/** Idempotent split settlement. Call on every PAID transition. */
export function settleSplitPayment(db, booking, { uid }) {
  const paid = booking?.paymentStatus === 'PAID'
  if (!booking || !paid) return null

  db.financeLedger = Array.isArray(db.financeLedger) ? db.financeLedger : []
  db.payouts = Array.isArray(db.payouts) ? db.payouts : []

  const existing = db.financeLedger.find(
    (e) => e.bookingId === booking.id && e.type === 'commission',
  )
  if (existing) {
    return (
      booking.splitSettlement || {
        commission: existing.amount,
        propertyNet: roundMoney(Number(booking.total) - Number(existing.amount)),
        alreadySettled: true,
      }
    )
  }

  const stay = (db.stays || []).find((s) => s.id === booking.stayId)
  const rate = commissionRateForStay(db, stay)
  const gross = roundMoney(booking.total)
  const commission = roundMoney(gross * rate)
  const propertyNet = roundMoney(gross - commission)
  const now = new Date().toISOString()
  const propertyType = stay?.type || stay?.typeLabel || 'property'
  const propertyName = stay?.name || booking.stayName || 'Property'
  const currency = booking.currency || db.settings?.defaultCurrency || 'USD'
  const bookingRef = booking.bookingRef || booking.id

  db.financeLedger.unshift({
    id: uid('fin_'),
    type: 'commission',
    bookingId: booking.id,
    bookingRef,
    stayId: booking.stayId,
    propertyName,
    propertyType,
    amount: commission,
    rate,
    currency,
    status: 'posted',
    createdAt: now,
  })

  db.financeLedger.unshift({
    id: uid('fin_'),
    type: 'hotel_payable',
    bookingId: booking.id,
    bookingRef,
    stayId: booking.stayId,
    propertyName,
    propertyType,
    amount: propertyNet,
    currency,
    status: 'settled',
    createdAt: now,
    settledAt: now,
  })

  const payout = {
    id: uid('payo_'),
    stayId: booking.stayId,
    stayName: propertyName,
    propertyType,
    bookingId: booking.id,
    bookingRef,
    amount: propertyNet,
    commission,
    gross,
    rate,
    period: 'instant',
    method: 'split_payment',
    status: 'paid',
    auto: true,
    createdAt: now,
    paidAt: now,
    note: `Automatic split payout after guest payment (${Math.round(rate * 100)}% platform commission).`,
  }
  db.payouts.unshift(payout)

  booking.splitSettlement = {
    commission,
    propertyNet,
    rate,
    payoutId: payout.id,
    settledAt: now,
    propertyType,
  }
  booking.updatedAt = now
  return booking.splitSettlement
}
