import { useLayoutEffect, useMemo, useRef, useState, type CSSProperties, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { destinations, vehicles } from '../data/catalog'
import { useSaved } from '../context/SavedContext'
import { useUser } from '../context/UserContext'
import { useStays } from '../hooks/useStays'
import { AppShell, BrandLockup } from '../components/AppShell'
import { StayCard } from '../components/StayCard'
import { StayCardSkeleton } from '../components/Skeleton'
import { Reveal } from '../components/Reveal'
import { categoryIcons } from '../components/LuxIcons'

const categories = [
  { id: 'hotels', label: 'Hotels', short: 'Hotels' },
  { id: 'guest_houses', label: 'Guest Houses', short: 'Guests' },
  { id: 'holiday_homes', label: 'Holiday Homes', short: 'Homes' },
  { id: 'vehicles', label: 'Vehicles', short: 'Cars' },
] as const

export function ExplorePage() {
  const navigate = useNavigate()
  const { isSaved, toggleSaved } = useSaved()
  const { user, ensureSession } = useUser()
  const { stays, loading } = useStays()
  const [category, setCategory] = useState<(typeof categories)[number]['id']>('hotels')
  const [query, setQuery] = useState('Dubai')
  const [dates, setDates] = useState('2025-05-24|2025-05-28')
  const [guests, setGuests] = useState('2 Guests, 1 Room')
  const railRef = useRef<HTMLDivElement>(null)
  const itemRefs = useRef<(HTMLButtonElement | null)[]>([])
  const [indicator, setIndicator] = useState({ left: 0, width: 0 })
  const activeIndex = categories.findIndex((c) => c.id === category)

  useLayoutEffect(() => {
    const update = () => {
      const btn = itemRefs.current[activeIndex]
      const rail = railRef.current
      if (!btn || !rail) return
      const railBox = rail.getBoundingClientRect()
      const btnBox = btn.getBoundingClientRect()
      setIndicator({ left: btnBox.left - railBox.left + rail.scrollLeft, width: btnBox.width })
    }
    update()
    window.addEventListener('resize', update)
    return () => window.removeEventListener('resize', update)
  }, [activeIndex, category])

  const featured = useMemo(
    () =>
      stays.filter((s) =>
        ['jazeer-hargeisa', 'address-downtown', 'four-seasons-dubai', 'maldives-villa'].includes(s.id),
      ),
    [stays],
  )
  const topRated = useMemo(() => [...stays].sort((a, b) => b.rating - a.rating).slice(0, 3), [stays])
  const luxury = useMemo(
    () => stays.filter((s) => s.nightlyFrom >= 400 || s.type === 'holiday_home').slice(0, 4),
    [stays],
  )
  const hornPicks = useMemo(
    () => featured.filter((s) => ['jazeer-hargeisa', 'address-downtown'].includes(s.id)),
    [featured],
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

  function scrollToSearch() {
    document.getElementById('maison-reserve')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  return (
    <AppShell
      flush
      topBar={
        <div className="lux-top-line" aria-label="Browse by stay type">
          <div className="lux-select-rail" ref={railRef} role="tablist" aria-label="Stay categories">
            <span
              className="lux-select-rail__indicator"
              style={{ transform: `translateX(${indicator.left}px)`, width: indicator.width } as CSSProperties}
              aria-hidden="true"
            />
            {categories.map((item, index) => {
              const Icon = categoryIcons[item.id]
              const active = category === item.id
              return (
                <button
                  key={item.id}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  className={`lux-select${active ? ' is-active' : ''}`}
                  style={{ '--lux-i': index } as CSSProperties}
                  ref={(el) => {
                    itemRefs.current[index] = el
                  }}
                  onClick={() => setCategory(item.id)}
                >
                  <span className="lux-select__medal" aria-hidden="true">
                    <span className="lux-select__ring" />
                    <span className="lux-select__icon lux-icon">
                      <Icon />
                    </span>
                  </span>
                  <span className="lux-select__label">{item.short}</span>
                </button>
              )
            })}
          </div>
        </div>
      }
    >
      <section className="atelier-hero maison-hero" aria-label="NomadStay introduction">
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
          <p className="maison-kicker lux-stagger__item">The leading collection of quiet luxury</p>
          <h1 className="lux-stagger__item">
            Stay where the world <em>softens</em>.
          </h1>
          <p className="lux-stagger__item">
            Independently minded sanctuaries across the Horn of Africa, the Gulf, and beyond — curated like a
            private maison.
          </p>
          <div className="atelier-hero__cta lux-stagger__item">
            <button type="button" className="btn btn--gold lux-shimmer" onClick={scrollToSearch}>
              Reserve a stay
            </button>
            <Link to={user ? '/profile' : '/login'} className="btn btn--ghost">
              {user ? 'Your membership' : 'Become a member'}
            </Link>
          </div>
        </div>
        <button type="button" className="maison-scroll" onClick={scrollToSearch} aria-label="Scroll to reservations">
          <span />
        </button>
      </section>

      <div className="maison-ribbon" role="note">
        <span>Maison Concierge</span>
        <span aria-hidden="true">·</span>
        <span>Arrivals arranged with quiet precision</span>
      </div>

      <div className="explore-panel" id="maison-reserve">
        <header className="section-head section-head--maison">
          <div>
            <p className="eyebrow">Reservations desk</p>
            <h2 className="serif-title">
              Find your next <em>sanctuary</em>
            </h2>
          </div>
          {user ? (
            <Link to="/profile" className="points-chip" title="Loyalty points">
              ✦ {user.points.toLocaleString()} pts
            </Link>
          ) : (
            <button type="button" className="points-chip" onClick={() => void ensureSession()}>
              Join the maison
            </button>
          )}
        </header>

        <form className="search-card maison-desk" onSubmit={onSearch}>
          <label className="search-field">
            <span className="mini-label">Destination</span>
            <span className="search-field__row">
              <span aria-hidden="true">⌕</span>
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Where would you like to arrive?"
              />
            </span>
          </label>
          <div className="search-grid">
            <label className="mini-field">
              <span>Check in — out</span>
              <select value={dates} onChange={(e) => setDates(e.target.value)}>
                <option value="2025-05-24|2025-05-28">May 24 – May 28</option>
                <option value="2025-06-01|2025-06-07">Jun 1 – Jun 7</option>
                <option value="2025-07-10|2025-07-17">Jul 10 – Jul 17</option>
              </select>
            </label>
            <label className="mini-field">
              <span>Guests & Suites</span>
              <select value={guests} onChange={(e) => setGuests(e.target.value)}>
                <option>2 Guests, 1 Room</option>
                <option>1 Guest, 1 Room</option>
                <option>4 Guests, 2 Rooms</option>
              </select>
            </label>
          </div>
          <button type="submit" className="btn btn--amber btn--block lux-shimmer">
            Search stays
          </button>
        </form>

        <Reveal className="rail-section-wrap">
          <section className="rail-section">
            <div className="section-head section-head--maison">
              <div>
                <p className="eyebrow">Signature collection</p>
                <h2>
                  Horn of Africa <em>picks</em>
                </h2>
              </div>
            </div>
            <div className="stack">
              {loading
                ? Array.from({ length: 2 }).map((_, i) => <StayCardSkeleton key={i} />)
                : (hornPicks.length ? hornPicks : featured.slice(0, 2)).map((stay) => (
                    <StayCard
                      key={stay.id}
                      stay={stay}
                      saved={isSaved(stay.id)}
                      onToggleSave={toggleSaved}
                    />
                  ))}
            </div>
          </section>
        </Reveal>

        <Reveal className="rail-section-wrap">
          <section className="rail-section">
            <div className="section-head section-head--maison">
              <div>
                <p className="eyebrow">Characterful destinations</p>
                <h2>
                  Step into our <em>world</em>
                </h2>
              </div>
            </div>
            <div className="h-scroll">
              {destinations.map((dest) => (
                <Link
                  key={dest.id}
                  to={`/results?city=${encodeURIComponent(dest.name)}`}
                  className="dest-card maison-dest"
                >
                  <img src={dest.image} alt="" loading="lazy" />
                  <div>
                    <strong>{dest.name}</strong>
                    <span>{dest.country}</span>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        </Reveal>

        <Reveal className="rail-section-wrap">
          <section className="rail-section">
            <div className="section-head section-head--maison">
              <div>
                <p className="eyebrow">Private escapes</p>
                <h2>
                  Independently <em>minded</em>
                </h2>
              </div>
              <Link to="/results?sort=luxury">Explore all</Link>
            </div>
            <div className="h-scroll h-scroll--wide">
              {luxury.map((stay) => (
                <Link key={stay.id} to={`/stay/${stay.id}`} className="escape-card maison-escape">
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
        </Reveal>

        <Reveal className="rail-section-wrap">
          <section className="rail-section">
            <div className="section-head section-head--maison">
              <div>
                <p className="eyebrow">Most loved</p>
                <h2>
                  Guests return <em>here</em>
                </h2>
              </div>
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
        </Reveal>

        <Reveal className="rail-section-wrap">
          <section className="rail-section">
            <div className="section-head section-head--maison">
              <div>
                <p className="eyebrow">Arrivals & journeys</p>
                <h2>
                  Chauffeured <em>travel</em>
                </h2>
              </div>
              <Link to="/results?category=vehicles">See all</Link>
            </div>
            <div className="h-scroll">
              {vehicles.map((vehicle) => (
                <article key={vehicle.id} className="vehicle-card maison-vehicle">
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
        </Reveal>
      </div>
    </AppShell>
  )
}
