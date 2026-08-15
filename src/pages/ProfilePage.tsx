import { AppShell, BrandLockup } from '../components/AppShell'

export function ProfilePage() {
  return (
    <AppShell>
      <header className="top-bar">
        <BrandLockup />
      </header>
      <main className="page-pad">
        <h1>Profile</h1>
        <p className="muted">Premium member · 24/7 concierge</p>
        <section className="profile-card">
          <div className="avatar">A</div>
          <div>
            <strong>Amin</strong>
            <p className="muted small">aminhajihussein@gmail.com</p>
          </div>
        </section>
        <ul className="settings-list">
          <li>Payment methods</li>
          <li>Travel preferences</li>
          <li>Notifications</li>
          <li>Trusted & Secure</li>
          <li>Contact concierge</li>
        </ul>
        <p className="value-props">
          Global Destinations · Handpicked Stays · Trusted & Secure · 24/7 Concierge
        </p>
      </main>
    </AppShell>
  )
}
