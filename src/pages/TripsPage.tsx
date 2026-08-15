import { useState } from 'react'
import { Link } from 'react-router-dom'
import { activeTrip, savedSuggestions } from '../data/catalog'
import { AppShell, BrandLockup } from '../components/AppShell'

export function TripsPage() {
  const [tab, setTab] = useState<'upcoming' | 'past' | 'cancelled'>('upcoming')
  const [manageOpen, setManageOpen] = useState(false)
  const trip = activeTrip
  const confirmedCount = trip.itinerary.filter((item) => item.status === 'Confirmed').length

  return (
    <AppShell>
      <header className="top-bar">
        <BrandLockup />
        <button type="button" className="icon-btn" aria-label="Notifications">
          ⌁
        </button>
      </header>

      <main className="page-pad">
        <h1>My Trips</h1>
        <p className="muted">Everything you need for a seamless journey.</p>

        <div className="segmented segmented--tabs">
          <button
            type="button"
            className={tab === 'upcoming' ? 'is-active' : ''}
            onClick={() => setTab('upcoming')}
          >
            Upcoming
          </button>
          <button
            type="button"
            className={tab === 'past' ? 'is-active' : ''}
            onClick={() => setTab('past')}
          >
            Past Trips
          </button>
          <button
            type="button"
            className={tab === 'cancelled' ? 'is-active' : ''}
            onClick={() => setTab('cancelled')}
          >
            Cancelled
          </button>
        </div>

        {tab !== 'upcoming' && (
          <p className="empty">No {tab === 'past' ? 'past' : 'cancelled'} trips yet.</p>
        )}

        {tab === 'upcoming' && (
          <>
            <article className="trip-hero">
              <img src={trip.image} alt="" />
              <div className="trip-hero__content">
                <div className="trip-hero__top">
                  <span className="status-pill">{trip.status}</span>
                  <span className="countdown">Starts in {trip.countdownDays} days</span>
                </div>
                <h2>{trip.city}</h2>
                <p>{trip.country}</p>
                <p className="small">Booking Ref. {trip.bookingRef}</p>
                <div className="trip-meta">
                  <span>Check-in · {trip.checkIn}</span>
                  <span>Check-out · {trip.checkOut}</span>
                  <span>
                    {trip.guests} Guests · {trip.rooms} Room
                  </span>
                </div>
                <div className="trip-pay">
                  <div>
                    <strong>Payment Summary</strong>
                    <p className="muted small">{trip.paidInFull ? 'Paid in Full' : 'Balance due'}</p>
                  </div>
                  <div className="trip-pay__amount">
                    <strong className="price-gold">{trip.totalLabel}</strong>
                    <button type="button" className="gold-link">
                      View Breakdown
                    </button>
                  </div>
                </div>
              </div>
            </article>

            <section className="rail-section">
              <div className="section-head">
                <h2>Your Itinerary</h2>
                <span className="success-text">
                  {confirmedCount} of {trip.itinerary.length} Confirmed
                </span>
              </div>
              <ul className="itinerary">
                {trip.itinerary.map((item) => (
                  <li key={item.id}>
                    <img src={item.image} alt="" />
                    <div>
                      <strong>{item.title}</strong>
                      <p className="muted small">{item.subtitle}</p>
                    </div>
                    <span className="status-pill status-pill--sm">{item.status}</span>
                  </li>
                ))}
              </ul>
              <div className="btn-row">
                <button type="button" className="btn btn--ghost">
                  View Itinerary
                </button>
                <button type="button" className="btn btn--gold" onClick={() => setManageOpen(true)}>
                  Manage Booking
                </button>
              </div>
            </section>

            <section className="rail-section">
              <div className="section-head">
                <h2>Saved for Later</h2>
              </div>
              <div className="h-scroll">
                {savedSuggestions.map((stay) => (
                  <Link key={stay.id} to={`/stay/${stay.id}`} className="escape-card">
                    <img src={stay.image} alt={stay.name} loading="lazy" />
                    <div>
                      <strong>{stay.name}</strong>
                      <span>From ${stay.nightlyFrom} / night</span>
                    </div>
                  </Link>
                ))}
              </div>
            </section>

            <section className="rail-section">
              <div className="section-head">
                <h2>Recommended Add-ons</h2>
                <Link to={`/stay/address-downtown`}>See all</Link>
              </div>
              <p className="muted">Desert safari, transfers, and vehicles matched to your Dubai trip.</p>
            </section>
          </>
        )}
      </main>

      {manageOpen && (
        <div className="sheet" role="dialog" aria-modal="true" aria-label="Manage booking">
          <div className="sheet__panel">
            <h3>Manage Booking</h3>
            <button type="button" className="sheet__option">
              Change dates
            </button>
            <button type="button" className="sheet__option">
              Contact concierge
            </button>
            <button type="button" className="sheet__option sheet__option--danger">
              Cancel booking
            </button>
            <button type="button" className="btn btn--ghost btn--block" onClick={() => setManageOpen(false)}>
              Close
            </button>
          </div>
        </div>
      )}
    </AppShell>
  )
}
