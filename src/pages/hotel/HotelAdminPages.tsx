import { useEffect, useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { api, type ApiStay } from '../../api'
import { useAuth } from '../../context/AuthContext'

type Dash = {
  summary: {
    properties: number
    rooms: number
    bookings: number
    pending: number
    revenue: number
    arrivingSoon: number
    occupancyHint: number
  }
  stays: ApiStay[]
  recentBookings: Array<Record<string, unknown>>
  rooms: Array<Record<string, unknown>>
}

export function HotelDashboardPage() {
  const { user } = useAuth()
  const [data, setData] = useState<Dash | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    void api
      .hotelDashboard()
      .then((d) => setData(d as unknown as Dash))
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load'))
  }, [])

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
        <p className="muted">Loading suite…</p>
      </div>
    )
  }

  const s = data.summary
  return (
    <div className="ops-page">
      <header className="ops-header">
        <div>
          <p className="ops-kicker">Hotel suite</p>
          <h1>Welcome, {user?.name?.split(' ')[0] || 'Host'}</h1>
          <p className="muted">Bookings, rooms, arrivals, and revenue at a glance.</p>
        </div>
        <Link className="btn btn--gold" to="/hotel-admin/bookings">
          Manage bookings
        </Link>
      </header>

      <section className="ops-metrics">
        <article>
          <p>Properties</p>
          <strong>{s.properties}</strong>
        </article>
        <article>
          <p>Rooms</p>
          <strong>{s.rooms}</strong>
        </article>
        <article>
          <p>Bookings</p>
          <strong>{s.bookings}</strong>
        </article>
        <article>
          <p>Pending</p>
          <strong>{s.pending}</strong>
        </article>
        <article>
          <p>Revenue</p>
          <strong>${Number(s.revenue || 0).toLocaleString()}</strong>
        </article>
        <article>
          <p>Arriving (7d)</p>
          <strong>{s.arrivingSoon}</strong>
        </article>
        <article>
          <p>Occupancy hint</p>
          <strong>{s.occupancyHint}%</strong>
        </article>
      </section>

      <section className="ops-grid">
        <div className="ops-panel">
          <h2>Your properties</h2>
          <ul className="ops-list">
            {data.stays.map((stay) => (
              <li key={stay.id}>
                <img src={stay.image} alt="" />
                <div>
                  <strong>{stay.name}</strong>
                  <p className="muted small">
                    {stay.city} · from ${stay.nightlyFrom}/night
                  </p>
                </div>
                <Link to="/hotel-admin/property">Edit</Link>
              </li>
            ))}
          </ul>
        </div>
        <div className="ops-panel">
          <h2>Recent bookings</h2>
          {data.recentBookings.length === 0 ? (
            <p className="muted">No bookings yet.</p>
          ) : (
            <ul className="ops-list ops-list--plain">
              {data.recentBookings.map((b) => (
                <li key={String(b.id)}>
                  <div>
                    <strong>{String(b.guestName || 'Guest')}</strong>
                    <p className="muted small">
                      {String(b.bookingRef)} · {String(b.status)} · ${Number(b.total || 0)}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>
    </div>
  )
}

export function HotelBookingsPage() {
  const [bookings, setBookings] = useState<Array<Record<string, unknown>>>([])
  const [note, setNote] = useState('')
  const [message, setMessage] = useState<string | null>(null)

  async function load() {
    const data = await api.hotelBookings()
    setBookings(data.bookings as Array<Record<string, unknown>>)
  }

  useEffect(() => {
    void load().catch(() => undefined)
  }, [])

  async function updateStatus(id: string, status: string) {
    await api.updateHotelBooking(id, { status, note: note || undefined })
    setMessage(`Booking marked ${status}`)
    setNote('')
    await load()
  }

  return (
    <div className="ops-page">
      <header className="ops-header">
        <div>
          <p className="ops-kicker">Front desk</p>
          <h1>Bookings</h1>
          <p className="muted">Confirm, check in, cancel, and leave internal notes.</p>
        </div>
      </header>
      {message && <p className="ops-toast">{message}</p>}
      <div className="ops-panel">
        <label className="ops-inline">
          Note for next action
          <input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Optional note" />
        </label>
        <div className="ops-table-wrap">
          <table className="ops-table">
            <thead>
              <tr>
                <th>Guest</th>
                <th>Stay</th>
                <th>Dates</th>
                <th>Total</th>
                <th>Status</th>
                <th>Pay</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {bookings.map((b) => (
                <tr key={String(b.id)}>
                  <td>
                    <strong>{String(b.guestName || 'Guest')}</strong>
                    <div className="muted small">{String(b.guestEmail || '')}</div>
                  </td>
                  <td>{String(b.stayName)}</td>
                  <td className="small">
                    {String(b.checkIn || '—')} → {String(b.checkOut || '—')}
                  </td>
                  <td>${Number(b.total || 0)}</td>
                  <td>
                    <span className="pill">{String(b.status)}</span>
                  </td>
                  <td>{String(b.paymentStatus || '—')}</td>
                  <td className="ops-actions">
                    <button type="button" onClick={() => void updateStatus(String(b.id), 'CONFIRMED')}>
                      Confirm
                    </button>
                    <button
                      type="button"
                      onClick={() => void updateStatus(String(b.id), 'CHECKED_IN')}
                    >
                      Check in
                    </button>
                    <button type="button" onClick={() => void updateStatus(String(b.id), 'CANCELLED')}>
                      Cancel
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {bookings.length === 0 && <p className="muted pad">No bookings yet.</p>}
        </div>
      </div>
    </div>
  )
}

export function HotelRoomsPage() {
  const [rooms, setRooms] = useState<Array<Record<string, unknown>>>([])
  const [stays, setStays] = useState<ApiStay[]>([])
  const [form, setForm] = useState({
    stayId: '',
    name: '',
    nightlyRate: '100',
    inventory: '5',
    guests: '2',
    bed: 'King Bed',
  })
  const [message, setMessage] = useState<string | null>(null)

  useEffect(() => {
    void Promise.all([api.hotelRooms(), api.hotelDashboard()]).then(([r, d]) => {
      setRooms(r.rooms as Array<Record<string, unknown>>)
      const dash = d as { stays?: ApiStay[] }
      setStays(dash.stays || [])
      if (dash.stays?.[0]) setForm((f) => ({ ...f, stayId: dash.stays![0].id }))
    })
  }, [])

  async function onCreate(event: FormEvent) {
    event.preventDefault()
    await api.createHotelRoom({
      stayId: form.stayId,
      name: form.name,
      nightlyRate: Number(form.nightlyRate),
      inventory: Number(form.inventory),
      guests: Number(form.guests),
      bed: form.bed,
    })
    setMessage('Room type added')
    setForm((f) => ({ ...f, name: '' }))
    const r = await api.hotelRooms()
    setRooms(r.rooms as Array<Record<string, unknown>>)
  }

  return (
    <div className="ops-page">
      <header className="ops-header">
        <div>
          <p className="ops-kicker">Inventory</p>
          <h1>Rooms & rates</h1>
          <p className="muted">Create room types, set nightly rates, and track inventory.</p>
        </div>
      </header>
      {message && <p className="ops-toast">{message}</p>}
      <div className="ops-grid">
        <form className="ops-panel" onSubmit={onCreate}>
          <h2>Add room type</h2>
          <label>
            Property
            <select
              value={form.stayId}
              onChange={(e) => setForm({ ...form, stayId: e.target.value })}
              required
            >
              {stays.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </label>
          <label>
            Name
            <input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
            />
          </label>
          <div className="ops-row">
            <label>
              Nightly rate
              <input
                value={form.nightlyRate}
                onChange={(e) => setForm({ ...form, nightlyRate: e.target.value })}
              />
            </label>
            <label>
              Inventory
              <input
                value={form.inventory}
                onChange={(e) => setForm({ ...form, inventory: e.target.value })}
              />
            </label>
          </div>
          <button className="btn btn--gold" type="submit">
            Save room
          </button>
        </form>
        <div className="ops-panel">
          <h2>Current rooms</h2>
          <ul className="ops-list ops-list--plain">
            {rooms.map((r) => (
              <li key={String(r.id)}>
                <div>
                  <strong>{String(r.name)}</strong>
                  <p className="muted small">
                    ${Number(r.nightlyRate)} · {Number(r.inventory)} units · {String(r.status)}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  )
}

export function HotelCalendarPage() {
  const [events, setEvents] = useState<Array<Record<string, unknown>>>([])
  useEffect(() => {
    void api.hotelCalendar().then((d) => setEvents(d.events as Array<Record<string, unknown>>))
  }, [])
  return (
    <div className="ops-page">
      <header className="ops-header">
        <div>
          <p className="ops-kicker">Availability</p>
          <h1>Calendar</h1>
          <p className="muted">Upcoming occupied nights across your properties.</p>
        </div>
      </header>
      <div className="ops-panel">
        {events.length === 0 ? (
          <p className="muted">No upcoming stays on the calendar.</p>
        ) : (
          <ul className="ops-list ops-list--plain">
            {events.map((e) => (
              <li key={String(e.id)}>
                <div>
                  <strong>{String(e.title)}</strong>
                  <p className="muted small">
                    {String(e.start)} → {String(e.end)} · {String(e.status)}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}

export function HotelPropertyPage() {
  const [stays, setStays] = useState<ApiStay[]>([])
  const [stayId, setStayId] = useState('')
  const [summary, setSummary] = useState('')
  const [nightlyFrom, setNightlyFrom] = useState('')
  const [phone, setPhone] = useState('')
  const [message, setMessage] = useState<string | null>(null)

  useEffect(() => {
    void api.hotelDashboard().then((d) => {
      const dash = d as { stays?: ApiStay[] }
      setStays(dash.stays || [])
      const first = dash.stays?.[0]
      if (first) {
        setStayId(first.id)
        setSummary(first.summary || '')
        setNightlyFrom(String(first.nightlyFrom))
        setPhone(first.contact?.phone || '')
      }
    })
  }, [])

  function applyStay(id: string) {
    const stay = stays.find((s) => s.id === id)
    if (!stay) return
    setStayId(id)
    setSummary(stay.summary || '')
    setNightlyFrom(String(stay.nightlyFrom))
    setPhone(stay.contact?.phone || '')
  }

  async function onSave(event: FormEvent) {
    event.preventDefault()
    const form = new FormData()
    form.set('summary', summary)
    form.set('nightlyFrom', nightlyFrom)
    form.set('phone', phone)
    await api.updateStay(stayId, form)
    setMessage('Property updated')
  }

  return (
    <div className="ops-page">
      <header className="ops-header">
        <div>
          <p className="ops-kicker">Property</p>
          <h1>Listing editor</h1>
          <p className="muted">Update story, rate floor, and contact details.</p>
        </div>
      </header>
      {message && <p className="ops-toast">{message}</p>}
      <form className="ops-panel" onSubmit={onSave}>
        <label>
          Property
          <select value={stayId} onChange={(e) => applyStay(e.target.value)}>
            {stays.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </label>
        <label>
          Summary
          <textarea value={summary} onChange={(e) => setSummary(e.target.value)} rows={5} />
        </label>
        <div className="ops-row">
          <label>
            From rate
            <input value={nightlyFrom} onChange={(e) => setNightlyFrom(e.target.value)} />
          </label>
          <label>
            Phone
            <input value={phone} onChange={(e) => setPhone(e.target.value)} />
          </label>
        </div>
        <button className="btn btn--gold" type="submit">
          Save changes
        </button>
      </form>
    </div>
  )
}

export function HotelMessagesPage() {
  const [messages, setMessages] = useState<Array<Record<string, unknown>>>([])
  const [body, setBody] = useState('')
  const [stayId, setStayId] = useState('')

  useEffect(() => {
    void Promise.all([api.hotelMessages(), api.hotelDashboard()]).then(([m, d]) => {
      setMessages(m.messages as Array<Record<string, unknown>>)
      const first = (d as { stays?: ApiStay[] }).stays?.[0]
      if (first) setStayId(first.id)
    })
  }, [])

  async function send(event: FormEvent) {
    event.preventDefault()
    await api.sendHotelMessage({ stayId, body })
    setBody('')
    const m = await api.hotelMessages()
    setMessages(m.messages as Array<Record<string, unknown>>)
  }

  return (
    <div className="ops-page">
      <header className="ops-header">
        <div>
          <p className="ops-kicker">Inbox</p>
          <h1>Guest messages</h1>
          <p className="muted">Concierge notes and guest correspondence.</p>
        </div>
      </header>
      <div className="ops-grid">
        <form className="ops-panel" onSubmit={send}>
          <h2>Compose</h2>
          <textarea value={body} onChange={(e) => setBody(e.target.value)} rows={4} required />
          <button className="btn btn--gold" type="submit">
            Send
          </button>
        </form>
        <div className="ops-panel">
          <h2>Thread</h2>
          <ul className="ops-list ops-list--plain">
            {messages.map((m) => (
              <li key={String(m.id)}>
                <div>
                  <strong>{String(m.fromName || 'Staff')}</strong>
                  <p>{String(m.body)}</p>
                  <p className="muted small">{String(m.createdAt)}</p>
                </div>
              </li>
            ))}
            {messages.length === 0 && <p className="muted">No messages yet.</p>}
          </ul>
        </div>
      </div>
    </div>
  )
}
