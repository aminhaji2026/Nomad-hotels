import { Link } from 'react-router-dom'
import { BottomNav } from './BottomNav'

type AppShellProps = {
  children: React.ReactNode
  hideNav?: boolean
}

export function BrandLockup({ compact = false }: { compact?: boolean }) {
  return (
    <Link to="/" className={`brand ${compact ? 'brand--compact' : ''}`}>
      <span className="brand__mark" aria-hidden="true">
        N
      </span>
      <span className="brand__word">NomadStay</span>
    </Link>
  )
}

export function AppShell({ children, hideNav = false }: AppShellProps) {
  return (
    <div className={`app-shell ${hideNav ? 'app-shell--bare' : ''}`}>
      <div className="app-frame">{children}</div>
      {!hideNav && <BottomNav />}
    </div>
  )
}
