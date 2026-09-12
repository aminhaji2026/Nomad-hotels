import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { api, setAuthToken, type AuthUser } from '../api'

const TOKEN_KEY = 'nomadstay-token'
const USER_KEY = 'nomadstay-auth-user'

type AuthContextValue = {
  user: AuthUser | null
  token: string | null
  loading: boolean
  login: (input: {
    email: string
    password: string
    portal?: 'customer' | 'staff'
  }) => Promise<{ user: AuthUser; portal: string }>
  register: (input: {
    email: string
    password: string
    name?: string
    phone?: string
  }) => Promise<AuthUser>
  logout: () => void
  refresh: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

function persist(token: string | null, user: AuthUser | null) {
  if (token && user) {
    localStorage.setItem(TOKEN_KEY, token)
    localStorage.setItem(USER_KEY, JSON.stringify(user))
    setAuthToken(token)
  } else {
    localStorage.removeItem(TOKEN_KEY)
    localStorage.removeItem(USER_KEY)
    setAuthToken(null)
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(async () => {
    const stored = localStorage.getItem(TOKEN_KEY)
    if (!stored) {
      setUser(null)
      setToken(null)
      setAuthToken(null)
      setLoading(false)
      return
    }
    setAuthToken(stored)
    try {
      const data = await api.me()
      setUser(data.user)
      setToken(stored)
      persist(stored, data.user)
    } catch {
      persist(null, null)
      setUser(null)
      setToken(null)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void refresh()
  }, [refresh])

  const login = useCallback(
    async (input: { email: string; password: string; portal?: 'customer' | 'staff' }) => {
      const data = await api.login(input)
      persist(data.token, data.user)
      setToken(data.token)
      setUser(data.user)
      return { user: data.user, portal: data.portal }
    },
    [],
  )

  const register = useCallback(
    async (input: { email: string; password: string; name?: string; phone?: string }) => {
      const data = await api.register(input)
      persist(data.token, data.user)
      setToken(data.token)
      setUser(data.user)
      return data.user
    },
    [],
  )

  const logout = useCallback(() => {
    persist(null, null)
    setToken(null)
    setUser(null)
  }, [])

  const value = useMemo(
    () => ({ user, token, loading, login, register, logout, refresh }),
    [user, token, loading, login, register, logout, refresh],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
