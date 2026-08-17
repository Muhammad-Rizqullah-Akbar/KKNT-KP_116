'use client'

import React from 'react'
import Link from 'next/link'
import { Icon } from '@/components/ui/Icons'

interface PublicCompletionReceiptProps {
  responseId?: string
  code: string
  submittedAt: string
  biodata?: Array<{ label: string; value: string }>
  result?: {
    percentage: number
    grade: string
    thresholdTitle: string
    thresholdDescription?: string
    aspects?: Array<{
      aspectId: string
      aspectTitle?: string
      title?: string
      rawScore: number
      maximumScore: number
      percentage: number
    }>
    recommendations?: Array<{
      articleId: string
      title: string
      slug?: string
      category?: string
    }>
  }
}

export function PublicCompletionReceipt({
  responseId,
  code,
  submittedAt,
  biodata,
  result,
}: PublicCompletionReceiptProps) {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-4 sm:p-6 font-sans">
      <div className="max-w-2xl w-full p-6 sm:p-8 rounded-3xl bg-slate-900 border border-slate-800 space-y-6 shadow-2xl animate-in zoom-in-95 duration-200">
        <div className="flex items-center gap-4 border-b border-slate-800 pb-5">
          <div className="w-14 h-14 rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center flex-shrink-0 shadow-lg shadow-emerald-500/10">
            <Icon name="checkCircle" className="w-7 h-7" />
          </div>

          <div className="space-y-0.5">
            <h2 className="text-lg font-bold text-slate-100">Tanggapan Evaluasi Berhasil Terkirim!</h2>
            <p className="text-xs text-slate-400">
              Hasil penilaian dan rekomendasi tindakan resmi telah dihitung secara otomatis.
            </p>
          </div>
        </div>

        {/* Respondent Biodata Card (Rendered ABOVE score if available) */}
        {biodata && biodata.length > 0 && (
          <div className="p-5 rounded-3xl bg-slate-900 border border-slate-800 space-y-3 shadow-lg">
            <h3 className="text-xs font-bold text-cyan-300 uppercase tracking-wider font-mono flex items-center gap-2 border-b border-slate-800 pb-2">
              <Icon name="user" className="w-4 h-4 text-cyan-400" />
              <span>Data Biodata Responden</span>
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              {biodata.map((b, idx) => (
                <div key={idx} className="p-3 rounded-2xl bg-slate-950 border border-slate-800/90 space-y-0.5">
                  <span className="text-[10px] text-slate-400 block font-mono font-medium">{b.label}</span>
                  <strong className="text-slate-100 font-sans font-semibold text-xs block">{b.value}</strong>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Calculated Result Card */}
        {result && (
          <div className="p-6 rounded-3xl bg-gradient-to-b from-slate-950 to-slate-900 border border-cyan-500/40 space-y-5 shadow-xl">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div>
                <span className="text-[10px] font-mono text-cyan-400 uppercase tracking-wider font-bold block mb-1">
                  Nilai Evaluasi Akhir
                </span>
                <div className="text-3xl font-black text-slate-100 font-mono tracking-tight flex items-baseline gap-1">
                  <span>{result.percentage}</span>
                  <span className="text-sm font-bold text-cyan-400">%</span>
                </div>
              </div>

              <div className="text-right">
                <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider font-bold block mb-1">
                  Kategori / Predikat Respon
                </span>
                <div className="inline-block font-mono text-xs font-extrabold px-3.5 py-1.5 rounded-xl bg-cyan-950 border border-cyan-500/40 text-cyan-300 shadow-sm">
                  {result.grade}
                </div>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-1.5">
              <h3 className="text-xs font-bold text-slate-100 flex items-center gap-2">
                <Icon name="award" className="w-4 h-4 text-cyan-400" />
                <span>{result.thresholdTitle || 'Status Kelayakan'}</span>
              </h3>
              {result.thresholdDescription && (
                <p className="text-xs text-slate-300 leading-relaxed font-sans">
                  {result.thresholdDescription}
                </p>
              )}
            </div>

            {/* Aspect Score Breakdown */}
            {result.aspects && result.aspects.length > 0 && (
              <div className="space-y-3 pt-2">
                <h4 className="text-xs font-bold text-cyan-300 uppercase tracking-wider font-mono flex items-center gap-2">
                  <Icon name="layers" className="w-4 h-4 text-cyan-400" />
                  <span>Rincian Nilai per Aspek Penilaian</span>
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {result.aspects.map((asp, idx) => {
                    const aspectTitle = asp.aspectTitle || asp.title || `Aspek Penilaian ${idx + 1}`
                    return (
                      <div key={asp.aspectId || idx} className="p-3.5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-2">
                        <div className="flex justify-between items-start gap-2">
                          <span className="text-xs font-bold text-slate-200 line-clamp-1">{aspectTitle}</span>
                          <span className="text-xs font-mono font-extrabold text-cyan-400 flex-shrink-0">
                            {asp.percentage}%
                          </span>
                        </div>
                        <div className="w-full bg-slate-950 rounded-full h-1.5 overflow-hidden border border-slate-800">
                          <div
                            className="bg-cyan-400 h-full rounded-full transition-all duration-500"
                            style={{ width: `${Math.min(100, Math.max(0, asp.percentage))}%` }}
                          />
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Article Recommendations if present */}
        {result?.recommendations && result.recommendations.length > 0 && (
          <div className="space-y-3 text-left">
            <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider font-mono flex items-center gap-2">
              <Icon name="bookOpen" className="w-4 h-4 text-cyan-400" />
              <span>Rekomendasi Tindakan & Materi Edukasi Terkait</span>
            </h3>

            <div className="space-y-2.5">
              {result.recommendations.map((item) => {
                const articleUrl = item.slug ? `/edukasi/${item.slug}` : `/edukasi`
                return (
                  <div
                    key={item.articleId}
                    className="p-4 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-between gap-3 hover:border-slate-700 transition-colors shadow-sm"
                  >
                    <div className="min-w-0 space-y-0.5">
                      <span className="text-[10px] font-mono text-cyan-400 uppercase font-semibold">
                        {item.category || 'Rekomendasi Edukasi BPOM'}
                      </span>
                      <h4 className="text-xs font-bold text-slate-200 line-clamp-1">{item.title}</h4>
                    </div>

                    <Link
                      href={articleUrl}
                      target="_blank"
                      className="px-3.5 py-1.5 rounded-xl bg-cyan-950 hover:bg-cyan-900 text-cyan-300 text-xs font-bold flex-shrink-0 border border-cyan-500/40 transition-colors flex items-center gap-1.5"
                    >
                      <span>Pelajari Materi</span>
                      <Icon name="externalLink" className="w-3.5 h-3.5 text-cyan-400" />
                    </Link>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Technical Metadata Bar (No Response ID) */}
        <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 text-xs text-slate-300 space-y-2 font-mono">
          <div className="flex justify-between items-center">
            <span className="text-slate-500">Kode Akses Formulir:</span>
            <strong className="text-cyan-400 font-bold">{code}</strong>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-slate-500">Waktu Pengiriman:</span>
            <strong className="text-slate-300 text-[11px]">
              {new Date(submittedAt).toLocaleString('id-ID')}
            </strong>
          </div>
        </div>

        <div className="flex items-center gap-3 pt-2">
          <Link
            href="/"
            className="flex-1 py-3 rounded-2xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold shadow-lg shadow-cyan-600/20 text-center transition-all"
          >
            Selesai & Kembali ke Beranda
          </Link>
        </div>
      </div>
    </div>
  )
}
