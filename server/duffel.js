/**
 * Duffel Stays API client (v2).
 * Docs: https://duffel.com/docs/guides/searching-for-stays
 * Falls back to mock inventory when DUFFEL_ACCESS_TOKEN is unset.
 */

const DUFFEL_BASE = process.env.DUFFEL_API_BASE || 'https://api.duffel.com'
const DUFFEL_VERSION = process.env.DUFFEL_VERSION || 'v2'

function token() {
  return process.env.DUFFEL_ACCESS_TOKEN || process.env.DUFFEL_API_TOKEN || ''
}

export function duffelConfigured() {
  return Boolean(token())
}

async function duffelFetch(path, { method = 'GET', body } = {}) {
  const access = token()
  if (!access) {
    const err = new Error('DUFFEL_ACCESS_TOKEN is not configured')
    err.code = 'DUFFEL_NOT_CONFIGURED'
    throw err
  }
  const res = await fetch(`${DUFFEL_BASE}${path}`, {
    method,
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      'Accept-Encoding': 'gzip',
      'Duffel-Version': DUFFEL_VERSION,
      Authorization: `Bearer ${access}`,
    },
    body: body ? JSON.stringify(body) : undefined,
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    const message = data?.errors?.[0]?.message || data?.error || `Duffel error (${res.status})`
    const err = new Error(message)
    err.status = res.status
    err.details = data
    throw err
  }
  return data
}

function mockSearch({ check_in_date, check_out_date, rooms = 1 }) {
  const nights = Math.max(
    1,
    Math.round(
      (new Date(check_out_date).getTime() - new Date(check_in_date).getTime()) / 86400000,
    ),
  )
  return {
    data: {
      results: [
        {
          id: 'srr_mock_damal',
          check_in_date,
          check_out_date,
          rooms,
          cheapest_rate_total_amount: String(85 * nights),
          cheapest_rate_currency: 'USD',
          accommodation: {
            id: 'acc_mock_damal',
            name: 'Damal Hotel Hargeisa',
            rating: 4.7,
            review_score: 9.0,
            location: {
              geographic_coordinates: { latitude: 9.5616, longitude: 44.064 },
              address: { city_name: 'Hargeisa', country_code: 'SO' },
            },
            photos: [{ url: '/hotels/damal/cover.jpg' }],
            amenities: [{ description: 'Wi-Fi' }, { description: 'Breakfast' }],
          },
          source: 'mock',
        },
        {
          id: 'srr_mock_holiday',
          check_in_date,
          check_out_date,
          rooms,
          cheapest_rate_total_amount: String(95 * nights),
          cheapest_rate_currency: 'USD',
          accommodation: {
            id: 'acc_mock_holiday',
            name: 'Holiday Hotel Mogadishu',
            rating: 4.6,
            review_score: 8.9,
            location: {
              geographic_coordinates: { latitude: 2.0469, longitude: 45.3182 },
              address: { city_name: 'Mogadishu', country_code: 'SO' },
            },
            photos: [{ url: '/hotels/holiday/hero.jpg' }],
            amenities: [{ description: 'Secure Compound' }, { description: 'Wi-Fi' }],
          },
          source: 'mock',
        },
        {
          id: 'srr_mock_address',
          check_in_date,
          check_out_date,
          rooms,
          cheapest_rate_total_amount: String(320 * nights),
          cheapest_rate_currency: 'USD',
          accommodation: {
            id: 'acc_mock_address',
            name: 'Address Downtown Dubai',
            rating: 5,
            review_score: 9.6,
            location: {
              geographic_coordinates: { latitude: 25.1972, longitude: 55.2744 },
              address: { city_name: 'Dubai', country_code: 'AE' },
            },
            photos: [
              {
                url: 'https://images.unsplash.com/photo-1582719508461-905c673771fd?auto=format&fit=crop&w=1400&q=80',
              },
            ],
            amenities: [{ description: 'Pool' }, { description: 'Spa' }],
          },
          source: 'mock',
        },
      ],
      created_at: new Date().toISOString(),
      mode: 'mock',
    },
  }
}

export async function searchStays(payload) {
  if (!duffelConfigured()) return mockSearch(payload)
  return duffelFetch('/stays/search', { method: 'POST', body: { data: payload } })
}

export async function fetchAllRates(searchResultId) {
  if (!duffelConfigured()) {
    return {
      data: {
        id: searchResultId,
        rates: [
          {
            id: `rat_mock_${searchResultId}`,
            total_amount: '340.00',
            total_currency: 'USD',
            base_amount: '300.00',
            base_currency: 'USD',
            name: 'Best Available Rate',
            payment_type: 'pay_now',
            board_type: 'room_only',
            quantity_available: 4,
          },
        ],
        mode: 'mock',
      },
    }
  }
  return duffelFetch(`/stays/search_results/${searchResultId}/actions/fetch_all_rates`, {
    method: 'POST',
  })
}

export async function createQuote({ rate_id, loyalty_programme_account_number } = {}) {
  if (!duffelConfigured()) {
    return {
      data: {
        id: `quo_mock_${rate_id || 'rate'}`,
        rate_id,
        total_amount: '340.00',
        total_currency: 'USD',
        expires_at: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
        mode: 'mock',
      },
    }
  }
  return duffelFetch('/stays/quotes', {
    method: 'POST',
    body: {
      data: {
        rate_id,
        ...(loyalty_programme_account_number ? { loyalty_programme_account_number } : {}),
      },
    },
  })
}

export async function createBooking(payload) {
  if (!duffelConfigured()) {
    return {
      data: {
        id: `bok_mock_${Date.now()}`,
        reference: `NSD${Date.now().toString().slice(-7)}`,
        status: 'confirmed',
        quote_id: payload.quote_id,
        email: payload.email,
        phone_number: payload.phone_number,
        guests: payload.guests,
        mode: 'mock',
      },
    }
  }
  return duffelFetch('/stays/bookings', { method: 'POST', body: { data: payload } })
}

export async function getBooking(id) {
  if (!duffelConfigured()) {
    return { data: { id, reference: id, status: 'confirmed', mode: 'mock' } }
  }
  return duffelFetch(`/stays/bookings/${id}`)
}

export async function cancelBooking(id) {
  if (!duffelConfigured()) {
    return { data: { id, status: 'cancelled', mode: 'mock' } }
  }
  return duffelFetch(`/stays/bookings/${id}/actions/cancel`, { method: 'POST' })
}

export async function listBookings() {
  if (!duffelConfigured()) return { data: [], mode: 'mock' }
  return duffelFetch('/stays/bookings')
}

export function duffelStatus() {
  return {
    configured: duffelConfigured(),
    version: DUFFEL_VERSION,
    base: DUFFEL_BASE,
    mode: duffelConfigured() ? 'live' : 'mock',
  }
}
