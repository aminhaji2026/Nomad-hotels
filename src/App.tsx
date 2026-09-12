import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AdminShell } from './components/AdminShell'
import { RequireAuth } from './components/RequireAuth'
import { AuthProvider } from './context/AuthContext'
import { SavedProvider } from './context/SavedContext'
import { UserProvider } from './context/UserContext'
import {
  AdminBookingsPage,
  AdminDashboardPage,
  AdminDuffelPage,
  AdminHotelsPage,
  AdminPaymentsPage,
  AdminSettingsPage,
  AdminUsersPage,
} from './pages/admin/AdminPages'
import { BookingPage } from './pages/BookingPage'
import { CustomerLoginPage } from './pages/CustomerLoginPage'
import { ExplorePage } from './pages/ExplorePage'
import { HostPage } from './pages/HostPage'
import {
  HotelBookingsPage,
  HotelCalendarPage,
  HotelDashboardPage,
  HotelMessagesPage,
  HotelPropertyPage,
  HotelRoomsPage,
} from './pages/hotel/HotelAdminPages'
import { MapPage } from './pages/MapPage'
import { ProfilePage } from './pages/ProfilePage'
import { ResultsPage } from './pages/ResultsPage'
import { SavedPage } from './pages/SavedPage'
import { StaffLoginPage } from './pages/StaffLoginPage'
import { StayDetailPage } from './pages/StayDetailPage'
import { TripsPage } from './pages/TripsPage'

export default function App() {
  return (
    <AuthProvider>
      <UserProvider>
        <SavedProvider>
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<ExplorePage />} />
              <Route path="/results" element={<ResultsPage />} />
              <Route path="/stay/:id" element={<StayDetailPage />} />
              <Route path="/book/:id" element={<BookingPage />} />
              <Route path="/trips" element={<TripsPage />} />
              <Route path="/saved" element={<SavedPage />} />
              <Route path="/profile" element={<ProfilePage />} />
              <Route path="/host" element={<HostPage />} />
              <Route path="/map" element={<MapPage />} />
              <Route path="/login" element={<CustomerLoginPage />} />
              <Route path="/staff/login" element={<StaffLoginPage />} />
              <Route path="/explore" element={<Navigate to="/" replace />} />

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

              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </BrowserRouter>
        </SavedProvider>
      </UserProvider>
    </AuthProvider>
  )
}
