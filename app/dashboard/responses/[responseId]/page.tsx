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
  const [searchQuery, setSearchQuery] = useState('')
  const [filterType, setFilterType] = useState<'all' | 'low_score' | 'indicators'>('all')

  const loadResponse = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/v1_5/responses/${responseId}`)
      const data = await res.json()

      if (data.success && data.response) {
        const resp = data.response
        setResponseDoc(resp)
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

  const handlePrint = () => {
    window.print()
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-slate-400 font-sans">
        <Icon name="loader" className="w-8 h-8 text-cyan-400 animate-spin mb-3" />
        <p className="text-sm font-semibold">Memuat Laporan Hasil Penilaian Responden...</p>
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
          <h2 className="text-base font-bold text-slate-100">Gagal Memuat Laporan</h2>
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

  // Low score indicators
  const lowScoreQuestions = result?.questions?.filter((q: any) => q.includedInTotal && q.percentage < 60) || []
  const allIndicators: Array<{ questionPrompt: string; label: string; score: number; max: number; value: any }> = []

  result?.questions?.forEach((q: any) => {
    if (q.details?.indicators) {
      q.details.indicators.forEach((ind: any) => {
        allIndicators.push({
          questionPrompt: q.prompt,
          label: ind.label,
          score: ind.score || 0,
          max: ind.maximumScore || 5,
          value: ind.selectedValue,
        })
      })
    }
  })

  const lowScoreIndicators = allIndicators.filter((ind) => ind.max > 0 && (ind.score / ind.max) < 0.6)

  // Filtered Question Results
  const filteredQuestionResults = (result?.questions || []).filter((q: any) => {
    const matchesSearch =
      q.prompt.toLowerCase().includes(searchQuery.toLowerCase()) ||
      q.questionId.toLowerCase().includes(searchQuery.toLowerCase())

    if (!matchesSearch) return false
    if (filterType === 'low_score') return q.percentage < 60
    if (filterType === 'indicators') return !!q.details?.indicators?.length
    return true
  })

  return (
    <div className="flex flex-col min-h-screen bg-slate-950 text-slate-100 font-sans print:bg-white print:text-black">
      <style>{`
        @media print {
          @page {
            size: A4 portrait;
            margin: 12mm 10mm 12mm 10mm;
          }
          body {
            background-color: #ffffff !important;
            color: #0f172a !important;
            font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          .print\\:hidden {
            display: none !important;
          }
          tr, .p-5, .p-6, .rounded-3xl, .rounded-2xl, .space-y-6 > div {
            break-inside: avoid !important;
            page-break-inside: avoid !important;
          }
        }
      `}</style>

      {/* Non-printable Topbar */}
      <div className="print:hidden">
        <Topbar
          title={`Detail Hasil Penilaian — ${responseDoc.responseId}`}
          subtitle="Detail hasil evaluasi kuesioner, rincian skor indikator, dan rekapitulasi jawaban responden"
        />
      </div>

      {/* Main Container */}
      <div className="flex-1 p-4 sm:p-6 space-y-6 max-w-6xl mx-auto w-full print:p-0 print:max-w-none print:bg-white print:text-black">
        {/* Navigation & Action Header */}
        <div className="flex items-center justify-between gap-4 flex-wrap print:hidden">
          <Link
            href="/dashboard/responses"
            className="inline-flex items-center gap-2 text-xs font-bold text-cyan-400 hover:text-cyan-300 transition-colors"
          >
            <Icon name="arrowLeft" className="w-4 h-4" />
            <span>Kembali ke Daftar Respon</span>
          </Link>

          <div className="flex items-center gap-3">
            <Link
              href="/dashboard/responses"
              className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold border border-slate-700 flex items-center gap-1.5 transition-all"
            >
              <span>Tutup Detail</span>
            </Link>
          </div>
        </div>

        {/* PRINT-ONLY OFFICIAL HEADER */}
        <div className="hidden print:block mb-6 text-center border-b-2 border-black pb-4 space-y-1">
          <h1 className="text-xl font-black uppercase tracking-wide">BADAN PENGAWAS OBAT DAN MAKANAN (BPOM)</h1>
          <h2 className="text-sm font-bold uppercase">LAPORAN HASIL EVALUASI PANGAN & KEBIASAAN SEHAT</h2>
          <p className="text-xs italic">Dokumen Hasil Penilaian Resmi — Nomor Respon: {responseDoc.responseId}</p>
        </div>

        {/* HERO RESPONDENT & EVALUATION SUMMARY CARD */}
        <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 space-y-6 shadow-xl print:border-black print:bg-white print:p-4 print:shadow-none">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800 print:border-black">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2.5 flex-wrap">
                <span className="font-mono text-cyan-300 font-extrabold text-sm px-3 py-1 rounded-xl bg-cyan-950 border border-cyan-500/40 print:border-black print:bg-gray-100 print:text-black">
                  {responseDoc.responseId}
                </span>
                <span className="text-xs font-bold px-3 py-1 rounded-lg uppercase border bg-emerald-500/10 text-emerald-300 border-emerald-500/30 print:bg-green-100 print:text-black">
                  TERVERIFIKASI ✓
                </span>
                <span className="text-xs font-mono font-bold px-3 py-1 rounded-lg uppercase border bg-purple-500/10 text-purple-300 border-purple-500/30 print:bg-purple-100 print:text-black">
                  {responseDoc.distributionCode ? `V1.5 (v${responseDoc.versionNumber})` : 'V1.0 Legacy'}
                </span>
              </div>

              <h2 className="text-lg font-extrabold text-slate-100 print:text-black">
                Responden: {responseDoc.respondent?.name || 'Anonim / Publik'}
              </h2>
              <div className="flex items-center gap-4 text-xs text-slate-400 font-mono flex-wrap print:text-gray-700">
                {responseDoc.respondent?.email && <span>Email: {responseDoc.respondent.email}</span>}
                {responseDoc.respondent?.phone && <span>Telp: {responseDoc.respondent.phone}</span>}
                {(responseDoc.respondent as any)?.address && <span>Lokasi: {(responseDoc.respondent as any).address}</span>}
              </div>
            </div>

            <div className="text-left sm:text-right space-y-1 font-mono text-xs text-slate-400 print:text-gray-700">
              <div>Kode Akses: <strong className="text-cyan-300 print:text-black">{responseDoc.distributionCode || 'N/A'}</strong></div>
              <div>Form ID: <strong className="text-slate-200 print:text-black">{responseDoc.formId}</strong></div>
              <div>Waktu Selesai: <strong className="text-slate-300 print:text-black">{new Date(responseDoc.submittedAt || responseDoc.updatedAt || Date.now()).toLocaleString('id-ID')}</strong></div>
            </div>
          </div>

          {/* INSIGHT SUMMARY CARDS GRID */}
          {result && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 print:grid-cols-2">
              {/* Card 1: Total Score */}
              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-1 print:border-black print:bg-gray-50">
                <span className="text-[10px] font-mono font-bold text-cyan-400 uppercase tracking-wider print:text-black">
                  Nilai Akhir Evaluasi
                </span>
                <div className="text-3xl font-black text-slate-100 font-mono tracking-tight print:text-black">
                  {result.percentage}%
                </div>
                <p className="text-[11px] text-slate-400 font-mono print:text-gray-600">
                  {result.rawScore} dari {result.maximumScore} total poin
                </p>
              </div>

              {/* Card 2: Predikat / Grade */}
              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-1 print:border-black print:bg-gray-50">
                <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider print:text-black">
                  Predikat / Kategori
                </span>
                <div className="text-xl font-black text-cyan-300 font-mono print:text-black">
                  Grade {result.grade}
                </div>
                <p className="text-[11px] font-bold text-slate-200 truncate print:text-black">
                  {result.thresholdTitle}
                </p>
              </div>

              {/* Card 3: Needs Attention Counter */}
              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-1 print:border-black print:bg-gray-50">
                <span className="text-[10px] font-mono font-bold text-amber-400 uppercase tracking-wider print:text-black">
                  Indikator Perlu Perbaikan
                </span>
                <div className="text-3xl font-black text-amber-400 font-mono print:text-black">
                  {lowScoreIndicators.length + lowScoreQuestions.length}
                </div>
                <p className="text-[11px] text-slate-400 print:text-gray-600">
                  {lowScoreIndicators.length + lowScoreQuestions.length === 0 ? 'Semua indikator baik ✓' : 'Perlu pembinaan lanjutan'}
                </p>
              </div>

              {/* Card 4: Answered Questions Counter */}
              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-1 print:border-black print:bg-gray-50">
                <span className="text-[10px] font-mono font-bold text-purple-400 uppercase tracking-wider print:text-black">
                  Jawaban Terisi
                </span>
                <div className="text-3xl font-black text-purple-300 font-mono print:text-black">
                  {answerEntries.length}
                </div>
                <p className="text-[11px] text-slate-400 print:text-gray-600">
                  Butir soal terisi oleh responden
                </p>
              </div>
            </div>
          )}
        </div>

        {/* ASPECT BREAKDOWN CARDS IF PRESENT */}
        {result?.aspects && result.aspects.length > 0 && (
          <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 space-y-4 shadow-xl print:border-black print:bg-white">
            <h3 className="text-xs font-bold text-cyan-300 font-mono uppercase tracking-wider flex items-center gap-2 print:text-black">
              <Icon name="layers" className="w-4 h-4" />
              <span>Rincian Hasil Evaluasi per Aspek Penilaian</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {result.aspects.map((asp: any, idx: number) => (
                <div key={asp.aspectId || idx} className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3 print:border-black print:bg-gray-50">
                  <div className="flex justify-between items-start gap-2">
                    <div>
                      <h4 className="text-xs font-bold text-slate-100 print:text-black">{asp.title}</h4>
                      <p className="text-[10px] font-mono text-slate-400 print:text-gray-600">
                        Skor: {asp.rawScore} / {asp.maximumScore} poin
                      </p>
                    </div>
                    <span className="text-sm font-black font-mono text-cyan-300 bg-cyan-950 px-2.5 py-1 rounded-xl border border-cyan-500/30 print:border-black print:bg-gray-200 print:text-black">
                      {asp.percentage}%
                    </span>
                  </div>

                  <div className="w-full bg-slate-900 rounded-full h-2 overflow-hidden border border-slate-800 print:border-black">
                    <div
                      className={`h-full rounded-full transition-all ${
                        asp.percentage >= 80
                          ? 'bg-emerald-400'
                          : asp.percentage >= 60
                          ? 'bg-cyan-400'
                          : 'bg-amber-400'
                      }`}
                      style={{ width: `${Math.min(100, Math.max(0, asp.percentage))}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* DETAILED RESPONDENT ANSWERS DATA WORKSPACE (SAMA DENGAN DOKUMEN RESPONDEN LAMA) */}
        <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 space-y-5 shadow-xl print:border-black print:bg-white">
          <div className="flex items-center justify-between border-b border-slate-800 pb-4 print:border-black">
            <h3 className="text-xs font-bold text-slate-100 font-mono uppercase tracking-wider flex items-center gap-2 print:text-black">
              <Icon name="fileText" className="w-4 h-4 text-cyan-400" />
              <span>Rincian Data Jawaban yang Diisi Responden ({answerEntries.length} Butir)</span>
            </h3>

            <span className="text-[10px] text-cyan-400 font-mono">
              Terkirim: {new Date(responseDoc.submittedAt || responseDoc.updatedAt || Date.now()).toLocaleString('id-ID')}
            </span>
          </div>

          {answerEntries.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-500 bg-slate-950 rounded-2xl border border-slate-800">
              Belum ada data jawaban terisi pada kuesioner ini.
            </div>
          ) : (
            <div className="space-y-3 max-h-[600px] overflow-y-auto pr-1 print:max-h-none print:overflow-visible">
              {answerEntries.map(([key, val], idx) => {
                const isTableObj = typeof val === 'object' && val !== null && !Array.isArray(val)
                const isArrayVal = Array.isArray(val)

                return (
                  <div key={key || idx} className="p-4 rounded-2xl bg-slate-950 border border-slate-800/80 space-y-2 print:border-black print:bg-gray-50">
                    <div className="flex items-center justify-between text-xs font-mono font-bold text-cyan-400 print:text-black">
                      <span>Pertanyaan #{String(idx + 1).padStart(2, '0')}</span>
                    </div>

                    <h4 className="text-xs font-bold text-slate-100 font-sans print:text-black">{key}</h4>

                    {isTableObj ? (
                      <div className="overflow-x-auto rounded-xl border border-slate-800/80 print:border-black mt-2">
                        <table className="w-full text-xs text-left text-slate-300 print:text-black font-mono">
                          <thead className="bg-slate-900 text-slate-400 text-[10px] uppercase print:bg-gray-200 print:text-black">
                            <tr>
                              <th className="p-2.5 px-3.5 font-sans">Indikator</th>
                              <th className="p-2.5 text-right font-sans">Jawaban Terpilih</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-800/80 bg-slate-950 print:bg-white print:divide-gray-300">
                            {Object.entries(val).map(([indLabel, indVal]) => (
                              <tr key={indLabel}>
                                <td className="p-2.5 px-3.5 font-sans font-medium text-slate-200 print:text-black">{indLabel}</td>
                                <td className="p-2.5 text-right font-bold text-cyan-300 print:text-black">
                                  {typeof indVal === 'object' ? JSON.stringify(indVal) : String(indVal)}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : isArrayVal ? (
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {val.map((item: any, i: number) => (
                          <span
                            key={i}
                            className="px-3 py-1 rounded-xl bg-cyan-950 border border-cyan-500/40 text-xs font-mono text-cyan-300 font-semibold print:border-black print:bg-gray-200 print:text-black"
                          >
                            {typeof item === 'object' ? JSON.stringify(item) : String(item)}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <div className="p-3 rounded-xl bg-slate-900 border border-slate-800/60 text-xs font-mono font-semibold text-slate-200 print:border-black print:bg-white print:text-black">
                        {String(val)}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* PRINT-ONLY OFFICIAL SIGNATURE SECTION */}
        <div className="hidden print:block pt-12 space-y-12 text-xs">
          <div className="flex justify-between items-end px-8">
            <div className="text-center space-y-12">
              <p>Cadre / Inspektor Pendamping,</p>
              <div className="border-b border-black w-48 mx-auto" />
              <p className="font-bold">( {responseDoc.respondent?.name || 'Kader Lapangan'} )</p>
            </div>

            <div className="text-center space-y-12">
              <p>Penanggung Jawab Tim BPOM,</p>
              <div className="border-b border-black w-48 mx-auto" />
              <p className="font-bold">( NIP. ........................................ )</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
