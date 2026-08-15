import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { BookingPage } from './pages/BookingPage'
import { ExplorePage } from './pages/ExplorePage'
import { HostPage } from './pages/HostPage'
import { MapPage } from './pages/MapPage'
import { ProfilePage } from './pages/ProfilePage'
import { ResultsPage } from './pages/ResultsPage'
import { SavedPage } from './pages/SavedPage'
import { StayDetailPage } from './pages/StayDetailPage'
import { TripsPage } from './pages/TripsPage'
import { SavedProvider } from './context/SavedContext'
import { UserProvider } from './context/UserContext'

export default function App() {
  return (
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
            <Route path="/explore" element={<Navigate to="/" replace />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </SavedProvider>
    </UserProvider>
  )
}
