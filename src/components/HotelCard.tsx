import { Link } from 'react-router-dom'
import type { Hotel } from '../types'

type HotelCardProps = {
  hotel: Hotel
}

export function HotelCard({ hotel }: HotelCardProps) {
  return (
    <article className="hotel-card">
      <Link to={`/stay/${hotel.id}`} className="hotel-card__media">
        <img src={hotel.image} alt={`${hotel.name} in ${hotel.city}`} loading="lazy" />
        <span className="hotel-card__wifi">{hotel.wifiMbps} Mbps</span>
      </Link>
      <div className="hotel-card__body">
        <div className="hotel-card__meta">
          <p>
            {hotel.city}, {hotel.country}
          </p>
          <p>
            {hotel.rating.toFixed(1)} · {hotel.reviews} reviews
          </p>
        </div>
        <h3>
          <Link to={`/stay/${hotel.id}`}>{hotel.name}</Link>
        </h3>
        <p className="hotel-card__summary">{hotel.summary}</p>
        <div className="hotel-card__tags">
          {hotel.desk && <span>Desk</span>}
          {hotel.kitchen && <span>Kitchen</span>}
          {hotel.coworkNearby && <span>Cowork nearby</span>}
          <span>{hotel.stayMinNights}+ nights</span>
        </div>
        <p className="hotel-card__price">
          From <strong>${hotel.monthlyFrom.toLocaleString()}</strong>
          <span>/ month</span>
        </p>
      </div>
    </article>
  )
}
