import { NavLink } from 'react-router-dom'

const items = [
  { to: '/', label: 'Explore', icon: 'compass', end: true },
  { to: '/map', label: 'Map', icon: 'map' },
  { to: '/trips', label: 'Trips', icon: 'trips' },
  { to: '/saved', label: 'Saved', icon: 'heart' },
  { to: '/profile', label: 'Profile', icon: 'profile' },
] as const

function Icon({ name }: { name: (typeof items)[number]['icon'] }) {
  if (name === 'compass') {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" strokeWidth="1.7" />
        <path d="M14.5 9.5 10 14l4.5-1.2L16 9.5z" fill="currentColor" />
      </svg>
    )
  }
  if (name === 'map') {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path
          d="M9 4 3 6.5V20l6-2.5L15 20l6-2.5V4L15 6.5 9 4z"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.7"
        />
      </svg>
    )
  }
  if (name === 'trips') {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <rect x="5" y="8" width="14" height="11" rx="2" fill="none" stroke="currentColor" strokeWidth="1.7" />
        <path d="M9 8V6.5A2.5 2.5 0 0 1 11.5 4h1A2.5 2.5 0 0 1 15 6.5V8" fill="none" stroke="currentColor" strokeWidth="1.7" />
      </svg>
    )
  }
  if (name === 'heart') {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path
          d="M12 20s-7-4.4-7-9.2A3.8 3.8 0 0 1 12 8a3.8 3.8 0 0 1 7 2.8C19 15.6 12 20 12 20z"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.7"
        />
      </svg>
    )
  }
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="12" cy="8" r="3.2" fill="none" stroke="currentColor" strokeWidth="1.7" />
      <path d="M5 19c1.5-3.2 4-4.8 7-4.8s5.5 1.6 7 4.8" fill="none" stroke="currentColor" strokeWidth="1.7" />
    </svg>
  )
}

export function BottomNav() {
  return (
    <nav className="bottom-nav lux-nav" aria-label="Primary">
      {items.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          end={'end' in item ? item.end : false}
          className={({ isActive }) => `bottom-nav__item${isActive ? ' is-active' : ''}`}
        >
          <span className="bottom-nav__icon">
            <Icon name={item.icon} />
          </span>
          <span>{item.label}</span>
        </NavLink>
      ))}
    </nav>
  )
}
