'use client'

import { useRouter } from 'next/navigation'
import { Topbar } from '@/features/dashboard/components/layout/Topbar'
import { Icon } from '@/components/ui/Icons'
import type { UserData } from '@/lib/domain/auth/auth-client.service'
import type { DistributionSummary, ResponseSummary, CadreMetric } from './types'

interface CadreViewProps {
  user: { uid?: string; email?: string | null; displayName?: string | null } | null
  userData: UserData | null
  distributions: DistributionSummary[]
  responses: ResponseSummary[]
  cadreMetrics: CadreMetric[]
}

export default function CadreView({ user, userData, distributions, responses, cadreMetrics }: CadreViewProps) {
  const router = useRouter()

  const myMetric =
    cadreMetrics.find((cadMetric) => cadMetric.cadre.uid === user?.uid) || {
      cadre: { displayName: user?.displayName || user?.email || 'Kader Lapangan', email: user?.email || '', organization: userData?.organization },
      distCount: distributions.filter((dist) => dist.createdBy === user?.uid || dist.cadreId === user?.uid).length,
      respCount: responses.filter((resp) => resp.createdBy === user?.uid || resp.cadreId === user?.uid).length,
      avgScore: 0,
      passRate: 0,
      contributionPct: 0,
      status: 'active' as const,
      organizationName: userData?.organization || 'Mandiri',
    }

  return (
    <div className="min-h-screen bg-[#080812] text-slate-100 font-sans flex flex-col">
      <Topbar title="Monitoring & Performa Saya" subtitle="Analisis Real-Time Distribusi, Responden, & Insight Lapangan Kader" />

      <main className="flex-1 p-4 md:p-6 space-y-6 max-w-7xl mx-auto w-full">
        {/* CADRE WELCOME HEADER */}
        <div className="p-5 rounded-2xl bg-gradient-to-r from-violet-950/60 via-slate-900 to-slate-950 border border-violet-500/30 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                <Icon name="checkCircle" className="w-3 h-3 text-emerald-400" />
                KADER LAPANGAN AKTIF
              </span>
              <span className="text-xs font-mono text-slate-400">{userData?.organization || 'Kemitraan BPOM'}</span>
            </div>
            <h1 className="text-xl font-bold font-display text-white">{user?.displayName || 'Kader Lapangan'}</h1>
            <p className="text-xs text-slate-400">Pantau performa distribusi kode dan kualitas evaluasi pangan responden Anda.</p>
          </div>

          <button
            onClick={() => router.push('/dashboard/distributions')}
            className="px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold font-mono text-xs transition-all flex items-center justify-center gap-1.5 shadow-lg shadow-cyan-500/10 shrink-0"
          >
            <Icon name="plus" className="w-4 h-4" />
            + Buat Kode Distribusi
          </button>
        </div>

        {/* CADRE PERSONAL KPI GRID */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-2">
            <span className="text-[10px] font-mono text-cyan-400 uppercase font-bold tracking-wider">Kode Distribusi Saya</span>
            <p className="text-3xl font-black font-mono text-cyan-200">{myMetric.distCount}</p>
            <p className="text-[11px] text-slate-400 font-mono">Kode Tersebar</p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-2">
            <span className="text-[10px] font-mono text-violet-300 uppercase font-bold tracking-wider">Responden Terjaring</span>
            <p className="text-3xl font-black font-mono text-violet-200">{myMetric.respCount}</p>
            <p className="text-[11px] text-slate-400 font-mono">Tanggapan Dikumpulkan</p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-2">
            <span className="text-[10px] font-mono text-emerald-400 uppercase font-bold tracking-wider">Rata-Rata Nilai</span>
            <p className="text-3xl font-black font-mono text-emerald-200">{myMetric.avgScore}%</p>
            <p className="text-[11px] text-slate-400 font-mono">Skor Keamanan Pangan</p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-2">
            <span className="text-[10px] font-mono text-amber-300 uppercase font-bold tracking-wider">Pass Rate (%)</span>
            <p className="text-3xl font-black font-mono text-amber-200">{myMetric.passRate}%</p>
            <p className="text-[11px] text-slate-400 font-mono">Memenuhi Syarat (MS)</p>
          </div>
        </div>

        {/* CADRE ACTIONABLE FIELD INSIGHT CARD */}
        <div className="p-5 rounded-2xl bg-gradient-to-r from-cyan-950/40 via-slate-900 to-slate-950 border border-cyan-500/30 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-mono font-bold text-cyan-300 uppercase tracking-wider flex items-center gap-2">
              <Icon name="sparkles" className="w-4 h-4 text-cyan-400" />
              Insight & Rekomendasi Edukasi Lapangan Saya
            </h3>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
              REKOMENDASI REAL-TIME
            </span>
          </div>

          <div className="space-y-2 text-xs font-mono text-slate-300 leading-relaxed">
            <p>
              {myMetric.respCount === 0
                ? 'Belum ada tanggapan evaluasi yang terkumpul melalui kode distribusi Anda. Bagikan kode/link distribusi Anda ke sekolah atau tempat pengolahan pangan sasaran.'
                : myMetric.avgScore >= 80
                ? `Sangat Baik! Responden Anda mencatatkan rata-rata nilai ${myMetric.avgScore}% (${myMetric.passRate}% Pass Rate). Pertahankan kualitas pendampingan!`
                : `Rata-rata nilai evaluasi responden Anda saat ini adalah ${myMetric.avgScore}%. Disarankan untuk mengarahkan responden ke Artikel Edukasi Keamanan Pangan BPOM.`}
            </p>
          </div>

          <div className="pt-2 border-t border-slate-800 flex items-center justify-between flex-wrap gap-2">
            <button
              onClick={() => router.push('/dashboard/articles')}
              className="px-3.5 py-1.5 rounded-xl bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 font-mono font-bold text-xs transition-colors flex items-center gap-1.5"
            >
              <Icon name="bookOpen" className="w-3.5 h-3.5" />
              Bagikan Materi Edukasi CMS →
            </button>

            <button
              onClick={() => router.push('/dashboard/responses')}
              className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-mono font-bold text-xs transition-colors flex items-center gap-1.5"
            >
              <Icon name="checkCircle" className="w-3.5 h-3.5 text-emerald-400" />
              Inspeksi Tanggapan Responden Saya →
            </button>
          </div>
        </div>
      </main>
    </div>
  )
}
