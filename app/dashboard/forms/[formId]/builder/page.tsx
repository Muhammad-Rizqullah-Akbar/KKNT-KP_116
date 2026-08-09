'use client'

import React, { useEffect, useState, use } from 'react'
import { useRouter } from 'next/navigation'
import { FormBuilderV2 } from '@/components/forms/v1_5/FormBuilderV2'
import type { FormAggregateDoc } from '@/lib/firebase/repositories/v1_5/v1_5Forms.repo'
import { formAggregateToBuilderState } from '@/lib/forms/v1_5/formConverters'
import type { BuilderState } from '@/lib/forms/v1_5/builderState'
import { Icon } from '@/components/ui/Icons'

interface PageProps {
  params: Promise<{ formId: string }>
}

export default function FormIdBuilderPage({ params }: PageProps) {
  const { formId } = use(params)
  const router = useRouter()
  const [formDoc, setFormDoc] = useState<FormAggregateDoc | null>(null)
  const [builderState, setBuilderState] = useState<BuilderState | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // 1 FIRESTORE READ via GET /api/v1_5/forms/[formId]
  const loadFormAggregate = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/v1_5/forms/${formId}`)
      const data = await res.json()

      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Gagal memuat data formulir.')
      }

      if (data.form) {
        setFormDoc(data.form)
        setBuilderState(formAggregateToBuilderState(data.form))
      } else {
        throw new Error('Formulir tidak ditemukan atau belum dipublikasikan.')
      }
    } catch (err: any) {
      setError(err.message || 'Terjadi kesalahan sistem.')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadFormAggregate()
  }, [formId])

  // Save Draft to Server
  const handleSaveDraftToServer = async (state: BuilderState) => {
    const res = await fetch(`/api/v1_5/forms/${formId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ state }),
    })
    const data = await res.json()
    if (!res.ok || !data.success) {
      throw new Error(data.message || 'Gagal menyimpan draft ke server.')
    }
    setFormDoc(data.form)
    setBuilderState(formAggregateToBuilderState(data.form))
  }

  // Publish Atomic Version Snapshot
  const handlePublishVersion = async () => {
    const res = await fetch(`/api/v1_5/forms/${formId}/publish`, {
      method: 'POST',
    })
    const data = await res.json()
    if (!res.ok || !data.success) {
      throw new Error(data.message || 'Gagal mempublikasikan versi.')
    }
    setFormDoc(data.aggregate)
    setBuilderState(formAggregateToBuilderState(data.aggregate))
  }

  // Create New Version
  const handleCreateNewVersion = async () => {
    const res = await fetch(`/api/v1_5/forms/${formId}/new-version`, {
      method: 'POST',
    })
    const data = await res.json()
    if (!res.ok || !data.success) {
      throw new Error(data.message || 'Gagal membuat versi draft baru.')
    }
    setFormDoc(data.form)
    setBuilderState(formAggregateToBuilderState(data.form))
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-slate-400 font-sans">
        <Icon name="loader" className="w-8 h-8 text-cyan-400 animate-spin mb-3" />
        <p className="text-sm font-semibold">Memuat Form Builder V2 (1-Read Aggregate)...</p>
        <p className="text-xs text-slate-600 mt-1 font-mono">Form ID: {formId}</p>
      </div>
    )
  }

  if (error || !builderState || !formDoc) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-slate-400 font-sans p-6">
        <div className="p-6 max-w-md w-full rounded-2xl bg-slate-900 border border-slate-800 text-center space-y-4 shadow-2xl">
          <div className="w-12 h-12 rounded-full bg-rose-500/10 text-rose-400 flex items-center justify-center mx-auto border border-rose-500/20">
            <Icon name="alertCircle" className="w-6 h-6" />
          </div>
          <h2 className="text-base font-bold text-slate-100">Gagal Memuat Formulir</h2>
          <p className="text-xs text-slate-400">{error || 'Data tidak ditemukan.'}</p>
          <div className="flex gap-2 justify-center pt-2">
            <button
              onClick={() => router.push('/dashboard/forms')}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold"
            >
              Kembali ke Daftar
            </button>
            <button
              onClick={loadFormAggregate}
              className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold"
            >
              Coba Lagi
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <FormBuilderV2
      formId={formDoc.formId}
      activeVersionId={formDoc.activeVersionId}
      activeVersionNumber={formDoc.activeVersionNumber}
      initialState={builderState}
      onSaveDraftToServer={handleSaveDraftToServer}
      onPublishVersion={handlePublishVersion}
      onCreateNewVersion={handleCreateNewVersion}
    />
  )
}
