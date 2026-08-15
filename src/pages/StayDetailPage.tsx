import { useMemo, useState } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { addonsForCity, nightsBetween, stays } from '../data/catalog'
import { useSaved } from '../context/SavedContext'
import { AppShell } from '../components/AppShell'

export function StayDetailPage() {
  const { id } = useParams()
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const { isSaved, toggleSaved } = useSaved()
  const [photoIndex, setPhotoIndex] = useState(0)

  const stay = stays.find((item) => item.id === id)
  const checkIn = params.get('checkIn') || '2025-05-24'
  const checkOut = params.get('checkOut') || '2025-05-28'
  const nights = nightsBetween(checkIn, checkOut)
  const cityAddons = useMemo(() => (stay ? addonsForCity(stay.city) : []), [stay])

  if (!stay) {
    return (
      <AppShell>
        <main className="page-pad">
          <h1>Stay not found</h1>
          <Link to="/">Back to explore</Link>
        </main>
      </AppShell>
    )
  }

  const gallery = stay.gallery.length ? stay.gallery : [stay.image]

  return (
    <AppShell hideNav>
      <div className="detail">
        <div className="detail__hero">
          <img src={gallery[photoIndex]} alt={stay.name} />
          <div className="detail__hero-actions">
            <button type="button" className="icon-btn" aria-label="Back" onClick={() => navigate(-1)}>
              ←
            </button>
            <div className="detail__hero-actions-right">
              <button
                type="button"
                className={`icon-btn icon-btn--heart ${isSaved(stay.id) ? 'is-active' : ''}`}
                aria-label="Save"
                onClick={() => toggleSaved(stay.id)}
              >
                ♥
              </button>
              <button type="button" className="icon-btn" aria-label="Share">
                ↗
              </button>
            </div>
          </div>
          <button
            type="button"
            className="gallery-count"
            onClick={() => setPhotoIndex((i) => (i + 1) % gallery.length)}
          >
            {photoIndex + 1} / {gallery.length}
          </button>
        </div>

        <main className="page-pad detail__body">
          <h1 className="serif-title">{stay.name}</h1>
          <div className="detail__rating-row">
            <div>
              <span className="stars">{'★★★★★'}</span>
              <strong>
                {stay.rating.toFixed(1)} ({stay.reviews} reviews)
              </strong>
            </div>
            <span className="score-pill">Exceptional {stay.guestScore} Guest Score</span>
          </div>
          <p className="muted">
            {stay.neighborhood}, {stay.city}, {stay.country} ·{' '}
            <a
              className="gold-link"
              href={`https://maps.google.com/?q=${stay.map.lat},${stay.map.lng}`}
              target="_blank"
              rel="noreferrer"
            >
              View on map
            </a>
          </p>

          <div className="amenity-icons">
            {stay.highlights.map((item) => (
              <div key={item} className="amenity-icon">
                <span>✧</span>
                <small>{item}</small>
              </div>
            ))}
          </div>

          <article className="room-card">
            <img src={stay.room.image} alt={stay.room.name} />
            <div>
              <div className="room-card__title">
                <strong>{stay.room.name}</strong>
                <span className="tag">{stay.room.tag}</span>
              </div>
              <p className="muted small">
                {stay.room.bed} · {stay.room.guests} Guests · {stay.room.sizeSqm} m²
              </p>
              <p>{stay.room.blurb}</p>
              <button type="button" className="gold-link">
                Room Details
              </button>
            </div>
          </article>

          <section>
            <h2>About the property</h2>
            <p className="muted">{stay.summary}</p>
          </section>

          <section>
            <h2>Property highlights</h2>
            <div className="tag-row">
              {stay.highlights.map((item) => (
                <span key={item} className="tag tag--gold">
                  {item}
                </span>
              ))}
            </div>
          </section>

          <section>
            <h2>Elevate your stay</h2>
            <p className="muted">Add-ons curated for {stay.city}.</p>
            <div className="h-scroll">
              {cityAddons.map((addon) => (
                <article key={addon.id} className="addon-card">
                  <img src={addon.image} alt={addon.name} loading="lazy" />
                  <div>
                    <strong>{addon.name}</strong>
                    <span className="muted">{addon.detail}</span>
                    <p className="price-gold">
                      From ${addon.priceFrom} / {addon.unit}
                    </p>
                  </div>
                </article>
              ))}
            </div>
          </section>
        </main>

        <div className="booking-bar">
          <div>
            <p className="price-gold">From ${stay.nightlyFrom} / night</p>
            <p className="muted small">Inclusive of taxes · {nights} nights</p>
          </div>
          <Link
            className="btn btn--gold"
            to={`/book/${stay.id}?checkIn=${checkIn}&checkOut=${checkOut}&nights=${nights}`}
          >
            Check Availability
          </Link>
        </div>
      </div>
    </AppShell>
  )
}
