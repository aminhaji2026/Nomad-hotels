import { useEffect, useState, type FormEvent } from 'react'
import { api, type ApiStay, type AuthUser, type PaymentMethod } from '../../api'
import { useAuth } from '../../context/AuthContext'

export function AdminDashboardPage() {
  const { user } = useAuth()
  const [data, setData] = useState<Record<string, unknown> | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    void api
      .adminDashboard()
      .then(setData)
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load'))
  }, [])

  if (error) return <div className="ops-page"><p className="form-error">{error}</p></div>
  if (!data) return <div className="ops-page"><p className="muted">Loading control center…</p></div>

  const summary = data.summary as Record<string, number>
  const duffel = data.duffel as Record<string, unknown>
  const recentBookings = (data.recentBookings as Array<Record<string, unknown>>) || []
  const recentPayments = (data.recentPayments as Array<Record<string, unknown>>) || []

  return (
    <div className="ops-page">
      <header className="ops-header">
        <div>
          <p className="ops-kicker">Platform control</p>
          <h1>Hello, {user?.name?.split(' ')[0] || 'Admin'}</h1>
          <p className="muted">Network health across hotels, guests, payments, and Duffel Stay.</p>
        </div>
      </header>
      <section className="ops-metrics">
        <article><p>Hotels</p><strong>{summary.stays}</strong></article>
        <article><p>Guests</p><strong>{summary.customers}</strong></article>
        <article><p>Hotel admins</p><strong>{summary.hotelAdmins}</strong></article>
        <article><p>Bookings</p><strong>{summary.bookings}</strong></article>
        <article><p>Payments</p><strong>{summary.payments}</strong></article>
        <article><p>Revenue</p><strong>${Number(summary.revenue || 0).toLocaleString()}</strong></article>
        <article><p>Pending pay</p><strong>{summary.pendingPayments}</strong></article>
      </section>
      <section className="ops-grid">
        <div className="ops-panel">
          <h2>Duffel Stay</h2>
          <p>
            Mode: <strong>{String(duffel.mode)}</strong>
          </p>
          <p className="muted small">
            {duffel.configured ? 'Live token configured' : 'Mock mode — set DUFFEL_ACCESS_TOKEN for live inventory'}
          </p>
        </div>
        <div className="ops-panel">
          <h2>Recent bookings</h2>
          <ul className="ops-list ops-list--plain">
            {recentBookings.slice(0, 6).map((b) => (
              <li key={String(b.id)}>
                <div>
                  <strong>{String(b.guestName || b.bookingRef)}</strong>
                  <p className="muted small">
                    {String(b.stayName)} · {String(b.status)} · ${Number(b.total || 0)}
                  </p>
                </div>
              </li>
            ))}
            {recentBookings.length === 0 && <p className="muted">No bookings yet.</p>}
          </ul>
        </div>
        <div className="ops-panel">
          <h2>Recent payments</h2>
          <ul className="ops-list ops-list--plain">
            {recentPayments.slice(0, 6).map((p) => (
              <li key={String(p.id)}>
                <div>
                  <strong>{String(p.gateway)}</strong>
                  <p className="muted small">
                    {String(p.status)} · ${Number(p.amount || 0)} · {String(p.providerRef)}
                  </p>
                </div>
              </li>
            ))}
            {recentPayments.length === 0 && <p className="muted">No payments yet.</p>}
          </ul>
        </div>
      </section>
    </div>
  )
}

