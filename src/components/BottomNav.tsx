import { NavLink } from 'react-router-dom'
import { navIcons } from './LuxIcons'

const items = [
  { to: '/', label: 'Explore', icon: 'compass', end: true },
  { to: '/map', label: 'Map', icon: 'map' },
  { to: '/trips', label: 'Trips', icon: 'trips' },
  { to: '/saved', label: 'Saved', icon: 'heart' },
  { to: '/profile', label: 'Profile', icon: 'profile' },
] as const

export function BottomNav() {
  return (
    <nav className="bottom-nav lux-nav" aria-label="Primary">
      {items.map((item) => {
        const Icon = navIcons[item.icon]
        return (
          <NavLink
            key={item.to}
            to={item.to}
            end={'end' in item ? item.end : false}
            className={({ isActive }) => `bottom-nav__item${isActive ? ' is-active' : ''}`}
          >
            <span className="bottom-nav__icon lux-icon">
              <Icon />
            </span>
            <span>{item.label}</span>
          </NavLink>
        )
      })}
    </nav>
  )
}
