'use client'

import React, { use, useEffect, useState } from 'react'
import Link from 'next/link'
import { Icon } from '@/components/ui/Icons'
import { PublicCompletionReceipt } from '@/components/forms/v1_5/PublicCompletionReceipt'

interface ResponsePageProps {
  params: Promise<{ responseId: string }>
}

export default function ResponseResultPage({ params }: ResponsePageProps) {
  const resolvedParams = use(params)
  const responseId = resolvedParams.responseId

  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [receipt, setReceipt] = useState<{
    responseId: string
    code: string
    submittedAt: string
    result?: any
  } | null>(null)

  useEffect(() => {
    async function loadReceipt() {
      setIsLoading(true)
      setError(null)
      try {
        const res = await fetch(`/api/v1_5/public/responses/${responseId}`)
        const data = await res.json()
        if (!res.ok || !data.success) {
          throw new Error(data.message || 'Hasil evaluasi tidak ditemukan.')
        }
        setReceipt(data.receipt)
      } catch (err: any) {
        setError(err.message || 'Terjadi kesalahan saat memuat hasil evaluasi.')
      } finally {
        setIsLoading(false)
      }
    }

    if (responseId) loadReceipt()
  }, [responseId])

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-slate-400 font-sans p-4">
        <Icon name="loader" className="w-8 h-8 text-cyan-400 animate-spin mb-3" />
        <p className="text-sm font-semibold">Memuat Sertifikat Hasil Evaluasi...</p>
        <p className="text-xs text-slate-600 mt-1 font-mono">Response ID: {responseId}</p>
      </div>
    )
  }

  if (error || !receipt) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-slate-400 font-sans p-6">
        <div className="p-8 max-w-md w-full rounded-3xl bg-slate-900 border border-slate-800 text-center space-y-4 shadow-2xl">
          <div className="w-14 h-14 rounded-2xl bg-amber-500/10 text-amber-400 flex items-center justify-center mx-auto border border-amber-500/20">
            <Icon name="alertCircle" className="w-7 h-7" />
          </div>
          <h2 className="text-lg font-bold text-slate-100 font-sans">Hasil Evaluasi Tidak Ditemukan</h2>
          <p className="text-xs text-slate-300 leading-relaxed font-sans">{error || 'ID Tanggapan tidak valid atau belum diselesaikan.'}</p>
          <div className="pt-2">
            <Link
              href="/"
              className="inline-block px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition-colors"
            >
              Kembali ke Beranda
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <PublicCompletionReceipt
      responseId={receipt.responseId}
      code={receipt.code}
      submittedAt={receipt.submittedAt}
      result={receipt.result}
    />
  )
}
