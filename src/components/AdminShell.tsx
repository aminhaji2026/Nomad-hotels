import { useEffect, useRef, useState } from 'react'
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { BrandLockup } from './AppShell'

type LinkItem = { to: string; label: string; end?: boolean }

type Group = { id: string; label: string; links: LinkItem[] }

const hotelLinks: LinkItem[] = [
  { to: '/hotel-admin', end: true, label: 'Overview' },
  { to: '/hotel-admin/bookings', label: 'Bookings' },
  { to: '/hotel-admin/rooms', label: 'Rooms & rates' },
  { to: '/hotel-admin/calendar', label: 'Calendar' },
  { to: '/hotel-admin/property', label: 'Property' },
  { to: '/hotel-admin/messages', label: 'Messages' },
]

const platformGroups: Group[] = [
  {
    id: 'command',
    label: 'Command',
    links: [
      { to: '/admin', end: true, label: 'Executive' },
      { to: '/admin/modules', label: 'Module map' },
      { to: '/admin/reports', label: 'Reports' },
    ],
  },
  {
    id: 'network',
    label: 'Network',
    links: [
      { to: '/admin/hotels', label: 'Hotels' },
      { to: '/admin/onboarding', label: 'Hotel registration' },
      { to: '/admin/users', label: 'Staff' },
      { to: '/admin/customers', label: 'Customers' },
    ],
  },
  {
    id: 'commerce',
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
    id: 'growth',
    label: 'Growth',
    links: [
      { to: '/admin/promotions', label: 'Promotions' },
      { to: '/admin/ads', label: 'Ads' },
      { to: '/admin/reviews', label: 'Reviews' },
      { to: '/admin/loyalty', label: 'Loyalty' },
    ],
  },
  {
    id: 'content',
    label: 'Content',
    links: [
      { to: '/admin/cms', label: 'CMS' },
      { to: '/admin/destinations', label: 'Destinations' },
      { to: '/admin/taxonomy', label: 'Taxonomy' },
    ],
  },
  {
    id: 'ops',
    label: 'Ops',
    links: [
      { to: '/admin/support', label: 'Support' },
      { to: '/admin/fraud', label: 'Fraud' },
      { to: '/admin/notifications', label: 'Notifications' },
    ],
  },
  {
    id: 'system',
    label: 'System',
    links: [
      { to: '/admin/languages', label: 'Languages' },
      { to: '/admin/taxes', label: 'Taxes' },
      { to: '/admin/roles', label: 'Roles' },
      { to: '/admin/audit', label: 'Audit' },
      { to: '/admin/duffel', label: 'Duffel Stay' },
      { to: '/admin/settings', label: 'Integrations & settings' },
    ],
  },
]

function NavDropdown({ group, open, onToggle }: { group: Group; open: boolean; onToggle: () => void }) {
  const location = useLocation()
  const active = group.links.some((link) =>
    link.end ? location.pathname === link.to : location.pathname === link.to || location.pathname.startsWith(`${link.to}/`),
  )
  const panelRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    function onDoc(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        onToggle()
      }
    }
    document.addEventListener('mousedown', onDoc)
    return () => document.removeEventListener('mousedown', onDoc)
  }, [open, onToggle])

  return (
    <div className={`ops-dd ${open ? 'is-open' : ''} ${active ? 'is-active' : ''}`} ref={panelRef}>
      <button
        type="button"
        className="ops-dd__btn"
        aria-expanded={open}
        aria-haspopup="menu"
        onClick={onToggle}
      >
        <span>{group.label}</span>
        <span className="ops-dd__chev" aria-hidden>
          ▾
        </span>
      </button>
      {open && (
        <div className="ops-dd__menu" role="menu">
          {group.links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end={Boolean(link.end)}
              role="menuitem"
              onClick={() => {
                if (open) onToggle()
              }}
            >
              {link.label}
            </NavLink>
          ))}
        </div>
      )}
    </div>
  )
}

export function AdminShell({ variant }: { variant: 'hotel' | 'platform' }) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [openId, setOpenId] = useState<string | null>(null)

  useEffect(() => {
    setOpenId(null)
  }, [location.pathname])

  return (
    <div className="app-shell app-shell--bare">
      <div className="app-frame ops-frame">
        <header className="top-bar ops-top">
          <div className="ops-top__brand">
            <BrandLockup compact />
            <span className="ops-top__badge">{variant === 'hotel' ? 'Hotel suite' : 'Platform control'}</span>
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
              <NavLink key={link.to} to={link.to} end={Boolean(link.end)}>
                {link.label}
              </NavLink>
            ))}
          </nav>
        ) : (
          <nav className="ops-nav ops-nav--dropdowns" aria-label="Platform admin">
            {platformGroups.map((group) => (
              <NavDropdown
                key={group.id}
                group={group}
                open={openId === group.id}
                onToggle={() => setOpenId((cur) => (cur === group.id ? null : group.id))}
              />
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
