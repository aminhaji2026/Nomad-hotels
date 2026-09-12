import { useMemo, useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { destinations, vehicles } from '../data/catalog'
import { useSaved } from '../context/SavedContext'
import { useUser } from '../context/UserContext'
import { useStays } from '../hooks/useStays'
import { AppShell, BrandLockup } from '../components/AppShell'
import { StayCard } from '../components/StayCard'
import { StayCardSkeleton } from '../components/Skeleton'
import { Reveal } from '../components/Reveal'

const categories = [
  { id: 'hotels', label: 'Hotels' },
  { id: 'guest_houses', label: 'Guest Houses' },
  { id: 'holiday_homes', label: 'Holiday Homes' },
  { id: 'vehicles', label: 'Vehicles' },
] as const

export function ExplorePage() {
  const navigate = useNavigate()
  const { isSaved, toggleSaved } = useSaved()
  const { user, ensureSession } = useUser()
  const { stays, loading } = useStays()
  const [category, setCategory] = useState<(typeof categories)[number]['id']>('hotels')
  const [query, setQuery] = useState('Hargeisa')
  const [dates, setDates] = useState('2025-05-24|2025-05-28')
  const [guests, setGuests] = useState('2 Guests, 1 Room')

  const featured = useMemo(
    () =>
      stays.filter((s) =>
        ['damal-hotel-hargeisa', 'holiday-hotel-mogadishu', 'address-downtown', 'maldives-villa'].includes(
          s.id,
        ),
      ),
    [stays],
  )
  const topRated = useMemo(() => [...stays].sort((a, b) => b.rating - a.rating).slice(0, 3), [stays])
  const luxury = useMemo(
    () => stays.filter((s) => s.nightlyFrom >= 400 || s.type === 'holiday_home').slice(0, 4),
    [stays],
  )

  function onSearch(event: FormEvent) {
    event.preventDefault()
    const [checkIn, checkOut] = dates.split('|')
    const params = new URLSearchParams({
      city: query || 'Hargeisa',
      checkIn: checkIn || '2025-05-24',
      checkOut: checkOut || '2025-05-28',
      guests,
      category,
    })
    navigate(`/results?${params.toString()}`)
  }

  function scrollToSearch() {
    document.getElementById('atelier-search')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  return (
    <AppShell flush>
      <section className="atelier-hero" aria-label="NomadStay introduction">
        <img
          className="atelier-hero__media"
          src="https://images.unsplash.com/photo-1582719508461-905c673771fd?auto=format&fit=crop&w=1600&q=80"
          alt=""
        />
        <div className="atelier-hero__veil" aria-hidden="true" />
        <div className="atelier-hero__grain" aria-hidden="true" />
        <div className="atelier-hero__content lux-stagger">
          <div className="lux-stagger__item">
            <BrandLockup onDark />
          </div>
          <h1 className="lux-stagger__item">Stay where the world softens.</h1>
          <p className="lux-stagger__item">An atelier of handpicked sanctuaries across the Horn of Africa and beyond.</p>
          <div className="atelier-hero__cta lux-stagger__item">
            <button type="button" className="btn btn--gold lux-shimmer" onClick={scrollToSearch}>
              Explore stays
            </button>
            <Link to={user ? '/profile' : '/login'} className="btn btn--ghost">
              {user ? 'Your membership' : 'Member entry'}
            </Link>
          </div>
        </div>
      </section>

      <div className="explore-panel" id="atelier-search">
        <header className="top-bar top-bar--panel">
          <div>
            <p className="eyebrow">Curated for you</p>
            <h2 className="serif-title">Find your next sanctuary</h2>
          </div>
          {user ? (
            <Link to="/profile" className="points-chip" title="Loyalty points">
              ✦ {user.points.toLocaleString()} pts
            </Link>
          ) : (
            <button type="button" className="points-chip" onClick={() => void ensureSession()}>
              Join loyalty
            </button>
          )}
        </header>

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
          <button type="submit" className="btn btn--gold btn--block lux-shimmer">
            Search stays
          </button>
        </form>

        <Reveal className="rail-section-wrap"><section className="rail-section">
          <div className="section-head">
            <h2>Horn of Africa picks</h2>
          </div>
          <div className="stack">
            {loading
              ? Array.from({ length: 2 }).map((_, i) => <StayCardSkeleton key={i} />)
              : featured
                  .filter((s) => ['damal-hotel-hargeisa', 'holiday-hotel-mogadishu'].includes(s.id))
                  .map((stay) => (
                    <StayCard
                      key={stay.id}
                      stay={stay}
                      saved={isSaved(stay.id)}
                      onToggleSave={toggleSaved}
                    />
                  ))}
          </div>
        </section></Reveal>

        <Reveal className="rail-section-wrap"><section className="rail-section">
          <div className="section-head">
            <h2>Destinations</h2>
          </div>
          <div className="h-scroll">
            {destinations.map((dest) => (
              <Link
                key={dest.id}
                to={`/results?city=${encodeURIComponent(dest.name)}`}
                className="dest-card"
              >
                <img src={dest.image} alt="" loading="lazy" />
                <div>
                  <strong>{dest.name}</strong>
                  <span>{dest.country}</span>
                </div>
              </Link>
            ))}
          </div>
        </section></Reveal>

        <Reveal className="rail-section-wrap"><section className="rail-section">
          <div className="section-head">
            <h2>Private escapes</h2>
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
        </section></Reveal>

        <Reveal className="rail-section-wrap"><section className="rail-section">
          <div className="section-head">
            <h2>Most loved stays</h2>
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
        </section></Reveal>

        <Reveal className="rail-section-wrap"><section className="rail-section">
          <div className="section-head">
            <h2>Chauffeured travel</h2>
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
        </section></Reveal>
      </div>
    </AppShell>
  )
}
