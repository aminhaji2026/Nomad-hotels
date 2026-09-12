import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { AppShell, BrandLockup } from '../components/AppShell'

const DEMO = [
  { label: 'Platform admin', email: 'admin@nomadstay.com', password: 'NomadAdmin2026!' },
  { label: 'Damal hotel admin', email: 'hotel@damalhotel.com', password: 'DamalHost2026!' },
  { label: 'Holiday hotel admin', email: 'hotel@holidayhotel.so', password: 'HolidayHost2026!' },
]

export function StaffLoginPage() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState(DEMO[0].email)
  const [password, setPassword] = useState(DEMO[0].password)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  async function onSubmit(event: FormEvent) {
    event.preventDefault()
    setBusy(true)
    setError(null)
    try {
      const { portal } = await login({ email, password, portal: 'staff' })
      navigate(portal === 'admin' ? '/admin' : '/hotel-admin')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to sign in')
    } finally {
      setBusy(false)
    }
  }

  return (
    <AppShell hideNav>
      <section className="auth-atelier auth-atelier--staff" aria-hidden="true">
        <img
          src="https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1200&q=80"
          alt=""
        />
        <div className="auth-atelier__veil" />
        <div className="auth-atelier__brand">
          <BrandLockup onDark />
        </div>
      </section>

      <main className="page-pad auth-page lux-stagger">
        <p className="eyebrow lux-stagger__item">Maison operations</p>
        <h1 className="serif-title lux-stagger__item">Staff entrance</h1>
        <p className="muted lux-stagger__item">
          Hotel admins manage property. Platform admins oversee the NomadStay network.
        </p>

        <form className="booking-form" onSubmit={onSubmit}>
          <label>
            Work email
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="username"
            />
          </label>
          <label>
            Password
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
            />
          </label>
          {error && <p className="form-error">{error}</p>}
          <button type="submit" className="btn btn--gold btn--block" disabled={busy}>
            {busy ? 'Authenticating…' : 'Enter suite'}
          </button>
        </form>

        <div className="demo-accounts">
          <p className="muted small">Demo accounts</p>
          {DEMO.map((d) => (
            <button
              key={d.email}
              type="button"
              className="demo-accounts__item"
              onClick={() => {
                setEmail(d.email)
                setPassword(d.password)
              }}
            >
              <strong>{d.label}</strong>
              <span>{d.email}</span>
            </button>
          ))}
        </div>

        <p className="muted small auth-page__foot">
          Travelling with us? <Link to="/login">Guest login</Link>
        </p>
      </main>
    </AppShell>
  )
}
