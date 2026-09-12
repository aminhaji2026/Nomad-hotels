import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

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
    <div className="lux-auth">
      <div className="lux-auth__media" aria-hidden="true">
        <div className="lux-auth__veil" />
        <p className="lux-auth__eyebrow">Guest arrival</p>
        <h1 className="lux-auth__brand">NomadStay</h1>
        <p className="lux-auth__tagline">Private stays, polished journeys, loyal rewards.</p>
      </div>
      <div className="lux-auth__panel">
        <div className="lux-auth__tabs">
          <button
            type="button"
            className={mode === 'login' ? 'is-active' : ''}
            onClick={() => setMode('login')}
          >
            Sign in
          </button>
          <button
            type="button"
            className={mode === 'register' ? 'is-active' : ''}
            onClick={() => setMode('register')}
          >
            Join
          </button>
        </div>
        <h2>{mode === 'login' ? 'Welcome back' : 'Create your membership'}</h2>
        <p className="muted">
          {mode === 'login'
            ? 'Access trips, saved stays, and loyalty points.'
            : 'Earn welcome points the moment you join.'}
        </p>
        <form className="lux-auth__form" onSubmit={onSubmit}>
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
            {busy ? 'Please wait…' : mode === 'login' ? 'Enter NomadStay' : 'Join NomadStay'}
          </button>
        </form>
        <p className="lux-auth__foot">
          Hotel partner or platform staff? <Link to="/staff/login">Staff portal</Link>
        </p>
        <Link className="lux-auth__back" to="/">
          ← Back to explore
        </Link>
      </div>
    </div>
  )
}
