// modals/ProfileProgressTabs.tsx
// Presentational tab bodies for ProfileProgressModal.

'use client'

import Link from 'next/link'
import { Icon } from '@/components/ui/Icons'
import type { ArticleData } from '@/lib/repositories/articles.repo'

// ============================================================
// PROGRESS TAB
// ============================================================

export interface CadreResponseStats {
  avgScore: number
  passCount: number
  passRate: number
  lowScoreCount: number
  totalResponses: number
}

export function ProgressTab({ activeCodes, stats }: { activeCodes: number; stats: CadreResponseStats }) {
  return (
    <div className="space-y-4">
      {/* Metric Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="rounded-2xl bg-slate-950 border border-slate-800 p-3.5 space-y-1">
          <span className="text-slate-400 text-[11px]">Kode Distribusi Saya</span>
          <p className="text-xl font-bold font-mono text-purple-300">{activeCodes}</p>
          <span className="text-[10px] text-slate-500 font-mono">Kode Aktif Menyebar</span>
        </div>

        <div className="rounded-2xl bg-slate-950 border border-slate-800 p-3.5 space-y-1">
          <span className="text-slate-400 text-[11px]">Responden Terjaring</span>
          <p className="text-xl font-bold font-mono text-cyan-300">{stats.totalResponses} Orang</p>
          <span className="text-[10px] text-slate-500 font-mono">Via Kode Kader Ini</span>
        </div>

        <div className="rounded-2xl bg-slate-950 border border-slate-800 p-3.5 space-y-1">
          <span className="text-slate-400 text-[11px]">Rata-Rata Nilai Evaluasi</span>
          <p className="text-xl font-bold font-mono text-emerald-400">{stats.avgScore}%</p>
          <span className="text-[10px] text-emerald-400 font-mono">Skor Lapangan</span>
        </div>

        <div className="rounded-2xl bg-slate-950 border border-slate-800 p-3.5 space-y-1">
          <span className="text-slate-400 text-[11px]">Tingkat Memenuhi Syarat</span>
          <p className="text-xl font-bold font-mono text-amber-300">{stats.passRate}%</p>
          <span className="text-[10px] text-slate-500 font-mono">{stats.passCount} Responden MS</span>
        </div>
      </div>

      {/* ACTIONABLE FIELD INSIGHTS CARD */}
      <div className="rounded-2xl bg-gradient-to-r from-violet-950/60 via-slate-950 to-slate-950 border border-violet-500/40 p-4 space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="font-bold text-violet-300 flex items-center gap-2 font-mono text-xs uppercase tracking-wider">
            <Icon name="sparkles" className="w-4 h-4 text-violet-400" />
            <span>Analisis Insight & Rekomendasi Lapangan Kader</span>
          </h4>
          <span className="px-2.5 py-0.5 rounded text-[10px] font-mono font-bold bg-violet-500/20 text-violet-200 border border-violet-500/30">
            Performa: {stats.avgScore >= 80 ? 'Sangat Baik (Grade A)' : stats.avgScore >= 60 ? 'Baik (Grade B)' : 'Perlu Pembinaan (Grade C)'}
          </span>
        </div>

        <div className="space-y-2 text-xs font-mono text-slate-300 leading-relaxed">
          <p>
            {stats.totalResponses === 0
              ? 'Belum ada tanggapan evaluasi yang terkumpul untuk kader ini. Disarankan segera menyebarkan kode distribusi ke responden sasaran.'
              : stats.lowScoreCount > 0
              ? `⚠️ Terdapat ${stats.lowScoreCount} dari ${stats.totalResponses} responden dengan nilai evaluasi di bawah standar (<60%). Disarankan untuk mengarahkan responden ke Artikel Edukasi Keamanan Pangan.`
              : `🎉 Luar biasa! ${stats.passCount} dari ${stats.totalResponses} responden memenuhi syarat keamanan pangan (${stats.passRate}% Pass Rate).`}
          </p>
        </div>
      </div>
    </div>
  )
}

// ============================================================
// ARTICLES TAB
// ============================================================

export function ArticlesTab({ articles, onClose }: { articles: ArticleData[]; onClose: () => void }) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="font-bold text-slate-200">Kontribusi Artikel Edukasi ({articles.length})</h4>
        <Link onClick={onClose} href="/dashboard/articles" className="text-xs text-purple-400 hover:underline">
          + Tulis Artikel Baru (CMS)
        </Link>
      </div>

      {articles.length === 0 ? (
        <div className="p-8 text-center bg-slate-950 border border-slate-800 rounded-2xl text-slate-500">
          Belum ada artikel edukasi yang ditulis oleh akun Anda.
        </div>
      ) : (
        <div className="divide-y divide-slate-800 bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden">
          {articles.map((art) => (
            <div key={art.id || art.slug} className="p-3 flex items-center justify-between">
              <div className="space-y-0.5 max-w-md">
                <span className="px-2 py-0.5 rounded bg-purple-950 text-purple-300 text-[10px] font-bold">
                  {art.category || 'Materi Edukasi'}
                </span>
                <p className="font-bold text-slate-100">{art.title}</p>
              </div>
              <span className="font-mono text-emerald-400 text-[11px] font-bold flex items-center gap-1">
                <Icon name="eye" className="w-3.5 h-3.5 text-emerald-400" />
                {art.views || 0} views
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ============================================================
// DISTRIBUTIONS TAB
// ============================================================

export function DistributionsTab({ distributions, onClose }: { distributions: any[]; onClose: () => void }) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="font-bold text-slate-200">Kode & Link Distribusi Saya ({distributions.length})</h4>
        <Link onClick={onClose} href="/dashboard/distributions" className="text-xs text-cyan-400 hover:underline">
          + Buat Kode Distribusi Baru
        </Link>
      </div>

      {distributions.length === 0 ? (
        <div className="p-8 text-center bg-slate-950 border border-slate-800 rounded-2xl text-slate-500">
          Belum ada kode distribusi publik yang dibuat untuk akun ini.
        </div>
      ) : (
        <div className="divide-y divide-slate-800 bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden">
          {distributions.map((d) => (
            <div key={d.distributionId} className="p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-mono text-cyan-400 font-bold text-xs px-2.5 py-0.5 rounded-lg bg-cyan-950 border border-cyan-500/30">
                    {d.code}
                  </span>
                  <span className="px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-500/30 text-[10px] font-bold flex items-center gap-1">
                    <Icon name="barChart" className="w-3 h-3 text-emerald-400" />
                    {d.respondentCount || 0} Responden Terjaring
                  </span>
                </div>
                <p className="font-bold text-slate-100 mt-1">{d.title}</p>
                {d.cadreName && (
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Kader/Pemilik: <strong className="text-slate-300">{d.cadreName}</strong> ({d.targetAudience || 'Umum'})
                  </p>
                )}
              </div>

              <div className="flex items-center gap-2 self-start sm:self-auto">
                <a
                  href={`/form/${d.code}`}
                  target="_blank"
                  rel="noreferrer"
                  className="px-3 py-1.5 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/40 font-semibold text-xs transition-colors flex items-center gap-1"
                >
                  <span>Buka Form Publik</span>
                  <Icon name="externalLink" className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
