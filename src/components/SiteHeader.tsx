import { NavLink } from 'react-router-dom'

type SiteHeaderProps = {
  tone?: 'light' | 'dark'
}

export function SiteHeader({ tone = 'dark' }: SiteHeaderProps) {
  return (
    <header className={`site-header site-header--${tone}`}>
      <NavLink to="/" className="brand" aria-label="Nomad Hotels home">
        <span className="brand-mark" aria-hidden="true" />
        <span className="brand-word">Nomad</span>
      </NavLink>
      <nav className="site-nav" aria-label="Primary">
        <NavLink to="/explore">Explore</NavLink>
        <NavLink to="/explore?wifi=300">Fast Wi‑Fi</NavLink>
        <a href="#how" className="nav-muted">
          How it works
        </a>
      </nav>
      <NavLink to="/explore" className="btn btn--small btn--solid">
        Find a stay
      </NavLink>
    </header>
  )
}
