import { BrowserRouter } from 'react-router-dom'
import { OpsApp } from './OpsApp'
import { AuthProvider } from './context/AuthContext'

/** Ops console — no guest saved/loyalty providers. */
export default function OpsRoot() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <OpsApp />
      </BrowserRouter>
    </AuthProvider>
  )
}
