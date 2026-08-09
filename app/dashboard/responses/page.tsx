'use client'

import React, { useEffect, useState, useMemo } from 'react'
import Link from 'next/link'
import { Topbar } from '@/components/dashboard/Topbar'
import { Icon } from '@/components/ui/Icons'
import type { ResponseDoc } from '@/lib/forms/v1_5/responseTypes'
import { useAuth } from '@/context/AuthContext'

export default function ResponsesDashboardPage() {
  const { user } = useAuth()
  const [responses, setResponses] = useState<ResponseDoc[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Filters
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')

  // Toast
  const [toastMessage, setToastMessage] = useState<string | null>(null)

  const showToast = (msg: string) => {
    setToastMessage(msg)
    setTimeout(() => setToastMessage(null), 3500)
  }

  const loadResponses = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/v1_5/responses')
      const data = await res.json()
      if (data.success && Array.isArray(data.responses)) {
        setResponses(data.responses)
      } else {
        setError(data.message || 'Gagal memuat daftar tanggapan.')
      }
    } catch (err: any) {
      setError(err.message || 'Terjadi kesalahan saat terhubung ke server.')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadResponses()
  }, [])

  const filteredResponses = useMemo(() => {
    return responses.filter((r) => {
      const matchesSearch =
        r.responseId.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.distributionCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.formId.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (r.respondent?.name && r.respondent.name.toLowerCase().includes(searchTerm.toLowerCase()))

      const matchesStatus = statusFilter === 'all' || r.status === statusFilter

      return matchesSearch && matchesStatus
    })
  }, [responses, searchTerm, statusFilter])

  const stats = useMemo(() => {
    const total = responses.length
    const submitted = responses.filter((r) => r.status === 'submitted').length
    const inProgress = responses.filter((r) => r.status === 'in_progress').length
    return { total, submitted, inProgress }
  }, [responses])

  return (
    <div className="flex flex-col min-h-screen bg-slate-950 text-slate-100 font-sans">
      <Topbar
        title="Manajemen Tanggapan & Hasil Kuesioner"
        subtitle="Pantau tanggapan terkirim, status pengisian, dan riwayat versi responden"
      />

      <div className="flex-1 p-4 sm:p-6 space-y-6 max-w-7xl mx-auto w-full">
        {/* Filter Action Bar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative flex-1 sm:flex-initial">
              <Icon name="search" className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input
                type="text"
                placeholder="Cari ID respon / kode / responden..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500 w-full sm:w-64"
              />
            </div>

            <div className="flex items-center p-1 bg-slate-900 border border-slate-800 rounded-xl text-xs">
              {(['all', 'submitted', 'in_progress'] as const).map((st) => (
                <button
                  key={st}
                  onClick={() => setStatusFilter(st)}
                  className={`px-3 py-1.5 rounded-lg font-semibold capitalize transition-all ${
                    statusFilter === st
                      ? 'bg-cyan-500/20 text-cyan-200 border border-cyan-500/40 shadow-sm'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {st === 'all' ? 'Semua' : st === 'submitted' ? 'Terkirim' : 'Sedang Diisi'}
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={loadResponses}
            className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-2 self-start sm:self-auto"
          >
            <Icon name="rotateCcw" className="w-4 h-4 text-cyan-400" />
            <span>Refresh Data</span>
          </button>
        </div>

        {/* Stats Summary */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="rounded-2xl bg-slate-900 border border-slate-800 p-4 shadow-sm">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span>Total Tanggapan</span>
              <Icon name="fileText" className="w-4 h-4 text-cyan-400" />
            </div>
            <p className="text-2xl font-bold font-mono text-slate-100 mt-2">{stats.total}</p>
          </div>

          <div className="rounded-2xl bg-slate-900 border border-slate-800 p-4 shadow-sm">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span>Terkirim (Submitted)</span>
              <Icon name="checkCircle" className="w-4 h-4 text-emerald-400" />
            </div>
            <p className="text-2xl font-bold font-mono text-emerald-300 mt-2">{stats.submitted}</p>
          </div>

          <div className="rounded-2xl bg-slate-900 border border-slate-800 p-4 shadow-sm">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span>Sedang Berjalan (In Progress)</span>
              <Icon name="clock" className="w-4 h-4 text-amber-400" />
            </div>
            <p className="text-2xl font-bold font-mono text-amber-300 mt-2">{stats.inProgress}</p>
          </div>
        </div>

        {/* Response List */}
        <div className="rounded-2xl bg-slate-900 border border-slate-800 overflow-hidden shadow-md">
          {isLoading ? (
            <div className="flex items-center justify-center py-16 text-slate-400 text-xs gap-3">
              <Icon name="loader" className="w-5 h-5 text-cyan-400 animate-spin" />
              <span>Memuat daftar tanggapan kuesioner...</span>
            </div>
          ) : error ? (
            <div className="p-8 text-center text-xs text-rose-300 space-y-2">
              <p className="font-semibold">{error}</p>
              <button onClick={loadResponses} className="px-3 py-1.5 rounded-lg bg-rose-950 border border-rose-500/40 text-rose-200">
                Coba Ulang
              </button>
            </div>
          ) : filteredResponses.length === 0 ? (
            <div className="text-center py-16 text-slate-500 space-y-2">
              <Icon name="fileText" className="w-10 h-10 mx-auto text-slate-700" />
              <p className="text-sm font-semibold text-slate-300">Belum Ada Tanggapan Terdeteksi</p>
              <p className="text-xs text-slate-500">Tanggapan responden yang telah memulai/mengirimkan kuesioner akan muncul di sini.</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-800/80">
              {filteredResponses.map((r) => {
                const isSubmitted = r.status === 'submitted'
                const answerCount = Object.keys(r.answers || {}).length

                return (
                  <div
                    key={r.responseId}
                    className="p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-slate-800/30 transition-colors"
                  >
                    <div className="space-y-1.5 max-w-xl">
                      <div className="flex items-center gap-2.5 flex-wrap">
                        <span className="font-mono text-slate-300 font-extrabold text-xs px-2.5 py-0.5 rounded-lg bg-slate-950 border border-slate-800">
                          {r.responseId}
                        </span>

                        <span
                          className={`text-[10px] font-bold px-2.5 py-0.5 rounded-md uppercase border ${
                            isSubmitted
                              ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'
                              : 'bg-amber-500/10 text-amber-300 border-amber-500/30'
                          }`}
                        >
                          {r.status}
                        </span>

                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-500/30">
                          Kode: {r.distributionCode}
                        </span>

                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-purple-950 text-purple-300 border border-purple-500/30">
                          Versi: v{r.versionNumber} ({r.versionId})
                        </span>
                      </div>

                      <div className="flex items-center gap-2 text-xs font-semibold text-slate-200">
                        <Icon name="user" className="w-3.5 h-3.5 text-cyan-400" />
                        <span>{r.respondent?.name || 'Responden Publik (Anonim)'}</span>
                        {r.respondent?.email && <span className="text-slate-400 font-mono">({r.respondent.email})</span>}
                      </div>

                      <div className="flex items-center gap-3 text-[11px] text-slate-500 font-mono pt-1">
                        <span>Form ID: {r.formId}</span>
                        <span>•</span>
                        <span>Jawaban Terisi: {answerCount} butir</span>
                        <span>•</span>
                        <span>
                          {isSubmitted
                            ? `Terkirim: ${new Date(r.submittedAt || r.updatedAt).toLocaleString('id-ID')}`
                            : `Dimulai: ${new Date(r.startedAt).toLocaleString('id-ID')}`}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-start md:self-center">
                      <Link
                        href={`/dashboard/responses/${r.responseId}`}
                        className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-cyan-400 hover:text-cyan-300 border border-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-colors"
                      >
                        <span>Inspeksi Jawaban</span>
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

      {/* Toast */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 p-4 rounded-xl bg-slate-900 border border-slate-700 text-slate-100 text-xs font-semibold shadow-2xl animate-in slide-in-from-bottom-3">
          {toastMessage}
        </div>
      )}
    </div>
  )
}
