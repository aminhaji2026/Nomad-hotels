import { useEffect, useState, type FormEvent, type ReactNode } from 'react'
import { api } from '../../api'

function money(n: number) {
  return `$${Number(n || 0).toLocaleString()}`
}

function PageHeader({ kicker, title, subtitle }: { kicker: string; title: string; subtitle: string }) {
  return (
    <header className="ops-header">
      <div>
        <p className="ops-kicker">{kicker}</p>
        <h1>{title}</h1>
        <p className="muted">{subtitle}</p>
      </div>
    </header>
  )
}

function Toast({ message }: { message: string | null }) {
  if (!message) return null
  return <p className="ops-toast">{message}</p>
}

type Row = Record<string, unknown>

export function AdminOnboardingPage() {
  const [rows, setRows] = useState<Row[]>([])
  const [status, setStatus] = useState('all')
  const [selected, setSelected] = useState<Row | null>(null)
  const [note, setNote] = useState('')
  const [message, setMessage] = useState<string | null>(null)

  async function load() {
    const data = await api.adminApplications(status)
    setRows(data.applications as Row[])
  }

  useEffect(() => {
    void load()
  }, [status])

  async function act(id: string, payload: Record<string, unknown>, toast: string) {
    await api.updateAdminApplication(id, payload)
    setMessage(toast)
    setSelected(null)
    await load()
  }

  return (
    <div className="ops-page">
      <PageHeader
        kicker="Hotel onboarding"
        title="Applications"
        subtitle="Review documents, verify locations, approve or reject hotel applications."
      />
      <Toast message={message} />
      <div className="ops-toolbar">
        <select value={status} onChange={(e) => setStatus(e.target.value)} aria-label="Filter status">
          <option value="all">All statuses</option>
          <option value="submitted">Submitted</option>
          <option value="in_review">In review</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
          <option value="corrections_requested">Corrections requested</option>
        </select>
        <p className="muted small">{rows.length} applications</p>
      </div>
      <div className="ops-panel">
        <ul className="ops-list ops-list--plain">
          {rows.map((app) => (
            <li key={String(app.id)}>
              <div>
                <strong>{String(app.propertyName)}</strong>
                <p className="muted small">
                  {String(app.city)}, {String(app.country)} · {String(app.status)} · {Number(app.progress || 0)}%
                </p>
              </div>
              <button type="button" className="btn btn--ghost" onClick={() => setSelected(app)}>
                Review
              </button>
            </li>
          ))}
          {rows.length === 0 && <p className="muted">No applications in this filter.</p>}
        </ul>
      </div>
      {selected && (
        <div className="ops-panel" style={{ marginTop: '1rem' }}>
          <h2>
            {String(selected.propertyName)} · {String(selected.ownerName)}
          </h2>
          <p className="muted small">
            {String(selected.ownerEmail)} · {String(selected.ownerPhone)}
          </p>
          <h3>Documents</h3>
          <ul className="ops-list ops-list--plain">
            {((selected.documents as Row[]) || []).map((doc) => (
              <li key={String(doc.id)}>
                <span>{String(doc.label)}</span>
                <span className={`ops-pill ops-pill--${String(doc.status) === 'received' ? 'live' : 'planned'}`}>
                  {String(doc.status)}
                </span>
              </li>
            ))}
          </ul>
          <h3>Checklist</h3>
          <ul className="ops-list ops-list--plain">
            {((selected.checklist as Row[]) || []).map((item) => (
              <li key={String(item.id)}>
                <span>{String(item.label)}</span>
                <span>{item.done ? 'Done' : 'Pending'}</span>
              </li>
            ))}
          </ul>
          <label>
            Reviewer note
            <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={3} />
          </label>
          <div className="ops-list__actions" style={{ marginTop: '0.75rem' }}>
            <button
              type="button"
              className="btn btn--gold"
              onClick={() =>
                void act(
                  String(selected.id),
                  { status: 'approved', reviewerNote: note || 'Approved after review' },
                  'Application approved',
                )
              }
            >
              Approve
            </button>
            <button
              type="button"
              className="btn btn--ghost"
              onClick={() =>
                void act(
                  String(selected.id),
                  { status: 'corrections_requested', reviewerNote: note || 'Please upload missing docs' },
                  'Corrections requested',
                )
              }
            >
              Request corrections
            </button>
            <button
              type="button"
              className="btn btn--ghost"
              onClick={() =>
                void act(
                  String(selected.id),
                  { status: 'rejected', rejectionReason: note || 'Did not meet standards', reviewerNote: note },
                  'Application rejected',
                )
              }
            >
              Reject
            </button>
            <button type="button" className="btn btn--ghost" onClick={() => setSelected(null)}>
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export function AdminCustomersPage() {
  const [rows, setRows] = useState<Row[]>([])
  const [q, setQ] = useState('')
  const [message, setMessage] = useState<string | null>(null)

  async function load(query = q) {
    const data = await api.adminCustomers(query)
    setRows(data.customers as Row[])
  }

  useEffect(() => {
    void load()
  }, [])

  return (
    <div className="ops-page">
      <PageHeader
        kicker="Customer management"
        title="Customers"
        subtitle="Search guests, view lifetime value, manage VIP/risk flags, and handle data requests."
      />
      <Toast message={message} />
      <div className="ops-toolbar">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search name, email, phone…"
          aria-label="Search customers"
        />
        <button type="button" className="btn btn--ghost" onClick={() => void load(q)}>
          Search
        </button>
      </div>
      <div className="ops-panel ops-table-wrap">
        <table className="ops-table">
          <thead>
            <tr>
              <th>Guest</th>
              <th>Bookings</th>
              <th>LTV</th>
              <th>Risk</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((c) => (
              <tr key={String(c.id)}>
                <td>
                  <strong>{String(c.name)}</strong>
                  <div className="muted small">
                    {String(c.email)}
                    {c.vip ? ' · VIP' : ''}
                  </div>
                </td>
                <td>{Number(c.bookingCount || 0)}</td>
                <td>{money(Number(c.lifetimeValue || 0))}</td>
                <td>{String(c.risk || 'normal')}</td>
                <td className="ops-list__actions">
                  <button
                    type="button"
                    className="btn btn--ghost"
                    onClick={() =>
                      void api
                        .updateAdminCustomer(String(c.id), { vip: !c.vip })
                        .then(() => {
                          setMessage(c.vip ? 'VIP removed' : 'Marked VIP')
                          return load()
                        })
                    }
                  >
                    {c.vip ? 'Unmark VIP' : 'VIP'}
                  </button>
                  <button
                    type="button"
                    className="btn btn--ghost"
                    onClick={() =>
                      void api
                        .updateAdminCustomer(String(c.id), {
                          status: c.status === 'SUSPENDED' ? 'ACTIVE' : 'SUSPENDED',
                        })
                        .then(() => {
                          setMessage('Status updated')
                          return load()
                        })
                    }
                  >
                    {c.status === 'SUSPENDED' ? 'Reactivate' : 'Suspend'}
                  </button>
                  <button
                    type="button"
                    className="btn btn--ghost"
                    onClick={() =>
                      void api.updateAdminCustomer(String(c.id), { anonymize: true }).then(() => {
                        setMessage('Customer anonymized')
                        return load()
                      })
                    }
                  >
                    Anonymize
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {rows.length === 0 && <p className="muted pad">No customers found.</p>}
      </div>
    </div>
  )
}

export function AdminInventoryPage() {
  const [rooms, setRooms] = useState<Row[]>([])
  const [alerts, setAlerts] = useState<Row[]>([])
  const [message, setMessage] = useState<string | null>(null)

  async function load() {
    const data = await api.adminInventory()
    setRooms(data.rooms as Row[])
    setAlerts(data.alerts as Row[])
  }

  useEffect(() => {
    void load()
  }, [])

  return (
    <div className="ops-page">
      <PageHeader
        kicker="Inventory"
        title="Availability control"
        subtitle="Inspect sold vs available rooms, stop-sell, and low-inventory alerts across the network."
      />
      <Toast message={message} />
      {alerts.length > 0 && (
        <section className="ops-alerts">
          {alerts.map((a) => (
            <p key={String(a.text)} className="ops-alert ops-alert--warn">
              {String(a.text)}
            </p>
          ))}
        </section>
      )}
      <div className="ops-panel ops-table-wrap">
        <table className="ops-table">
          <thead>
            <tr>
              <th>Property / room</th>
              <th>Inventory</th>
              <th>Sold</th>
              <th>Available</th>
              <th>Controls</th>
            </tr>
          </thead>
          <tbody>
            {rooms.map((room) => (
              <tr key={String(room.id)}>
                <td>
                  <strong>{String(room.stayName)}</strong>
                  <div className="muted small">
                    {String(room.name)} · {String(room.city || '')}
                  </div>
                </td>
                <td>{Number(room.inventory || 0)}</td>
                <td>{Number(room.sold || 0)}</td>
                <td>{Number(room.available || 0)}</td>
                <td className="ops-list__actions">
                  <button
                    type="button"
                    className="btn btn--ghost"
                    onClick={() =>
                      void api
                        .updateAdminInventory(String(room.id), {
                          stopSell: !room.stopSell,
                        })
                        .then(() => {
                          setMessage(room.stopSell ? 'Sales reopened' : 'Stop-sell applied')
                          return load()
                        })
                    }
                  >
                    {room.stopSell ? 'Reopen sales' : 'Stop sell'}
                  </button>
                  <button
                    type="button"
                    className="btn btn--ghost"
                    onClick={() => {
                      const next = window.prompt('New inventory count', String(room.inventory || 0))
                      const reason = window.prompt('Reason for adjustment')
                      if (next == null || !reason) return
                      void api
                        .updateAdminInventory(String(room.id), { inventory: Number(next), reason })
                        .then(() => {
                          setMessage('Inventory updated')
                          return load()
                        })
                    }}
                  >
                    Adjust
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export function AdminRatesPage() {
  const [plans, setPlans] = useState<Row[]>([])
  const [message, setMessage] = useState<string | null>(null)

  async function load() {
    const data = await api.adminRates()
    setPlans(data.ratePlans as Row[])
  }

  useEffect(() => {
    void load()
  }, [])

  return (
    <div className="ops-page">
      <PageHeader
        kicker="Rates"
        title="Pricing oversight"
        subtitle="Review rate plans, correct outliers, and track refundable vs non-refundable inventory."
      />
      <Toast message={message} />
      <div className="ops-panel ops-table-wrap">
        <table className="ops-table">
          <thead>
            <tr>
              <th>Plan</th>
              <th>Nightly</th>
              <th>Stay rules</th>
              <th>Status</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {plans.map((plan) => (
              <tr key={String(plan.id)}>
                <td>{String(plan.name)}</td>
                <td>{money(Number(plan.nightlyRate || 0))}</td>
                <td>
                  {Number(plan.minStay || 1)}–{Number(plan.maxStay || 30)} nights
                  {plan.refundable ? ' · refundable' : ' · non-refundable'}
                </td>
                <td>{String(plan.status)}</td>
                <td>
                  <button
                    type="button"
                    className="btn btn--ghost"
                    onClick={() => {
                      const next = window.prompt('Nightly rate', String(plan.nightlyRate || 0))
                      if (next == null) return
                      void api.updateAdminRate(String(plan.id), { nightlyRate: Number(next) }).then(() => {
                        setMessage('Rate updated')
                        return load()
                      })
                    }}
                  >
                    Correct rate
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {plans.length === 0 && <p className="muted pad">No rate plans yet.</p>}
      </div>
    </div>
  )
}

export function AdminCommissionsPage() {
  const [data, setData] = useState<Row | null>(null)
  const [rate, setRate] = useState('0.12')
  const [message, setMessage] = useState<string | null>(null)

  async function load() {
    const res = await api.adminCommissions()
    setData(res as Row)
    setRate(String(res.defaultRate ?? 0.12))
  }

  useEffect(() => {
    void load()
  }, [])

  if (!data) return <div className="ops-page"><p className="muted">Loading commissions…</p></div>

  const byStay = (data.byStay as Row[]) || []

  return (
    <div className="ops-page">
      <PageHeader
        kicker="Commission"
        title="Commission management"
        subtitle="Default platform rate, hotel overrides, and earned commission by property."
      />
      <Toast message={message} />
      <section className="ops-metrics">
        <article>
          <p>Default rate</p>
          <strong>{Math.round(Number(data.defaultRate || 0) * 100)}%</strong>
        </article>
        <article>
          <p>Unsettled commission</p>
          <strong>{money(Number(data.unpaid || 0))}</strong>
        </article>
      </section>
      <form
        className="ops-panel"
        onSubmit={(e: FormEvent) => {
          e.preventDefault()
          void api.updateAdminCommission({ defaultCommissionRate: Number(rate) }).then(() => {
            setMessage('Default commission saved')
            return load()
          })
        }}
      >
        <label>
          Default commission rate (0–1)
          <input value={rate} onChange={(e) => setRate(e.target.value)} />
        </label>
        <button className="btn btn--gold" type="submit">
          Save default rate
        </button>
      </form>
      <div className="ops-panel">
        <h2>By hotel</h2>
        <ul className="ops-list ops-list--plain">
          {byStay.map((row) => (
            <li key={String(row.stayId)}>
              <div>
                <strong>{String(row.stayName)}</strong>
                <p className="muted small">{Number(row.bookings || 0)} bookings</p>
              </div>
              <strong>{money(Number(row.commission || 0))}</strong>
            </li>
          ))}
          {byStay.length === 0 && <p className="muted">No commission entries yet.</p>}
        </ul>
      </div>
    </div>
  )
}

export function AdminRefundsPage() {
  const [refunds, setRefunds] = useState<Row[]>([])
  const [bookingId, setBookingId] = useState('')
  const [amount, setAmount] = useState('')
  const [reason, setReason] = useState('')
  const [message, setMessage] = useState<string | null>(null)

  async function load() {
    const data = await api.adminRefunds()
    setRefunds(data.refunds as Row[])
  }

  useEffect(() => {
    void load()
  }, [])

  return (
    <div className="ops-page">
      <PageHeader
        kicker="Refunds"
        title="Refund management"
        subtitle="Issue full or partial refunds with maker-checker approval above policy limits."
      />
      <Toast message={message} />
      <form
        className="ops-panel"
        onSubmit={(e: FormEvent) => {
          e.preventDefault()
          void api
            .createAdminRefund({ bookingId, amount: Number(amount), reason, fundedBy: 'platform' })
            .then((res) => {
              setMessage(res.message || 'Refund recorded')
              setBookingId('')
              setAmount('')
              setReason('')
              return load()
            })
        }}
      >
        <h2>Issue refund</h2>
        <label>
          Booking ID
          <input value={bookingId} onChange={(e) => setBookingId(e.target.value)} required />
        </label>
        <label>
          Amount
          <input value={amount} onChange={(e) => setAmount(e.target.value)} required />
        </label>
        <label>
          Reason
          <input value={reason} onChange={(e) => setReason(e.target.value)} required />
        </label>
        <button className="btn btn--gold" type="submit">
          Submit refund
        </button>
      </form>
      <div className="ops-panel ops-table-wrap">
        <table className="ops-table">
          <thead>
            <tr>
              <th>Ref</th>
              <th>Amount</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {refunds.map((r) => (
              <tr key={String(r.id)}>
                <td>{String(r.bookingRef || r.bookingId)}</td>
                <td>{money(Number(r.amount || 0))}</td>
                <td>{String(r.status)}</td>
                <td>
                  {r.status === 'awaiting_approval' && (
                    <button
                      type="button"
                      className="btn btn--ghost"
                      onClick={() =>
                        void api.updateAdminRefund(String(r.id), { status: 'approved' }).then(() => {
                          setMessage('Refund approved')
                          return load()
                        })
                      }
                    >
                      Approve
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export function AdminPayoutsPage() {
  const [payouts, setPayouts] = useState<Row[]>([])
  const [forecast, setForecast] = useState(0)
  const [stayId, setStayId] = useState('')
  const [amount, setAmount] = useState('')
  const [message, setMessage] = useState<string | null>(null)

  async function load() {
    const data = await api.adminPayouts()
    setPayouts(data.payouts as Row[])
    setForecast(Number(data.forecast || 0))
  }

  useEffect(() => {
    void load()
  }, [])

  return (
    <div className="ops-page">
      <PageHeader
        kicker="Payouts"
        title="Hotel payouts"
        subtitle="Calculate net payouts, hold or release batches, and track remittance status."
      />
      <Toast message={message} />
      <section className="ops-metrics">
        <article>
          <p>Payable forecast</p>
          <strong>{money(forecast)}</strong>
        </article>
      </section>
      <form
        className="ops-panel"
        onSubmit={(e: FormEvent) => {
          e.preventDefault()
          void api.createAdminPayout({ stayId, amount: Number(amount), period: 'weekly' }).then(() => {
            setMessage('Payout queued for approval')
            setStayId('')
            setAmount('')
            return load()
          })
        }}
      >
        <h2>Create payout</h2>
        <label>
          Stay ID
          <input value={stayId} onChange={(e) => setStayId(e.target.value)} required />
        </label>
        <label>
          Amount
          <input value={amount} onChange={(e) => setAmount(e.target.value)} required />
        </label>
        <button className="btn btn--gold" type="submit">
          Queue payout
        </button>
      </form>
      <div className="ops-panel">
        <ul className="ops-list ops-list--plain">
          {payouts.map((p) => (
            <li key={String(p.id)}>
              <div>
                <strong>{String(p.stayName)}</strong>
                <p className="muted small">
                  {money(Number(p.amount || 0))} · {String(p.status)}
                </p>
              </div>
              {p.status === 'pending_approval' && (
                <button
                  type="button"
                  className="btn btn--ghost"
                  onClick={() =>
                    void api.updateAdminPayout(String(p.id), { status: 'paid' }).then(() => {
                      setMessage('Payout marked paid')
                      return load()
                    })
                  }
                >
                  Mark paid
                </button>
              )}
            </li>
          ))}
          {payouts.length === 0 && <p className="muted">No payouts yet.</p>}
        </ul>
      </div>
    </div>
  )
}

export function AdminLedgerPage() {
  const [entries, setEntries] = useState<Row[]>([])
  useEffect(() => {
    void api.adminLedger().then((d) => setEntries(d.entries as Row[]))
  }, [])
  return (
    <div className="ops-page">
      <PageHeader
        kicker="Accounting"
        title="Financial ledger"
        subtitle="Commission, hotel payables, refunds, and settlement entries."
      />
      <div className="ops-panel ops-table-wrap">
        <table className="ops-table">
          <thead>
            <tr>
              <th>Type</th>
              <th>Amount</th>
              <th>Status</th>
              <th>Note</th>
            </tr>
          </thead>
          <tbody>
            {entries.map((e) => (
              <tr key={String(e.id)}>
                <td>{String(e.type)}</td>
                <td>{money(Number(e.amount || 0))}</td>
                <td>{String(e.status)}</td>
                <td className="small">{String(e.note || '')}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {entries.length === 0 && <p className="muted pad">Ledger empty.</p>}
      </div>
    </div>
  )
}

function SimpleListPage({
  kicker,
  title,
  subtitle,
  load,
  render,
}: {
  kicker: string
  title: string
  subtitle: string
  load: () => Promise<{ rows: Row[]; extra?: ReactNode }>
  render: (row: Row, reload: () => void) => ReactNode
}) {
  const [rows, setRows] = useState<Row[]>([])
  const [extra, setExtra] = useState<ReactNode>(null)
  async function refresh() {
    const data = await load()
    setRows(data.rows)
    setExtra(data.extra || null)
  }
  useEffect(() => {
    void refresh()
  }, [])
  return (
    <div className="ops-page">
      <PageHeader kicker={kicker} title={title} subtitle={subtitle} />
      {extra}
      <div className="ops-panel">
        <ul className="ops-list ops-list--plain">
          {rows.map((row) => (
            <li key={String(row.id)}>{render(row, () => void refresh())}</li>
          ))}
          {rows.length === 0 && <p className="muted">Nothing here yet.</p>}
        </ul>
      </div>
    </div>
  )
}

export function AdminPromotionsPage() {
  return (
    <SimpleListPage
      kicker="Promotions"
      title="Campaigns & coupons"
      subtitle="Platform and hotel-funded offers with usage limits and stacking controls."
      load={async () => {
        const data = await api.adminPromotions()
        return { rows: data.promotions as Row[] }
      }}
      render={(row, reload) => (
        <>
          <div>
            <strong>
              {String(row.name)} · {String(row.code || '')}
            </strong>
            <p className="muted small">
              {String(row.type)} {String(row.value)} · used {Number(row.usedCount || 0)}/
              {Number(row.usageLimit || 0)} · {String(row.status)}
            </p>
          </div>
          <button
            type="button"
            className="btn btn--ghost"
            onClick={() =>
              void api
                .updateAdminPromotion(String(row.id), {
                  status: row.status === 'active' ? 'paused' : 'active',
                })
                .then(reload)
            }
          >
            {row.status === 'active' ? 'Pause' : 'Activate'}
          </button>
        </>
      )}
    />
  )
}

export function AdminAdsPage() {
  return (
    <SimpleListPage
      kicker="Advertising"
      title="Featured placements"
      subtitle="Sponsored homepage and destination placements with budget and conversion tracking."
      load={async () => ({ rows: ((await api.adminAds()).ads as Row[]) || [] })}
      render={(row, reload) => (
        <>
          <div>
            <strong>{String(row.name)}</strong>
            <p className="muted small">
              {String(row.placement)} · spent {money(Number(row.spent || 0))}/
              {money(Number(row.budget || 0))} · {Number(row.impressions || 0)} impr
            </p>
          </div>
          <button
            type="button"
            className="btn btn--ghost"
            onClick={() =>
              void api
                .updateAdminAd(String(row.id), { status: row.status === 'active' ? 'paused' : 'active' })
                .then(reload)
            }
          >
            {row.status === 'active' ? 'Pause' : 'Activate'}
          </button>
        </>
      )}
    />
  )
}

export function AdminReviewsPage() {
  return (
    <SimpleListPage
      kicker="Reputation"
      title="Reviews moderation"
      subtitle="Approve, hide, or investigate reviews and hotel responses."
      load={async () => ({ rows: ((await api.adminReviews()).reviews as Row[]) || [] })}
      render={(row, reload) => (
        <>
          <div>
            <strong>
              {String(row.stayName)} · {Number(row.rating || 0)}★
            </strong>
            <p className="muted small">
              {String(row.title)} — {String(row.status)}
              {row.reported ? ' · reported' : ''}
            </p>
          </div>
          <div className="ops-list__actions">
            <button
              type="button"
              className="btn btn--ghost"
              onClick={() => void api.updateAdminReview(String(row.id), { status: 'published' }).then(reload)}
            >
              Publish
            </button>
            <button
              type="button"
              className="btn btn--ghost"
              onClick={() => void api.updateAdminReview(String(row.id), { status: 'hidden' }).then(reload)}
            >
              Hide
            </button>
          </div>
        </>
      )}
    />
  )
}

export function AdminCmsPage() {
  return (
    <SimpleListPage
      kicker="Content"
      title="CMS pages"
      subtitle="Homepage, help centre, and legal content with draft/publish workflow."
      load={async () => ({ rows: ((await api.adminCms()).pages as Row[]) || [] })}
      render={(row, reload) => (
        <>
          <div>
            <strong>
              {String(row.title)} · /{String(row.slug)}
            </strong>
            <p className="muted small">
              {String(row.type)} · {String(row.status)}
            </p>
          </div>
          <button
            type="button"
            className="btn btn--ghost"
            onClick={() =>
              void api
                .updateAdminCms(String(row.id), {
                  status: row.status === 'published' ? 'draft' : 'published',
                })
                .then(reload)
            }
          >
            {row.status === 'published' ? 'Unpublish' : 'Publish'}
          </button>
        </>
      )}
    />
  )
}

export function AdminDestinationsPage() {
  return (
    <SimpleListPage
      kicker="Destinations"
      title="Geographic management"
      subtitle="Cities and featured destinations that power search and landing pages."
      load={async () => ({ rows: ((await api.adminDestinations()).destinations as Row[]) || [] })}
      render={(row, reload) => (
        <>
          <div>
            <strong>
              {String(row.name)}, {String(row.country)}
            </strong>
            <p className="muted small">
              popularity {Number(row.popularity || 0)} · {row.featured ? 'featured' : 'standard'} ·{' '}
              {String(row.status)}
            </p>
          </div>
          <button
            type="button"
            className="btn btn--ghost"
            onClick={() => void api.updateAdminDestination(String(row.id), { featured: !row.featured }).then(reload)}
          >
            {row.featured ? 'Unfeature' : 'Feature'}
          </button>
        </>
      )}
    />
  )
}

export function AdminTaxonomyPage() {
  const [taxonomy, setTaxonomy] = useState<Row | null>(null)
  useEffect(() => {
    void api.adminTaxonomy().then((d) => setTaxonomy(d.taxonomy as Row))
  }, [])
  if (!taxonomy) return <div className="ops-page"><p className="muted">Loading taxonomy…</p></div>
  const sections = [
    ['propertyTypes', 'Property types'],
    ['amenities', 'Amenities'],
    ['bedTypes', 'Bed types'],
    ['policyTemplates', 'Policy templates'],
  ] as const
  return (
    <div className="ops-page">
      <PageHeader
        kicker="Taxonomy"
        title="Property types & policies"
        subtitle="Activate or retire configurable options without deleting historical records."
      />
      <div className="ops-grid">
        {sections.map(([key, label]) => (
          <div className="ops-panel" key={key}>
            <h2>{label}</h2>
            <ul className="ops-list ops-list--plain">
              {((taxonomy[key] as Row[]) || []).map((item) => (
                <li key={String(item.id)}>
                  <span>{String(item.label)}</span>
                  <span className={`ops-pill ops-pill--${item.active ? 'live' : 'planned'}`}>
                    {item.active ? 'Active' : 'Retired'}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  )
}

export function AdminSupportPage() {
  return (
    <SimpleListPage
      kicker="Support"
      title="Support centre"
      subtitle="Tickets linked to customers, hotels, and bookings with SLA-oriented handling."
      load={async () => ({ rows: ((await api.adminSupport()).tickets as Row[]) || [] })}
      render={(row, reload) => (
        <>
          <div>
            <strong>{String(row.subject)}</strong>
            <p className="muted small">
              {String(row.priority)} · {String(row.status)} · {String(row.customerEmail || '')}
            </p>
          </div>
          <button
            type="button"
            className="btn btn--ghost"
            onClick={() =>
              void api
                .updateAdminSupport(String(row.id), {
                  status: row.status === 'open' ? 'resolved' : 'open',
                  message: row.status === 'open' ? 'Resolved by platform admin' : undefined,
                })
                .then(reload)
            }
          >
            {row.status === 'open' ? 'Resolve' : 'Reopen'}
          </button>
        </>
      )}
    />
  )
}

export function AdminFraudPage() {
  return (
    <SimpleListPage
      kicker="Risk"
      title="Fraud & chargebacks"
      subtitle="Investigate velocity, device, and payment anomalies across the network."
      load={async () => ({ rows: ((await api.adminFraud()).flags as Row[]) || [] })}
      render={(row, reload) => (
        <>
          <div>
            <strong>
              {String(row.type)} · {String(row.severity)}
            </strong>
            <p className="muted small">{String(row.summary)}</p>
          </div>
          <button
            type="button"
            className="btn btn--ghost"
            onClick={() =>
              void api
                .updateAdminFraud(String(row.id), { status: row.status === 'open' ? 'cleared' : 'open' })
                .then(reload)
            }
          >
            {row.status === 'open' ? 'Clear' : 'Reopen'}
          </button>
        </>
      )}
    />
  )
}

export function AdminNotificationsPage() {
  return (
    <SimpleListPage
      kicker="Communications"
      title="Notification templates"
      subtitle="Email, SMS, and push templates with multi-language variants."
      load={async () => ({ rows: ((await api.adminNotifications()).templates as Row[]) || [] })}
      render={(row) => (
        <>
          <div>
            <strong>
              {String(row.name)} · {String(row.channel)}/{String(row.language)}
            </strong>
            <p className="muted small">{String(row.subject || row.body || '')}</p>
          </div>
          <span className={`ops-pill ops-pill--${String(row.status) === 'active' ? 'live' : 'planned'}`}>
            {String(row.status)}
          </span>
        </>
      )}
    />
  )
}

export function AdminLanguagesPage() {
  const [languages, setLanguages] = useState<Row[]>([])
  const [base, setBase] = useState('en')
  useEffect(() => {
    void api.adminLanguages().then((d) => {
      setLanguages(d.languages as Row[])
      setBase(String(d.base || 'en'))
    })
  }, [])
  return (
    <div className="ops-page">
      <PageHeader
        kicker="i18n"
        title="Languages"
        subtitle="English, Somali, and Arabic with RTL support and independent publish controls."
      />
      <p className="muted">Base language: {base}</p>
      <div className="ops-panel">
        <ul className="ops-list ops-list--plain">
          {languages.map((lang) => (
            <li key={String(lang.code)}>
              <div>
                <strong>
                  {String(lang.name)} ({String(lang.code)})
                </strong>
                <p className="muted small">{lang.rtl ? 'RTL' : 'LTR'}</p>
              </div>
              <span className={`ops-pill ops-pill--${lang.enabled ? 'live' : 'planned'}`}>
                {lang.enabled ? 'Enabled' : 'Disabled'}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}

export function AdminTaxesPage() {
  return (
    <SimpleListPage
      kicker="Tax & fees"
      title="Tax configuration"
      subtitle="Country and city tax rules with effective dates — no retroactive edits to confirmed bookings."
      load={async () => ({ rows: ((await api.adminTaxes()).rules as Row[]) || [] })}
      render={(row) => (
        <>
          <div>
            <strong>{String(row.name)}</strong>
            <p className="muted small">
              {String(row.country)}
              {row.city ? ` · ${String(row.city)}` : ''} · {Math.round(Number(row.rate || 0) * 100)}%
            </p>
          </div>
          <span className="ops-pill ops-pill--live">{String(row.status)}</span>
        </>
      )}
    />
  )
}

export function AdminLoyaltyPage() {
  const [config, setConfig] = useState<Row | null>(null)
  const [liabilities, setLiabilities] = useState(0)
  const [message, setMessage] = useState<string | null>(null)
  async function load() {
    const data = await api.adminLoyalty()
    setConfig((data.config as Row) || {})
    setLiabilities(Number(data.liabilities || 0))
  }
  useEffect(() => {
    void load()
  }, [])
  if (!config) return <div className="ops-page"><p className="muted">Loading loyalty…</p></div>
  return (
    <div className="ops-page">
      <PageHeader
        kicker="Loyalty"
        title="Loyalty & referrals"
        subtitle="Earning rules, tiers, and outstanding point liabilities."
      />
      <Toast message={message} />
      <section className="ops-metrics">
        <article>
          <p>Point liability</p>
          <strong>{liabilities.toLocaleString()}</strong>
        </article>
        <article>
          <p>Welcome bonus</p>
          <strong>{Number(config.welcomeBonus || 0)}</strong>
        </article>
        <article>
          <p>Points / dollar</p>
          <strong>{Number(config.pointsPerDollar || 0)}</strong>
        </article>
      </section>
      <form
        className="ops-panel"
        onSubmit={(e: FormEvent) => {
          e.preventDefault()
          void api
            .updateAdminLoyalty({
              welcomeBonus: Number(config.welcomeBonus || 0),
              pointsPerDollar: Number(config.pointsPerDollar || 0),
              redemptionValue: Number(config.redemptionValue || 0),
            })
            .then(() => {
              setMessage('Loyalty settings saved')
              return load()
            })
        }}
      >
        <label>
          Welcome bonus
          <input
            value={String(config.welcomeBonus || 0)}
            onChange={(e) => setConfig({ ...config, welcomeBonus: Number(e.target.value) })}
          />
        </label>
        <label>
          Points per dollar
          <input
            value={String(config.pointsPerDollar || 0)}
            onChange={(e) => setConfig({ ...config, pointsPerDollar: Number(e.target.value) })}
          />
        </label>
        <button className="btn btn--gold" type="submit">
          Save loyalty rules
        </button>
      </form>
    </div>
  )
}

export function AdminReportsPage() {
  const [summary, setSummary] = useState<Row | null>(null)
  useEffect(() => {
    void api.adminReportsSummary().then((d) => setSummary(d as Row))
  }, [])
  if (!summary) return <div className="ops-page"><p className="muted">Loading reports…</p></div>
  const cards = [
    ['Bookings', summary.bookings],
    ['Revenue', money(Number(summary.revenue || 0))],
    ['Commission', money(Number(summary.commission || 0))],
    ['Refunds', money(Number(summary.refunds || 0))],
    ['Payouts', money(Number(summary.payouts || 0))],
    ['Failed payments', summary.paymentsFailed],
    ['Open support', summary.supportOpen],
    ['Open fraud flags', summary.fraudOpen],
  ]
  return (
    <div className="ops-page">
      <PageHeader
        kicker="Analytics"
        title="Reports"
        subtitle="Executive exports across bookings, finance, support, and risk."
      />
      <section className="ops-metrics">
        {cards.map(([label, value]) => (
          <article key={String(label)}>
            <p>{label}</p>
            <strong>{value as ReactNode}</strong>
          </article>
        ))}
      </section>
      <p className="muted small">Generated {String(summary.generatedAt || '').replace('T', ' ').slice(0, 19)}</p>
    </div>
  )
}

export function AdminRolesPage() {
  return (
    <SimpleListPage
      kicker="Access control"
      title="Administrator roles"
      subtitle="Granular permissions, finance restrictions, and maker-checker approval rights."
      load={async () => ({ rows: ((await api.adminRoles()).roles as Row[]) || [] })}
      render={(row) => (
        <>
          <div>
            <strong>{String(row.name)}</strong>
            <p className="muted small">
              {(row.permissions as string[] | undefined)?.join(', ')}
              {row.financeAccess ? ' · finance' : ''}
              {row.approvalRights ? ' · approvals' : ''}
            </p>
          </div>
        </>
      )}
    />
  )
}

export function AdminAuditPage() {
  const [rows, setRows] = useState<Row[]>([])
  const [q, setQ] = useState('')
  async function load(query = q) {
    const data = await api.adminAudit(query)
    setRows(data.audit as Row[])
  }
  useEffect(() => {
    void load()
  }, [])
  return (
    <div className="ops-page">
      <PageHeader
        kicker="Compliance"
        title="Audit log"
        subtitle="Immutable record of sensitive admin actions with actor, entity, and metadata."
      />
      <div className="ops-toolbar">
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search audit trail…" />
        <button type="button" className="btn btn--ghost" onClick={() => void load(q)}>
          Search
        </button>
      </div>
      <div className="ops-panel">
        <ul className="ops-list ops-list--plain">
          {rows.map((row) => (
            <li key={String(row.id)}>
              <div>
                <strong>
                  {String(row.action)} · {String(row.entity)}
                </strong>
                <p className="muted small">
                  {String(row.entityId || '')} · {String(row.actorId || '')} ·{' '}
                  {String(row.createdAt || '').replace('T', ' ').slice(0, 19)}
                </p>
              </div>
            </li>
          ))}
          {rows.length === 0 && <p className="muted">No audit events.</p>}
        </ul>
      </div>
    </div>
  )
}
