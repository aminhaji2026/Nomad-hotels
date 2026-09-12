import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { api, type ApiStay, type AuthUser, type PaymentMethod } from '../../api'
import { useAuth } from '../../context/AuthContext'

function money(n: number) {
  return `$${Number(n || 0).toLocaleString()}`
}

export function AdminDashboardPage() {
  const { user } = useAuth()
  const [range, setRange] = useState('30')
  const [data, setData] = useState<Record<string, unknown> | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setError(null)
    void api
      .adminDashboard(range)
      .then(setData)
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load'))
  }, [range])

  if (error) {
    return (
      <div className="ops-page">
        <p className="form-error">{error}</p>
      </div>
    )
  }
  if (!data) {
    return (
      <div className="ops-page">
        <p className="muted">Loading executive dashboard…</p>
      </div>
    )
  }

  const summary = (data.summary || {}) as Record<string, number>
  const alerts = (data.alerts as Array<{ level: string; text: string }>) || []
  const topHotels = (data.topHotels as Array<Record<string, unknown>>) || []
  const topDestinations = (data.topDestinations as Array<Record<string, unknown>>) || []
  const topRoomTypes = (data.topRoomTypes as Array<Record<string, unknown>>) || []
  const bookingSources = (data.bookingSources as Array<Record<string, unknown>>) || []
  const recentBookings = (data.recentBookings as Array<Record<string, unknown>>) || []
  const recentPayments = (data.recentPayments as Array<Record<string, unknown>>) || []
  const audit = (data.audit as Array<Record<string, unknown>>) || []
  const duffel = (data.duffel || {}) as Record<string, unknown>

  return (
    <div className="ops-page">
      <header className="ops-header">
        <div>
          <p className="ops-kicker">Executive dashboard</p>
          <h1>Hello, {user?.name?.split(' ')[0] || 'Admin'}</h1>
          <p className="muted">
            Live network pulse — hotels, guests, revenue, arrivals, and operational alerts.
          </p>
        </div>
        <label className="ops-range">
          Range
          <select value={range} onChange={(e) => setRange(e.target.value)} aria-label="Dashboard range">
            <option value="7">Last 7 days</option>
            <option value="30">Last 30 days</option>
            <option value="90">Last 90 days</option>
          </select>
        </label>
      </header>

      {alerts.length > 0 && (
        <section className="ops-alerts" aria-label="System alerts">
          {alerts.map((alert) => (
            <p key={alert.text} className={`ops-alert ops-alert--${alert.level}`}>
              {alert.text}
            </p>
          ))}
        </section>
      )}

      <section className="ops-metrics">
        <article>
          <p>Registered hotels</p>
          <strong>{summary.stays || 0}</strong>
          <span className="muted small">
            {summary.publishedHotels || 0} live · {summary.suspendedHotels || 0} suspended ·{' '}
            {summary.featuredHotels || 0} featured
          </span>
        </article>
        <article>
          <p>Bookings</p>
          <strong>{summary.bookings || 0}</strong>
          <span className="muted small">{summary.todaysBookings || 0} created today</span>
        </article>
        <article>
          <p>Current guests</p>
          <strong>{summary.currentGuests || 0}</strong>
          <span className="muted small">
            {summary.upcomingArrivals || 0} arrivals · {summary.upcomingDepartures || 0} departures (7d)
          </span>
        </article>
        <article>
          <p>Gross booking value</p>
          <strong>{money(summary.grossBookingValue || 0)}</strong>
          <span className="muted small">Paid revenue {money(summary.revenue || 0)}</span>
        </article>
        <article>
          <p>Platform commission</p>
          <strong>{money(summary.commissionEarned || 0)}</strong>
          <span className="muted small">
            {Math.round((summary.commissionRate || 0.12) * 100)}% default rate
          </span>
        </article>
        <article>
          <p>Outstanding / pending</p>
          <strong>{summary.pendingPayments || 0}</strong>
          <span className="muted small">
            Refunds {summary.completedRefunds || 0} · payouts {money(summary.outstandingPayouts || 0)}
          </span>
        </article>
        <article>
          <p>Avg booking value</p>
          <strong>{money(summary.avgBookingValue || 0)}</strong>
          <span className="muted small">ALOS {summary.avgLengthOfStay || 0} nights</span>
        </article>
        <article>
          <p>Customers</p>
          <strong>{summary.customers || 0}</strong>
          <span className="muted small">
            Growth {summary.customerGrowth || 0}% · hotel admins {summary.hotelAdmins || 0}
          </span>
        </article>
        <article>
          <p>Cancel / no-show</p>
          <strong>{summary.cancellationRate || 0}%</strong>
          <span className="muted small">No-show {summary.noShowRate || 0}%</span>
        </article>
        <article>
          <p>Support & applications</p>
          <strong>{summary.unresolvedSupport || 0}</strong>
          <span className="muted small">
            Pending hotel apps {summary.pendingApplications || 0}
          </span>
        </article>
      </section>

      <section className="ops-grid">
        <div className="ops-panel">
          <h2>Top-performing hotels</h2>
          <ul className="ops-list ops-list--plain">
            {topHotels.map((h) => (
              <li key={String(h.stayId || h.stayName)}>
                <div>
                  <strong>{String(h.stayName || h.stayId)}</strong>
                  <p className="muted small">
                    {Number(h.bookings || 0)} bookings · {money(Number(h.revenue || 0))}
                  </p>
                </div>
              </li>
            ))}
            {topHotels.length === 0 && <p className="muted">No paid hotel performance yet.</p>}
          </ul>
        </div>
        <div className="ops-panel">
          <h2>Top destinations</h2>
          <ul className="ops-list ops-list--plain">
            {topDestinations.map((d) => (
              <li key={String(d.city)}>
                <div>
                  <strong>{String(d.city)}</strong>
                  <p className="muted small">
                    {Number(d.bookings || 0)} bookings · {money(Number(d.revenue || 0))}
                  </p>
                </div>
              </li>
            ))}
            {topDestinations.length === 0 && <p className="muted">No destination mix yet.</p>}
          </ul>
        </div>
        <div className="ops-panel">
          <h2>Most-booked room types</h2>
          <ul className="ops-list ops-list--plain">
            {topRoomTypes.map((r) => (
              <li key={String(r.name)}>
                <div>
                  <strong>{String(r.name)}</strong>
                  <p className="muted small">{Number(r.count || 0)} bookings</p>
                </div>
              </li>
            ))}
            {topRoomTypes.length === 0 && <p className="muted">No room-type mix yet.</p>}
          </ul>
        </div>
        <div className="ops-panel">
          <h2>Booking sources</h2>
          <ul className="ops-list ops-list--plain">
            {bookingSources.map((s) => (
              <li key={String(s.source)}>
                <div>
                  <strong>{String(s.source)}</strong>
                  <p className="muted small">{Number(s.count || 0)} bookings</p>
                </div>
              </li>
            ))}
            {bookingSources.length === 0 && <p className="muted">No attribution data yet.</p>}
          </ul>
          <p className="muted small" style={{ marginTop: '0.75rem' }}>
            Duffel Stay · {String(duffel.mode || 'mock')}
            {duffel.configured ? ' · live token' : ' · mock inventory'}
          </p>
        </div>
      </section>

      <section className="ops-grid">
        <div className="ops-panel">
          <h2>Recent reservations</h2>
          <ul className="ops-list ops-list--plain">
            {recentBookings.slice(0, 8).map((b) => (
              <li key={String(b.id)}>
                <div>
                  <strong>{String(b.guestName || b.bookingRef)}</strong>
                  <p className="muted small">
                    {String(b.stayName)} · {String(b.status)} · {money(Number(b.total || 0))}
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
            {recentPayments.slice(0, 8).map((p) => (
              <li key={String(p.id)}>
                <div>
                  <strong>{String(p.gateway)}</strong>
                  <p className="muted small">
                    {String(p.status)} · {money(Number(p.amount || 0))} · {String(p.providerRef || '')}
                  </p>
                </div>
              </li>
            ))}
            {recentPayments.length === 0 && <p className="muted">No payments yet.</p>}
          </ul>
        </div>
        <div className="ops-panel">
          <h2>Audit trail</h2>
          <ul className="ops-list ops-list--plain">
            {audit.slice(0, 8).map((row) => (
              <li key={String(row.id || `${row.action}-${row.createdAt}`)}>
                <div>
                  <strong>
                    {String(row.action)} · {String(row.entity)}
                  </strong>
                  <p className="muted small">
                    {String(row.entityId || '')} · {String(row.createdAt || '').slice(0, 19).replace('T', ' ')}
                  </p>
                </div>
              </li>
            ))}
            {audit.length === 0 && <p className="muted">No audit events yet.</p>}
          </ul>
        </div>
      </section>
    </div>
  )
}

export function AdminHotelsPage() {
  const [stays, setStays] = useState<ApiStay[]>([])
  const [query, setQuery] = useState('')
  const [status, setStatus] = useState('all')
  const [message, setMessage] = useState<string | null>(null)
  const [editing, setEditing] = useState<ApiStay | null>(null)
  const [notes, setNotes] = useState('')

  async function load() {
    const data = await api.adminStays()
    setStays(data.stays)
  }

  useEffect(() => {
    void load()
  }, [])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return stays.filter((stay) => {
      const stayStatus = stay.status || 'published'
      if (status !== 'all' && stayStatus !== status) return false
      if (!q) return true
      return [stay.name, stay.city, stay.country, stay.typeLabel, stay.neighborhood]
        .join(' ')
        .toLowerCase()
        .includes(q)
    })
  }, [stays, query, status])

  async function patchStay(id: string, payload: Record<string, unknown>, toast: string) {
    await api.updateAdminStay(id, payload)
    setMessage(toast)
    await load()
  }

  async function archive(id: string) {
    await api.archiveStay(id)
    setMessage('Hotel archived')
    setEditing(null)
    await load()
  }

  return (
    <div className="ops-page">
      <header className="ops-header">
        <div>
          <p className="ops-kicker">Hotel & property management</p>
          <h1>Hotels</h1>
          <p className="muted">Search, feature, suspend, note, and archive properties across the network.</p>
        </div>
      </header>
      {message && <p className="ops-toast">{message}</p>}

      <div className="ops-toolbar">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search name, city, country…"
          aria-label="Search hotels"
        />
        <select value={status} onChange={(e) => setStatus(e.target.value)} aria-label="Filter status">
          <option value="all">All statuses</option>
          <option value="published">Published</option>
          <option value="suspended">Suspended</option>
          <option value="pending">Pending</option>
          <option value="archived">Archived</option>
        </select>
        <p className="muted small">{filtered.length} properties</p>
      </div>

      <div className="ops-panel">
        <ul className="ops-list">
          {filtered.map((stay) => (
            <li key={stay.id}>
              <img src={stay.image} alt="" />
              <div>
                <strong>
                  {stay.name}
                  {stay.featured ? ' · Featured' : ''}
                </strong>
                <p className="muted small">
                  {stay.city}, {stay.country} · ${stay.nightlyFrom}/night · {stay.status || 'published'} ·{' '}
                  {stay.typeLabel}
                </p>
              </div>
              <div className="ops-list__actions">
                <button
                  type="button"
                  className="btn btn--ghost"
                  onClick={() => {
                    setEditing(stay)
                    setNotes(String(stay.internalNotes || ''))
                  }}
                >
                  Manage
                </button>
                <button
                  type="button"
                  className="btn btn--ghost"
                  onClick={() =>
                    void patchStay(stay.id, { featured: !stay.featured }, stay.featured ? 'Unfeatured' : 'Featured')
                  }
                >
                  {stay.featured ? 'Unfeature' : 'Feature'}
                </button>
                <button
                  type="button"
                  className="btn btn--ghost"
                  onClick={() =>
                    void patchStay(
                      stay.id,
                      {
                        status: (stay.status || 'published') === 'suspended' ? 'published' : 'suspended',
                      },
                      (stay.status || 'published') === 'suspended' ? 'Reactivated' : 'Suspended',
                    )
                  }
                >
                  {(stay.status || 'published') === 'suspended' ? 'Activate' : 'Suspend'}
                </button>
              </div>
            </li>
          ))}
          {filtered.length === 0 && <p className="muted">No hotels match these filters.</p>}
        </ul>
      </div>

      {editing && (
        <div className="ops-panel" style={{ marginTop: '1rem' }}>
          <h2>Manage · {editing.name}</h2>
          <p className="muted small">
            {editing.city}, {editing.country} · visibility in search follows published status
          </p>
          <label>
            Internal notes
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={4} />
          </label>
          <div className="ops-list__actions" style={{ marginTop: '0.75rem' }}>
            <button
              type="button"
              className="btn btn--gold"
              onClick={() =>
                void patchStay(editing.id, { internalNotes: notes }, 'Notes saved').then(() => setEditing(null))
              }
            >
              Save notes
            </button>
            <button
              type="button"
              className="btn btn--ghost"
              onClick={() => void patchStay(editing.id, { status: 'published' }, 'Published')}
            >
              Publish
            </button>
            <button type="button" className="btn btn--ghost" onClick={() => void archive(editing.id)}>
              Archive
            </button>
            <button type="button" className="btn btn--ghost" onClick={() => setEditing(null)}>
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export function AdminModulesPage() {
  const modules = [
    { name: '1. Executive Dashboard', status: 'Live', note: 'KPIs, alerts, tops, audit feed' },
    { name: '2. Hotel & Property Management', status: 'Live', note: 'Search, feature, suspend, notes, archive' },
    { name: '3. Hotel Onboarding & Approval', status: 'Next', note: 'Applications queue & document review' },
    { name: '4. Hotel User & Staff Management', status: 'Partial', note: 'Invite/suspend staff live; roles matrix next' },
    { name: '5. Customer Management', status: 'Partial', note: 'Directory live; CRM profile next' },
    { name: '6. Reservation Management', status: 'Partial', note: 'Network bookings list live' },
    { name: '7. Inventory & Availability', status: 'Planned', note: 'Calendars, holds, overbooking rules' },
    { name: '8. Rates & Pricing Oversight', status: 'Planned', note: 'Rate plans and anomaly detection' },
    { name: '9. Commission Management', status: 'Next', note: 'Default rate already feeds dashboard' },
    { name: '10. Payment Management', status: 'Partial', note: 'Ledger + gateways live' },
    { name: '11–13. Refunds, Payouts, Ledger', status: 'Planned', note: 'Finance suite' },
    { name: '14–15. Promotions & Advertising', status: 'Planned', note: 'Campaigns and featured placements' },
    { name: '16–20. Reviews, CMS, Destinations', status: 'Planned', note: 'Content & taxonomy' },
    { name: '21–23. Support, Fraud, Comms', status: 'Planned', note: 'Ops case management' },
    { name: '24–27. i18n, Tax, Loyalty, Reports', status: 'Planned', note: 'Growth & compliance analytics' },
    { name: '28–29. Roles, Audit & Compliance', status: 'Partial', note: 'Hard roles + audit feed live' },
  ]

  return (
    <div className="ops-page">
      <header className="ops-header">
        <div>
          <p className="ops-kicker">Platform roadmap</p>
          <h1>Module map</h1>
          <p className="muted">
            Your Multi-Hotel Platform Admin blueprint — shipped pieces first, then finance, onboarding, and
            content modules.
          </p>
        </div>
      </header>
      <div className="ops-panel">
        <ul className="ops-module-list">
          {modules.map((mod) => (
            <li key={mod.name}>
              <div>
                <strong>{mod.name}</strong>
                <p className="muted small">{mod.note}</p>
              </div>
              <span className={`ops-pill ops-pill--${mod.status.toLowerCase()}`}>{mod.status}</span>
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
