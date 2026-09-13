'use client'

import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import Link from 'next/link'
import { useAuth } from '@/context/AuthContext'
import { safeFetchJson } from '@/lib/infra/safe-fetch'
import { getArticles } from '@/lib/repositories/articles.repo'
import { Topbar } from '@/features/dashboard/components/layout/Topbar'
import { Icon } from '@/components/ui/Icons'
import { queryKeys } from '@/lib/query-keys'

// Dedicated Dashboard View for Cadre Lapangan
export function CadreOverviewDashboard() {
  const { user, userData } = useAuth()

  const { data: cadreData } = useQuery({
    queryKey: queryKeys.dashboard.overview.cadre(user?.uid, userData?.displayName),
    enabled: !!user,
    queryFn: async () => {
      const [distRes, respRes, artData] = await Promise.all([
        safeFetchJson('/api/distributions'),
        safeFetchJson('/api/responses'),
        getArticles().catch(() => []),
      ])

      const userUid = user?.uid
      const userEmail = (user?.email || '').toLowerCase().trim()
      const userName = (userData?.displayName || '').toLowerCase().trim()

      let dists: any[] = []
      if (distRes.ok && distRes.data && Array.isArray(distRes.data.distributions)) {
        dists = distRes.data.distributions.filter(
          (d: any) => d.createdBy === userUid || d.cadreId === userUid || d.ownerId === userUid
        )
      }

      const myCodesSet = new Set<string>()
      dists.forEach((d) => {
        if (d.code) myCodesSet.add(String(d.code).toLowerCase().trim())
        if (d.distributionId) myCodesSet.add(String(d.distributionId).toLowerCase().trim())
      })

      let resps: any[] = []
      if (respRes.ok && respRes.data && Array.isArray(respRes.data.responses)) {
        resps = respRes.data.responses.filter((r: any) => {
          const code = String(r.distributionCode || r.code || '').toLowerCase().trim()
          return (code !== '' && myCodesSet.has(code)) || r.createdBy === userUid || r.cadreId === userUid
        })
      }

      let count = 0
      if (Array.isArray(artData)) {
        count = artData.filter((a: any) => {
          if (a.authorId && userUid && a.authorId === userUid) return true
          if (a.createdBy && userUid && a.createdBy === userUid) return true
          const authLower = String(a.author || '').toLowerCase().trim()
          if (userEmail && authLower === userEmail) return true
          if (userName && userName.length > 2 && authLower === userName) return true
          return false
        }).length
      }

      return { myDists: dists, myResponses: resps, myArticlesCount: count }
    },
  })

  const myDists = cadreData?.myDists ?? []
  const myResponses = cadreData?.myResponses ?? []
  const myArticlesCount = cadreData?.myArticlesCount ?? 0

  const stats = useMemo(() => {
    const totalRespondents = myResponses.length
    const totalDists = myDists.length

    let sumScores = 0
    myResponses.forEach((r) => {
      const score = Math.min(100, Math.max(0, Math.round(Number(r.result?.percentage ?? r.score ?? r.totalScore ?? 0))))
      sumScores += score
    })

    const avgScore = totalRespondents > 0 ? Math.round(sumScores / totalRespondents) : 0
    const grade = avgScore >= 80 ? 'Grade A' : avgScore >= 60 ? 'Grade B' : 'Grade C'

    return { totalRespondents, totalDists, avgScore, grade }
  }, [myDists, myResponses])

  return (
    <div className="flex flex-col min-h-screen bg-[#06060E]">
      <Topbar title="Dashboard Ringkasan Saya" subtitle="Pusat Kendali Distribusi & Kinerja Kader Lapangan" />

      <div className="flex-1 p-6 space-y-6 max-w-7xl mx-auto w-full">
        {/* CADRE WELCOME CARD */}
        <div className="p-6 rounded-3xl bg-gradient-to-r from-violet-950/60 via-slate-900 to-slate-950 border border-violet-500/30 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xl">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                <Icon name="checkCircle" className="w-3 h-3 text-emerald-400" />
                KADER LAPANGAN AKTIF
              </span>
              <span className="text-xs font-mono text-slate-400">{userData?.organization || 'Kemitraan BPOM'}</span>
            </div>
            <h1 className="text-2xl font-bold font-display text-white">{user?.displayName || 'Kader Lapangan'}</h1>
            <p className="text-xs text-slate-400">Ringkasan performa penyebaran kode distribusi dan tanggapan kuesioner Anda.</p>
          </div>

          <Link href="/dashboard/distributions">
            <button className="px-4 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold font-mono text-xs transition-all flex items-center justify-center gap-1.5 shadow-lg shadow-cyan-500/10">
              <Icon name="plus" className="w-4 h-4" />
              + Buat Kode Distribusi
            </button>
          </Link>
        </div>

        {/* CADRE STATS PODS */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-1">
            <span className="text-[10px] font-mono text-cyan-400 uppercase font-bold tracking-wider">Kode Distribusi</span>
            <p className="text-3xl font-black font-mono text-cyan-200">{stats.totalDists}</p>
            <span className="text-[11px] text-slate-400 font-mono">Aktif Berjalan</span>
          </div>

          <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-1">
            <span className="text-[10px] font-mono text-violet-300 uppercase font-bold tracking-wider">Responden Dikumpulkan</span>
            <p className="text-3xl font-black font-mono text-violet-200">{stats.totalRespondents}</p>
            <span className="text-[11px] text-slate-400 font-mono">Tanggapan Masuk</span>
          </div>

          <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-1">
            <span className="text-[10px] font-mono text-emerald-400 uppercase font-bold tracking-wider">Rata-Rata Nilai</span>
            <p className="text-3xl font-black font-mono text-emerald-200">{stats.avgScore}%</p>
            <span className="text-[11px] text-slate-400 font-mono">Skor Evaluasi Pangan</span>
          </div>

          <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-1">
            <span className="text-[10px] font-mono text-amber-300 uppercase font-bold tracking-wider">Artikel Edukasi Saya</span>
            <p className="text-3xl font-black font-mono text-amber-200">{myArticlesCount}</p>
            <span className="text-[11px] text-slate-400 font-mono">Diterbitkan di CMS</span>
          </div>
        </div>

        {/* QUICK LINK TO MONITORING */}
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-between">
          <div className="space-y-1">
            <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
              <Icon name="eye" className="w-4 h-4 text-cyan-400" />
              <span>Inspeksi Grafik Performa Lengkap Lapangan Saya</span>
            </h3>
            <p className="text-xs text-slate-400 font-mono">Analisis real-time kuesioner dan tanggapan responden Anda dapat dilihat di domain monitoring.</p>
          </div>
          <Link href="/dashboard/monitoring">
            <button className="px-4 py-2 rounded-xl bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 text-xs font-mono font-bold transition-colors">
              Buka Halaman Monitoring →
            </button>
          </Link>
        </div>
      </div>
    </div>
  )
}
