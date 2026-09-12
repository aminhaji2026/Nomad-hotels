type ApiBody = BodyInit | Record<string, unknown> | unknown[] | null | undefined

/** Ops builds can point at the customer API host so login does not depend on a same-origin proxy. */
const API_BASE = String(import.meta.env.VITE_API_BASE_URL || '').replace(/\/$/, '')

let authToken: string | null =
  typeof localStorage !== 'undefined' ? localStorage.getItem('nomadstay-token') : null

export function setAuthToken(token: string | null) {
  authToken = token
}

function apiUrl(path: string) {
  if (/^https?:\/\//i.test(path)) return path
  return `${API_BASE}${path}`
}

async function request<T>(path: string, options: Omit<RequestInit, 'body'> & { body?: ApiBody } = {}): Promise<T> {
  const { body, headers, ...rest } = options
  const isForm = typeof FormData !== 'undefined' && body instanceof FormData
  const isPlainObject =
    body !== null &&
    body !== undefined &&
    !isForm &&
    typeof body === 'object' &&
    !(body instanceof Blob) &&
    !(body instanceof ArrayBuffer) &&
    !(body instanceof URLSearchParams) &&
    !ArrayBuffer.isView(body)

  const res = await fetch(apiUrl(path), {
    ...rest,
    headers: {
      ...(isPlainObject ? { 'Content-Type': 'application/json' } : {}),
      ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
      ...(headers || {}),
    },
    body: isPlainObject ? JSON.stringify(body) : (body as BodyInit | null | undefined),
  })
  const data = (await res.json().catch(() => ({}))) as T & { error?: string }
  if (!res.ok) {
    throw new Error(data.error || `Request failed (${res.status})`)
  }
  return data
}

export type ApiStay = {
  id: string
  name: string
  city: string
  country: string
  neighborhood: string
  type: 'hotel' | 'guest_house' | 'holiday_home' | string
  typeLabel: string
  image: string
  gallery: string[]
  nightlyFrom: number
  rating: number
  reviews: number
  guestScore: number
  badge?: 'Bestseller' | 'New' | string
  amenities: string[]
  highlights: string[]
  summary: string
  room: {
    name: string
    tag: string
    bed: string
    guests: number
    sizeSqm: number
    image: string
    blurb: string
  }
  map: { lat: number; lng: number }
  contact?: { phone?: string; email?: string; website?: string; checkIn?: string; checkOut?: string }
  featured?: boolean
  ownerId?: string | null
  status?: string
  internalNotes?: string
}

export type AuthUser = {
  id: string
  name: string
  email: string
  role: 'customer' | 'hotel_admin' | 'admin' | string
  points: number
  referralCode: string
  referredBy?: string | null
  stayIds?: string[]
  phone?: string
  status?: string
  createdAt?: string
}

export type ApiUser = AuthUser

export type PaymentMethod = {
  id: string
  label: string
  description: string
  regions: string[]
}

/** @deprecated alias */
export type PaymentMethodAlias = PaymentMethod

export const api = {
  health: () => request<{ ok: boolean }>('/api/health'),
  paymentMethods: () => request<{ methods: PaymentMethod[] }>('/api/meta/payment-methods'),

  register: (payload: { email: string; password: string; name?: string; phone?: string }) =>
    request<{ user: AuthUser; token: string; created: boolean }>('/api/auth/register', {
      method: 'POST',
      body: payload,
    }),
  login: (payload: { email: string; password: string; portal?: 'customer' | 'staff' }) =>
    request<{ user: AuthUser; token: string; portal: string }>('/api/auth/login', {
      method: 'POST',
      body: payload,
    }),
  me: () => request<{ user: AuthUser }>('/api/auth/me'),
  session: (payload: { email: string; name?: string; password?: string }) =>
    request<{ user: AuthUser; created: boolean; token?: string | null }>('/api/auth/session', {
      method: 'POST',
      body: payload,
    }),

  listStays: (params: Record<string, string> = {}) => {
    const qs = new URLSearchParams(params).toString()
    return request<{ stays: ApiStay[]; count: number }>(`/api/stays${qs ? `?${qs}` : ''}`)
  },
  getStay: (id: string) => request<{ stay: ApiStay; rooms?: unknown[] }>(`/api/stays/${id}`),
  createStay: (formData: FormData) =>
    request<{ stay: ApiStay }>('/api/stays', { method: 'POST', body: formData }),
  updateStay: (id: string, formData: FormData) =>
    request<{ stay: ApiStay }>(`/api/stays/${id}`, { method: 'PATCH', body: formData }),
  uploadImages: (formData: FormData) =>
    request<{ files: Array<{ url: string; filename: string }> }>('/api/uploads', {
      method: 'POST',
      body: formData,
    }),

  getUser: (id: string) =>
    request<{
      user: AuthUser
      ledger: Array<{
        id: string
        points: number
        reason: string
        createdAt: string
        meta?: Record<string, unknown>
      }>
      bookings: unknown[]
    }>(`/api/users/${id}`),
  redeemReferral: (payload: { userId: string; code: string }) =>
    request<{ user: AuthUser; awarded: { referrer: number; referee: number } }>(
      '/api/referrals/redeem',
      { method: 'POST', body: payload },
    ),
  createBooking: (payload: Record<string, unknown>) =>
    request<{
      booking: { bookingRef: string; pointsEarned: number; status?: string; paymentStatus?: string }
      user: AuthUser
      pointsEarned: number
      payment?: {
        id: string
        status: string
        gateway: string
        checkoutUrl?: string | null
        message?: string | null
      }
    }>('/api/bookings', { method: 'POST', body: payload }),
  confirmDemoPayment: (id: string) =>
    request<{ payment: unknown; booking: unknown }>(`/api/payments/${id}/confirm-demo`, {
      method: 'POST',
    }),
  loyaltyRules: () =>
    request<{
      rules: {
        welcomeBonus: number
        referralReferrer: number
        referralReferee: number
        pointsPerDollar: number
      }
      copy: Record<string, string>
    }>('/api/loyalty/rules'),

  duffelStatus: () => request<Record<string, unknown>>('/api/duffel/status'),
  duffelSearch: (payload: Record<string, unknown>) =>
    request<{ data: { results: unknown[]; mode?: string } }>('/api/duffel/search', {
      method: 'POST',
      body: payload,
    }),
  duffelRates: (id: string) =>
    request<unknown>(`/api/duffel/search-results/${id}/rates`, { method: 'POST' }),
  duffelQuote: (payload: Record<string, unknown>) =>
    request<unknown>('/api/duffel/quotes', { method: 'POST', body: payload }),
  duffelBook: (payload: Record<string, unknown>) =>
    request<unknown>('/api/duffel/bookings', { method: 'POST', body: payload }),

  hotelDashboard: () => request<Record<string, unknown>>('/api/hotel/dashboard'),
  hotelBookings: (status?: string) =>
    request<{ bookings: unknown[]; count: number }>(
      `/api/hotel/bookings${status ? `?status=${status}` : ''}`,
    ),
  updateHotelBooking: (id: string, payload: Record<string, unknown>) =>
    request<{ booking: unknown }>(`/api/hotel/bookings/${id}`, { method: 'PATCH', body: payload }),
  hotelRooms: () => request<{ rooms: unknown[] }>('/api/hotel/rooms'),
  createHotelRoom: (payload: Record<string, unknown>) =>
    request<{ room: unknown }>('/api/hotel/rooms', { method: 'POST', body: payload }),
  updateHotelRoom: (id: string, payload: Record<string, unknown>) =>
    request<{ room: unknown }>(`/api/hotel/rooms/${id}`, { method: 'PATCH', body: payload }),
  hotelMessages: () => request<{ messages: unknown[] }>('/api/hotel/messages'),
  sendHotelMessage: (payload: Record<string, unknown>) =>
    request<{ message: unknown }>('/api/hotel/messages', { method: 'POST', body: payload }),
  hotelCalendar: () => request<{ events: unknown[] }>('/api/hotel/calendar'),

  adminDashboard: (range = '30') =>
    request<Record<string, unknown>>(`/api/admin/dashboard?range=${encodeURIComponent(range)}`),
  adminUsers: () => request<{ users: AuthUser[] }>('/api/admin/users'),
  createAdminUser: (payload: Record<string, unknown>) =>
    request<{ user: AuthUser }>('/api/admin/users', { method: 'POST', body: payload }),
  updateAdminUser: (id: string, payload: Record<string, unknown>) =>
    request<{ user: AuthUser }>(`/api/admin/users/${id}`, { method: 'PATCH', body: payload }),
  adminBookings: () => request<{ bookings: unknown[] }>('/api/admin/bookings'),
  adminPayments: () =>
    request<{ payments: unknown[]; methods: PaymentMethod[] }>('/api/admin/payments'),
  adminSettings: () => request<Record<string, unknown>>('/api/admin/settings'),
  updateAdminSettings: (payload: Record<string, unknown>) =>
    request<{ settings: Record<string, unknown> }>('/api/admin/settings', {
      method: 'PATCH',
      body: payload,
    }),
  adminStays: () => request<{ stays: ApiStay[]; count: number }>('/api/admin/stays'),
  updateAdminStay: (id: string, payload: Record<string, unknown>) =>
    request<{ stay: ApiStay }>(`/api/admin/stays/${id}`, { method: 'PATCH', body: payload }),
  archiveStay: (id: string) =>
    request<{ stay: ApiStay }>(`/api/admin/stays/${id}`, { method: 'DELETE' }),
}

