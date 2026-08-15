import { createContext, useContext, type ReactNode } from 'react'
import { useSavedStays } from '../hooks/useSavedStays'

type SavedContextValue = ReturnType<typeof useSavedStays>

const SavedContext = createContext<SavedContextValue | null>(null)

export function SavedProvider({ children }: { children: ReactNode }) {
  const value = useSavedStays()
  return <SavedContext.Provider value={value}>{children}</SavedContext.Provider>
}

export function useSaved() {
  const ctx = useContext(SavedContext)
  if (!ctx) {
    throw new Error('useSaved must be used within SavedProvider')
  }
  return ctx
}
