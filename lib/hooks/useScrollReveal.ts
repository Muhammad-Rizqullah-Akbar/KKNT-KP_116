'use client'

import { useEffect, useState, useRef, type RefObject } from 'react'

interface ScrollRevealOptions {
  /** Fraction of element visible before triggering (0–1). Default 0.15 */
  threshold?: number
  /** CSS rootMargin string. Default '0px 0px -60px 0px' (trigger slightly before fully visible) */
  rootMargin?: string
  /** If true, observer disconnects after first reveal. Default true */
  triggerOnce?: boolean
}

/**
 * Observes an element and returns `isVisible` when it enters the viewport.
 * Lightweight — no external animation library required.
 */
export function useScrollReveal<T extends HTMLElement = HTMLDivElement>(
  ref: RefObject<T | null>,
  options: ScrollRevealOptions = {}
) {
  const { threshold = 0.15, rootMargin = '0px 0px -60px 0px', triggerOnce = true } = options
  const [isVisible, setIsVisible] = useState(false)
  const hasTriggered = useRef(false)

  useEffect(() => {
    const node = ref.current
    if (!node) return

    // Skip if already triggered and triggerOnce is true
    if (triggerOnce && hasTriggered.current) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true)
          hasTriggered.current = true
          if (triggerOnce) {
            observer.disconnect()
          }
        } else if (!triggerOnce) {
          setIsVisible(false)
        }
      },
      { threshold, rootMargin }
    )

    observer.observe(node)

    return () => observer.disconnect()
  }, [ref, threshold, rootMargin, triggerOnce])

  return { isVisible }
}
