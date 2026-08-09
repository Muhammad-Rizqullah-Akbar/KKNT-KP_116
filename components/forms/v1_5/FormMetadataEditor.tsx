'use client'

import React from 'react'
import type { FormMetadata, FormKind, FormStatus } from '@/lib/forms/v1_5/types'
import { FORM_KINDS, FORM_STATUSES } from '@/lib/forms/v1_5/types'

interface FormMetadataEditorProps {
  metadata: FormMetadata
  onChange: (update: Partial<FormMetadata>) => void
}

export function FormMetadataEditor({ metadata, onChange }: FormMetadataEditorProps) {
  return (
    <div className="space-y-4 p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-md">
      <div className="flex items-center justify-between pb-3 border-b border-slate-800">
        <h3 className="text-sm font-semibold text-slate-100 flex items-center gap-2">
          <span>Metadata Formulir V1.5</span>
        </h3>
        <span className="text-[11px] font-mono text-cyan-400 bg-cyan-950/60 border border-cyan-500/30 px-2 py-0.5 rounded-full">
          Canonical Form Metadata
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Title */}
        <div className="md:col-span-2">
          <label className="block text-xs font-medium text-slate-300 mb-1">
            Judul Formulir <span className="text-rose-400">*</span>
          </label>
          <input
            type="text"
            value={metadata.title}
            onChange={(e) => onChange({ title: e.target.value })}
            placeholder="Masukkan judul resmi formulir..."
            className="w-full bg-slate-950 border border-slate-700 text-slate-100 text-sm font-semibold rounded-xl px-3.5 py-2.5 focus:outline-none focus:border-cyan-500"
          />
        </div>

        {/* Description */}
        <div className="md:col-span-2">
          <label className="block text-xs font-medium text-slate-300 mb-1">Deskripsi / Penjelasan Formulir</label>
          <textarea
            rows={3}
            value={metadata.description || ''}
            onChange={(e) => onChange({ description: e.target.value })}
            placeholder="Deskripsi singkat mengenai maksud dan tujuan formulir..."
            className="w-full bg-slate-950 border border-slate-700 text-slate-200 text-xs rounded-xl px-3.5 py-2.5 focus:outline-none focus:border-cyan-500"
          />
        </div>

        {/* Category */}
        <div>
          <label className="block text-xs font-medium text-slate-300 mb-1">Kategori</label>
          <input
            type="text"
            value={metadata.category || ''}
            onChange={(e) => onChange({ category: e.target.value })}
            placeholder="Contoh: Kuesioner, Evaluasi, Observasi..."
            className="w-full bg-slate-950 border border-slate-700 text-slate-200 text-xs rounded-xl px-3.5 py-2.5 focus:outline-none focus:border-cyan-500"
          />
        </div>

        {/* Target Audience */}
        <div>
          <label className="block text-xs font-medium text-slate-300 mb-1">Target Responden</label>
          <input
            type="text"
            value={metadata.target || ''}
            onChange={(e) => onChange({ target: e.target.value })}
            placeholder="Contoh: Siswa Sekolah, Kader BPOM, Umum..."
            className="w-full bg-slate-950 border border-slate-700 text-slate-200 text-xs rounded-xl px-3.5 py-2.5 focus:outline-none focus:border-cyan-500"
          />
        </div>

        {/* Form Kind */}
        <div>
          <label className="block text-xs font-medium text-slate-300 mb-1">Jenis Formulir (Kind)</label>
          <select
            value={metadata.kind}
            onChange={(e) => onChange({ kind: e.target.value as FormKind })}
            className="w-full bg-slate-950 border border-slate-700 text-slate-200 text-xs rounded-xl px-3.5 py-2.5 focus:outline-none focus:border-cyan-500"
          >
            {FORM_KINDS.map((kind) => (
              <option key={kind} value={kind}>
                {kind === 'official' ? 'Official (Resmi BPOM)' : 'User-created (Kader / Komunitas)'}
              </option>
            ))}
          </select>
        </div>

        {/* Form Status */}
        <div>
          <label className="block text-xs font-medium text-slate-300 mb-1">Status Formulir</label>
          <select
            value={metadata.status}
            onChange={(e) => onChange({ status: e.target.value as FormStatus })}
            className="w-full bg-slate-950 border border-slate-700 text-slate-200 text-xs rounded-xl px-3.5 py-2.5 focus:outline-none focus:border-cyan-500"
          >
            {FORM_STATUSES.map((st) => (
              <option key={st} value={st}>
                {st.toUpperCase()}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  )
}
