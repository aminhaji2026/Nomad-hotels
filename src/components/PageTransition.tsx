import { useLocation } from 'react-router-dom'

/** Remounts on route change to play a silk entrance. */
export function PageTransition({ children }: { children: React.ReactNode }) {
  const location = useLocation()
  return (
    <div key={location.pathname} className="page-transition">
      {children}
    </div>
  )
}
