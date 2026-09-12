import { Navigate, Route, Routes } from 'react-router-dom'
import { AdminShell } from './components/AdminShell'
import { PageTransition } from './components/PageTransition'
import { RequireAuth } from './components/RequireAuth'
import {
  AdminBookingsPage,
  AdminDashboardPage,
  AdminDuffelPage,
  AdminHotelsPage,
  AdminPaymentsPage,
  AdminSettingsPage,
  AdminUsersPage,
} from './pages/admin/AdminPages'
import { HostPage } from './pages/HostPage'
import {
  HotelBookingsPage,
  HotelCalendarPage,
  HotelDashboardPage,
  HotelMessagesPage,
  HotelPropertyPage,
  HotelRoomsPage,
} from './pages/hotel/HotelAdminPages'
import { StaffLoginPage } from './pages/StaffLoginPage'

/** Hotel + platform ops console — separate host from the guest app. */
export function OpsApp() {
  return (
    <PageTransition>
      <Routes>
        <Route path="/" element={<Navigate to="/staff/login" replace />} />
        <Route path="/login" element={<Navigate to="/staff/login" replace />} />
        <Route path="/staff/login" element={<StaffLoginPage />} />
        <Route
          path="/host"
          element={
            <RequireAuth roles={['hotel_admin', 'admin']}>
              <HostPage />
            </RequireAuth>
          }
        />

        <Route
          path="/hotel-admin"
          element={
            <RequireAuth roles={['hotel_admin', 'admin']}>
              <AdminShell variant="hotel" />
            </RequireAuth>
          }
        >
          <Route index element={<HotelDashboardPage />} />
          <Route path="bookings" element={<HotelBookingsPage />} />
          <Route path="rooms" element={<HotelRoomsPage />} />
          <Route path="calendar" element={<HotelCalendarPage />} />
          <Route path="property" element={<HotelPropertyPage />} />
          <Route path="messages" element={<HotelMessagesPage />} />
        </Route>

        <Route
          path="/admin"
          element={
            <RequireAuth roles={['admin']}>
              <AdminShell variant="platform" />
            </RequireAuth>
          }
        >
          <Route index element={<AdminDashboardPage />} />
          <Route path="hotels" element={<AdminHotelsPage />} />
          <Route path="users" element={<AdminUsersPage />} />
          <Route path="bookings" element={<AdminBookingsPage />} />
          <Route path="payments" element={<AdminPaymentsPage />} />
          <Route path="duffel" element={<AdminDuffelPage />} />
          <Route path="settings" element={<AdminSettingsPage />} />
        </Route>

        <Route path="*" element={<Navigate to="/staff/login" replace />} />
      </Routes>
    </PageTransition>
  )
}
