'use client'

import { useEffect, useState } from 'react'

/**
 * useDebounce — tunda update nilai sampai user berhenti mengetik.
 * Wajib untuk input pencarian yang memicu API call, agar tidak spam request.
 */
export function useDebounce<T>(value: T, delayMs = 500): T {
  const [debounced, setDebounced] = useState(value)

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delayMs)
    return () => clearTimeout(timer)
  }, [value, delayMs])

  return debounced
}
