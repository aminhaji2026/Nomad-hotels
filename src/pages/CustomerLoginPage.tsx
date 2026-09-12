import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { AppShell, BrandLockup } from '../components/AppShell'

export function CustomerLoginPage() {
  const { login, register } = useAuth()
  const navigate = useNavigate()
  const [mode, setMode] = useState<'login' | 'register'>('login')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  async function onSubmit(event: FormEvent) {
    event.preventDefault()
    setBusy(true)
    setError(null)
    try {
      if (mode === 'register') {
        await register({ email, password, name })
      } else {
        await login({ email, password, portal: 'customer' })
      }
      navigate('/profile')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to continue')
    } finally {
      setBusy(false)
    }
  }

  return (
    <AppShell hideNav>
      <section className="auth-atelier" aria-hidden="true">
        <img
          src="https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=1200&q=80"
          alt=""
        />
        <div className="auth-atelier__veil" />
        <div className="auth-atelier__brand">
          <BrandLockup onDark />
        </div>
      </section>

      <main className="page-pad auth-page">
        <p className="eyebrow">Guest access</p>
        <h1 className="serif-title">{mode === 'login' ? 'A quiet return' : 'Begin membership'}</h1>
        <p className="muted">
          {mode === 'login'
            ? 'Sign in for trips, saved stays, and loyalty points.'
            : 'Create a membership and earn welcome points instantly.'}
        </p>

        <div className="segmented segmented--tabs" role="tablist" aria-label="Account mode">
          <button
            type="button"
            role="tab"
            aria-selected={mode === 'login'}
            className={mode === 'login' ? 'is-active' : ''}
            onClick={() => setMode('login')}
          >
            Sign in
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={mode === 'register'}
            className={mode === 'register' ? 'is-active' : ''}
            onClick={() => setMode('register')}
          >
            Join
          </button>
        </div>

        <form className="booking-form" onSubmit={onSubmit}>
          {mode === 'register' && (
            <label>
              Full name
              <input value={name} onChange={(e) => setName(e.target.value)} required />
            </label>
          )}
          <label>
            Email
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
            />
          </label>
          <label>
            Password
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={8}
              autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
            />
          </label>
          {error && <p className="form-error">{error}</p>}
          <button type="submit" className="btn btn--gold btn--block" disabled={busy}>
            {busy ? 'Please wait…' : mode === 'login' ? 'Sign in' : 'Create account'}
          </button>
        </form>

        <p className="muted small auth-page__foot">
          Hotel partner or platform staff? <Link to="/staff/login">Staff portal</Link>
        </p>
      </main>
    </AppShell>
  )
}
