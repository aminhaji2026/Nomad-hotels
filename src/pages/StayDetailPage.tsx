import { useMemo, useRef, useState } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { addonsForCity, nightsBetween } from '../data/catalog'
import { useSaved } from '../context/SavedContext'
import { useStay } from '../hooks/useStays'
import { AppShell } from '../components/AppShell'

export function StayDetailPage() {
  const { id } = useParams()
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const { isSaved, toggleSaved } = useSaved()
  const [photoIndex, setPhotoIndex] = useState(0)
  const touchStartX = useRef<number | null>(null)
  const { stay, raw, loading, error } = useStay(id)

  const checkIn = params.get('checkIn') || '2025-05-24'
  const checkOut = params.get('checkOut') || '2025-05-28'
  const nights = nightsBetween(checkIn, checkOut)
  const cityAddons = useMemo(() => (stay ? addonsForCity(stay.city) : []), [stay])

  if (loading) {
    return (
      <AppShell hideNav>
        <main className="page-pad">
          <p className="muted">Loading stay…</p>
        </main>
      </AppShell>
    )
  }

  if (!stay || error) {
    return (
      <AppShell>
        <main className="page-pad">
          <h1>Stay not found</h1>
          <Link to="/">Back to explore</Link>
        </main>
      </AppShell>
    )
  }

  const gallery = (stay.gallery?.length ? stay.gallery : [stay.image]).filter(Boolean)
  const multiPhoto = gallery.length > 1
  const showPrev = () => setPhotoIndex((i) => (i - 1 + gallery.length) % gallery.length)
  const showNext = () => setPhotoIndex((i) => (i + 1) % gallery.length)

  return (
    <AppShell hideNav>
      <div className="detail">
        <div
          className="detail__hero"
          onTouchStart={(e) => {
            touchStartX.current = e.changedTouches[0]?.clientX ?? null
          }}
          onTouchEnd={(e) => {
            if (touchStartX.current == null || !multiPhoto) return
            const dx = (e.changedTouches[0]?.clientX ?? 0) - touchStartX.current
            touchStartX.current = null
            if (Math.abs(dx) < 40) return
            if (dx < 0) showNext()
            else showPrev()
          }}
        >
          <img
            src={gallery[photoIndex]}
            alt={`${stay.name} photo ${photoIndex + 1} of ${gallery.length}`}
            onClick={() => multiPhoto && showNext()}
            style={{ cursor: multiPhoto ? 'pointer' : undefined }}
          />
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
          {multiPhoto && (
            <>
              <button type="button" className="gallery-nav gallery-nav--prev" aria-label="Previous photo" onClick={showPrev}>
                ‹
              </button>
              <button type="button" className="gallery-nav gallery-nav--next" aria-label="Next photo" onClick={showNext}>
                ›
              </button>
            </>
          )}
          <button
            type="button"
            className="gallery-count"
            onClick={() => multiPhoto && showNext()}
            aria-label={multiPhoto ? 'Show next photo' : 'Photo count'}
          >
            {photoIndex + 1} / {gallery.length}
          </button>
        </div>

        {multiPhoto && (
          <div className="gallery-thumbs" role="list" aria-label="Photo thumbnails">
            {gallery.map((src, index) => (
              <button
                key={`${src}-${index}`}
                type="button"
                role="listitem"
                className={`gallery-thumb ${index === photoIndex ? 'is-active' : ''}`}
                onClick={() => setPhotoIndex(index)}
                aria-label={`View photo ${index + 1}`}
                aria-current={index === photoIndex}
              >
                <img src={src} alt="" loading="lazy" />
              </button>
            ))}
          </div>
        )}

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

          {raw?.contact && (raw.contact.phone || raw.contact.email || raw.contact.website) && (
            <section className="contact-card">
              <h2>Property info</h2>
              {raw.contact.phone && <p>Phone · {raw.contact.phone}</p>}
              {raw.contact.email && <p>Email · {raw.contact.email}</p>}
              {raw.contact.website && (
                <p>
                  Web ·{' '}
                  <a className="gold-link" href={raw.contact.website} target="_blank" rel="noreferrer">
                    {raw.contact.website.replace(/^https?:\/\//, '')}
                  </a>
                </p>
              )}
              {(raw.contact.checkIn || raw.contact.checkOut) && (
                <p className="muted small">
                  Check-in {raw.contact.checkIn || '—'} · Check-out {raw.contact.checkOut || '—'}
                </p>
              )}
            </section>
          )}

          <div className="amenity-icons">
            {stay.highlights.map((item) => (
              <div key={item} className="amenity-icon">
                <span>✧</span>
                <small>{item}</small>
              </div>
            ))}
          </div>

          <article className="room-card">
            <img src={stay.room.image || gallery[0]} alt={stay.room.name} />
            <div>
              <div className="room-card__title">
                <strong>{stay.room.name}</strong>
                <span className="tag">{stay.room.tag}</span>
              </div>
              <p className="muted small">
                {stay.room.bed} · {stay.room.guests} Guests · {stay.room.sizeSqm} m²
              </p>
              <p>{stay.room.blurb}</p>
            </div>
          </article>

          {multiPhoto && (
            <section>
              <h2>Photos</h2>
              <p className="muted small">{gallery.length} photos · tap any to view</p>
              <div className="photo-grid">
                {gallery.map((src, index) => (
                  <button
                    key={`grid-${src}-${index}`}
                    type="button"
                    className="photo-grid__item"
                    onClick={() => {
                      setPhotoIndex(index)
                      window.scrollTo({ top: 0, behavior: 'smooth' })
                    }}
                  >
                    <img src={src} alt={`${stay.name} ${index + 1}`} loading="lazy" />
                  </button>
                ))}
              </div>
            </section>
          )}

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

          <p className="muted small">
            Earn loyalty points when you request this stay ·{' '}
            <Link className="gold-link" to={`/host?stay=${stay.id}`}>
              Upload photos / update info
            </Link>
          </p>
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
