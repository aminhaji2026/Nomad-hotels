import { Link } from 'react-router-dom'
import { BottomNav } from './BottomNav'

type AppShellProps = {
  children: React.ReactNode
  hideNav?: boolean
  flush?: boolean
  /** Pinned above the scrolling frame (e.g. Explore category rail). */
  topBar?: React.ReactNode
}

export function BrandLockup({
  compact = false,
  onDark = false,
}: {
  compact?: boolean
  onDark?: boolean
}) {
  return (
    <Link
      to="/"
      className={`brand${compact ? ' brand--compact' : ''}${onDark ? ' brand--on-dark' : ''}`}
    >
      <span className="brand__mark" aria-hidden="true">
        N
      </span>
      <span className="brand__word">NomadStay</span>
    </Link>
  )
}

export function AppShell({ children, hideNav = false, flush = false, topBar }: AppShellProps) {
  return (
    <div
      className={`app-shell${hideNav ? ' app-shell--bare' : ''}${flush ? ' app-shell--flush' : ''}${topBar ? ' app-shell--with-top' : ''}${flush && topBar ? ' app-shell--overlay-top' : ''}`}
    >
      {topBar ? <div className="app-shell__top">{topBar}</div> : null}
      <div className="app-frame">{children}</div>
      {!hideNav && <BottomNav />}
    </div>
  )
}
