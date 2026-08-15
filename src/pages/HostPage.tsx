import { useEffect, useState, type FormEvent } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { api, type ApiStay } from '../api'
import { AppShell } from '../components/AppShell'

export function HostPage() {
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const preset = params.get('stay') || 'damal-hotel-hargeisa'
  const [stays, setStays] = useState<ApiStay[]>([])
  const [stayId, setStayId] = useState(preset)
  const [mode, setMode] = useState<'update' | 'create'>('update')
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const [name, setName] = useState('Damal Hotel Hargeisa')
  const [city, setCity] = useState('Hargeisa')
  const [country, setCountry] = useState('Somaliland')
  const [neighborhood, setNeighborhood] = useState('Road 1 · Dahabshiil Business Centre')
  const [summary, setSummary] = useState('')
  const [nightlyFrom, setNightlyFrom] = useState('85')
  const [phone, setPhone] = useState('+252 65 339 9000')
  const [email, setEmail] = useState('')
  const [website, setWebsite] = useState('https://damalhotel.com')
  const [amenities, setAmenities] = useState('Breakfast Included, Wi-Fi, Parking, Free Cancellation')
  const [highlights, setHighlights] = useState('24h Front Desk, Restaurant, Airport Shuttle, AC, Wi-Fi')
  const [files, setFiles] = useState<FileList | null>(null)

  useEffect(() => {
    void api.listStays().then((data) => {
      setStays(data.stays)
      const selected = data.stays.find((s) => s.id === preset) || data.stays[0]
      if (selected) applyStay(selected)
    })
  }, [preset])

  function applyStay(stay: ApiStay) {
    setStayId(stay.id)
    setName(stay.name)
    setCity(stay.city)
    setCountry(stay.country)
    setNeighborhood(stay.neighborhood)
    setSummary(stay.summary)
    setNightlyFrom(String(stay.nightlyFrom))
    setPhone(stay.contact?.phone || '')
    setEmail(stay.contact?.email || '')
    setWebsite(stay.contact?.website || '')
    setAmenities((stay.amenities || []).join(', '))
    setHighlights((stay.highlights || []).join(', '))
    setMode('update')
  }

  function loadTemplate(kind: 'damal' | 'holiday') {
    if (kind === 'damal') {
      setMode('create')
      setStayId('damal-hotel-hargeisa')
      setName('Damal Hotel Hargeisa')
      setCity('Hargeisa')
      setCountry('Somaliland')
      setNeighborhood('Road 1 · Dahabshiil Business Centre')
      setNightlyFrom('85')
      setPhone('+252 65 339 9000')
      setWebsite('https://damalhotel.com')
      setEmail('')
      setAmenities('Breakfast Included, Wi-Fi, Parking, Free Cancellation')
      setHighlights('24h Front Desk, Restaurant, Airport Shuttle, AC, Wi-Fi')
      setSummary(
        'Modern 4-star hospitality in Hargeisa with Deluxe to VIP rooms, complimentary breakfast, free Wi‑Fi, and 24-hour front desk.',
      )
    } else {
      setMode('create')
      setStayId('holiday-hotel-mogadishu')
      setName('Holiday Hotel Mogadishu')
      setCity('Mogadishu')
      setCountry('Somalia')
      setNeighborhood('KM4 · near Sahal terminal')
      setNightlyFrom('95')
      setPhone('+252 61 3885999')
      setEmail('info@holidayhotel.so')
      setWebsite('')
      setAmenities('Wi-Fi, Parking, Breakfast Included, Free Cancellation')
      setHighlights('Secure Compound, Restaurant, 24h Desk, AC, Transfers')
      setSummary(
        'City hotel in Mogadishu’s KM4 area with secure rooms, on-site dining, Wi‑Fi, and concierge support for transfers.',
      )
    }
  }

  async function onSubmit(event: FormEvent) {
    event.preventDefault()
    setBusy(true)
    setError(null)
    setMessage(null)
    try {
      const form = new FormData()
      form.set('name', name)
      form.set('city', city)
      form.set('country', country)
      form.set('neighborhood', neighborhood)
      form.set('summary', summary)
      form.set('nightlyFrom', nightlyFrom)
      form.set('phone', phone)
      form.set('email', email)
      form.set('website', website)
      form.set('amenities', amenities)
      form.set('highlights', highlights)
      form.set('type', 'hotel')
      form.set('typeLabel', 'Hotel')
      form.set('featured', 'true')
      form.set('setPrimary', 'true')
      if (mode === 'create') form.set('id', stayId)
      if (files) {
        Array.from(files).forEach((file) => form.append('images', file))
      }

      const data =
        mode === 'create' ? await api.createStay(form) : await api.updateStay(stayId, form)

      setMessage(
        mode === 'create'
          ? `Created ${data.stay.name}`
          : `Updated ${data.stay.name}${files?.length ? ` · uploaded ${files.length} image(s)` : ''}`,
      )
      const list = await api.listStays()
      setStays(list.stays)
      applyStay(data.stay)
      setFiles(null)
    } catch (err) {
      // If create fails because it exists, update instead
      if (mode === 'create' && err instanceof Error && err.message.includes('already exists')) {
        try {
          const form = new FormData()
          form.set('name', name)
          form.set('city', city)
          form.set('country', country)
          form.set('neighborhood', neighborhood)
          form.set('summary', summary)
          form.set('nightlyFrom', nightlyFrom)
          form.set('phone', phone)
          form.set('email', email)
          form.set('website', website)
          form.set('amenities', amenities)
          form.set('highlights', highlights)
          form.set('setPrimary', 'true')
          if (files) Array.from(files).forEach((file) => form.append('images', file))
          const data = await api.updateStay(stayId, form)
          setMessage(`Updated existing ${data.stay.name}`)
          applyStay(data.stay)
        } catch (inner) {
          setError(inner instanceof Error ? inner.message : 'Update failed')
        }
      } else {
        setError(err instanceof Error ? err.message : 'Save failed')
      }
    } finally {
      setBusy(false)
    }
  }

  const selected = stays.find((s) => s.id === stayId)

  return (
    <AppShell hideNav>
      <header className="results-header">
        <div className="results-header__row">
          <button type="button" className="icon-btn" aria-label="Back" onClick={() => navigate(-1)}>
            ←
          </button>
          <div className="results-header__title">
            <strong>Host console</strong>
            <span>Upload images & hotel info</span>
          </div>
          <Link to="/profile" className="gold-link">
            Profile
          </Link>
        </div>
      </header>

      <main className="page-pad">
        <div className="btn-row" style={{ marginBottom: '1rem' }}>
          <button type="button" className="btn btn--ghost" onClick={() => loadTemplate('damal')}>
            Damal template
          </button>
          <button type="button" className="btn btn--ghost" onClick={() => loadTemplate('holiday')}>
            Holiday template
          </button>
        </div>

        <form className="booking-form" onSubmit={onSubmit}>
          <label>
            Mode
            <select
              value={mode}
              onChange={(e) => setMode(e.target.value as 'update' | 'create')}
            >
              <option value="update">Update existing stay</option>
              <option value="create">Create new stay</option>
            </select>
          </label>

          {mode === 'update' && (
            <label>
              Select stay
              <select
                value={stayId}
                onChange={(e) => {
                  const next = stays.find((s) => s.id === e.target.value)
                  if (next) applyStay(next)
                }}
              >
                {stays.map((stay) => (
                  <option key={stay.id} value={stay.id}>
                    {stay.name} · {stay.city}
                  </option>
                ))}
              </select>
            </label>
          )}

          {mode === 'create' && (
            <label>
              Stay id
              <input value={stayId} onChange={(e) => setStayId(e.target.value)} required />
            </label>
          )}

          <label>
            Hotel name
            <input value={name} onChange={(e) => setName(e.target.value)} required />
          </label>
          <label>
            City
            <input value={city} onChange={(e) => setCity(e.target.value)} required />
          </label>
          <label>
            Country
            <input value={country} onChange={(e) => setCountry(e.target.value)} required />
          </label>
          <label>
            Neighborhood / address
            <input value={neighborhood} onChange={(e) => setNeighborhood(e.target.value)} />
          </label>
          <label>
            Nightly from (USD)
            <input
              type="number"
              min="1"
              value={nightlyFrom}
              onChange={(e) => setNightlyFrom(e.target.value)}
              required
            />
          </label>
          <label>
            Summary
            <textarea value={summary} onChange={(e) => setSummary(e.target.value)} rows={4} required />
          </label>
          <label>
            Amenities (comma separated)
            <input value={amenities} onChange={(e) => setAmenities(e.target.value)} />
          </label>
          <label>
            Highlights (comma separated)
            <input value={highlights} onChange={(e) => setHighlights(e.target.value)} />
          </label>
          <label>
            Phone
            <input value={phone} onChange={(e) => setPhone(e.target.value)} />
          </label>
          <label>
            Email
            <input value={email} onChange={(e) => setEmail(e.target.value)} />
          </label>
          <label>
            Website
            <input value={website} onChange={(e) => setWebsite(e.target.value)} />
          </label>
          <label>
            Upload images
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={(e) => setFiles(e.target.files)}
            />
          </label>

          {selected?.gallery?.length ? (
            <div className="upload-preview">
              {selected.gallery.slice(0, 6).map((src) => (
                <img key={src} src={src} alt="" />
              ))}
            </div>
          ) : null}

          {message && <p className="success-text">{message}</p>}
          {error && <p className="error-text">{error}</p>}

          <button type="submit" className="btn btn--gold btn--block" disabled={busy}>
            {busy ? 'Saving…' : mode === 'create' ? 'Create stay' : 'Save images & info'}
          </button>
          {selected && (
            <Link className="gold-link" to={`/stay/${selected.id}`}>
              View public listing →
            </Link>
          )}
        </form>
      </main>
    </AppShell>
  )
}
