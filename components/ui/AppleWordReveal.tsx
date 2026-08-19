'use client'

import React from 'react'

interface AppleWordRevealProps {
  text: string
  className?: string
  wordClassName?: string
  variant?: 'white' | 'cyan' | 'violet'
}

export function AppleWordReveal({
  text,
  className = '',
  wordClassName = '',
  variant = 'white',
}: AppleWordRevealProps) {
  if (!text) return null
  const words = text.split(' ')

  return (
    <span className={`inline-flex flex-wrap items-center gap-x-[0.28em] gap-y-[0.05em] ${className}`}>
      {words.map((word, idx) => (
        <span
          key={idx}
          data-variant={variant}
          className={`word-reveal-token inline-block select-none opacity-35 filter blur-[0.8px] font-normal transition-none ${wordClassName}`}
          style={{
            color: 'rgba(255, 255, 255, 0.35)',
            fontWeight: 400,
            willChange: 'opacity, filter, color, transform, text-shadow, font-weight',
            transform: 'translate3d(0, 1px, 0)',
          }}
        >
          {word}
        </span>
      ))}
    </span>
  )
}
