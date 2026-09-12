import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { BrandLockup } from './AppShell'

type AdminShellProps = {
  variant: 'hotel' | 'platform'
}

const hotelLinks = [
  { to: '/hotel-admin', end: true, label: 'Overview' },
  { to: '/hotel-admin/bookings', label: 'Bookings' },
  { to: '/hotel-admin/rooms', label: 'Rooms & rates' },
  { to: '/hotel-admin/calendar', label: 'Calendar' },
  { to: '/hotel-admin/property', label: 'Property' },
  { to: '/hotel-admin/messages', label: 'Messages' },
]

const platformLinks = [
  { to: '/admin', end: true, label: 'Overview' },
  { to: '/admin/hotels', label: 'Hotels' },
  { to: '/admin/users', label: 'Users' },
  { to: '/admin/bookings', label: 'Bookings' },
  { to: '/admin/payments', label: 'Payments' },
  { to: '/admin/duffel', label: 'Duffel Stay' },
  { to: '/admin/settings', label: 'Settings' },
]

export function AdminShell({ variant }: AdminShellProps) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const links = variant === 'hotel' ? hotelLinks : platformLinks

  return (
    <div className="app-shell app-shell--bare">
      <div className="app-frame ops-frame">
        <header className="top-bar ops-top">
          <div className="ops-top__brand">
            <BrandLockup compact />
            <span className="ops-top__badge">
              {variant === 'hotel' ? 'Hotel suite' : 'Platform'}
            </span>
          </div>
          <button
            type="button"
            className="btn btn--ghost"
            onClick={() => {
              logout()
              navigate('/staff/login')
            }}
          >
            Sign out
          </button>
        </header>

        <nav className="ops-tabs" aria-label={variant === 'hotel' ? 'Hotel admin' : 'Platform admin'}>
          {links.map((link) => (
            <NavLink key={link.to} to={link.to} end={'end' in link ? link.end : false}>
              {link.label}
            </NavLink>
          ))}
        </nav>

        <div className="ops-main">
          <p className="ops-user muted small">
            {user?.name} · {user?.email}
          </p>
          <Outlet />
        </div>
      </div>
    </div>
  )
}
