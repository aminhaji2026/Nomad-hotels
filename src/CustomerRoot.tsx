import { BrowserRouter } from 'react-router-dom'
import { CustomerApp } from './CustomerApp'
import { AuthProvider } from './context/AuthContext'
import { SavedProvider } from './context/SavedContext'
import { UserProvider } from './context/UserContext'

export default function CustomerRoot() {
  return (
    <AuthProvider>
      <UserProvider>
        <SavedProvider>
          <BrowserRouter>
            <CustomerApp />
          </BrowserRouter>
        </SavedProvider>
      </UserProvider>
    </AuthProvider>
  )
}
