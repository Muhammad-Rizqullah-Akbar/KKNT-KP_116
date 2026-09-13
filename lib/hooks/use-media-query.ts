'use client'

import { useEffect, useState } from 'react'

/**
 * useMediaQuery — lacak apakah viewport cocok dengan query CSS (SSR-safe).
 * Dipakai untuk responsive layout tanpa duplikasi window.innerWidth.
 */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false)

  useEffect(() => {
    const mql = window.matchMedia(query)
    setMatches(mql.matches)
    const handler = (e: MediaQueryListEvent) => setMatches(e.matches)
    mql.addEventListener('change', handler)
    return () => mql.removeEventListener('change', handler)
  }, [query])

  return matches
}
