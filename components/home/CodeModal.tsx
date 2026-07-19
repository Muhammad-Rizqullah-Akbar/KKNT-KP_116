'use client'

import { useState } from 'react'
import { Icon } from '@/components/ui/Icons'

interface CodeModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (code: string) => void
  isLoading?: boolean
}

export function CodeModal({ isOpen, onClose, onSubmit, isLoading = false }: CodeModalProps) {
  const [codeInput, setCodeInput] = useState('')

  if (!isOpen) return null

  const handleSubmit = () => {
    const code = codeInput.trim().toUpperCase()
    if (code) {
      onSubmit(code)
    }
  }

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(0,0,0,0.8)' }}
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-md bg-[#0e0e1a] border border-white/[0.08] rounded-3xl shadow-2xl p-8 sm:p-10 text-center animate-bounceIn"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          disabled={isLoading}
          className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/[0.05] hover:bg-white/10 flex items-center justify-center transition-colors disabled:opacity-30"
        >
          <Icon name="x" className="w-4 h-4 text-white/50" />
        </button>

        <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-cyan-500/20 to-violet-500/20 border border-cyan-400/20 flex items-center justify-center">
          <Icon name="key" className="w-10 h-10 text-cyan-400" />
        </div>

        <h2 className="font-display text-2xl font-bold mb-2">Kode Akses Formulir</h2>
        <p className="text-white/45 text-sm mb-6 leading-relaxed">
          Masukkan kode akses yang telah diberikan oleh administrator atau koordinator program.
        </p>

        <div className="space-y-4">
          <div className="relative">
            <Icon name="search" className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/25" />
            <input
              type="text"
              value={codeInput}
              onChange={(e) => setCodeInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
              maxLength={8}
              placeholder="Contoh: KEAM-05"
              disabled={isLoading}
              className="w-full text-center bg-white/[0.03] border border-white/[0.08] rounded-xl px-4 py-3.5 text-lg font-mono uppercase tracking-widest text-white placeholder-white/20 focus:outline-none focus:border-cyan-400/50 focus:ring-2 focus:ring-cyan-400/10 transition-all disabled:opacity-50"
            />
          </div>
          <button
            onClick={handleSubmit}
            disabled={isLoading}
            className="w-full bg-gradient-to-r from-cyan-600 to-teal-600 hover:from-cyan-500 hover:to-teal-500 text-white py-3.5 rounded-xl font-semibold text-sm transition-all shadow-lg shadow-cyan-600/25 disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <Icon name="loader" className="w-4 h-4 animate-spin" />
            ) : (
              <Icon name="arrowRight" className="w-4 h-4" />
            )}
            {isLoading ? 'Memeriksa...' : 'Buka Formulir'}
          </button>
        </div>

        <p className="text-xs text-white/25 mt-4 text-center">
          Kode demo: <span className="text-cyan-400 font-mono">KKN-2026</span>,{' '}
          <span className="text-violet-400 font-mono">KEAM-05</span>,{' '}
          <span className="text-rose-400 font-mono">EVAL-01</span>
        </p>
        <p className="text-xs text-white/20 mt-1 text-center">Klik di luar area ini untuk menutup</p>
      </div>
    </div>
  )
}