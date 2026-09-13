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
  adminSettings: () =>
    request<{
      settings: Record<string, unknown>
      integrations?: Record<string, Record<string, string>>
      env?: Record<string, unknown>
      duffel?: Record<string, unknown>
      paymentMethods?: unknown[]
    }>('/api/admin/settings'),
  updateAdminSettings: (payload: Record<string, unknown>) =>
    request<{
      settings: Record<string, unknown>
      integrations?: Record<string, Record<string, string>>
      env?: Record<string, unknown>
    }>('/api/admin/settings', {
      method: 'PATCH',
      body: payload,
    }),
  adminStays: () => request<{ stays: ApiStay[]; count: number }>('/api/admin/stays'),
  updateAdminStay: (id: string, payload: Record<string, unknown>) =>
    request<{ stay: ApiStay }>(`/api/admin/stays/${id}`, { method: 'PATCH', body: payload }),
  archiveStay: (id: string) =>
    request<{ stay: ApiStay }>(`/api/admin/stays/${id}`, { method: 'DELETE' }),
  adminApplications: (status = 'all') =>
    request<{ applications: unknown[]; count: number }>(
      `/api/admin/applications?status=${encodeURIComponent(status)}`,
    ),
  createAdminApplication: (payload: Record<string, unknown>) =>
    request<{ application: unknown; stay: unknown }>('/api/admin/applications', {
      method: 'POST',
      body: payload,
    }),
  updateAdminApplication: (id: string, payload: Record<string, unknown>) =>
    request<{ application: unknown }>(`/api/admin/applications/${id}`, { method: 'PATCH', body: payload }),
  adminCustomers: (q = '') =>
    request<{ customers: unknown[]; count: number }>(
      `/api/admin/customers${q ? `?q=${encodeURIComponent(q)}` : ''}`,
    ),
  updateAdminCustomer: (id: string, payload: Record<string, unknown>) =>
    request<{ customer: unknown }>(`/api/admin/customers/${id}`, { method: 'PATCH', body: payload }),
  updateAdminBooking: (id: string, payload: Record<string, unknown>) =>
    request<{ booking: unknown }>(`/api/admin/bookings/${id}`, { method: 'PATCH', body: payload }),
  adminInventory: () =>
    request<{ rooms: unknown[]; holds: unknown[]; alerts: unknown[] }>('/api/admin/inventory'),
  updateAdminInventory: (roomId: string, payload: Record<string, unknown>) =>
    request<{ room: unknown }>(`/api/admin/inventory/${roomId}`, { method: 'PATCH', body: payload }),
  adminRates: () => request<{ ratePlans: unknown[]; count: number }>('/api/admin/rates'),
  updateAdminRate: (id: string, payload: Record<string, unknown>) =>
    request<{ ratePlan: unknown }>(`/api/admin/rates/${id}`, { method: 'PATCH', body: payload }),
  adminCommissions: () => request<Record<string, unknown>>('/api/admin/commissions'),
  updateAdminCommission: (payload: Record<string, unknown>) =>
    request<{ settings: Record<string, unknown> }>('/api/admin/settings/commission', {
      method: 'PATCH',
      body: payload,
    }),
  adminRefunds: () => request<{ refunds: unknown[]; count: number }>('/api/admin/refunds'),
  createAdminRefund: (payload: Record<string, unknown>) =>
    request<{ refund: unknown; message?: string }>('/api/admin/refunds', { method: 'POST', body: payload }),
  updateAdminRefund: (id: string, payload: Record<string, unknown>) =>
    request<{ refund: unknown }>(`/api/admin/refunds/${id}`, { method: 'PATCH', body: payload }),
  adminPayouts: () => request<{ payouts: unknown[]; forecast: number }>('/api/admin/payouts'),
  createAdminPayout: (payload: Record<string, unknown>) =>
    request<{ payout: unknown }>('/api/admin/payouts', { method: 'POST', body: payload }),
  updateAdminPayout: (id: string, payload: Record<string, unknown>) =>
    request<{ payout: unknown }>(`/api/admin/payouts/${id}`, { method: 'PATCH', body: payload }),
  adminLedger: () => request<{ entries: unknown[]; count: number }>('/api/admin/ledger'),
  adminPromotions: () => request<{ promotions: unknown[] }>('/api/admin/promotions'),
  createAdminPromotion: (payload: Record<string, unknown>) =>
    request<{ promotion: unknown }>('/api/admin/promotions', { method: 'POST', body: payload }),
  updateAdminPromotion: (id: string, payload: Record<string, unknown>) =>
    request<{ promotion: unknown }>(`/api/admin/promotions/${id}`, { method: 'PATCH', body: payload }),
  adminAds: () => request<{ ads: unknown[] }>('/api/admin/ads'),
  updateAdminAd: (id: string, payload: Record<string, unknown>) =>
    request<{ ad: unknown }>(`/api/admin/ads/${id}`, { method: 'PATCH', body: payload }),
  adminReviews: () => request<{ reviews: unknown[] }>('/api/admin/reviews'),
  updateAdminReview: (id: string, payload: Record<string, unknown>) =>
    request<{ review: unknown }>(`/api/admin/reviews/${id}`, { method: 'PATCH', body: payload }),
  adminCms: () => request<{ pages: unknown[] }>('/api/admin/cms'),
  updateAdminCms: (id: string, payload: Record<string, unknown>) =>
    request<{ page: unknown }>(`/api/admin/cms/${id}`, { method: 'PATCH', body: payload }),
  adminDestinations: () => request<{ destinations: unknown[] }>('/api/admin/destinations'),
  createAdminDestination: (payload: Record<string, unknown>) =>
    request<{ destination: unknown }>('/api/admin/destinations', { method: 'POST', body: payload }),
  updateAdminDestination: (id: string, payload: Record<string, unknown>) =>
    request<{ destination: unknown }>(`/api/admin/destinations/${id}`, { method: 'PATCH', body: payload }),
  adminTaxonomy: () => request<{ taxonomy: Record<string, unknown> }>('/api/admin/taxonomy'),
  updateAdminTaxonomy: (payload: Record<string, unknown>) =>
    request<{ taxonomy: Record<string, unknown> }>('/api/admin/taxonomy', { method: 'PATCH', body: payload }),
  adminSupport: () => request<{ tickets: unknown[] }>('/api/admin/support'),
  updateAdminSupport: (id: string, payload: Record<string, unknown>) =>
    request<{ ticket: unknown }>(`/api/admin/support/${id}`, { method: 'PATCH', body: payload }),
  adminFraud: () => request<{ flags: unknown[] }>('/api/admin/fraud'),
  updateAdminFraud: (id: string, payload: Record<string, unknown>) =>
    request<{ flag: unknown }>(`/api/admin/fraud/${id}`, { method: 'PATCH', body: payload }),
  adminNotifications: () => request<{ templates: unknown[] }>('/api/admin/notifications'),
  updateAdminNotification: (id: string, payload: Record<string, unknown>) =>
    request<{ template: unknown }>(`/api/admin/notifications/${id}`, { method: 'PATCH', body: payload }),
  adminLanguages: () => request<{ languages: unknown[]; base: string }>('/api/admin/languages'),
  updateAdminLanguages: (payload: Record<string, unknown>) =>
    request<{ languages: unknown[]; base: string }>('/api/admin/languages', { method: 'PATCH', body: payload }),
  adminTaxes: () => request<{ rules: unknown[] }>('/api/admin/taxes'),
  createAdminTax: (payload: Record<string, unknown>) =>
    request<{ rule: unknown }>('/api/admin/taxes', { method: 'POST', body: payload }),
  adminLoyalty: () =>
    request<{ config: Record<string, unknown>; liabilities: number; ledger: unknown[] }>('/api/admin/loyalty'),
  updateAdminLoyalty: (payload: Record<string, unknown>) =>
    request<{ config: Record<string, unknown> }>('/api/admin/loyalty', { method: 'PATCH', body: payload }),
  adminReportsSummary: () => request<Record<string, unknown>>('/api/admin/reports/summary'),
  adminRoles: () => request<{ roles: unknown[] }>('/api/admin/roles'),
  updateAdminRole: (id: string, payload: Record<string, unknown>) =>
    request<{ role: unknown }>(`/api/admin/roles/${id}`, { method: 'PATCH', body: payload }),
  adminAudit: (q = '', entity = '') => {
    const params = new URLSearchParams()
    if (q) params.set('q', q)
    if (entity) params.set('entity', entity)
    const qs = params.toString()
    return request<{ audit: unknown[]; count: number }>(`/api/admin/audit${qs ? `?${qs}` : ''}`)
  },
}

