'use client'

import React from 'react'
import { Icon } from '@/components/ui/Icons'

interface ConfirmationModalProps {
  isOpen: boolean
  title: string
  message: string
  confirmLabel?: string
  cancelLabel?: string
  variant?: 'danger' | 'warning' | 'info'
  onConfirm: () => void
  onCancel: () => void
}

export function ConfirmationModal({
  isOpen,
  title,
  message,
  confirmLabel = 'Konfirmasi',
  cancelLabel = 'Batal',
  variant = 'danger',
  onConfirm,
  onCancel,
}: ConfirmationModalProps) {
  if (!isOpen) return null

  const variantStyles = {
    danger: {
      iconBg: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
      btnBg: 'bg-rose-600 hover:bg-rose-500 text-white',
      iconName: 'alertTriangle' as const,
    },
    warning: {
      iconBg: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
      btnBg: 'bg-amber-600 hover:bg-amber-500 text-white',
      iconName: 'alertCircle' as const,
    },
    info: {
      iconBg: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
      btnBg: 'bg-cyan-600 hover:bg-cyan-500 text-white',
      iconName: 'info' as const,
    },
  }[variant]

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl space-y-4">
        <div className="flex items-start gap-4">
          <div className={`p-3 rounded-xl border ${variantStyles.iconBg}`}>
            <Icon name={variantStyles.iconName} className="w-6 h-6" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-slate-100">{title}</h3>
            <p className="text-sm text-slate-400 mt-1 leading-relaxed">{message}</p>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 text-sm font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-xl transition-colors"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className={`px-4 py-2 text-sm font-medium rounded-xl transition-colors ${variantStyles.btnBg}`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
