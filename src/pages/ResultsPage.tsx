import { useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { nightsBetween, vehicles } from '../data/catalog'
import { useSaved } from '../context/SavedContext'
import { useStays } from '../hooks/useStays'
import { AppShell } from '../components/AppShell'
import { MapPreview } from '../components/MapPreview'
import { StayCardSkeleton } from '../components/Skeleton'
import { StayCard } from '../components/StayCard'

const categoryToType: Record<string, string> = {
  hotels: 'hotel',
  holiday_homes: 'holiday_home',
  guest_houses: 'guest_house',
  vehicles: 'vehicles',
}

export function ResultsPage() {
  const [params, setParams] = useSearchParams()
  const { isSaved, toggleSaved } = useSaved()
  const [view, setView] = useState<'list' | 'map'>((params.get('view') as 'list' | 'map') || 'list')
  const [sort, setSort] = useState(params.get('sort') || 'best')
  const [price, setPrice] = useState(params.get('price') || 'any')
  const categoryParam = params.get('category') || ''
  const mappedType = categoryToType[categoryParam] || ''
  const [type, setType] = useState(params.get('type') || mappedType || 'any')

  const city = params.get('city') || 'Dubai'
  const checkIn = params.get('checkIn') || '2025-05-24'
  const checkOut = params.get('checkOut') || '2025-05-28'
  const guests = params.get('guests') || '2 Guests, 1 Room'
  const nights = nightsBetween(checkIn, checkOut)
  const isCarRental = type === 'vehicles' || categoryParam === 'vehicles'

  const { stays, loading } = useStays(city && city !== 'Anywhere' ? { city } : {})

  useEffect(() => {
    if (mappedType && mappedType !== type) setType(mappedType)
  }, [mappedType]) // eslint-disable-line react-hooks/exhaustive-deps

  const results = useMemo(() => {
    if (isCarRental) return []
    let list = [...stays]

    if (type !== 'any' && type !== 'vehicles') list = list.filter((stay) => stay.type === type)
    if (price === 'under300') list = list.filter((stay) => stay.nightlyFrom < 300)
    if (price === '300to600') {
      list = list.filter((stay) => stay.nightlyFrom >= 300 && stay.nightlyFrom <= 600)
    }
    if (price === '600plus') list = list.filter((stay) => stay.nightlyFrom > 600)

    if (sort === 'price') list = [...list].sort((a, b) => a.nightlyFrom - b.nightlyFrom)
    else if (sort === 'rating') list = [...list].sort((a, b) => b.rating - a.rating)
    else list = [...list].sort((a, b) => b.guestScore - a.guestScore)

    return list
  }, [stays, sort, price, type, isCarRental])

  const rentalResults = useMemo(() => {
    if (!isCarRental) return []
    return vehicles.filter((v) => !city || city === 'Anywhere' || v.city === city || !v.city)
  }, [isCarRental, city])

  function updateView(next: 'list' | 'map') {
    setView(next)
    const nextParams = new URLSearchParams(params)
    nextParams.set('view', next)
    setParams(nextParams, { replace: true })
  }

  function updateType(next: string) {
    setType(next)
    const nextParams = new URLSearchParams(params)
    if (next === 'any') nextParams.delete('type')
    else nextParams.set('type', next)
    if (next === 'vehicles') nextParams.set('category', 'vehicles')
    else nextParams.delete('category')
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
            <strong>{isCarRental ? 'Car Rental' : city}</strong>
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
          <select value={type} onChange={(e) => updateType(e.target.value)} aria-label="Property type">
            <option value="any">All types</option>
            <option value="hotel">Hotels</option>
            <option value="holiday_home">Holiday homes</option>
            <option value="guest_house">Guest houses</option>
            <option value="vehicles">Car Rental</option>
          </select>
        </div>

        {!isCarRental && (
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
        )}
      </header>

      <main className="page-pad">
        <div className="results-meta">
          <p>
            {isCarRental
              ? `${rentalResults.length} vehicles available`
              : loading
                ? 'Searching…'
                : `${results.length} stays found`}
          </p>
        </div>

        {isCarRental ? (
          <div className="results-grid">
            {rentalResults.map((vehicle) => (
              <article key={vehicle.id} className="vehicle-card maison-vehicle lux-card">
                <img src={vehicle.image} alt={vehicle.name} loading="lazy" />
                <div>
                  <strong>{vehicle.name}</strong>
                  <span>{vehicle.detail}</span>
                  <p className="price-gold">From ${vehicle.dailyFrom} / day</p>
                </div>
              </article>
            ))}
            {rentalResults.length === 0 && (
              <p className="empty">No vehicles match this city. Try Dubai or clear the destination.</p>
            )}
          </div>
        ) : view === 'map' ? (
          <MapPreview stays={results} city={city} expanded />
        ) : (
          <div className="results-grid">
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
            {!loading && results.length > 0 && <MapPreview stays={results} city={city} />}
          </div>
        )}
      </main>
    </AppShell>
  )
}
