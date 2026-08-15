import { useMemo, useState, type FormEvent } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { stays } from '../data/catalog'
import { AppShell } from '../components/AppShell'

type Step = 'form' | 'checking' | 'confirmed'

export function BookingPage() {
  const { id } = useParams()
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const stay = stays.find((item) => item.id === id)
  const nights = Number(params.get('nights') || 4)
  const checkIn = params.get('checkIn') || '2025-05-24'
  const checkOut = params.get('checkOut') || '2025-05-28'

  const [step, setStep] = useState<Step>('form')
  const [name, setName] = useState('Amin Hussein')
  const [email, setEmail] = useState('aminhajihussein@gmail.com')
  const [ref, setRef] = useState('')

  const total = useMemo(() => (stay ? stay.nightlyFrom * nights : 0), [stay, nights])

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

  function onSubmit(event: FormEvent) {
    event.preventDefault()
    setStep('checking')
    window.setTimeout(() => {
      setRef(`NS${stay!.city.slice(0, 3).toUpperCase()}${Date.now().toString().slice(-6)}`)
      setStep('confirmed')
    }, 1100)
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
            <label>
              Full name
              <input value={name} onChange={(e) => setName(e.target.value)} required />
            </label>
            <label>
              Email
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </label>
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
            <p className="muted">Confirming rates with the property and concierge.</p>
          </div>
        )}

        {step === 'confirmed' && (
          <div className="empty-card">
            <span className="status-pill">REQUEST SENT</span>
            <h2>You’re on the list</h2>
            <p className="muted">
              Reference <strong>{ref}</strong>. We’ll email {email} when the stay is confirmed.
            </p>
            <Link to="/trips" className="btn btn--gold">
              View My Trips
            </Link>
            <Link to="/" className="gold-link">
              Keep exploring
            </Link>
          </div>
        )}
      </main>
    </AppShell>
  )
}
