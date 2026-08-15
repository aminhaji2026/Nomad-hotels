import { Link } from 'react-router-dom'
import { stays } from '../data/catalog'
import { AppShell } from '../components/AppShell'
import { MapPreview } from '../components/MapPreview'

export function MapPage() {
  const dubaiStays = stays.filter((stay) => stay.city === 'Dubai')

  return (
    <AppShell>
      <header className="results-header">
        <div className="results-header__row">
          <div className="results-header__title">
            <strong>Map</strong>
            <span>Browse stays by neighborhood</span>
          </div>
          <Link to="/results?city=Dubai&view=list" className="gold-link">
            List
          </Link>
        </div>
      </header>
      <main className="page-pad">
        <MapPreview stays={dubaiStays} city="Dubai" expanded />
        <p className="muted" style={{ marginTop: '1rem' }}>
          Tap a gold price pin in search results for full stay details. Map pins are demo-positioned for this MVP.
        </p>
      </main>
    </AppShell>
  )
}
