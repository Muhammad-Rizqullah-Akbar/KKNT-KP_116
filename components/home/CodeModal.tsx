// components/home/CodeModal.tsx
'use client'

import { useState, useEffect, useRef } from 'react'
import Image from 'next/image'
import { Icon } from '@/components/ui/Icons'

interface CodeModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (code: string) => void
  isLoading?: boolean
  error?: string | null
}

export function CodeModal({ isOpen, onClose, onSubmit, isLoading = false, error }: CodeModalProps) {
  const [codeInput, setCodeInput] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)
  
  const LOGO_SRC = '/logo.png'

  // Auto focus input saat modal terbuka
  useEffect(() => {
    if (isOpen) {
      setCodeInput('')
      setTimeout(() => inputRef.current?.focus(), 150)
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [isOpen])

  // Handle submit form
  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    const code = codeInput.trim().toUpperCase()
    if (code && !isLoading) {
      onSubmit(code)
    }
  }

  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 overflow-y-auto animate-fadeIn"
      style={{ backgroundColor: 'rgba(3, 3, 10, 0.85)', backdropFilter: 'blur(16px)' }}
      onClick={onClose}
    >
      {/* Container Utama dengan Glow Effect */}
      <div
        className="relative w-full max-w-md bg-[#0a0a16]/90 border border-white/10 rounded-3xl p-6 sm:p-8 shadow-[0_0_50px_rgba(6,182,212,0.15)] overflow-hidden transition-all duration-300 animate-slideUp"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Neon Ambient Background Orbs */}
        <div className="absolute -top-20 -left-20 w-48 h-48 bg-cyan-500/20 rounded-full blur-[80px] pointer-events-none animate-pulse-slow" />
        <div className="absolute -bottom-20 -right-20 w-48 h-48 bg-violet-500/20 rounded-full blur-[80px] pointer-events-none animate-pulse-slow" style={{ animationDelay: '2s' }} />
        
        {/* Border Accent Line */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-[2px] bg-gradient-to-r from-transparent via-cyan-400 to-transparent shadow-[0_0_12px_#06b6d4]" />

        {/* Close Button */}
        <button
          onClick={onClose}
          disabled={isLoading}
          className="absolute top-4 right-4 w-9 h-9 rounded-full bg-white/[0.04] hover:bg-white/10 border border-white/[0.08] flex items-center justify-center transition-all group disabled:opacity-30 cursor-pointer z-20"
          aria-label="Tutup Modal"
        >
          <Icon name="x" className="w-4 h-4 text-white/50 group-hover:text-white transition-colors" />
        </button>

        {/* Modal Body */}
        <div className="relative z-10 flex flex-col items-center text-center">
          
          {/* ============ LOGO UTAMA DI TENGAH ATAS ============ */}
          <div className="relative mb-6">
            <div className="w-20 h-20 rounded-3xl bg-gradient-to-tr from-cyan-500/20 via-teal-500/20 to-violet-500/20 border border-cyan-400/30 flex items-center justify-center shadow-lg shadow-cyan-500/20 group hover:scale-105 transition-transform duration-300 p-1">
              <div className="w-full h-full rounded-2xl bg-[#080814] flex items-center justify-center border border-white/10 overflow-hidden p-2">
                <Image
                  src={LOGO_SRC}
                  alt="Logo KKNT-KP UH"
                  width={48}
                  height={48}
                  className="w-full h-full object-contain p-1 group-hover:scale-110 transition-transform duration-300"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none'
                  }}
                />
              </div>
            </div>
            
            {/* Live Indicator Dot */}
            <div className="absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-3 w-3 bg-cyan-400 border-2 border-[#0a0a16]" />
            </div>
          </div>

          {/* Title & Subtitle */}
          <h2 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-white mb-2">
            MASUKKAN <span className="bg-gradient-to-r from-cyan-400 via-teal-300 to-violet-400 bg-clip-text text-transparent">KODE</span>
          </h2>
          <p className="text-white/50 text-xs sm:text-sm max-w-xs mb-6 font-light leading-relaxed">
            Ketik kode akses khusus kuesioner Anda untuk memulai sesi pengisian
          </p>

          {/* Form Input PIN */}
          <form onSubmit={handleSubmit} className="w-full space-y-4">
            <div className="relative">
              <input
                ref={inputRef}
                type="text"
                value={codeInput}
                onChange={(e) => setCodeInput(e.target.value.toUpperCase())}
                maxLength={10}
                placeholder="PIN / KODE"
                disabled={isLoading}
                className={`w-full text-center bg-white/[0.03] border rounded-2xl px-4 py-4 text-2xl sm:text-3xl font-mono font-bold tracking-[0.25em] text-white placeholder-white/15 focus:outline-none transition-all shadow-inner ${
                  error
                    ? 'border-rose-500/60 ring-2 ring-rose-500/20 bg-rose-500/5 text-rose-300 animate-shake'
                    : 'border-white/10 focus:border-cyan-400/60 focus:ring-4 focus:ring-cyan-400/10 focus:bg-cyan-500/5'
                }`}
              />

              {/* Character Counter Indicator */}
              {codeInput && (
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-mono text-cyan-400/60 bg-cyan-500/10 px-2 py-1 rounded-md border border-cyan-500/20">
                  {codeInput.length} Char
                </span>
              )}
            </div>

            {/* Error Message Display */}
            {error && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-center justify-center gap-2 animate-slideUp">
                <Icon name="alertCircle" className="w-4 h-4 shrink-0 text-rose-400" />
                <span>{error}</span>
              </div>
            )}

            {/* Submit Button Game-Style */}
            <button
              type="submit"
              disabled={isLoading || !codeInput.trim()}
              className="w-full group relative inline-flex items-center justify-center gap-3 py-4 px-6 rounded-2xl font-bold text-sm text-white bg-gradient-to-r from-cyan-500 via-teal-500 to-cyan-500 hover:from-cyan-400 hover:via-teal-400 hover:to-cyan-400 shadow-[0_0_25px_rgba(6,182,212,0.3)] hover:shadow-[0_0_35px_rgba(6,182,212,0.5)] transition-all duration-300 disabled:opacity-40 disabled:cursor-not-allowed disabled:shadow-none cursor-pointer overflow-hidden active:scale-98"
            >
              {/* Button Shimmer */}
              <span className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/25 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-in-out" />
              
              <span className="relative z-10 flex items-center gap-2 font-display uppercase tracking-wider">
                {isLoading ? (
                  <>
                    <Icon name="loader" className="w-5 h-5 animate-spin text-white" />
                    <span>Memvalidasi...</span>
                  </>
                ) : (
                  <>
                    <span>Mulai Kuesioner</span>
                    <Icon name="arrowRight" className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-300" />
                  </>
                )}
              </span>
            </button>
          </form>

          {/* ESC Hint Footer */}
          <div className="mt-6 flex items-center gap-1.5 text-[10px] text-white/25">
            <kbd className="px-1.5 py-0.5 rounded bg-white/5 border border-white/10 text-white/40 font-mono text-[9px]">ESC</kbd>
            <span>atau klik di luar untuk menutup</span>
          </div>

        </div>
      </div>
    </div>
  )
}