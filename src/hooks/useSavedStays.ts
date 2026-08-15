import { useCallback, useEffect, useState } from 'react'

const KEY = 'nomadstay-saved'

function readSaved(): string[] {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as unknown
    return Array.isArray(parsed) ? parsed.filter((id) => typeof id === 'string') : []
  } catch {
    return []
  }
}

export function useSavedStays() {
  const [savedIds, setSavedIds] = useState<string[]>(() =>
    typeof window === 'undefined' ? [] : readSaved(),
  )

  useEffect(() => {
    localStorage.setItem(KEY, JSON.stringify(savedIds))
  }, [savedIds])

  const isSaved = useCallback((id: string) => savedIds.includes(id), [savedIds])

  const toggleSaved = useCallback((id: string) => {
    setSavedIds((current) =>
      current.includes(id) ? current.filter((item) => item !== id) : [...current, id],
    )
  }, [])

  return { savedIds, isSaved, toggleSaved }
}
