'use client'

import React, { useEffect, useState, use } from 'react'
import Link from 'next/link'
import { Topbar } from '@/components/dashboard/Topbar'
import { Icon } from '@/components/ui/Icons'
import type { ResponseDoc } from '@/lib/forms/v1_5/responseTypes'

interface PageProps {
  params: Promise<{ responseId: string }>
}

export default function ResponseDetailPage({ params }: PageProps) {
  const { responseId } = use(params)
  const [responseDoc, setResponseDoc] = useState<ResponseDoc | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadResponse = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/v1_5/responses/${responseId}`)
      const data = await res.json()

      if (data.success && data.response) {
        setResponseDoc(data.response)
      } else {
        setError(data.message || 'Gagal memuat detail respon.')
      }
    } catch (err: any) {
      setError(err.message || 'Terjadi kesalahan jaringan.')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadResponse()
  }, [responseId])

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-slate-400 font-sans">
        <Icon name="loader" className="w-8 h-8 text-cyan-400 animate-spin mb-3" />
        <p className="text-sm font-semibold">Memuat detail respon kuesioner...</p>
      </div>
    )
  }

  if (error || !responseDoc) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-slate-400 font-sans p-6">
        <div className="p-6 max-w-md w-full rounded-2xl bg-slate-900 border border-slate-800 text-center space-y-4 shadow-2xl">
          <div className="w-12 h-12 rounded-full bg-rose-500/10 text-rose-400 flex items-center justify-center mx-auto border border-rose-500/20">
            <Icon name="alertCircle" className="w-6 h-6" />
          </div>
          <h2 className="text-base font-bold text-slate-100">Gagal Memuat Detail</h2>
          <p className="text-xs text-slate-400">{error || 'Respon tidak ditemukan.'}</p>
          <Link
            href="/dashboard/responses"
            className="inline-block px-4 py-2 rounded-xl bg-slate-800 text-slate-200 text-xs font-semibold"
          >
            Kembali ke Daftar Respon
          </Link>
        </div>
      </div>
    )
  }

  const { answers, result } = responseDoc
  const answerEntries = Object.entries(answers || {})

  return (
    <div className="flex flex-col min-h-screen bg-slate-950 text-slate-100 font-sans">
      <Topbar
        title={`Inspeksi Respon — ${responseDoc.responseId}`}
        subtitle="Auditing hasil penilaian resmi dan rincian skor per indikator"
      />

      <div className="flex-1 p-4 sm:p-6 space-y-6 max-w-5xl mx-auto w-full">
        <Link
          href="/dashboard/responses"
          className="inline-flex items-center gap-2 text-xs font-semibold text-cyan-400 hover:text-cyan-300 transition-colors"
        >
          <Icon name="arrowLeft" className="w-4 h-4" />
          <span>Kembali ke Daftar Respon</span>
        </Link>

        {/* Hero Metadata Card */}
        <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 space-y-6 shadow-xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
            <div className="space-y-1">
              <div className="flex items-center gap-2.5 flex-wrap">
                <span className="font-mono text-cyan-300 font-extrabold text-sm px-3 py-1 rounded-xl bg-cyan-950 border border-cyan-500/40">
                  {responseDoc.responseId}
                </span>
                <span
                  className={`text-xs font-bold px-3 py-1 rounded-lg uppercase border ${
                    responseDoc.status === 'submitted'
                      ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'
                      : 'bg-amber-500/10 text-amber-300 border-amber-500/30'
                  }`}
                >
                  STATUS: {responseDoc.status}
                </span>
              </div>
              <h2 className="text-base font-bold text-slate-100 pt-2">
                Responden: {responseDoc.respondent?.name || 'Anonim / Publik'}
              </h2>
              {responseDoc.respondent?.email && (
                <p className="text-xs text-slate-400 font-mono">Email: {responseDoc.respondent.email}</p>
              )}
            </div>

            <div className="text-left sm:text-right space-y-1 font-mono text-xs text-slate-400">
              <div>Kode Distribusi: <strong className="text-cyan-300">{responseDoc.distributionCode}</strong></div>
              <div>Form ID: <strong className="text-slate-200">{responseDoc.formId}</strong></div>
              <div>Versi Snapshot: <strong className="text-purple-300">v{responseDoc.versionNumber} ({responseDoc.versionId})</strong></div>
            </div>
          </div>

          {/* CALCULATED RESULT AUDIT CARD */}
          {result ? (
            <div className="p-6 rounded-2xl bg-slate-950 border border-cyan-500/30 space-y-5">
              <div className="flex items-center justify-between flex-wrap gap-4 border-b border-slate-800 pb-4">
                <div>
                  <span className="text-[10px] font-mono text-cyan-400 uppercase tracking-wider font-bold">
                    NILAI AKHIR EVALUASI
                  </span>
                  <div className="text-3xl font-black text-slate-100 font-mono">
                    {result.percentage}%
                  </div>
                  <p className="text-[11px] text-slate-400 font-mono mt-0.5">
                    Skor Mentah: {result.rawScore} / {result.maximumScore} poin
                  </p>
                </div>

                <div className="text-right">
                  <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider font-bold">
                    KATEGORI / PREDIKAT
                  </span>
                  <div className="text-lg font-black text-cyan-300 font-mono bg-cyan-950 px-3.5 py-1 rounded-xl border border-cyan-500/40">
                    {result.grade}
                  </div>
                  <p className="text-[11px] text-slate-300 font-semibold mt-1">
                    {result.thresholdTitle}
                  </p>
                </div>
              </div>

              {/* Aspect Breakdown Table */}
              {result.aspects && result.aspects.length > 0 && (
                <div className="space-y-3">
                  <h3 className="text-xs font-bold text-slate-300 font-mono uppercase tracking-wider">
                    Breakdown Skor Per Aspek Penilaian
                  </h3>
                  <div className="overflow-x-auto rounded-xl border border-slate-800">
                    <table className="w-full text-xs text-left text-slate-300">
                      <thead className="bg-slate-900 text-slate-400 font-mono uppercase text-[10px]">
                        <tr>
                          <th className="p-3">Aspek Penilaian</th>
                          <th className="p-3 text-center">Skor Mentah</th>
                          <th className="p-3 text-center">Persentase</th>
                          <th className="p-3 text-center">Bobot Tahap</th>
                          <th className="p-3 text-right">Kontribusi</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800 font-mono bg-slate-950">
                        {result.aspects.map((asp) => (
                          <tr key={asp.aspectId} className="hover:bg-slate-900/50">
                            <td className="p-3 font-sans font-bold text-slate-200">{asp.title}</td>
                            <td className="p-3 text-center text-slate-400">{asp.rawScore} / {asp.maximumScore}</td>
                            <td className="p-3 text-center text-cyan-400 font-bold">{asp.percentage}%</td>
                            <td className="p-3 text-center text-slate-400">{asp.weightPercentage}%</td>
                            <td className="p-3 text-right text-emerald-400 font-bold">+{asp.weightedContribution}%</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Question & Indicator Breakdown */}
              {result.questions && result.questions.length > 0 && (
                <div className="space-y-3 pt-2">
                  <h3 className="text-xs font-bold text-slate-300 font-mono uppercase tracking-wider">
                    Breakdown Skor Per Pertanyaan & Indikator
                  </h3>

                  <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
                    {result.questions.map((q) => (
                      <div key={q.questionId} className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
                        <div className="flex items-start justify-between gap-3">
                          <div className="space-y-0.5 min-w-0">
                            <span className="text-[10px] font-mono text-cyan-400 font-bold uppercase">
                              Tipe: {q.questionType}
                            </span>
                            <p className="text-xs font-bold text-slate-100">{q.prompt}</p>
                          </div>

                          {q.includedInTotal ? (
                            <span className="text-xs font-mono font-bold text-cyan-300 bg-cyan-950 px-2.5 py-1 rounded-lg border border-cyan-500/40 flex-shrink-0">
                              {q.rawScore} / {q.maximumScore} Poin ({q.percentage}%)
                            </span>
                          ) : (
                            <span className="text-[10px] font-mono text-slate-500 bg-slate-950 px-2 py-0.5 rounded border border-slate-800 flex-shrink-0">
                              Non-Skor
                            </span>
                          )}
                        </div>

                        {/* Indicator Table Breakdown Details */}
                        {q.details?.indicators && q.details.indicators.length > 0 && (
                          <div className="pt-2">
                            <div className="overflow-x-auto rounded-lg border border-slate-800">
                              <table className="w-full text-[11px] text-slate-300">
                                <thead className="bg-slate-950 text-slate-400 font-mono text-[9px] uppercase">
                                  <tr>
                                    <th className="p-2 px-3 text-left">Indikator</th>
                                    <th className="p-2 text-center">Nilai Skala Terpilih</th>
                                    <th className="p-2 text-right">Skor Poin</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-800/60 bg-slate-950/80 font-mono">
                                  {q.details.indicators.map((ind: any) => (
                                    <tr key={ind.indicatorId}>
                                      <td className="p-2 px-3 font-sans font-medium text-slate-300">{ind.label}</td>
                                      <td className="p-2 text-center text-cyan-300 font-bold">
                                        {ind.selectedValue !== undefined ? ind.selectedValue : 'Belum diisi'}
                                      </td>
                                      <td className="p-2 text-right text-emerald-400 font-bold">
                                        {ind.score} / {ind.maximumScore}
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* Raw Answers Payload Fallback View */
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-semibold text-slate-300 uppercase tracking-wider font-mono">
                  Rincian Jawaban Responden Mentah ({answerEntries.length} Butir Soal Terisi)
                </h3>
                <span className="text-[10px] text-emerald-400 font-mono">
                  Terkirim: {new Date(responseDoc.submittedAt || responseDoc.updatedAt).toLocaleString('id-ID')}
                </span>
              </div>

              {answerEntries.length === 0 ? (
                <div className="p-6 text-center text-xs text-slate-500 bg-slate-950 rounded-2xl border border-slate-800">
                  Belum ada jawaban terisi pada sesi respon ini.
                </div>
              ) : (
                <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
                  {answerEntries.map(([qId, val]) => (
                    <div key={qId} className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                      <div className="text-[11px] font-mono text-cyan-400 font-semibold">Question ID: {qId}</div>
                      <pre className="text-xs font-mono text-slate-200 bg-slate-900/60 p-2.5 rounded-lg border border-slate-800/80 overflow-x-auto whitespace-pre-wrap">
                        {typeof val === 'object' ? JSON.stringify(val, null, 2) : String(val)}
                      </pre>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
