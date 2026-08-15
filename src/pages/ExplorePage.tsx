import { useMemo, useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { destinations, stays, vehicles } from '../data/catalog'
import { useSaved } from '../context/SavedContext'
import { AppShell, BrandLockup } from '../components/AppShell'
import { StayCard } from '../components/StayCard'

const categories = [
  { id: 'hotels', label: 'Hotels' },
  { id: 'guest_houses', label: 'Guest Houses' },
  { id: 'holiday_homes', label: 'Holiday Homes' },
  { id: 'vehicles', label: 'Vehicles' },
] as const

export function ExplorePage() {
  const navigate = useNavigate()
  const { isSaved, toggleSaved } = useSaved()
  const [category, setCategory] = useState<(typeof categories)[number]['id']>('hotels')
  const [query, setQuery] = useState('Dubai')
  const [dates, setDates] = useState('2025-05-24|2025-05-28')
  const [guests, setGuests] = useState('2 Guests, 1 Room')

  const luxury = useMemo(
    () => stays.filter((s) => ['maldives-villa', 'bali-cliff', 'zanzibar-beach'].includes(s.id)),
    [],
  )
  const topRated = useMemo(
    () => stays.filter((s) => ['address-downtown', 'jazeer-hargeisa', 'four-seasons-dubai'].includes(s.id)),
    [],
  )

  function onSearch(event: FormEvent) {
    event.preventDefault()
    const [checkIn, checkOut] = dates.split('|')
    const params = new URLSearchParams({
      city: query || 'Dubai',
      checkIn: checkIn || '2025-05-24',
      checkOut: checkOut || '2025-05-28',
      guests,
      category,
    })
    navigate(`/results?${params.toString()}`)
  }

  return (
    <AppShell>
      <header className="top-bar">
        <BrandLockup />
        <button type="button" className="icon-btn" aria-label="Notifications">
          ⌁
          <span className="dot" />
        </button>
      </header>

      <main className="page-pad explore">
        <section className="hero-home">
          <div>
            <p className="eyebrow">Welcome back</p>
            <h1>
              Discover your next <em>journey</em>
            </h1>
          </div>
          <div className="hero-home__orb">
            <img
              src="https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?auto=format&fit=crop&w=600&q=80"
              alt=""
            />
          </div>
        </section>

        <div className="chip-row" role="tablist" aria-label="Categories">
          {categories.map((item) => (
            <button
              key={item.id}
              type="button"
              role="tab"
              aria-selected={category === item.id}
              className={`chip ${category === item.id ? 'is-active' : ''}`}
              onClick={() => setCategory(item.id)}
            >
              {item.label}
            </button>
          ))}
        </div>

        <form className="search-card" onSubmit={onSearch}>
          <label className="search-field">
            <span className="sr-only">Destination</span>
            <span aria-hidden="true">⌕</span>
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Where do you want to go?"
            />
          </label>
          <div className="search-grid">
            <label className="mini-field">
              <span>Dates</span>
              <select value={dates} onChange={(e) => setDates(e.target.value)}>
                <option value="2025-05-24|2025-05-28">May 24 – May 28</option>
                <option value="2025-06-01|2025-06-07">Jun 1 – Jun 7</option>
                <option value="2025-07-10|2025-07-17">Jul 10 – Jul 17</option>
              </select>
            </label>
            <label className="mini-field">
              <span>Guests & Rooms</span>
              <select value={guests} onChange={(e) => setGuests(e.target.value)}>
                <option>2 Guests, 1 Room</option>
                <option>1 Guest, 1 Room</option>
                <option>4 Guests, 2 Rooms</option>
              </select>
            </label>
          </div>
          <button type="submit" className="btn btn--gold btn--block">
            Search stays
          </button>
        </form>

        <section className="rail-section">
          <div className="section-head">
            <h2>Destinations</h2>
          </div>
          <div className="h-scroll">
            {destinations.map((dest) => (
              <Link key={dest.id} to={`/results?city=${encodeURIComponent(dest.name)}`} className="dest-card">
                <img src={dest.image} alt="" loading="lazy" />
                <div>
                  <strong>{dest.name}</strong>
                  <span>{dest.country}</span>
                </div>
              </Link>
            ))}
          </div>
        </section>

        <section className="rail-section">
          <div className="section-head">
            <h2>Luxury Escapes</h2>
            <Link to="/results?sort=luxury">See all</Link>
          </div>
          <div className="h-scroll h-scroll--wide">
            {luxury.map((stay) => (
              <Link key={stay.id} to={`/stay/${stay.id}`} className="escape-card">
                <img src={stay.image} alt={stay.name} loading="lazy" />
                {stay.badge && <span className="badge">{stay.badge}</span>}
                <div>
                  <strong>{stay.name}</strong>
                  <span>From ${stay.nightlyFrom} / night</span>
                </div>
              </Link>
            ))}
          </div>
        </section>

        <section className="rail-section">
          <div className="section-head">
            <h2>Top Rated Stays</h2>
            <Link to="/results">See all</Link>
          </div>
          <div className="stack">
            {topRated.map((stay) => (
              <StayCard
                key={stay.id}
                stay={stay}
                saved={isSaved(stay.id)}
                onToggleSave={toggleSaved}
              />
            ))}
          </div>
        </section>

        <section className="rail-section">
          <div className="section-head">
            <h2>Premium Vehicles</h2>
            <Link to="/results?category=vehicles">See all</Link>
          </div>
          <div className="h-scroll">
            {vehicles.map((vehicle) => (
              <article key={vehicle.id} className="vehicle-card">
                <img src={vehicle.image} alt={vehicle.name} loading="lazy" />
                <div>
                  <strong>{vehicle.name}</strong>
                  <span>{vehicle.detail}</span>
                  <p className="price-gold">From ${vehicle.dailyFrom} / day</p>
                </div>
              </article>
            ))}
          </div>
        </section>
      </main>
    </AppShell>
  )
}
