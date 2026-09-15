'use client'

import Link from 'next/link'
import { Icon } from '@/components/ui/Icons'
import type { FormData as FormRecord } from '@/lib/repositories/forms.repo'

type FormCardProps = {
  form: FormRecord
  isDuplicating: boolean
  onCopyCode: (code: string) => void
  onToggleStatus: (formId?: string, currentStatus?: string) => void
  onPreview: (form: FormRecord) => void
  onDuplicate: (form: FormRecord) => void
  onDelete: (formId?: string, title?: string) => void
}

export default function FormCard({ form, isDuplicating, onCopyCode, onToggleStatus, onPreview, onDuplicate, onDelete }: FormCardProps) {
  const isPublished = form.status === 'published'
  const qCount = form.questions?.length || 0

  return (
    <div
      key={form.id}
      className="rounded-3xl bg-slate-900/80 border border-slate-800/80 hover:border-indigo-500/40 p-5 flex flex-col justify-between space-y-4 transition-all hover:shadow-xl hover:shadow-indigo-500/5 group"
    >
      <div className="space-y-3">
        {/* Header Badges */}
        <div className="flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={() => onCopyCode(form.code || form.id || '')}
            className="font-mono text-[11px] font-bold px-2.5 py-1 rounded-lg bg-slate-950 text-indigo-300 border border-indigo-500/30 hover:border-indigo-500/60 transition-colors flex items-center gap-1.5"
            title="Klik untuk salin kode kuesioner"
          >
            <Icon name="copy" className="w-3 h-3 text-indigo-400" />
            <span>{form.code || form.id}</span>
          </button>

          <span
            className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-md uppercase border ${
              isPublished
                ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'
                : 'bg-amber-500/10 text-amber-300 border-amber-500/30'
            }`}
          >
            {form.status}
          </span>
        </div>

        {/* Title & Description */}
        <div>
          <h3 className="text-base font-bold text-slate-100 group-hover:text-indigo-300 transition-colors line-clamp-2">
            {form.title || 'Formulir Tanpa Judul'}
          </h3>
          <p className="text-xs text-slate-400 mt-1 line-clamp-2">
            {form.description || 'Tidak ada deskripsi kuesioner.'}
          </p>
        </div>

        {/* Metadata Details */}
        <div className="pt-2 flex flex-wrap items-center gap-2 text-[11px] text-slate-400 font-mono">
          <span className="px-2 py-0.5 rounded bg-slate-950 border border-slate-800">
            {form.category || 'Umum'}
          </span>
          <span>•</span>
          <span>{qCount} Soal</span>
          <span>•</span>
          <span className="text-emerald-400 font-bold">{form.filledCount || 0} Terisi</span>
        </div>
      </div>

      {/* Actions Footer */}
      <div className="pt-4 border-t border-slate-800/80 flex items-center justify-between gap-2">
        <button
          type="button"
          onClick={() => onToggleStatus(form.id, form.status)}
          className={`px-3 py-1.5 rounded-xl border text-xs font-semibold transition-colors ${
            isPublished
              ? 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
              : 'bg-emerald-950/40 hover:bg-emerald-900/50 text-emerald-300 border-emerald-500/40'
          }`}
        >
          {isPublished ? 'Ubah ke Draft' : 'Publikasikan'}
        </button>

        <div className="flex items-center gap-1.5">
          {/* Preview Button */}
          <button
            type="button"
            onClick={() => onPreview(form)}
            className="p-2 rounded-xl bg-slate-800 hover:bg-cyan-600/30 text-slate-300 hover:text-cyan-300 border border-slate-700 hover:border-cyan-500/40 transition-colors"
            title="Pratinjau Kuesioner (Preview)"
          >
            <Icon name="eye" className="w-4 h-4 text-cyan-400" />
          </button>

          {/* Duplicate / Salin Button */}
          <button
            type="button"
            onClick={() => onDuplicate(form)}
            disabled={isDuplicating}
            className="p-2 rounded-xl bg-slate-800 hover:bg-purple-600/30 text-slate-300 hover:text-purple-300 border border-slate-700 hover:border-purple-500/40 transition-colors disabled:opacity-50"
            title="Duplikasi / Salin Kuesioner"
          >
            {isDuplicating ? (
              <Icon name="loader" className="w-4 h-4 text-purple-400 animate-spin" />
            ) : (
              <Icon name="copy" className="w-4 h-4 text-purple-400" />
            )}
          </button>

          {/* Edit Button */}
          <Link
            href={`/dashboard/form-builder?id=${form.id}`}
            className="p-2 rounded-xl bg-slate-800 hover:bg-indigo-600 text-slate-300 hover:text-white border border-slate-700 transition-colors"
            title="Buka Editor Formulir"
          >
            <Icon name="pencil" className="w-4 h-4" />
          </Link>

          {/* Delete Button */}
          <button
            type="button"
            onClick={() => onDelete(form.id, form.title)}
            className="p-2 rounded-xl bg-slate-800 hover:bg-rose-950 text-slate-400 hover:text-rose-300 border border-slate-700 hover:border-rose-800 transition-colors"
            title="Hapus Formulir"
          >
            <Icon name="trash" className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  )
}
