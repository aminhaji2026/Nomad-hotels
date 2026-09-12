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

const platformGroups = [
  {
    label: 'Command',
    links: [
      { to: '/admin', end: true, label: 'Executive' },
      { to: '/admin/modules', label: 'Module map' },
      { to: '/admin/reports', label: 'Reports' },
    ],
  },
  {
    label: 'Network',
    links: [
      { to: '/admin/hotels', label: 'Hotels' },
      { to: '/admin/onboarding', label: 'Onboarding' },
      { to: '/admin/users', label: 'Staff' },
      { to: '/admin/customers', label: 'Customers' },
    ],
  },
  {
    label: 'Commerce',
    links: [
      { to: '/admin/bookings', label: 'Reservations' },
      { to: '/admin/payments', label: 'Payments' },
      { to: '/admin/inventory', label: 'Inventory' },
      { to: '/admin/rates', label: 'Rates' },
      { to: '/admin/commissions', label: 'Commissions' },
      { to: '/admin/refunds', label: 'Refunds' },
      { to: '/admin/payouts', label: 'Payouts' },
      { to: '/admin/ledger', label: 'Ledger' },
    ],
  },
  {
    label: 'Growth',
    links: [
      { to: '/admin/promotions', label: 'Promotions' },
      { to: '/admin/ads', label: 'Ads' },
      { to: '/admin/reviews', label: 'Reviews' },
      { to: '/admin/loyalty', label: 'Loyalty' },
    ],
  },
  {
    label: 'Content',
    links: [
      { to: '/admin/cms', label: 'CMS' },
      { to: '/admin/destinations', label: 'Destinations' },
      { to: '/admin/taxonomy', label: 'Taxonomy' },
    ],
  },
  {
    label: 'Ops',
    links: [
      { to: '/admin/support', label: 'Support' },
      { to: '/admin/fraud', label: 'Fraud' },
      { to: '/admin/notifications', label: 'Notifications' },
    ],
  },
  {
    label: 'System',
    links: [
      { to: '/admin/languages', label: 'Languages' },
      { to: '/admin/taxes', label: 'Taxes' },
      { to: '/admin/roles', label: 'Roles' },
      { to: '/admin/audit', label: 'Audit' },
      { to: '/admin/duffel', label: 'Duffel Stay' },
      { to: '/admin/settings', label: 'Settings' },
    ],
  },
]

export function AdminShell({ variant }: AdminShellProps) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  return (
    <div className="app-shell app-shell--bare">
      <div className="app-frame ops-frame">
        <header className="top-bar ops-top">
          <div className="ops-top__brand">
            <BrandLockup compact />
            <span className="ops-top__badge">
              {variant === 'hotel' ? 'Hotel suite' : 'Platform control'}
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

        {variant === 'hotel' ? (
          <nav className="ops-tabs" aria-label="Hotel admin">
            {hotelLinks.map((link) => (
              <NavLink key={link.to} to={link.to} end={'end' in link ? link.end : false}>
                {link.label}
              </NavLink>
            ))}
          </nav>
        ) : (
          <nav className="ops-nav" aria-label="Platform admin">
            {platformGroups.map((group) => (
              <div key={group.label} className="ops-nav__group">
                <p className="ops-nav__label">{group.label}</p>
                <div className="ops-nav__links">
                  {group.links.map((link) => (
                    <NavLink key={link.to} to={link.to} end={'end' in link ? link.end : false}>
                      {link.label}
                    </NavLink>
                  ))}
                </div>
              </div>
            ))}
          </nav>
        )}

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
