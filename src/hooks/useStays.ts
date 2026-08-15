import { useEffect, useState } from 'react'
import { api, type ApiStay } from '../api'
import type { Stay } from '../types'

function toStay(s: ApiStay): Stay {
  return {
    id: s.id,
    name: s.name,
    city: s.city,
    country: s.country,
    neighborhood: s.neighborhood,
    type: (s.type as Stay['type']) || 'hotel',
    typeLabel: s.typeLabel,
    image: s.image,
    gallery: s.gallery || [s.image],
    nightlyFrom: s.nightlyFrom,
    rating: s.rating,
    reviews: s.reviews,
    guestScore: s.guestScore,
    badge: s.badge as Stay['badge'],
    amenities: s.amenities as Stay['amenities'],
    highlights: s.highlights,
    summary: s.summary,
    room: s.room,
    map: s.map,
  }
}

export function useStays(params: Record<string, string> = {}) {
  const [stays, setStays] = useState<Stay[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const key = JSON.stringify(params)

  useEffect(() => {
    let alive = true
    setLoading(true)
    api
      .listStays(params)
      .then((data) => {
        if (!alive) return
        setStays(data.stays.map(toStay))
        setError(null)
      })
      .catch((err: Error) => {
        if (!alive) return
        setError(err.message)
        setStays([])
      })
      .finally(() => {
        if (alive) setLoading(false)
      })
    return () => {
      alive = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key])

  return { stays, loading, error }
}

export function useStay(id?: string) {
  const [stay, setStay] = useState<Stay | null>(null)
  const [raw, setRaw] = useState<ApiStay | null>(null)
  const [loading, setLoading] = useState(Boolean(id))
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!id) return
    let alive = true
    setLoading(true)
    api
      .getStay(id)
      .then((data) => {
        if (!alive) return
        setStay(toStay(data.stay))
        setRaw(data.stay)
        setError(null)
      })
      .catch((err: Error) => {
        if (!alive) return
        setError(err.message)
        setStay(null)
      })
      .finally(() => {
        if (alive) setLoading(false)
      })
    return () => {
      alive = false
    }
  }, [id])

  return { stay, raw, loading, error }
}
