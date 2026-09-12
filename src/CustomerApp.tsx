import { Navigate, Route, Routes } from 'react-router-dom'
import { PageTransition } from './components/PageTransition'
import { BookingPage } from './pages/BookingPage'
import { CustomerLoginPage } from './pages/CustomerLoginPage'
import { ExplorePage } from './pages/ExplorePage'
import { MapPage } from './pages/MapPage'
import { ProfilePage } from './pages/ProfilePage'
import { ResultsPage } from './pages/ResultsPage'
import { SavedPage } from './pages/SavedPage'
import { StayDetailPage } from './pages/StayDetailPage'
import { TripsPage } from './pages/TripsPage'

/** Guest-facing routes only — no staff login, host console, or admin suites. */
export function CustomerApp() {
  return (
    <PageTransition>
      <Routes>
        <Route path="/" element={<ExplorePage />} />
        <Route path="/results" element={<ResultsPage />} />
        <Route path="/stay/:id" element={<StayDetailPage />} />
        <Route path="/book/:id" element={<BookingPage />} />
        <Route path="/trips" element={<TripsPage />} />
        <Route path="/saved" element={<SavedPage />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/map" element={<MapPage />} />
        <Route path="/login" element={<CustomerLoginPage />} />
        <Route path="/explore" element={<Navigate to="/" replace />} />
        {/* Legacy staff URLs must not open ops UI on the customer host */}
        <Route path="/staff/login" element={<Navigate to="/login" replace />} />
        <Route path="/staff/*" element={<Navigate to="/" replace />} />
        <Route path="/host" element={<Navigate to="/" replace />} />
        <Route path="/host/*" element={<Navigate to="/" replace />} />
        <Route path="/hotel-admin/*" element={<Navigate to="/" replace />} />
        <Route path="/admin/*" element={<Navigate to="/" replace />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </PageTransition>
  )
}
