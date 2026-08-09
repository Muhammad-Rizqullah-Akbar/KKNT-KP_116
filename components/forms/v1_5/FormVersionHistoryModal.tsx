'use client'

import React, { useEffect, useState } from 'react'
import type { FormVersionSnapshotDoc } from '@/lib/firebase/repositories/v1_5/v1_5Forms.repo'
import { Icon } from '@/components/ui/Icons'

interface FormVersionHistoryModalProps {
  isOpen: boolean
  formId: string
  activeVersionId?: string
  onClose: () => void
  onSelectVersion?: (version: FormVersionSnapshotDoc) => void
}

export function FormVersionHistoryModal({
  isOpen,
  formId,
  activeVersionId,
  onClose,
  onSelectVersion,
}: FormVersionHistoryModalProps) {
  const [versions, setVersions] = useState<FormVersionSnapshotDoc[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!isOpen || !formId) return

    async function loadVersions() {
      setIsLoading(true)
      setError(null)
      try {
        const res = await fetch(`/api/v1_5/forms/${formId}/versions`)
        const data = await res.json()
        if (data.success && Array.isArray(data.versions)) {
          setVersions(data.versions)
        } else {
          setError(data.message || 'Gagal memuat riwayat versi.')
        }
      } catch (err: any) {
        setError(err.message || 'Gagal terhubung ke server.')
      } finally {
        setIsLoading(false)
      }
    }

    loadVersions()
  }, [isOpen, formId])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-2xl max-h-[85vh] bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="p-5 px-6 border-b border-slate-800 flex items-center justify-between bg-slate-950/70">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
              <Icon name="history" className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-100">Riwayat Versi Formulir</h3>
              <p className="text-xs text-slate-400 font-mono">Form ID: {formId}</p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-xl bg-slate-800 hover:bg-slate-700 transition-colors"
          >
            <Icon name="x" className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4 no-scrollbar">
          {isLoading ? (
            <div className="p-8 text-center text-xs text-slate-400 flex items-center justify-center gap-2">
              <Icon name="loader" className="w-5 h-5 animate-spin text-cyan-400" />
              <span>Memuat snapshot versi histori...</span>
            </div>
          ) : error ? (
            <div className="p-4 rounded-xl bg-rose-950/30 border border-rose-500/40 text-xs text-rose-300">
              {error}
            </div>
          ) : versions.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-400 border border-dashed border-slate-800 rounded-2xl space-y-1">
              <p className="font-semibold text-slate-300">Belum ada snapshot versi terpublikasi.</p>
              <p className="text-slate-500">Versi snapshot otomatis tersimpan saat formulir dipublikasikan.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {versions.map((ver) => {
                const isActive = ver.versionId === activeVersionId

                return (
                  <div
                    key={ver.versionId}
                    className={`p-4 rounded-2xl border transition-all ${
                      isActive
                        ? 'bg-cyan-950/30 border-cyan-500/60 ring-1 ring-cyan-500/30'
                        : 'bg-slate-950 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-cyan-300 font-bold text-sm">
                            Versi {ver.versionNumber}
                          </span>
                          {isActive && (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                              AKTIF
                            </span>
                          )}
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700 uppercase">
                            {ver.status}
                          </span>
                        </div>
                        <p className="text-xs text-slate-400 truncate max-w-sm">
                          {ver.metadata.title}
                        </p>
                      </div>

                      {onSelectVersion && (
                        <button
                          type="button"
                          onClick={() => onSelectVersion(ver)}
                          className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-colors"
                        >
                          Lihat Snapshot
                        </button>
                      )}
                    </div>

                    <div className="mt-3 pt-3 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400 font-mono">
                      <div className="flex items-center gap-3">
                        <span>{ver.aspects.length} Aspek</span>
                        <span>•</span>
                        <span>{ver.questions.length} Soal</span>
                      </div>
                      <span>Publikasi: {ver.publishedAt ? new Date(ver.publishedAt).toLocaleDateString('id-ID') : '-'}</span>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
