'use client'

import React from 'react'

interface WordRevealProps {
  text: string
  className?: string
  wordClassName?: string
  baseDelay?: number
  stagger?: number
}

export function WordReveal({
  text,
  className = '',
  wordClassName = '',
  baseDelay = 0.1,
  stagger = 0.045,
}: WordRevealProps) {
  if (!text) return null
  const words = text.split(' ')

  return (
    <span className={`inline-flex flex-wrap items-center justify-center gap-x-[0.25em] gap-y-[0.08em] ${className}`}>
      {words.map((word, idx) => {
        const delay = baseDelay + idx * stagger
        return (
          <span key={idx} className="inline-block overflow-hidden py-0.5">
            <span
              className={`inline-block animate-word-fade-in ${wordClassName}`}
              style={{ animationDelay: `${delay}s` }}
            >
              {word}
            </span>
          </span>
        )
      })}
    </span>
  )
}
