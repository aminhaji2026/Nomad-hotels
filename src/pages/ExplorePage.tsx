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
import { HeroMediaReel } from '../components/HeroMediaReel'
import { categoryIcons } from '../components/LuxIcons'
import { useDragScroll } from '../hooks/useDragScroll'
import { StayCriteriaFields } from '../components/StayCriteriaFields'
import {
  defaultStayDates,
  stayCriteriaSearchParams,
  type StayOccupancy,
} from '../lib/stayCriteria'

function scrollFrameToId(id: string) {
  const target = document.getElementById(id)
  const frame = document.querySelector('.app-frame') as HTMLElement | null
  if (!target || !frame) {
    target?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    return
  }
  const top = target.getBoundingClientRect().top - frame.getBoundingClientRect().top + frame.scrollTop - 8
  frame.scrollTo({ top, behavior: 'smooth' })
}

const categories = [
  { id: 'hotels', label: 'Hotels', short: 'Hotels' },
  { id: 'holiday_homes', label: 'Holiday homes', short: 'Holiday' },
  { id: 'guest_houses', label: 'Guest houses', short: 'Guests' },
  { id: 'vehicles', label: 'Car Rental', short: 'Rental' },
] as const

export function ExplorePage() {
  const navigate = useNavigate()
  const { isSaved, toggleSaved } = useSaved()
  const { user, ensureSession } = useUser()
  const { stays, loading } = useStays()
  const [category, setCategory] = useState<(typeof categories)[number]['id']>('hotels')
  const initialDates = defaultStayDates()
  const [query, setQuery] = useState('Dubai')
  const [checkIn, setCheckIn] = useState(initialDates.checkIn)
  const [checkOut, setCheckOut] = useState(initialDates.checkOut)
  const [occupancy, setOccupancy] = useState<StayOccupancy>({ adults: 2, children: 0, rooms: 1 })
  const railRef = useRef<HTMLDivElement>(null)
  const itemRefs = useRef<(HTMLButtonElement | null)[]>([])
  const [indicator, setIndicator] = useState({ left: 0, width: 0 })
  const activeIndex = categories.findIndex((c) => c.id === category)

  useDragScroll('.h-scroll, .hero-reel__track')

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

  const exploreQuery = stayCriteriaSearchParams({
    city: query || 'Dubai',
    checkIn,
    checkOut,
    occupancy,
  }).toString()

  function onSearch(event: FormEvent) {
    event.preventDefault()
    const type =
      category === 'hotels'
        ? 'hotel'
        : category === 'holiday_homes'
          ? 'holiday_home'
          : category === 'guest_houses'
            ? 'guest_house'
            : undefined
    const params = stayCriteriaSearchParams({
      city: query || 'Dubai',
      checkIn,
      checkOut,
      occupancy,
      category,
      type,
    })
    navigate(`/results?${params.toString()}`)
  }

  function selectCategory(id: (typeof categories)[number]['id']) {
    setCategory(id)
    if (id === 'vehicles') {
      scrollFrameToId('maison-vehicles')
      return
    }

    // Category medals should open filtered results, not only highlight.
    const type =
      id === 'hotels' ? 'hotel' : id === 'holiday_homes' ? 'holiday_home' : 'guest_house'
    const params = stayCriteriaSearchParams({
      city: 'Anywhere',
      checkIn,
      checkOut,
      occupancy,
      category: id,
      type,
    })
    navigate(`/results?${params.toString()}`)
  }

  function scrollToSearch() {
    scrollFrameToId('maison-reserve')
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
                  onClick={() => selectCategory(item.id)}
                >
                  <span className="lux-select__medal" aria-hidden="true">
                    <span className="lux-select__ring" />
                    <span className="lux-select__icon lux-icon">
                      <Icon />
                    </span>
                  </span>
                  <span className="lux-select__label">
                    <span className="lux-select__label--short">{item.short}</span>
                    <span className="lux-select__label--full">{item.label}</span>
                  </span>
                </button>
              )
            })}
          </div>
        </div>
      }
    >
      <section className="atelier-hero maison-hero" aria-label="NomadStay introduction">
        <HeroMediaReel className="atelier-hero__media" />
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
          <StayCriteriaFields
            checkIn={checkIn}
            checkOut={checkOut}
            occupancy={occupancy}
            onCheckInChange={setCheckIn}
            onCheckOutChange={setCheckOut}
            onOccupancyChange={setOccupancy}
          />
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
                      query={exploreQuery}
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
                  to={`/results?${stayCriteriaSearchParams({
                    city: dest.name,
                    checkIn,
                    checkOut,
                    occupancy,
                  }).toString()}`}
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
                <Link
                  key={stay.id}
                  to={`/stay/${stay.id}?${exploreQuery}`}
                  className="escape-card maison-escape"
                >
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
                  query={exploreQuery}
                />
              ))}
            </div>
          </section>
        </Reveal>

        <Reveal className="rail-section-wrap">
          <section className="rail-section" id="maison-vehicles">
            <div className="section-head section-head--maison">
              <div>
                <p className="eyebrow">Arrivals & journeys</p>
                <h2>
                  Car <em>Rental</em>
                </h2>
              </div>
              <Link to="/results?category=vehicles&type=vehicles">See all</Link>
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
