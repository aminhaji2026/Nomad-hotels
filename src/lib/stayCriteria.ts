/** Shared stay-search criteria helpers (dates, rooms, occupants). */

export type StayOccupancy = {
  adults: number
  children: number
  rooms: number
}

export function toDateInputValue(date: Date) {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

export function addDays(isoDate: string, days: number) {
  const date = new Date(`${isoDate}T12:00:00`)
  date.setDate(date.getDate() + days)
  return toDateInputValue(date)
}

/** Sensible near-term defaults so the form never shows stale hard-coded years. */
export function defaultStayDates(offsetDays = 14, nights = 4) {
  const start = new Date()
  start.setHours(12, 0, 0, 0)
  start.setDate(start.getDate() + offsetDays)
  const checkIn = toDateInputValue(start)
  return { checkIn, checkOut: addDays(checkIn, nights) }
}

export function ensureCheckoutAfterCheckin(checkIn: string, checkOut: string) {
  if (!checkIn) return { checkIn, checkOut }
  if (!checkOut || checkOut <= checkIn) {
    return { checkIn, checkOut: addDays(checkIn, 1) }
  }
  return { checkIn, checkOut }
}

export function clampOccupancy(next: Partial<StayOccupancy>, current: StayOccupancy): StayOccupancy {
  const adults = Math.min(12, Math.max(1, next.adults ?? current.adults))
  const children = Math.min(10, Math.max(0, next.children ?? current.children))
  let rooms = Math.min(8, Math.max(1, next.rooms ?? current.rooms))
  // At least one adult per room keeps the request realistic.
  if (adults < rooms) rooms = adults
  return { adults, children, rooms }
}

export function formatOccupancyLabel({ adults, children, rooms }: StayOccupancy) {
  const people = adults + children
  const guestPart = `${people} Guest${people === 1 ? '' : 's'}`
  const detail =
    children > 0
      ? ` (${adults} adult${adults === 1 ? '' : 's'}, ${children} child${children === 1 ? '' : 'ren'})`
      : ''
  const roomPart = `${rooms} Room${rooms === 1 ? '' : 's'}`
  return `${guestPart}${detail}, ${roomPart}`
}

export function parseOccupancyParams(params: URLSearchParams): StayOccupancy {
  const adults = Number(params.get('adults') || 0)
  const children = Number(params.get('children') || 0)
  const rooms = Number(params.get('rooms') || 0)
  if (adults || children || rooms) {
    return clampOccupancy({ adults: adults || 2, children: children || 0, rooms: rooms || 1 }, {
      adults: 2,
      children: 0,
      rooms: 1,
    })
  }

  // Back-compat with older "2 Guests, 1 Room" strings.
  const legacy = params.get('guests') || ''
  const guestMatch = legacy.match(/(\d+)\s*Guest/i)
  const roomMatch = legacy.match(/(\d+)\s*Room/i)
  return {
    adults: guestMatch ? Number(guestMatch[1]) : 2,
    children: 0,
    rooms: roomMatch ? Number(roomMatch[1]) : 1,
  }
}

export function stayCriteriaSearchParams(input: {
  city?: string
  checkIn: string
  checkOut: string
  occupancy: StayOccupancy
  category?: string
  type?: string
}) {
  const { checkIn, checkOut } = ensureCheckoutAfterCheckin(input.checkIn, input.checkOut)
  const occupancy = clampOccupancy(input.occupancy, input.occupancy)
  const params = new URLSearchParams()
  if (input.city) params.set('city', input.city)
  params.set('checkIn', checkIn)
  params.set('checkOut', checkOut)
  params.set('adults', String(occupancy.adults))
  params.set('children', String(occupancy.children))
  params.set('rooms', String(occupancy.rooms))
  params.set('guests', formatOccupancyLabel(occupancy))
  if (input.category) params.set('category', input.category)
  if (input.type) params.set('type', input.type)
  return params
}
