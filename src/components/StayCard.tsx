import { Link } from 'react-router-dom'
import type { Stay } from '../types'

type StayCardProps = {
  stay: Stay
  nights?: number
  saved?: boolean
  onToggleSave?: (id: string) => void
}

export function StayCard({ stay, nights = 4, saved = false, onToggleSave }: StayCardProps) {
  const total = stay.nightlyFrom * nights

  return (
    <article className="stay-card lux-card">
      <div className="stay-card__media">
        <Link to={`/stay/${stay.id}`}>
          <img src={stay.image} alt={stay.name} loading="lazy" />
        </Link>
        {stay.badge && <span className="badge">{stay.badge}</span>}
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
          <Link to={`/stay/${stay.id}`}>{stay.name}</Link>
        </h3>
        <p className="muted">
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
            <p className="price-gold">${stay.nightlyFrom} / night</p>
            <p className="muted small">Total ${total.toLocaleString()}</p>
          </div>
        </div>
      </div>
    </article>
  )
}