export function AdminHotelsPage() {
  const [stays, setStays] = useState<ApiStay[]>([])
  const [message, setMessage] = useState<string | null>(null)

  async function load() {
    const data = await api.listStays()
    setStays(data.stays)
  }

  useEffect(() => {
    void load()
  }, [])

  async function archive(id: string) {
    await api.archiveStay(id)
    setMessage('Hotel archived')
    await load()
  }

  return (
    <div className="ops-page">
      <header className="ops-header">
        <div>
          <p className="ops-kicker">Inventory</p>
          <h1>Hotels</h1>
          <p className="muted">Publish, feature, and archive properties across the network.</p>
        </div>
      </header>
      {message && <p className="ops-toast">{message}</p>}
      <div className="ops-panel">
        <ul className="ops-list">
          {stays.map((stay) => (
            <li key={stay.id}>
              <img src={stay.image} alt="" />
              <div>
                <strong>{stay.name}</strong>
                <p className="muted small">
                  {stay.city}, {stay.country} · ${stay.nightlyFrom}/night · {stay.status || 'published'}
                </p>
              </div>
              <button type="button" className="btn btn--ghost" onClick={() => void archive(stay.id)}>
                Archive
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}

export function AdminUsersPage() {
  const [users, setUsers] = useState<AuthUser[]>([])
  const [form, setForm] = useState({
    email: '',
    name: '',
    password: '',
    role: 'hotel_admin',
    stayIds: '',
  })
  const [message, setMessage] = useState<string | null>(null)

  async function load() {
    const data = await api.adminUsers()
    setUsers(data.users)
  }

  useEffect(() => {
    void load()
  }, [])

  async function onCreate(event: FormEvent) {
    event.preventDefault()
    await api.createAdminUser({
      email: form.email,
      name: form.name,
      password: form.password,
      role: form.role,
      stayIds: form.stayIds
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean),
    })
    setMessage('User created')
    setForm({ email: '', name: '', password: '', role: 'hotel_admin', stayIds: '' })
    await load()
  }

  async function toggleStatus(user: AuthUser) {
    const next = user.status === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE'
    await api.updateAdminUser(user.id, { status: next })
    await load()
  }

  return (
    <div className="ops-page">
      <header className="ops-header">
        <div>
          <p className="ops-kicker">People</p>
          <h1>Users & roles</h1>
          <p className="muted">Invite hotel admins, promote staff, and suspend accounts.</p>
        </div>
      </header>
      {message && <p className="ops-toast">{message}</p>}
      <div className="ops-grid">
        <form className="ops-panel" onSubmit={onCreate}>
          <h2>Create staff user</h2>
          <label>
            Name
            <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
          </label>
          <label>
            Email
            <input
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              required
            />
          </label>
          <label>
            Password
            <input
              type="password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              required
              minLength={8}
            />
          </label>
          <label>
            Role
            <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
              <option value="hotel_admin">Hotel admin</option>
              <option value="admin">Platform admin</option>
              <option value="customer">Customer</option>
            </select>
          </label>
          <label>
            Stay IDs (comma-separated)
            <input
              value={form.stayIds}
              onChange={(e) => setForm({ ...form, stayIds: e.target.value })}
              placeholder="damal-hotel-hargeisa"
            />
          </label>
          <button className="btn btn--gold" type="submit">
            Create user
          </button>
        </form>
        <div className="ops-panel">
          <h2>Directory</h2>
          <ul className="ops-list ops-list--plain">
            {users.map((u) => (
              <li key={u.id}>
                <div>
                  <strong>{u.name}</strong>
                  <p className="muted small">
                    {u.email} · {u.role} · {u.status || 'ACTIVE'}
                  </p>
                </div>
                <button type="button" className="btn btn--ghost" onClick={() => void toggleStatus(u)}>
                  {u.status === 'SUSPENDED' ? 'Activate' : 'Suspend'}
                </button>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  )
}

export function AdminBookingsPage() {
  const [bookings, setBookings] = useState<Array<Record<string, unknown>>>([])
  useEffect(() => {
    void api.adminBookings().then((d) => setBookings(d.bookings as Array<Record<string, unknown>>))
  }, [])
  return (
    <div className="ops-page">
      <header className="ops-header">
        <div>
          <p className="ops-kicker">Network</p>
          <h1>All bookings</h1>
          <p className="muted">Every direct and Duffel reservation across NomadStay.</p>
        </div>
      </header>
      <div className="ops-panel ops-table-wrap">
        <table className="ops-table">
          <thead>
            <tr>
              <th>Ref</th>
              <th>Guest</th>
              <th>Stay</th>
              <th>Total</th>
              <th>Status</th>
              <th>Source</th>
            </tr>
          </thead>
          <tbody>
            {bookings.map((b) => (
              <tr key={String(b.id)}>
                <td>{String(b.bookingRef)}</td>
                <td>{String(b.guestName || b.guestEmail || '—')}</td>
                <td>{String(b.stayName)}</td>
                <td>${Number(b.total || 0)}</td>
                <td>{String(b.status)}</td>
                <td>{String(b.source || 'direct')}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {bookings.length === 0 && <p className="muted pad">No bookings yet.</p>}
      </div>
    </div>
  )
}

export function AdminPaymentsPage() {
  const [payments, setPayments] = useState<Array<Record<string, unknown>>>([])
  const [methods, setMethods] = useState<PaymentMethod[]>([])
  useEffect(() => {
    void api.adminPayments().then((d) => {
      setPayments(d.payments as Array<Record<string, unknown>>)
      setMethods(d.methods)
    })
  }, [])
  return (
    <div className="ops-page">
      <header className="ops-header">
        <div>
          <p className="ops-kicker">Treasury</p>
          <h1>Payments</h1>
          <p className="muted">Creams-style gateways: Mock, ZAAD mobile money, and international cards.</p>
        </div>
      </header>
      <section className="ops-metrics">
        {methods.map((m) => (
          <article key={m.id}>
            <p>{m.label}</p>
            <strong>{m.id}</strong>
            <span className="muted small">{m.description}</span>
          </article>
        ))}
      </section>
      <div className="ops-panel ops-table-wrap">
        <table className="ops-table">
          <thead>
            <tr>
              <th>Gateway</th>
              <th>Amount</th>
              <th>Status</th>
              <th>Reference</th>
              <th>Created</th>
            </tr>
          </thead>
          <tbody>
            {payments.map((p) => (
              <tr key={String(p.id)}>
                <td>{String(p.gateway)}</td>
                <td>
                  ${Number(p.amount || 0)} {String(p.currency || 'USD')}
                </td>
                <td>{String(p.status)}</td>
                <td className="small">{String(p.providerRef)}</td>
                <td className="small">{String(p.createdAt)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {payments.length === 0 && <p className="muted pad">No payments yet.</p>}
      </div>
    </div>
  )
}

export function AdminDuffelPage() {
  const [status, setStatus] = useState<Record<string, unknown> | null>(null)
  const [results, setResults] = useState<Array<Record<string, unknown>>>([])
  const [checkIn, setCheckIn] = useState('2026-11-01')
  const [checkOut, setCheckOut] = useState('2026-11-04')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    void api.duffelStatus().then(setStatus)
  }, [])

  async function onSearch(event: FormEvent) {
    event.preventDefault()
    setBusy(true)
    setError(null)
    try {
      const data = await api.duffelSearch({
        checkIn,
        checkOut,
        lat: 9.56,
        lng: 44.06,
      })
      setResults((data.data?.results as Array<Record<string, unknown>>) || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Search failed')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="ops-page">
      <header className="ops-header">
        <div>
          <p className="ops-kicker">Distribution</p>
          <h1>Duffel Stay API</h1>
          <p className="muted">Search, quote, and book global hotel inventory via Duffel.</p>
        </div>
      </header>
      <div className="ops-panel">
        <h2>Connection</h2>
        <p>
          Mode: <strong>{String(status?.mode || '…')}</strong>
        </p>
        <p className="muted small">
          Set <code>DUFFEL_ACCESS_TOKEN</code> for live searches. Without it, NomadStay returns rich mock
          inventory so the booking flow still works.
        </p>
      </div>
      <form className="ops-panel" onSubmit={onSearch}>
        <h2>Test search (Hargeisa radius)</h2>
        <div className="ops-row">
          <label>
            Check in
            <input type="date" value={checkIn} onChange={(e) => setCheckIn(e.target.value)} />
          </label>
          <label>
            Check out
            <input type="date" value={checkOut} onChange={(e) => setCheckOut(e.target.value)} />
          </label>
        </div>
        {error && <p className="form-error">{error}</p>}
        <button className="btn btn--gold" type="submit" disabled={busy}>
          {busy ? 'Searching…' : 'Search Duffel Stay'}
        </button>
      </form>
      <div className="ops-panel">
        <h2>Results ({results.length})</h2>
        <ul className="ops-list ops-list--plain">
          {results.map((r) => {
            const acc = (r.accommodation || {}) as Record<string, unknown>
            return (
              <li key={String(r.id)}>
                <div>
                  <strong>{String(acc.name || r.id)}</strong>
                  <p className="muted small">
                    {String(r.cheapest_rate_currency)} {String(r.cheapest_rate_total_amount)} ·{' '}
                    {String(r.source || status?.mode)}
                  </p>
                </div>
              </li>
            )
          })}
          {results.length === 0 && <p className="muted">Run a search to preview inventory.</p>}
        </ul>
      </div>
    </div>
  )
}

export function AdminSettingsPage() {
  const [settings, setSettings] = useState<Record<string, unknown>>({})
  const [env, setEnv] = useState<Record<string, unknown>>({})
  const [message, setMessage] = useState<string | null>(null)

  useEffect(() => {
    void api.adminSettings().then((d) => {
      setSettings((d.settings as Record<string, unknown>) || {})
      setEnv((d.env as Record<string, unknown>) || {})
    })
  }, [])

  async function onSave(event: FormEvent) {
    event.preventDefault()
    const data = await api.updateAdminSettings(settings)
    setSettings(data.settings)
    setMessage('Settings saved')
  }

  return (
    <div className="ops-page">
      <header className="ops-header">
        <div>
          <p className="ops-kicker">Configuration</p>
          <h1>Platform settings</h1>
          <p className="muted">Brand, currency, default gateway, and integration readiness.</p>
        </div>
      </header>
      {message && <p className="ops-toast">{message}</p>}
      <form className="ops-panel" onSubmit={onSave}>
        <label>
          Platform name
          <input
            value={String(settings.platformName || '')}
            onChange={(e) => setSettings({ ...settings, platformName: e.target.value })}
          />
        </label>
        <label>
          Support email
          <input
            value={String(settings.supportEmail || '')}
            onChange={(e) => setSettings({ ...settings, supportEmail: e.target.value })}
          />
        </label>
        <label>
          Default currency
          <input
            value={String(settings.defaultCurrency || 'USD')}
            onChange={(e) => setSettings({ ...settings, defaultCurrency: e.target.value })}
          />
        </label>
        <label>
          Default gateway
          <select
            value={String(settings.defaultGateway || 'mock')}
            onChange={(e) => setSettings({ ...settings, defaultGateway: e.target.value })}
          >
            <option value="mock">Mock (demo)</option>
            <option value="zaad">ZAAD</option>
            <option value="international">International card</option>
          </select>
        </label>
        <button className="btn btn--gold" type="submit">
          Save settings
        </button>
      </form>
      <div className="ops-panel">
        <h2>Integration readiness</h2>
        <ul className="ops-list ops-list--plain">
          <li>
            <div>
              <strong>ZAAD</strong>
              <p className="muted small">{env.zaadConfigured ? 'Configured' : 'Needs ZAAD_API_KEY'}</p>
            </div>
          </li>
          <li>
            <div>
              <strong>International cards</strong>
              <p className="muted small">
                {env.internationalConfigured
                  ? 'Configured'
                  : 'Needs INTERNATIONAL_GATEWAY_KEY or STRIPE_SECRET_KEY'}
              </p>
            </div>
          </li>
          <li>
            <div>
              <strong>Duffel Stay</strong>
              <p className="muted small">
                {env.duffelConfigured ? 'Configured' : 'Needs DUFFEL_ACCESS_TOKEN'}
              </p>
            </div>
          </li>
        </ul>
      </div>
    </div>
  )
}
