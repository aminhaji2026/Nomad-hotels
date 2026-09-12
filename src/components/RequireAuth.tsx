import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export function RequireAuth({
  roles,
  children,
}: {
  roles?: Array<'customer' | 'hotel_admin' | 'admin' | string>
  children?: React.ReactNode
}) {
  const { user, loading } = useAuth()
  const location = useLocation()

  if (loading) {
    return (
      <div className="ops-page">
        <p className="muted">Checking session…</p>
      </div>
    )
  }

  if (!user) {
    const staff = location.pathname.startsWith('/admin') || location.pathname.startsWith('/hotel-admin')
    return <Navigate to={staff ? '/staff/login' : '/login'} replace state={{ from: location.pathname }} />
  }

  if (roles && !roles.includes(user.role)) {
    if (user.role === 'admin') return <Navigate to="/admin" replace />
    if (user.role === 'hotel_admin') return <Navigate to="/hotel-admin" replace />
    return <Navigate to="/" replace />
  }

  return children ? <>{children}</> : <Outlet />
}
