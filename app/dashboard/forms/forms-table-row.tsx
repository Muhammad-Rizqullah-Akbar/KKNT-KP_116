'use client'

import Link from 'next/link'
import { Icon } from '@/components/ui/Icons'
import type { FormData as LegacyFormData } from '@/lib/repositories/forms.repo'

type FormTableRowProps = {
  form: LegacyFormData
  isDuplicating: boolean
  onCopyCode: (code: string) => void
  onToggleStatus: (formId?: string, currentStatus?: string) => void
  onPreview: (form: LegacyFormData) => void
  onDuplicate: (form: LegacyFormData) => void
  onDelete: (formId?: string, title?: string) => void
}

export default function FormTableRow({ form, isDuplicating, onCopyCode, onToggleStatus, onPreview, onDuplicate, onDelete }: FormTableRowProps) {
  const isPublished = form.status === 'published'

  return (
    <tr key={form.id} className="hover:bg-slate-800/40 transition-colors">
      <td className="px-5 py-4 space-y-0.5 max-w-xs">
        <div className="font-bold text-slate-100 text-sm truncate">{form.title || 'Formulir V1.0'}</div>
        <button
          type="button"
          onClick={() => onCopyCode(form.code || form.id || '')}
          className="font-mono text-[11px] text-indigo-400 hover:underline flex items-center gap-1"
          title="Klik untuk salin kode"
        >
          <span>Kode: {form.code || form.id}</span>
          <Icon name="copy" className="w-3 h-3 text-indigo-400/70" />
        </button>
      </td>

      <td className="px-5 py-4 space-y-0.5">
        <div className="text-slate-200 font-semibold">{form.category || 'Umum'}</div>
        <div className="text-[11px] text-slate-400">{form.target || 'Masyarakat'}</div>
      </td>

      <td className="px-5 py-4">
        <span
          className={`px-2.5 py-1 rounded-md text-[11px] font-extrabold uppercase border ${
            isPublished
              ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'
              : 'bg-amber-500/10 text-amber-300 border-amber-500/30'
          }`}
        >
          {form.status}
        </span>
      </td>

      <td className="px-5 py-4 text-slate-400 font-mono">
        {form.questions?.length || 0} Pertanyaan
      </td>

      <td className="px-5 py-4 font-mono font-bold text-emerald-400">
        {form.filledCount || 0} pengisian
      </td>

      <td className="px-5 py-4 text-right">
        <div className="flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={() => onToggleStatus(form.id, form.status)}
            className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold"
          >
            {isPublished ? 'Ubah ke Draft' : 'Publikasikan'}
          </button>

          {/* Preview Button */}
          <button
            type="button"
            onClick={() => onPreview(form)}
            className="p-2 rounded-xl bg-slate-800 hover:bg-cyan-600/30 text-slate-300 hover:text-cyan-300 border border-slate-700 transition-colors"
            title="Pratinjau Kuesioner (Preview)"
          >
            <Icon name="eye" className="w-4 h-4 text-cyan-400" />
          </button>

          {/* Duplicate / Salin Button */}
          <button
            type="button"
            onClick={() => onDuplicate(form)}
            disabled={isDuplicating}
            className="p-2 rounded-xl bg-slate-800 hover:bg-purple-600/30 text-slate-300 hover:text-purple-300 border border-slate-700 transition-colors disabled:opacity-50"
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
            title="Edit Form V1.0"
          >
            <Icon name="pencil" className="w-4 h-4" />
          </Link>

          {/* Delete Button */}
          <button
            type="button"
            onClick={() => onDelete(form.id, form.title)}
            className="p-2 rounded-xl bg-slate-800 hover:bg-rose-950 text-slate-400 hover:text-rose-300 border border-slate-700 hover:border-rose-800 transition-colors"
            title="Hapus Form V1.0"
          >
            <Icon name="trash" className="w-4 h-4" />
          </button>
        </div>
      </td>
    </tr>
  )
}
