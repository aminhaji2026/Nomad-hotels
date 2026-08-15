import { Link } from 'react-router-dom'
import { useStays } from '../hooks/useStays'
import { AppShell } from '../components/AppShell'
import { MapPreview } from '../components/MapPreview'

export function MapPage() {
  const { stays } = useStays()
  const focus = stays.filter((stay) =>
    ['Hargeisa', 'Mogadishu', 'Dubai'].includes(stay.city),
  )

  return (
    <AppShell>
      <header className="results-header">
        <div className="results-header__row">
          <div className="results-header__title">
            <strong>Map</strong>
            <span>Browse stays by neighborhood</span>
          </div>
          <Link to="/results?city=Hargeisa&view=list" className="gold-link">
            List
          </Link>
        </div>
      </header>
      <main className="page-pad">
        <MapPreview stays={focus.length ? focus : stays} city="Hargeisa" expanded />
        <p className="muted" style={{ marginTop: '1rem' }}>
          Includes Damal Hotel Hargeisa and Holiday Hotel Mogadishu. Map pins are approximate for this MVP.
        </p>
      </main>
    </AppShell>
  )
}
