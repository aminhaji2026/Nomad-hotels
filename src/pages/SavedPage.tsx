import { Link } from 'react-router-dom'
import { stays } from '../data/catalog'
import { useSaved } from '../context/SavedContext'
import { AppShell, BrandLockup } from '../components/AppShell'
import { StayCard } from '../components/StayCard'

export function SavedPage() {
  const { savedIds, isSaved, toggleSaved } = useSaved()
  const saved = stays.filter((stay) => savedIds.includes(stay.id))

  return (
    <AppShell>
      <header className="top-bar">
        <BrandLockup />
      </header>
      <main className="page-pad">
        <h1>Saved</h1>
        <p className="muted">Stays you want to revisit.</p>
        {saved.length === 0 ? (
          <div className="empty-card">
            <p>No saved stays yet.</p>
            <Link to="/" className="btn btn--gold">
              Explore stays
            </Link>
          </div>
        ) : (
          <div className="stack">
            {saved.map((stay) => (
              <StayCard
                key={stay.id}
                stay={stay}
                saved={isSaved(stay.id)}
                onToggleSave={toggleSaved}
              />
            ))}
          </div>
        )}
      </main>
    </AppShell>
  )
}
