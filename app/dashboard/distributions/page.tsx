'use client'

import React, { useState, useEffect, useMemo } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Topbar } from '@/components/dashboard/Topbar'
import { Icon } from '@/components/ui/Icons'
import type { DistributionDoc } from '@/lib/forms/v1_5/distributionTypes'
import type { FormAggregateDoc } from '@/lib/firebase/repositories/v1_5/v1_5Forms.repo'
import { useAuth } from '@/context/AuthContext'

export default function DistributionsDashboardPage() {
  const router = useRouter()
  const { user } = useAuth()

  const [distributions, setDistributions] = useState<DistributionDoc[]>([])
  const [publishedForms, setPublishedForms] = useState<FormAggregateDoc[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Filters
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [ownerFilter, setOwnerFilter] = useState<string>('all')

  // Modals
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [selectedFormId, setSelectedFormId] = useState('')
  const [customTitle, setCustomTitle] = useState('')
  const [customDescription, setCustomDescription] = useState('')
  const [ownerType, setOwnerType] = useState<'admin' | 'cadre' | 'partnership'>('admin')
  const [versionMode, setVersionMode] = useState<'active' | 'pinned'>('active')
  const [pinnedVersionId, setPinnedVersionId] = useState('')
  const [expiresAt, setExpiresAt] = useState('')
  const [isCreating, setIsCreating] = useState(false)

  // Toast
  const [toastMessage, setToastMessage] = useState<string | null>(null)

  const showToast = (msg: string) => {
    setToastMessage(msg)
    setTimeout(() => setToastMessage(null), 3500)
  }

  // Load Distributions & Published Forms from API
  const loadData = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const [distRes, formRes] = await Promise.all([
        fetch('/api/v1_5/distributions'),
        fetch('/api/v1_5/forms?status=published'),
      ])

      const distData = await distRes.json()
      const formData = await formRes.json()

      if (distData.success && Array.isArray(distData.distributions)) {
        setDistributions(distData.distributions)
      } else {
        setError(distData.message || 'Gagal memuat daftar distribusi.')
      }

      if (formData.success && Array.isArray(formData.forms)) {
        setPublishedForms(formData.forms)
        if (formData.forms.length > 0) {
          setSelectedFormId(formData.forms[0].formId)
        }
      }
    } catch (err: any) {
      setError(err.message || 'Gagal terhubung ke server.')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  // Filtered List Client-Side
  const filteredDistributions = useMemo(() => {
    return distributions.filter((d) => {
      const term = searchTerm.toLowerCase()
      const matchesSearch =
        (d.title || '').toLowerCase().includes(term) ||
        (d.code || '').toLowerCase().includes(term) ||
        (d.ownerName || '').toLowerCase().includes(term) ||
        (d.formId || '').toLowerCase().includes(term)

      const matchesStatus = statusFilter === 'all' || d.status === statusFilter
      const matchesOwner = ownerFilter === 'all' || d.ownerType === ownerFilter

      return matchesSearch && matchesStatus && matchesOwner
    })
  }, [distributions, searchTerm, statusFilter, ownerFilter])

  // Stats
  const stats = useMemo(() => {
    const total = distributions.length
    const active = distributions.filter((d) => d.status === 'active').length
    const paused = distributions.filter((d) => d.status === 'paused').length
    const expired = distributions.filter((d) => d.status === 'expired').length
    return { total, active, paused, expired }
  }, [distributions])

  // Create Distribution Handler
  const handleCreateDistribution = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedFormId) {
      showToast('Pilih formulir resmi terlebih dahulu.')
      return
    }

    setIsCreating(true)
    try {
      const res = await fetch('/api/v1_5/distributions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          formId: selectedFormId,
          title: customTitle.trim() || undefined,
          description: customDescription.trim() || undefined,
          ownerType,
          versionMode,
          pinnedVersionId: versionMode === 'pinned' ? pinnedVersionId : undefined,
          expiresAt: expiresAt ? new Date(expiresAt).toISOString() : undefined,
        }),
      })
      const data = await res.json()

      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Gagal membuat kode distribusi.')
      }

      showToast(`Kode distribusi "${data.distribution.code}" berhasil dibuat!`)
      setIsCreateModalOpen(false)
      setCustomTitle('')
      setCustomDescription('')
      loadData()
    } catch (err: any) {
      showToast(`Error: ${err.message}`)
    } finally {
      setIsCreating(false)
    }
  }

  // Toggle Pause/Resume Handler
  const handleTogglePause = async (distId: string) => {
    try {
      const res = await fetch(`/api/v1_5/distributions/${distId}/pause`, {
        method: 'POST',
      })
      const data = await res.json()
      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Gagal mengubah status distribusi.')
      }

      showToast(data.message)
      loadData()
    } catch (err: any) {
      showToast(`Error: ${err.message}`)
    }
  }

  // Copy Link Helper
  const copyPublicLink = (code: string) => {
    const origin = typeof window !== 'undefined' ? window.location.origin : ''
    const url = `${origin}/form/${code}`
    navigator.clipboard.writeText(url)
    showToast(`Tautan publik "${url}" disalin ke clipboard!`)
  }

  return (
    <div className="flex flex-col min-h-screen bg-slate-950 text-slate-100 font-sans">
      <Topbar
        title="Manajemen Distribusi & Tautan Publik"
        subtitle="Kelola kode distribusi resmi, hak akses kader/kemitraan, dan resolusi versi formulir"
      />

      <div className="flex-1 p-4 sm:p-6 space-y-6 max-w-7xl mx-auto w-full">
        {/* Header Action Bar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-3">
            {/* Search Input */}
            <div className="relative flex-1 sm:flex-initial">
              <Icon name="search" className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input
                type="text"
                placeholder="Cari kode/judul/pemilik..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500 w-full sm:w-64"
              />
            </div>

            {/* Status Filter */}
            <div className="flex items-center p-1 bg-slate-900 border border-slate-800 rounded-xl text-xs">
              {(['all', 'active', 'paused', 'expired'] as const).map((st) => (
                <button
                  key={st}
                  onClick={() => setStatusFilter(st)}
                  className={`px-3 py-1.5 rounded-lg font-semibold capitalize transition-all ${
                    statusFilter === st
                      ? 'bg-cyan-500/20 text-cyan-200 border border-cyan-500/40 shadow-sm'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {st === 'all' ? 'Semua Status' : st === 'active' ? 'Aktif' : st === 'paused' ? 'Dijeda' : 'Kedaluwarsa'}
                </button>
              ))}
            </div>

            {/* Owner Filter */}
            <select
              value={ownerFilter}
              onChange={(e) => setOwnerFilter(e.target.value)}
              className="px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-300 focus:outline-none focus:border-cyan-500 cursor-pointer"
            >
              <option value="all">Semua Pemilik</option>
              <option value="admin">Admin / Pusat</option>
              <option value="cadre">Kader Desa</option>
              <option value="partnership">Kemitraan / Sekolah</option>
            </select>
          </div>

          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-xs font-bold text-white transition-all shadow-lg shadow-cyan-600/20"
          >
            <Icon name="share2" className="w-4 h-4" />
            <span>+ Buat Kode Distribusi</span>
          </button>
        </div>

        {/* Quick Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="rounded-2xl bg-slate-900 border border-slate-800 p-4 shadow-sm">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span>Total Distribusi</span>
              <Icon name="share2" className="w-4 h-4 text-cyan-400" />
            </div>
            <p className="text-2xl font-bold font-mono text-slate-100 mt-2">{stats.total}</p>
          </div>

          <div className="rounded-2xl bg-slate-900 border border-slate-800 p-4 shadow-sm">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span>Aktif Menyebar</span>
              <Icon name="checkCircle" className="w-4 h-4 text-emerald-400" />
            </div>
            <p className="text-2xl font-bold font-mono text-emerald-300 mt-2">{stats.active}</p>
          </div>

          <div className="rounded-2xl bg-slate-900 border border-slate-800 p-4 shadow-sm">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span>Dijeda Sementara</span>
              <Icon name="pauseCircle" className="w-4 h-4 text-amber-400" />
            </div>
            <p className="text-2xl font-bold font-mono text-amber-300 mt-2">{stats.paused}</p>
          </div>

          <div className="rounded-2xl bg-slate-900 border border-slate-800 p-4 shadow-sm">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span>Masa Berlaku Habis</span>
              <Icon name="clock" className="w-4 h-4 text-rose-400" />
            </div>
            <p className="text-2xl font-bold font-mono text-rose-300 mt-2">{stats.expired}</p>
          </div>
        </div>

        {/* Distribution Cards & Table */}
        <div className="rounded-2xl bg-slate-900 border border-slate-800 overflow-hidden shadow-md">
          {isLoading ? (
            <div className="flex items-center justify-center py-16 text-slate-400 text-xs gap-3">
              <Icon name="loader" className="w-5 h-5 text-cyan-400 animate-spin" />
              <span>Memuat daftar kode distribusi...</span>
            </div>
          ) : error ? (
            <div className="p-8 text-center text-xs text-rose-300 space-y-2">
              <p className="font-semibold">{error}</p>
              <button onClick={loadData} className="px-3 py-1.5 rounded-lg bg-rose-950 border border-rose-500/40 text-rose-200">
                Coba Ulang
              </button>
            </div>
          ) : filteredDistributions.length === 0 ? (
            <div className="text-center py-16 text-slate-500 space-y-2">
              <Icon name="share2" className="w-10 h-10 mx-auto text-slate-700" />
              <p className="text-sm font-semibold text-slate-300">Belum Ada Kode Distribusi</p>
              <p className="text-xs text-slate-500">Klik "+ Buat Kode Distribusi" untuk menghasilkan tautan publik baru.</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-800/80">
              {filteredDistributions.map((d) => {
                const isActive = d.status === 'active'
                const isPaused = d.status === 'paused'

                return (
                  <div
                    key={d.distributionId}
                    className="p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-slate-800/30 transition-colors"
                  >
                    <div className="space-y-1.5 max-w-xl">
                      <div className="flex items-center gap-2.5 flex-wrap">
                        <span className="font-mono text-cyan-400 font-extrabold text-sm px-2.5 py-0.5 rounded-lg bg-cyan-950 border border-cyan-500/30">
                          {d.code}
                        </span>

                        <span
                          className={`text-[10px] font-bold px-2.5 py-0.5 rounded-md uppercase border ${
                            isActive
                              ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'
                              : isPaused
                              ? 'bg-amber-500/10 text-amber-300 border-amber-500/30'
                              : 'bg-rose-500/10 text-rose-300 border-rose-500/30'
                          }`}
                        >
                          {d.status}
                        </span>

                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-950 text-slate-400 border border-slate-800">
                          {d.versionMode === 'pinned' ? `Pinned (${d.pinnedVersionId})` : 'Auto-Active (Versi Publik Terbaru)'}
                        </span>

                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-purple-950/40 text-purple-300 border border-purple-500/30 capitalize">
                          {d.ownerType === 'admin' ? 'BPOM Pusat' : d.ownerType === 'cadre' ? 'Kader Desa' : 'Kemitraan'}
                        </span>
                      </div>

                      <h4 className="text-sm font-bold text-slate-100">{d.title}</h4>
                      <p className="text-xs text-slate-400 line-clamp-1">{d.description || 'Tidak ada deskripsi tambahan.'}</p>

                      <div className="flex items-center gap-3 text-[11px] text-slate-500 font-mono pt-1">
                        <span>Form ID: {d.formId}</span>
                        <span>•</span>
                        <span>Pemilik: {d.ownerName}</span>
                        <span>•</span>
                        <span>Dibuat: {new Date(d.createdAt).toLocaleDateString('id-ID')}</span>
                      </div>
                    </div>

                    {/* Controls */}
                    <div className="flex items-center gap-2 self-start md:self-center flex-wrap">
                      <button
                        type="button"
                        onClick={() => copyPublicLink(d.code)}
                        className="px-3 py-1.5 rounded-xl bg-cyan-600/20 hover:bg-cyan-600/30 text-cyan-200 border border-cyan-500/40 text-xs font-semibold flex items-center gap-1.5 transition-colors"
                      >
                        <Icon name="copy" className="w-3.5 h-3.5" />
                        <span>Salin Link</span>
                      </button>

                      <a
                        href={`/form/${d.code}`}
                        target="_blank"
                        rel="noreferrer"
                        className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-colors"
                      >
                        <Icon name="externalLink" className="w-3.5 h-3.5 text-cyan-400" />
                        <span>Buka</span>
                      </a>

                      <button
                        type="button"
                        onClick={() => handleTogglePause(d.distributionId)}
                        className={`px-3 py-1.5 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                          isPaused
                            ? 'bg-emerald-950/40 hover:bg-emerald-900/50 text-emerald-200 border-emerald-500/40'
                            : 'bg-amber-950/40 hover:bg-amber-900/50 text-amber-200 border-amber-500/40'
                        }`}
                      >
                        <Icon name={isPaused ? 'play' : 'pause'} className="w-3.5 h-3.5" />
                        <span>{isPaused ? 'Aktifkan' : 'Jeda'}</span>
                      </button>

                      <Link
                        href={`/dashboard/distributions/${d.distributionId}`}
                        className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white border border-slate-700"
                        title="Detail Distribusi"
                      >
                        <Icon name="arrowRight" className="w-4 h-4" />
                      </Link>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* Modal: Buat Kode Distribusi Baru */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200">
          <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
                <Icon name="share2" className="w-5 h-5 text-cyan-400" />
                <span>Buat Kode & Tautan Distribusi Baru</span>
              </h3>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg bg-slate-800"
              >
                <Icon name="x" className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateDistribution} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-300 mb-1.5">
                  Pilih Formulir Resmi Terpublikasi <span className="text-rose-400">*</span>
                </label>
                {publishedForms.length === 0 ? (
                  <p className="p-3 rounded-xl bg-rose-950/30 border border-rose-500/40 text-rose-300">
                    Belum ada formulir resmi yang dipublikasikan. Publikasikan versi formulir terlebih dahulu di Form Builder.
                  </p>
                ) : (
                  <select
                    value={selectedFormId}
                    onChange={(e) => setSelectedFormId(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 text-slate-100 rounded-xl px-3.5 py-2.5"
                  >
                    {publishedForms.map((f: any) => {
                      const title =
                        f?.metadata?.title ||
                        f?.publicForm?.metadata?.title ||
                        f?.title ||
                        f?.formId ||
                        'Formulir Tanpa Judul'
                      const vNum = f?.activeVersionNumber || f?.versionNumber || 1
                      return (
                        <option key={f.formId || Math.random().toString()} value={f.formId}>
                          {title} ({f.formId} — v{vNum})
                        </option>
                      )
                    })}
                  </select>
                )}
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Judul Tampilan Distribusi (Opsional)</label>
                <input
                  type="text"
                  placeholder="Kosongkan untuk mengikuti judul formulir resmi..."
                  value={customTitle}
                  onChange={(e) => setCustomTitle(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 text-slate-100 rounded-xl px-3.5 py-2.5"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Tipe Pemilik Distribusi</label>
                  <select
                    value={ownerType}
                    onChange={(e) => setOwnerType(e.target.value as any)}
                    className="w-full bg-slate-950 border border-slate-700 text-slate-200 rounded-xl px-3 py-2.5"
                  >
                    <option value="admin">BPOM Pusat (Admin)</option>
                    <option value="cadre">Kader Desa</option>
                    <option value="partnership">Kemitraan / Sekolah</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Mode Resolusi Versi</label>
                  <select
                    value={versionMode}
                    onChange={(e) => setVersionMode(e.target.value as any)}
                    className="w-full bg-slate-950 border border-slate-700 text-slate-200 rounded-xl px-3 py-2.5"
                  >
                    <option value="active">Auto-Active (Selalu Versi Terbaru)</option>
                    <option value="pinned">Pinned (Sematkan Versi Tertentu)</option>
                  </select>
                </div>
              </div>

              {versionMode === 'pinned' && (
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Versi Snapshot Yang Disematkan</label>
                  <input
                    type="text"
                    placeholder="Contoh: form_evaluasi_v1"
                    value={pinnedVersionId}
                    onChange={(e) => setPinnedVersionId(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 text-slate-100 rounded-xl px-3.5 py-2.5"
                  />
                </div>
              )}

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Batas Masa Berlaku (Opsional)</label>
                <input
                  type="datetime-local"
                  value={expiresAt}
                  onChange={(e) => setExpiresAt(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 text-slate-100 rounded-xl px-3.5 py-2.5"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isCreating || publishedForms.length === 0}
                  className="px-5 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 disabled:bg-slate-800 text-white font-bold shadow-lg shadow-cyan-600/20 flex items-center gap-1.5"
                >
                  {isCreating ? <Icon name="loader" className="w-4 h-4 animate-spin" /> : <Icon name="check" className="w-4 h-4" />}
                  <span>{isCreating ? 'Membuat...' : 'Generate Kode KKPD'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 p-4 rounded-xl bg-slate-900 border border-slate-700 text-slate-100 text-xs font-semibold shadow-2xl animate-in slide-in-from-bottom-3">
          {toastMessage}
        </div>
      )}
    </div>
  )
}
