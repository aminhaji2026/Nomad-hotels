import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { api } from '../api'

const USER_KEY = 'nomadstay-user-id'
const EMAIL_KEY = 'nomadstay-email'
const NAME_KEY = 'nomadstay-name'

export type LoyaltyUser = {
  id: string
  name: string
  email: string
  points: number
  referralCode: string
  referredBy?: string | null
  createdAt?: string
}

type UserContextValue = {
  user: LoyaltyUser | null
  loading: boolean
  ledger: Array<{ id: string; points: number; reason: string; createdAt: string; meta?: Record<string, unknown> }>
  ensureSession: (input?: { email?: string; name?: string }) => Promise<LoyaltyUser>
  refresh: () => Promise<void>
  redeemReferral: (code: string) => Promise<{ awarded: { referrer: number; referee: number } }>
  setIdentity: (email: string, name: string) => void
}

const UserContext = createContext<UserContextValue | null>(null)

export function UserProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<LoyaltyUser | null>(null)
  const [ledger, setLedger] = useState<UserContextValue['ledger']>([])
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(async () => {
    const id = localStorage.getItem(USER_KEY)
    if (!id) {
      setLoading(false)
      return
    }
    try {
      const data = await api.getUser(id)
      setUser(data.user)
      setLedger(data.ledger || [])
      localStorage.setItem(EMAIL_KEY, data.user.email)
      localStorage.setItem(NAME_KEY, data.user.name)
    } catch {
      localStorage.removeItem(USER_KEY)
      setUser(null)
      setLedger([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void refresh()
  }, [refresh])

  const ensureSession = useCallback(
    async (input?: { email?: string; name?: string }) => {
      const email =
        input?.email ||
        localStorage.getItem(EMAIL_KEY) ||
        'aminhajihussein@gmail.com'
      const name = input?.name || localStorage.getItem(NAME_KEY) || 'Amin Hussein'
      const data = await api.session({ email, name })
      localStorage.setItem(USER_KEY, data.user.id)
      localStorage.setItem(EMAIL_KEY, data.user.email)
      localStorage.setItem(NAME_KEY, data.user.name)
      setUser(data.user)
      await refresh()
      return data.user as LoyaltyUser
    },
    [refresh],
  )

  const redeemReferral = useCallback(
    async (code: string) => {
      const current = user || (await ensureSession())
      const data = await api.redeemReferral({ userId: current.id, code })
      setUser(data.user)
      await refresh()
      return data
    },
    [ensureSession, refresh, user],
  )

  const setIdentity = useCallback((email: string, name: string) => {
    localStorage.setItem(EMAIL_KEY, email)
    localStorage.setItem(NAME_KEY, name)
  }, [])

  const value = useMemo(
    () => ({ user, loading, ledger, ensureSession, refresh, redeemReferral, setIdentity }),
    [user, loading, ledger, ensureSession, refresh, redeemReferral, setIdentity],
  )

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>
}

export function useUser() {
  const ctx = useContext(UserContext)
  if (!ctx) throw new Error('useUser must be used within UserProvider')
  return ctx
}
