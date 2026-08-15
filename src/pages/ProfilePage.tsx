import { useEffect, useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../api'
import { useUser } from '../context/UserContext'
import { AppShell, BrandLockup } from '../components/AppShell'

export function ProfilePage() {
  const { user, loading, ledger, ensureSession, redeemReferral, refresh } = useUser()
  const [code, setCode] = useState('')
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [rules, setRules] = useState<string[]>([])

  useEffect(() => {
    void api.loyaltyRules().then((data) => {
      setRules([data.copy.welcome, data.copy.referral, data.copy.booking])
    })
  }, [])

  async function onJoin() {
    setError(null)
    try {
      await ensureSession()
      setMessage('Welcome bonus applied to your loyalty balance.')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not start session')
    }
  }

  async function onRedeem(event: FormEvent) {
    event.preventDefault()
    setError(null)
    setMessage(null)
    try {
      const data = await redeemReferral(code)
      setMessage(`Referral applied! You earned ${data.awarded.referee} points.`)
      setCode('')
      await refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Invalid code')
    }
  }

  return (
    <AppShell>
      <header className="top-bar">
        <BrandLockup />
        {user && <span className="points-chip">✦ {user.points.toLocaleString()} pts</span>}
      </header>
      <main className="page-pad">
        <h1>Profile</h1>
        <p className="muted">Premium member · loyalty & referrals</p>

        {!user && !loading && (
          <div className="empty-card">
            <p>Join NomadStay loyalty to earn points on every stay request.</p>
            <button type="button" className="btn btn--gold" onClick={() => void onJoin()}>
              Activate loyalty
            </button>
          </div>
        )}

        {user && (
          <>
            <section className="profile-card">
              <div className="avatar">{user.name.slice(0, 1).toUpperCase()}</div>
              <div>
                <strong>{user.name}</strong>
                <p className="muted small">{user.email}</p>
              </div>
            </section>

            <section className="points-panel">
              <p className="muted small">Loyalty balance</p>
              <p className="points-huge">{user.points.toLocaleString()}</p>
              <p className="muted">Your referral code</p>
              <code className="referral-code">{user.referralCode}</code>
              <button
                type="button"
                className="btn btn--ghost btn--block"
                onClick={() => {
                  void navigator.clipboard?.writeText(user.referralCode)
                  setMessage('Referral code copied')
                }}
              >
                Copy referral code
              </button>
            </section>

            <form className="search-card" onSubmit={onRedeem}>
              <h2>Redeem a referral</h2>
              <p className="muted small">Enter a friend’s code once to unlock bonus points.</p>
              <label className="search-field">
                <span className="sr-only">Referral code</span>
                <input
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  placeholder="FRIENDCODE"
                  required
                />
              </label>
              <button type="submit" className="btn btn--gold btn--block">
                Apply code
              </button>
            </form>

            {message && <p className="success-text">{message}</p>}
            {error && <p className="error-text">{error}</p>}

            <section className="rail-section">
              <div className="section-head">
                <h2>How points work</h2>
              </div>
              <ul className="settings-list">
                {rules.map((rule) => (
                  <li key={rule}>{rule}</li>
                ))}
              </ul>
            </section>

            <section className="rail-section">
              <div className="section-head">
                <h2>Recent activity</h2>
              </div>
              {ledger.length === 0 ? (
                <p className="muted">No ledger entries yet.</p>
              ) : (
                <ul className="ledger">
                  {ledger.slice(0, 8).map((entry) => (
                    <li key={entry.id}>
                      <div>
                        <strong>{entry.reason.replace(/_/g, ' ')}</strong>
                        <p className="muted small">{new Date(entry.createdAt).toLocaleString()}</p>
                      </div>
                      <span className={entry.points >= 0 ? 'price-gold' : 'error-text'}>
                        {entry.points >= 0 ? '+' : ''}
                        {entry.points}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </>
        )}

        <ul className="settings-list">
          <li>
            <Link to="/host">Upload hotel images & info</Link>
          </li>
          <li>Payment methods</li>
          <li>Travel preferences</li>
          <li>Trusted & Secure · 24/7 Concierge</li>
        </ul>
      </main>
    </AppShell>
  )
}
