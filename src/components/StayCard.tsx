import { Link } from 'react-router-dom'
import type { Stay } from '../types'

type StayCardProps = {
  stay: Stay
  nights?: number
  saved?: boolean
  onToggleSave?: (id: string) => void
  /** Query string (without ? ) preserving dates/rooms/occupants into detail. */
  query?: string
}

export function StayCard({ stay, nights = 4, saved = false, onToggleSave, query = '' }: StayCardProps) {
  const total = stay.nightlyFrom * nights
  const href = query ? `/stay/${stay.id}?${query}` : `/stay/${stay.id}`

  return (
    <article className="stay-card lux-card maison-stay">
      <div className="stay-card__media">
        <Link to={href}>
          <img src={stay.image} alt={stay.name} loading="lazy" />
        </Link>
        <div className="maison-stay__veil" aria-hidden="true" />
        {stay.badge && <span className="badge maison-badge">{stay.badge}</span>}
        {onToggleSave && (
          <button
            type="button"
            className={`icon-btn icon-btn--heart ${saved ? 'is-active' : ''}`}
            aria-label={saved ? 'Remove from saved' : 'Save stay'}
            onClick={() => onToggleSave(stay.id)}
          >
            ♥
          </button>
        )}
      </div>
      <div className="stay-card__body">
        <div className="stay-card__rating">
          <span className="star">★</span>
          <strong>{stay.rating.toFixed(1)}</strong>
          <span>{stay.rating >= 4.9 ? 'Exceptional' : 'Excellent'}</span>
          <span className="muted">({stay.reviews})</span>
        </div>
        <h3>
          <Link to={href}>{stay.name}</Link>
        </h3>
        <p className="muted maison-stay__meta">
          {stay.typeLabel} · {stay.neighborhood}
        </p>
        <div className="tag-row">
          {stay.amenities.slice(0, 3).map((amenity) => (
            <span key={amenity} className={`tag tag--${amenity.includes('Free') ? 'green' : 'blue'}`}>
              {amenity}
            </span>
          ))}
        </div>
        <div className="stay-card__price">
          <div>
            <span className="muted">From</span>
            <p className="price-gold">${stay.nightlyFrom}</p>
            <p className="muted small">per night · ${total.toLocaleString()} total</p>
          </div>
          <Link to={href} className="maison-stay__link">
            View suite
          </Link>
        </div>
      </div>
    </article>
  )
}
