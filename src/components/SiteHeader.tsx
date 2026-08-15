import { NavLink } from 'react-router-dom'

type SiteHeaderProps = {
  tone?: 'light' | 'dark'
}

export function SiteHeader({ tone = 'dark' }: SiteHeaderProps) {
  return (
    <header className={`site-header site-header--${tone}`}>
      <NavLink to="/" className="brand" aria-label="Nomad Hotels home">
        <svg className="brand-mark" viewBox="0 0 24 24" aria-hidden="true">
          <path d="M12 3 L22 21 H2 Z" fill="none" stroke="currentColor" strokeWidth="2.4" />
        </svg>
        <span className="brand-word">Nomad</span>
      </NavLink>
      <nav className="site-nav" aria-label="Primary">
        <NavLink to="/explore">Explore</NavLink>
        <NavLink to="/explore?wifi=300">Fast Wi‑Fi</NavLink>
        <NavLink to="/#how" className="nav-muted">
          How it works
        </NavLink>
      </nav>
      <NavLink to="/explore" className="btn btn--small btn--solid">
        Find a stay
      </NavLink>
    </header>
  )
}
