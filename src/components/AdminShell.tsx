import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

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
    <div className={`ops-shell ops-shell--${variant}`}>
      <aside className="ops-nav">
        <div className="ops-nav__brand">
          <span className="ops-nav__mark">N</span>
          <div>
            <strong>NomadStay</strong>
            <p>{variant === 'hotel' ? 'Hotel suite' : 'Platform control'}</p>
          </div>
        </div>
        <nav>
          {links.map((link) => (
            <NavLink key={link.to} to={link.to} end={'end' in link ? link.end : false}>
              {link.label}
            </NavLink>
          ))}
        </nav>
        <div className="ops-nav__foot">
          <p>{user?.name}</p>
          <p className="muted small">{user?.email}</p>
          <button
            type="button"
            className="btn btn--ghost btn--block"
            onClick={() => {
              logout()
              navigate('/staff/login')
            }}
          >
            Sign out
          </button>
        </div>
      </aside>
      <div className="ops-main">
        <Outlet />
      </div>
    </div>
  )
}
