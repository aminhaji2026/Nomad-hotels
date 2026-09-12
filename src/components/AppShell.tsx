import { Link } from 'react-router-dom'
import { BottomNav } from './BottomNav'

type AppShellProps = {
  children: React.ReactNode
  hideNav?: boolean
  flush?: boolean
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

export function AppShell({ children, hideNav = false, flush = false }: AppShellProps) {
  return (
    <div
      className={`app-shell ${hideNav ? 'app-shell--bare' : ''} ${flush ? 'app-shell--flush' : ''}`}
    >
      <div className="app-frame">{children}</div>
      {!hideNav && <BottomNav />}
    </div>
  )
}
