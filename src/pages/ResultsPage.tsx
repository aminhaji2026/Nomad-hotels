import { useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { nightsBetween, stays } from '../data/catalog'
import { useSaved } from '../context/SavedContext'
import { AppShell } from '../components/AppShell'
import { MapPreview } from '../components/MapPreview'
import { StayCardSkeleton } from '../components/Skeleton'
import { StayCard } from '../components/StayCard'

export function ResultsPage() {
  const [params, setParams] = useSearchParams()
  const { isSaved, toggleSaved } = useSaved()
  const [loading, setLoading] = useState(true)
  const [view, setView] = useState<'list' | 'map'>((params.get('view') as 'list' | 'map') || 'list')
  const [sort, setSort] = useState(params.get('sort') || 'best')
  const [price, setPrice] = useState(params.get('price') || 'any')
  const [type, setType] = useState(params.get('type') || 'any')

  const city = params.get('city') || 'Dubai'
  const checkIn = params.get('checkIn') || '2025-05-24'
  const checkOut = params.get('checkOut') || '2025-05-28'
  const guests = params.get('guests') || '2 Guests, 1 Room'
  const nights = nightsBetween(checkIn, checkOut)

  useEffect(() => {
    setLoading(true)
    const timer = window.setTimeout(() => setLoading(false), 650)
    return () => window.clearTimeout(timer)
  }, [city, sort, price, type, view])

  const results = useMemo(() => {
    let list = stays.filter((stay) => {
      const cityMatch =
        city.toLowerCase() === 'anywhere' ||
        stay.city.toLowerCase().includes(city.toLowerCase()) ||
        stay.country.toLowerCase().includes(city.toLowerCase())
      // Also show luxury inventory when searching Dubai-heavy catalog fallback
      return cityMatch || (city === 'Dubai' && stay.city === 'Dubai')
    })

    // If exact city has few results, include destination-themed fallbacks for demo
    if (list.length < 2 && city !== 'Dubai') {
      list = stays.filter(
        (stay) =>
          stay.city.toLowerCase().includes(city.toLowerCase()) ||
          ['maldives-villa', 'bali-cliff', 'zanzibar-beach'].includes(stay.id),
      )
    }
    if (city === 'Dubai') {
      list = stays.filter((stay) => stay.city === 'Dubai' || stay.id === 'maldives-villa')
    }

    if (type !== 'any') {
      list = list.filter((stay) => stay.type === type)
    }
    if (price === 'under300') list = list.filter((stay) => stay.nightlyFrom < 300)
    if (price === '300to600') {
      list = list.filter((stay) => stay.nightlyFrom >= 300 && stay.nightlyFrom <= 600)
    }
    if (price === '600plus') list = list.filter((stay) => stay.nightlyFrom > 600)

    if (sort === 'price') list = [...list].sort((a, b) => a.nightlyFrom - b.nightlyFrom)
    else if (sort === 'rating') list = [...list].sort((a, b) => b.rating - a.rating)
    else list = [...list].sort((a, b) => b.guestScore - a.guestScore)

    return list
  }, [city, sort, price, type])

  function updateView(next: 'list' | 'map') {
    setView(next)
    const nextParams = new URLSearchParams(params)
    nextParams.set('view', next)
    setParams(nextParams, { replace: true })
  }

  return (
    <AppShell>
      <header className="results-header">
        <div className="results-header__row">
          <Link to="/" className="icon-btn" aria-label="Back">
            ←
          </Link>
          <div className="results-header__title">
            <strong>{city}</strong>
            <span>
              {checkIn.slice(5)} – {checkOut.slice(5)} · {guests}
            </span>
          </div>
          <button type="button" className="icon-btn" aria-label="Notifications">
            ⌁
          </button>
        </div>

        <div className="filter-row">
          <select value={sort} onChange={(e) => setSort(e.target.value)} aria-label="Sort">
            <option value="best">Sort · Best Match</option>
            <option value="price">Price</option>
            <option value="rating">Rating</option>
          </select>
          <select value={price} onChange={(e) => setPrice(e.target.value)} aria-label="Price">
            <option value="any">Price</option>
            <option value="under300">Under $300</option>
            <option value="300to600">$300–$600</option>
            <option value="600plus">$600+</option>
          </select>
          <select value={type} onChange={(e) => setType(e.target.value)} aria-label="Property type">
            <option value="any">Property Type</option>
            <option value="hotel">Hotels</option>
            <option value="holiday_home">Holiday Homes</option>
            <option value="guest_house">Guest Houses</option>
          </select>
        </div>

        <div className="segmented" role="tablist" aria-label="Results view">
          <button
            type="button"
            className={view === 'list' ? 'is-active' : ''}
            onClick={() => updateView('list')}
          >
            List
          </button>
          <button
            type="button"
            className={view === 'map' ? 'is-active' : ''}
            onClick={() => updateView('map')}
          >
            Map
          </button>
        </div>
      </header>

      <main className="page-pad">
        <div className="results-meta">
          <p>{loading ? 'Searching…' : `${results.length} stays found`}</p>
        </div>

        {view === 'map' ? (
          <MapPreview stays={results} city={city} expanded />
        ) : (
          <div className="stack">
            {loading
              ? Array.from({ length: 3 }).map((_, index) => <StayCardSkeleton key={index} />)
              : results.map((stay) => (
                  <StayCard
                    key={stay.id}
                    stay={stay}
                    nights={nights}
                    saved={isSaved(stay.id)}
                    onToggleSave={toggleSaved}
                  />
                ))}
            {!loading && results.length === 0 && (
              <p className="empty">No stays match these filters. Try widening price or property type.</p>
            )}
            {!loading && results.length > 0 && (
              <MapPreview stays={results} city={city} />
            )}
          </div>
        )}
      </main>
    </AppShell>
  )
}
