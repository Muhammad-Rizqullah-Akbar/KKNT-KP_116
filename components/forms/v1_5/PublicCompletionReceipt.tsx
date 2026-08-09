'use client'

import React from 'react'
import Link from 'next/link'
import { Icon } from '@/components/ui/Icons'

interface PublicCompletionReceiptProps {
  responseId: string
  code: string
  submittedAt: string
  result?: {
    percentage: number
    grade: string
    thresholdTitle: string
    thresholdDescription?: string
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
  result,
}: PublicCompletionReceiptProps) {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-4 font-sans">
      <div className="max-w-lg w-full p-6 sm:p-8 rounded-3xl bg-slate-900 border border-slate-800 text-center space-y-6 shadow-2xl animate-in zoom-in-95 duration-200">
        <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/10">
          <Icon name="checkCircle" className="w-8 h-8" />
        </div>

        <div className="space-y-1.5">
          <h2 className="text-xl font-bold text-slate-100">Tanggapan Berhasil Terkirim!</h2>
          <p className="text-xs text-slate-400 leading-relaxed">
            Terima kasih telah mengisi instrumen evaluasi pangan BPOM ini secara lengkap dan jujur.
          </p>
        </div>

        {/* Calculated Result Card */}
        {result && (
          <div className="p-5 rounded-2xl bg-gradient-to-b from-slate-950 to-slate-900 border border-cyan-500/30 space-y-3 shadow-lg">
            <div className="flex items-center justify-between">
              <div className="text-left">
                <span className="text-[10px] font-mono text-cyan-400 uppercase tracking-wider font-bold">
                  Nilai Evaluasi Akhir
                </span>
                <div className="text-2xl font-black text-slate-100 font-mono">
                  {result.percentage}%
                </div>
              </div>

              <div className="text-right">
                <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider font-bold">
                  Kategori / Predikat
                </span>
                <div className="inline-block font-mono text-xs font-black px-3 py-1 rounded-xl bg-cyan-950 border border-cyan-500/40 text-cyan-300">
                  {result.grade}
                </div>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-800 text-left text-xs space-y-1">
              <p className="font-bold text-slate-200">{result.thresholdTitle}</p>
              {result.thresholdDescription && (
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  {result.thresholdDescription}
                </p>
              )}
            </div>
          </div>
        )}

        {/* Article Recommendations if present */}
        {result?.recommendations && result.recommendations.length > 0 && (
          <div className="space-y-3 text-left">
            <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider font-mono flex items-center gap-2">
              <Icon name="bookOpen" className="w-4 h-4 text-cyan-400" />
              <span>Rekomendasi Materi Edukasi Terkait</span>
            </h3>

            <div className="space-y-2">
              {result.recommendations.map((item) => (
                <div
                  key={item.articleId}
                  className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-between gap-3 hover:border-slate-700 transition-colors"
                >
                  <div className="min-w-0 space-y-0.5">
                    <span className="text-[10px] font-mono text-cyan-400 uppercase font-semibold">
                      {item.category || 'Materi Edukasi'}
                    </span>
                    <h4 className="text-xs font-bold text-slate-200 line-clamp-1">{item.title}</h4>
                  </div>

                  <Link
                    href={item.slug ? `/articles/${item.slug}` : `/articles`}
                    target="_blank"
                    className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-cyan-300 text-xs font-bold flex-shrink-0 border border-slate-700 transition-colors"
                  >
                    Baca
                  </Link>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 text-xs text-slate-300 space-y-2 text-left font-mono">
          <div className="flex justify-between">
            <span className="text-slate-500">Response ID:</span>
            <strong className="text-cyan-400">{responseId}</strong>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Kode Distribusi:</span>
            <strong className="text-slate-200">{code}</strong>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Waktu Kirim:</span>
            <strong className="text-slate-400 text-[11px]">
              {new Date(submittedAt).toLocaleString('id-ID')}
            </strong>
          </div>
        </div>

        <Link
          href="/"
          className="inline-block w-full py-3 rounded-2xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold shadow-lg shadow-cyan-600/20 transition-all"
        >
          Selesai & Kembali ke Beranda
        </Link>
      </div>
    </div>
  )
}
