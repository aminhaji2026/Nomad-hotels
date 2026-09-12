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
      <header className="top-bar">
        <BrandLockup />
        <Link to="/login" className="gold-link">
          Guest login
        </Link>
      </header>

      <main className="page-pad auth-page">
        <p className="eyebrow">Staff portal</p>
        <h1 className="serif-title">Sign in to manage</h1>
        <p className="muted">
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
      </main>
    </AppShell>
  )
}
