type ApiBody = BodyInit | Record<string, unknown> | unknown[] | null | undefined

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

  const res = await fetch(path, {
    ...rest,
    headers: {
      ...(isPlainObject ? { 'Content-Type': 'application/json' } : {}),
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
}

export type ApiUser = {
  id: string
  name: string
  email: string
  points: number
  referralCode: string
  referredBy?: string | null
  createdAt?: string
}

export const api = {
  health: () => request<{ ok: boolean }>('/api/health'),
  listStays: (params: Record<string, string> = {}) => {
    const qs = new URLSearchParams(params).toString()
    return request<{ stays: ApiStay[]; count: number }>(`/api/stays${qs ? `?${qs}` : ''}`)
  },
  getStay: (id: string) => request<{ stay: ApiStay }>(`/api/stays/${id}`),
  createStay: (formData: FormData) =>
    request<{ stay: ApiStay }>('/api/stays', { method: 'POST', body: formData }),
  updateStay: (id: string, formData: FormData) =>
    request<{ stay: ApiStay }>(`/api/stays/${id}`, { method: 'PATCH', body: formData }),
  uploadImages: (formData: FormData) =>
    request<{ files: Array<{ url: string; filename: string }> }>('/api/uploads', {
      method: 'POST',
      body: formData,
    }),
  session: (payload: { email: string; name?: string }) =>
    request<{ user: ApiUser; created: boolean }>('/api/auth/session', {
      method: 'POST',
      body: payload,
    }),
  getUser: (id: string) =>
    request<{
      user: ApiUser
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
    request<{ user: ApiUser; awarded: { referrer: number; referee: number } }>(
      '/api/referrals/redeem',
      { method: 'POST', body: payload },
    ),
  createBooking: (payload: Record<string, unknown>) =>
    request<{
      booking: { bookingRef: string; pointsEarned: number }
      user: ApiUser
      pointsEarned: number
    }>('/api/bookings', { method: 'POST', body: payload }),
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
}
