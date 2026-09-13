'use client'

import { useCallback, useRef, useState } from 'react'
import { TOAST_DURATION_MS } from '@/lib/constants'

/**
 * useToast — success/error notification terpusat.
 * Mengganti pola manual `useState(showSuccess) + useState(successMessage) + setTimeout`
 * yang terduplikasi di banyak komponen (DRY).
 */
export function useToast(defaultDuration = TOAST_DURATION_MS) {
  const [visible, setVisible] = useState(false)
  const [message, setMessage] = useState('')
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const show = useCallback(
    (msg: string, duration = defaultDuration) => {
      setMessage(msg)
      setVisible(true)
      if (timerRef.current) clearTimeout(timerRef.current)
      timerRef.current = setTimeout(() => setVisible(false), duration)
    },
    [defaultDuration],
  )

  const hide = useCallback(() => {
    setVisible(false)
    if (timerRef.current) clearTimeout(timerRef.current)
  }, [])

  return { visible, message, show, hide }
}
