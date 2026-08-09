'use client'

import React, { useEffect, useState, use } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Topbar } from '@/components/dashboard/Topbar'
import { Icon } from '@/components/ui/Icons'
import type { DistributionDoc } from '@/lib/forms/v1_5/distributionTypes'

interface PageProps {
  params: Promise<{ distributionId: string }>
}

export default function DistributionDetailPage({ params }: PageProps) {
  const { distributionId } = use(params)
  const router = useRouter()
  const [distribution, setDistribution] = useState<DistributionDoc | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [toastMessage, setToastMessage] = useState<string | null>(null)

  const showToast = (msg: string) => {
    setToastMessage(msg)
    setTimeout(() => setToastMessage(null), 3500)
  }

  const loadDistribution = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/v1_5/distributions/${distributionId}`)
      const data = await res.json()
      if (data.success && data.distribution) {
        setDistribution(data.distribution)
      } else {
        setError(data.message || 'Gagal memuat detail distribusi.')
      }
    } catch (err: any) {
      setError(err.message || 'Terjadi kesalahan jaringan.')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadDistribution()
  }, [distributionId])

  const handleTogglePause = async () => {
    if (!distribution) return
    try {
      const res = await fetch(`/api/v1_5/distributions/${distributionId}/pause`, {
        method: 'POST',
      })
      const data = await res.json()
      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Gagal mengubah status.')
      }
      showToast(data.message)
      loadDistribution()
    } catch (err: any) {
      showToast(`Error: ${err.message}`)
    }
  }

  const handleArchive = async () => {
    if (!confirm('Apakah Anda yakin ingin mengarsipkan kode distribusi ini?')) return
    try {
      const res = await fetch(`/api/v1_5/distributions/${distributionId}/archive`, {
        method: 'POST',
      })
      const data = await res.json()
      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Gagal mengarsipkan.')
      }
      showToast('Distribusi berhasil diarsipkan.')
      router.push('/dashboard/distributions')
    } catch (err: any) {
      showToast(`Error: ${err.message}`)
    }
  }

  const copyPublicLink = () => {
    if (!distribution) return
    const origin = typeof window !== 'undefined' ? window.location.origin : ''
    const url = `${origin}/form/${distribution.code}`
    navigator.clipboard.writeText(url)
    showToast(`Tautan publik "${url}" disalin ke clipboard!`)
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-slate-400 font-sans">
        <Icon name="loader" className="w-8 h-8 text-cyan-400 animate-spin mb-3" />
        <p className="text-sm font-semibold">Memuat detail distribusi...</p>
      </div>
    )
  }

  if (error || !distribution) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-slate-400 font-sans p-6">
        <div className="p-6 max-w-md w-full rounded-2xl bg-slate-900 border border-slate-800 text-center space-y-4 shadow-2xl">
          <div className="w-12 h-12 rounded-full bg-rose-500/10 text-rose-400 flex items-center justify-center mx-auto border border-rose-500/20">
            <Icon name="alertCircle" className="w-6 h-6" />
          </div>
          <h2 className="text-base font-bold text-slate-100">Gagal Memuat Detail</h2>
          <p className="text-xs text-slate-400">{error || 'Distribusi tidak ditemukan.'}</p>
          <Link
            href="/dashboard/distributions"
            className="inline-block px-4 py-2 rounded-xl bg-slate-800 text-slate-200 text-xs font-semibold"
          >
            Kembali ke Daftar Distribusi
          </Link>
        </div>
      </div>
    )
  }

  const origin = typeof window !== 'undefined' ? window.location.origin : ''
  const publicUrl = `${origin}/form/${distribution.code}`

  return (
    <div className="flex flex-col min-h-screen bg-slate-950 text-slate-100 font-sans">
      <Topbar
        title={`Detail Distribusi — ${distribution.code}`}
        subtitle="Atribusi pemilik, resolusi versi, dan status publikasi tautan respondent"
      />

      <div className="flex-1 p-4 sm:p-6 space-y-6 max-w-4xl mx-auto w-full">
        {/* Navigation back */}
        <Link
          href="/dashboard/distributions"
          className="inline-flex items-center gap-2 text-xs font-semibold text-cyan-400 hover:text-cyan-300 transition-colors"
        >
          <Icon name="arrowLeft" className="w-4 h-4" />
          <span>Kembali ke Daftar Distribusi</span>
        </Link>

        {/* Hero Card */}
        <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 space-y-6 shadow-xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
            <div className="space-y-1">
              <div className="flex items-center gap-3">
                <span className="font-mono text-cyan-300 font-extrabold text-xl px-3 py-1 rounded-xl bg-cyan-950 border border-cyan-500/40">
                  {distribution.code}
                </span>
                <span
                  className={`text-xs font-bold px-3 py-1 rounded-lg uppercase border ${
                    distribution.status === 'active'
                      ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'
                      : distribution.status === 'paused'
                      ? 'bg-amber-500/10 text-amber-300 border-amber-500/30'
                      : 'bg-rose-500/10 text-rose-300 border-rose-500/30'
                  }`}
                >
                  STATUS: {distribution.status}
                </span>
              </div>
              <h2 className="text-lg font-bold text-slate-100 pt-2">{distribution.title}</h2>
              <p className="text-xs text-slate-400">{distribution.description || 'Tidak ada deskripsi tambahan.'}</p>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={copyPublicLink}
                className="px-4 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold shadow-lg shadow-cyan-600/20 flex items-center gap-2"
              >
                <Icon name="copy" className="w-4 h-4" />
                <span>Salin Tautan</span>
              </button>

              <button
                type="button"
                onClick={handleTogglePause}
                className={`px-4 py-2.5 rounded-xl text-xs font-bold border flex items-center gap-2 ${
                  distribution.status === 'paused'
                    ? 'bg-emerald-950/40 text-emerald-200 border-emerald-500/40'
                    : 'bg-amber-950/40 text-amber-200 border-amber-500/40'
                }`}
              >
                <Icon name={distribution.status === 'paused' ? 'play' : 'pause'} className="w-4 h-4" />
                <span>{distribution.status === 'paused' ? 'Aktifkan' : 'Jeda'}</span>
              </button>
            </div>
          </div>

          {/* Public Link Box & QR Placeholder */}
          <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-300">
              <span className="flex items-center gap-1.5 text-cyan-400">
                <Icon name="link" className="w-4 h-4" />
                <span>Tautan Akses Responden Publik:</span>
              </span>
              <a
                href={publicUrl}
                target="_blank"
                rel="noreferrer"
                className="text-xs text-cyan-400 hover:underline flex items-center gap-1"
              >
                <span>Uji Coba Tautan</span>
                <Icon name="externalLink" className="w-3.5 h-3.5" />
              </a>
            </div>

            <div className="p-3 rounded-xl bg-slate-900 border border-slate-800/80 text-xs font-mono text-cyan-300 break-all select-all">
              {publicUrl}
            </div>
          </div>

          {/* Metadata Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
              <h3 className="font-semibold text-slate-200 flex items-center gap-2">
                <Icon name="fileText" className="w-4 h-4 text-cyan-400" />
                <span>Informasi Formulir Baseline</span>
              </h3>
              <div className="space-y-1 text-slate-400 font-mono">
                <div>Form ID: <strong className="text-slate-200">{distribution.formId}</strong></div>
                <div>Mode Resolusi Versi: <strong className="text-cyan-300">{distribution.versionMode}</strong></div>
                {distribution.versionMode === 'pinned' && (
                  <div>Pinned Snapshot: <strong className="text-purple-300">{distribution.pinnedVersionId}</strong></div>
                )}
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
              <h3 className="font-semibold text-slate-200 flex items-center gap-2">
                <Icon name="user" className="w-4 h-4 text-cyan-400" />
                <span>Atribusikan Pemilik (Owner Attribution)</span>
              </h3>
              <div className="space-y-1 text-slate-400 font-mono">
                <div>Tipe Pemilik: <strong className="text-purple-300 uppercase">{distribution.ownerType}</strong></div>
                <div>Nama Pemilik: <strong className="text-slate-200">{distribution.ownerName}</strong></div>
                <div>Owner User ID: <span className="text-slate-500 text-[10px]">{distribution.ownerId}</span></div>
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
            <span className="text-xs text-slate-500 font-mono">
              Dibuat pada: {new Date(distribution.createdAt).toLocaleString('id-ID')}
            </span>

            <button
              type="button"
              onClick={handleArchive}
              className="px-3.5 py-1.5 rounded-xl bg-rose-950/40 hover:bg-rose-900/50 text-rose-300 border border-rose-500/40 text-xs font-semibold flex items-center gap-1.5 transition-colors"
            >
              <Icon name="archive" className="w-3.5 h-3.5" />
              <span>Arsipkan Distribusi</span>
            </button>
          </div>
        </div>
      </div>

      {/* Toast */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 p-4 rounded-xl bg-slate-900 border border-slate-700 text-slate-100 text-xs font-semibold shadow-2xl animate-in slide-in-from-bottom-3">
          {toastMessage}
        </div>
      )}
    </div>
  )
}
