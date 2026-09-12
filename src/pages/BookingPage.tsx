import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { api, type PaymentMethod } from '../api'
import { useUser } from '../context/UserContext'
import { useStay } from '../hooks/useStays'
import { AppShell } from '../components/AppShell'
import { defaultStayDates, formatOccupancyLabel, parseOccupancyParams } from '../lib/stayCriteria'

type Step = 'form' | 'checking' | 'confirmed'

export function BookingPage() {
  const { id } = useParams()
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const { stay, loading } = useStay(id)
  const { ensureSession, setIdentity, refresh } = useUser()
  const defaults = defaultStayDates()
  const checkIn = params.get('checkIn') || defaults.checkIn
  const checkOut = params.get('checkOut') || defaults.checkOut
  const occupancy = parseOccupancyParams(params)
  const nights = Number(params.get('nights') || 4)

  const [step, setStep] = useState<Step>('form')
  const [name, setName] = useState(localStorage.getItem('nomadstay-name') || 'Amin Hussein')
  const [email, setEmail] = useState(
    localStorage.getItem('nomadstay-email') || 'aminhajihussein@gmail.com',
  )
  const [phone, setPhone] = useState('')
  const [gateway, setGateway] = useState('mock')
  const [methods, setMethods] = useState<PaymentMethod[]>([])
  const [ref, setRef] = useState('')
  const [pointsEarned, setPointsEarned] = useState(0)
  const [paymentNote, setPaymentNote] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    void api.paymentMethods().then((d) => setMethods(d.methods)).catch(() => undefined)
  }, [])

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
        phone,
        stayId: stay!.id,
        checkIn,
        checkOut,
        nights,
        total,
        gateway,
        guests: occupancy.adults + occupancy.children,
        adults: occupancy.adults,
        children: occupancy.children,
        rooms: occupancy.rooms,
      })
      setRef(data.booking.bookingRef)
      setPointsEarned(data.pointsEarned)
      setPaymentNote(data.payment?.message || data.payment?.status || null)
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
              {checkIn} → {checkOut} · {nights} nights · {formatOccupancyLabel(occupancy)}
            </p>
            <p className="price-gold">${total.toLocaleString()} estimated total</p>
            <p className="muted small">
              Earn ~{Math.max(50, total * 10).toLocaleString()} loyalty points on this request.
            </p>
            <label>
              Full name
              <input value={name} onChange={(e) => setName(e.target.value)} required />
            </label>
            <label>
              Email
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </label>
            <label>
              Mobile (for ZAAD)
              <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+252 63…" />
            </label>

            <div className="gateway-picker" role="radiogroup" aria-label="Payment method">
              <p className="muted small">Pay with</p>
              {(methods.length ? methods : [
                { id: 'mock', label: 'Demo pay', description: 'Instant confirmation', regions: ['global'] },
                { id: 'zaad', label: 'ZAAD', description: 'Mobile money', regions: ['SO'] },
                { id: 'international', label: 'Card', description: 'Visa / Mastercard', regions: ['global'] },
              ]).map((m) => (
                <label key={m.id} className={gateway === m.id ? 'is-active' : ''}>
                  <input
                    type="radio"
                    name="gateway"
                    value={m.id}
                    checked={gateway === m.id}
                    onChange={() => setGateway(m.id)}
                  />
                  <span>
                    <strong>{m.label}</strong>
                    <br />
                    <span className="muted small">{m.description}</span>
                  </span>
                </label>
              ))}
            </div>

            {error && <p className="error-text">{error}</p>}
            <button type="submit" className="btn btn--gold btn--block">
              Request reservation
            </button>
            <p className="muted small">
              Concierge confirms shortly. Choose demo, ZAAD, or card to continue.
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
            {paymentNote && <p className="muted small">{paymentNote}</p>}
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
