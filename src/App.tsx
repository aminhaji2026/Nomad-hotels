import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { ExplorePage } from './pages/ExplorePage'
import { HomePage } from './pages/HomePage'
import { StayPage } from './pages/StayPage'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/explore" element={<ExplorePage />} />
        <Route path="/stay/:id" element={<StayPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
