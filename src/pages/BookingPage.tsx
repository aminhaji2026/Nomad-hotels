import { useMemo, useState, type FormEvent } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { api } from '../api'
import { useUser } from '../context/UserContext'
import { useStay } from '../hooks/useStays'
import { AppShell } from '../components/AppShell'

type Step = 'form' | 'checking' | 'confirmed'

export function BookingPage() {
  const { id } = useParams()
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const { stay, loading } = useStay(id)
  const { ensureSession, setIdentity, refresh } = useUser()
  const nights = Number(params.get('nights') || 4)
  const checkIn = params.get('checkIn') || '2025-05-24'
  const checkOut = params.get('checkOut') || '2025-05-28'

  const [step, setStep] = useState<Step>('form')
  const [name, setName] = useState(localStorage.getItem('nomadstay-name') || 'Amin Hussein')
  const [email, setEmail] = useState(
    localStorage.getItem('nomadstay-email') || 'aminhajihussein@gmail.com',
  )
  const [ref, setRef] = useState('')
  const [pointsEarned, setPointsEarned] = useState(0)
  const [error, setError] = useState<string | null>(null)

  const total = useMemo(() => (stay ? stay.nightlyFrom * nights : 0), [stay, nights])

  if (loading) {
    return (
      <AppShell hideNav>
        <main className="page-pad">
          <p className="muted">Loading…</p>
        </main>
      </AppShell>
    )
  }

  if (!stay) {
    return (
      <AppShell hideNav>
        <main className="page-pad">
          <h1>Stay not found</h1>
          <Link to="/">Back</Link>
        </main>
      </AppShell>
    )
  }

  async function onSubmit(event: FormEvent) {
    event.preventDefault()
    setError(null)
    setStep('checking')
    setIdentity(email, name)
    try {
      const user = await ensureSession({ email, name })
      const data = await api.createBooking({
        userId: user.id,
        email,
        name,
        stayId: stay!.id,
        checkIn,
        checkOut,
        nights,
        total,
      })
      setRef(data.booking.bookingRef)
      setPointsEarned(data.pointsEarned)
      await refresh()
      setStep('confirmed')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Booking failed')
      setStep('form')
    }
  }

  return (
    <AppShell hideNav>
      <header className="results-header">
        <div className="results-header__row">
          <button type="button" className="icon-btn" aria-label="Back" onClick={() => navigate(-1)}>
            ←
          </button>
          <div className="results-header__title">
            <strong>Request stay</strong>
            <span>{stay.name}</span>
          </div>
        </div>
      </header>

      <main className="page-pad">
        {step === 'form' && (
          <form className="booking-form" onSubmit={onSubmit}>
            <img className="booking-form__image" src={stay.image} alt="" />
            <h1 className="serif-title">{stay.name}</h1>
            <p className="muted">
              {checkIn} → {checkOut} · {nights} nights
            </p>
            <p className="price-gold">${total.toLocaleString()} estimated total</p>
            <p className="muted small">Earn ~{Math.max(50, total * 10).toLocaleString()} loyalty points on this request.</p>
            <label>
              Full name
              <input value={name} onChange={(e) => setName(e.target.value)} required />
            </label>
            <label>
              Email
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </label>
            {error && <p className="error-text">{error}</p>}
            <button type="submit" className="btn btn--gold btn--block">
              Request reservation
            </button>
            <p className="muted small">
              Concierge confirms within a few hours. No charge until you approve the quote.
            </p>
          </form>
        )}

        {step === 'checking' && (
          <div className="empty-card">
            <div className="spinner" aria-hidden="true" />
            <h2>Checking availability…</h2>
            <p className="muted">Confirming rates and calculating loyalty points.</p>
          </div>
        )}

        {step === 'confirmed' && (
          <div className="empty-card">
            <span className="status-pill">REQUEST SENT</span>
            <h2>You’re on the list</h2>
            <p className="muted">
              Reference <strong>{ref}</strong>. We emailed {email}.
            </p>
            <p className="price-gold">+{pointsEarned.toLocaleString()} loyalty points earned</p>
            <Link to="/trips" className="btn btn--gold">
              View My Trips
            </Link>
            <Link to="/profile" className="gold-link">
              See points balance
            </Link>
          </div>
        )}
      </main>
    </AppShell>
  )
}
