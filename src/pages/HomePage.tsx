import { Link } from 'react-router-dom'
import { hotels } from '../data/hotels'
import { HotelCard } from '../components/HotelCard'
import { SearchPanel } from '../components/SearchPanel'
import { SiteHeader } from '../components/SiteHeader'

const featured = hotels.slice(0, 3)

export function HomePage() {
  return (
    <div className="page page--home">
      <section className="hero">
        <div className="hero__media" aria-hidden="true">
          <img
            src="https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?auto=format&fit=crop&w=2000&q=80"
            alt=""
          />
          <div className="hero__scrim" />
        </div>
        <SiteHeader tone="light" />
        <div className="hero__content">
          <p className="brand-lockup">Nomad Hotels</p>
          <h1>Stay long enough to ship.</h1>
          <p className="hero__lede">
            Rooms with real desks, measured Wi‑Fi, and monthly rates in cities built for remote work.
          </p>
          <div className="hero__actions">
            <Link to="/explore" className="btn btn--solid">
              Explore stays
            </Link>
            <a href="#how" className="btn btn--ghost">
              How Nomad works
            </a>
          </div>
        </div>
      </section>

      <section className="section search-section" aria-label="Search">
        <SearchPanel />
      </section>

      <section className="section" id="featured">
        <div className="section__intro">
          <h2>Featured long stays</h2>
          <p>Handpicked for bandwidth, desk space, and neighborhood rhythm.</p>
        </div>
        <div className="hotel-grid">
          {featured.map((hotel) => (
            <HotelCard key={hotel.id} hotel={hotel} />
          ))}
        </div>
        <div className="section__footer">
          <Link to="/explore" className="text-link">
            View all destinations →
          </Link>
        </div>
      </section>

      <section className="section section--split" id="how">
        <div className="section__intro">
          <h2>Built for the way you work</h2>
          <p>Hotel comfort with the filters digital nomads actually need.</p>
        </div>
        <ol className="steps">
          <li>
            <strong>Filter on signal</strong>
            <span>Set minimum Mbps, desk, kitchen, and stay length before you book.</span>
          </li>
          <li>
            <strong>Book by the month</strong>
            <span>Transparent monthly pricing with flexible check-in windows.</span>
          </li>
          <li>
            <strong>Arrive ready</strong>
            <span>Verified work setups and local cowork options on every listing.</span>
          </li>
        </ol>
      </section>

      <footer className="site-footer">
        <p className="brand-lockup">Nomad Hotels</p>
        <p>Long-stay rooms for people who work from everywhere.</p>
      </footer>
    </div>
  )
}
