import { Link, useParams } from 'react-router-dom'
import { hotels } from '../data/hotels'
import { SiteHeader } from '../components/SiteHeader'

export function StayPage() {
  const { id } = useParams()
  const hotel = hotels.find((item) => item.id === id)

  if (!hotel) {
    return (
      <div className="page">
        <SiteHeader tone="dark" />
        <main className="section">
          <h1>Stay not found</h1>
          <Link to="/explore" className="text-link">
            Back to explore →
          </Link>
        </main>
      </div>
    )
  }

  return (
    <div className="page page--stay">
      <SiteHeader tone="dark" />
      <main>
        <section className="stay-hero">
          <img src={hotel.image} alt={`${hotel.name} in ${hotel.city}`} />
          <div className="stay-hero__copy">
            <p>
              {hotel.city}, {hotel.country}
            </p>
            <h1>{hotel.name}</h1>
            <p>{hotel.summary}</p>
          </div>
        </section>

        <section className="section stay-grid">
          <div className="stay-facts">
            <h2>Work-ready details</h2>
            <dl>
              <div>
                <dt>Wi‑Fi</dt>
                <dd>{hotel.wifiMbps} Mbps verified</dd>
              </div>
              <div>
                <dt>From</dt>
                <dd>${hotel.monthlyFrom.toLocaleString()} / month</dd>
              </div>
              <div>
                <dt>Nightly</dt>
                <dd>${hotel.nightlyFrom} when available</dd>
              </div>
              <div>
                <dt>Minimum stay</dt>
                <dd>{hotel.stayMinNights} nights</dd>
              </div>
              <div>
                <dt>Timezone</dt>
                <dd>{hotel.timezone}</dd>
              </div>
              <div>
                <dt>Rating</dt>
                <dd>
                  {hotel.rating.toFixed(1)} ({hotel.reviews} reviews)
                </dd>
              </div>
            </dl>
            <ul className="amenity-list">
              {hotel.amenities.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>

          <aside className="stay-book">
            <p className="stay-book__price">
              <strong>${hotel.monthlyFrom.toLocaleString()}</strong>
              <span>per month</span>
            </p>
            <p className="stay-book__note">
              Includes high-speed Wi‑Fi, weekly cleaning, and a dedicated work surface.
            </p>
            <button type="button" className="btn btn--solid btn--block">
              Request this stay
            </button>
            <Link to="/explore" className="text-link">
              Compare nearby stays →
            </Link>
          </aside>
        </section>

        <section className="section stay-gallery" aria-label="Gallery">
          {hotel.gallery.map((src) => (
            <img key={src} src={src} alt="" loading="lazy" />
          ))}
        </section>
      </main>
    </div>
  )
}
