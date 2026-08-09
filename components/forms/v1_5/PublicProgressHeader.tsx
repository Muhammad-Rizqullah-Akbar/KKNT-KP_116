'use client'

import React from 'react'
import { Icon } from '@/components/ui/Icons'

interface PublicProgressHeaderProps {
  code: string
  title: string
  activeAspectTitle?: string
  currentQuestionIndex: number
  totalQuestions: number
  versionNumber: number
  onToggleNavigator?: () => void
  isNavigatorOpen?: boolean
}

export function PublicProgressHeader({
  code,
  title,
  activeAspectTitle,
  currentQuestionIndex,
  totalQuestions,
  versionNumber,
  onToggleNavigator,
  isNavigatorOpen,
}: PublicProgressHeaderProps) {
  const percentage = totalQuestions > 0 ? Math.round(((currentQuestionIndex + 1) / totalQuestions) * 100) : 0

  return (
    <header className="sticky top-0 z-30 bg-slate-900/95 border-b border-slate-800 backdrop-blur-md px-4 sm:px-6 py-3 font-sans shadow-md">
      <div className="max-w-7xl mx-auto flex flex-col gap-2">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <span className="font-mono text-cyan-400 font-extrabold text-xs px-2.5 py-1 rounded-lg bg-cyan-950 border border-cyan-500/40 shadow-sm flex-shrink-0">
              {code}
            </span>
            <div className="min-w-0">
              <h1 className="text-xs sm:text-sm font-bold text-slate-100 truncate">{title}</h1>
              {activeAspectTitle && (
                <p className="text-[11px] text-cyan-300 font-medium truncate hidden sm:block">
                  {activeAspectTitle}
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3 flex-shrink-0">
            <span className="hidden md:inline-flex items-center gap-1 text-[11px] text-slate-400 font-mono bg-slate-950 px-2.5 py-1 rounded-lg border border-slate-800">
              <kbd className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 font-mono text-[10px]">←</kbd>
              <kbd className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 font-mono text-[10px]">→</kbd> Navigasi
            </span>

            <span className="text-xs font-mono font-bold text-slate-300 bg-slate-950 px-2.5 py-1 rounded-lg border border-slate-800">
              {String(currentQuestionIndex + 1).padStart(2, '0')} / {String(totalQuestions).padStart(2, '0')}
            </span>

            <span className="text-[10px] font-mono text-slate-500 hidden sm:inline">v{versionNumber}</span>

            {onToggleNavigator && (
              <button
                type="button"
                onClick={onToggleNavigator}
                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 md:hidden transition-colors"
                title="Daftar Soal"
              >
                <Icon name={isNavigatorOpen ? 'x' : 'menu'} className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Dynamic Progress Bar */}
        <div className="w-full h-1.5 bg-slate-950 rounded-full overflow-hidden border border-slate-800/80">
          <div
            className="h-full bg-gradient-to-r from-cyan-500 via-teal-400 to-emerald-400 rounded-full transition-all duration-300 ease-out shadow-sm"
            style={{ width: `${percentage}%` }}
          />
        </div>
      </div>
    </header>
  )
}
