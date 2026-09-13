'use client'

import { Icon } from '@/components/ui/Icons'
import type { FormAggregateDoc } from '@/lib/repositories/form-versions.repo'
import type { DerivedLifecycle } from './forms-utils'

export type FormsMenuActions = {
  onPreview: (form: FormAggregateDoc) => void
  onDistribution: (form: FormAggregateDoc) => void
  onEditVersion: (form: FormAggregateDoc) => void
  onEditTitle: (form: FormAggregateDoc) => void
  onHistory: (formId: string) => void
  onResponses: (formId: string) => void
  onDuplicate: (formId: string) => void
  onArchive: (formId: string) => void
  onDelete: (form: FormAggregateDoc) => void
}

type FormsActionMenuProps = FormsMenuActions & {
  form: FormAggregateDoc
  derived: DerivedLifecycle
  isOpen: boolean
  direction: 'up' | 'down'
  duplicatingFormId: string | null
  onToggle: () => void
  onClose: () => void
}

export default function FormsActionMenu({
  form,
  derived,
  isOpen,
  direction,
  duplicatingFormId,
  onToggle,
  onClose,
  onPreview,
  onDistribution,
  onEditVersion,
  onEditTitle,
  onHistory,
  onResponses,
  onDuplicate,
  onArchive,
  onDelete,
}: FormsActionMenuProps) {
  const positionClass =
    direction === 'up'
      ? 'absolute right-0 bottom-full mb-2'
      : 'absolute right-0 top-full mt-2'

  return (
    <div className="relative">
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation()
          onToggle()
        }}
        className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-slate-200 border border-slate-700/80 transition-all cursor-pointer"
      >
        <Icon name="moreHorizontal" className="w-4 h-4" />
      </button>

      {isOpen && (
        <div
          onClick={(e) => e.stopPropagation()}
          className={`${positionClass} w-48 rounded-xl bg-slate-900 border border-slate-800 shadow-xl z-20 py-1 space-y-0.5 text-xs text-slate-200`}
        >
          <button
            type="button"
            onClick={() => {
              onClose()
              onPreview(form)
            }}
            className="w-full text-left px-3.5 py-2 hover:bg-slate-800 flex items-center gap-2 transition-colors cursor-pointer"
          >
            <Icon name="eye" className="w-3.5 h-3.5 text-slate-400" />
            <span>Pratinjau Responden</span>
          </button>

          {(derived.status === 'published' || derived.status === 'active') && (
            <>
              <button
                type="button"
                onClick={() => {
                  onClose()
                  onDistribution(form)
                }}
                className="w-full text-left px-3.5 py-2 hover:bg-slate-800 flex items-center gap-2 transition-colors cursor-pointer text-emerald-300"
              >
                <Icon name="send" className="w-3.5 h-3.5 text-emerald-400" />
                <span>Akses Distribusi Kader</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  onClose()
                  onEditVersion(form)
                }}
                className="w-full text-left px-3.5 py-2 hover:bg-slate-800 flex items-center gap-2 transition-colors cursor-pointer text-purple-300"
              >
                <Icon name="edit" className="w-3.5 h-3.5 text-purple-400" />
                <span>Pratinjau & Edit Versi</span>
              </button>
            </>
          )}

          <button
            type="button"
            onClick={() => {
              onClose()
              onEditTitle(form)
            }}
            className="w-full text-left px-3.5 py-2 hover:bg-slate-800 flex items-center gap-2 transition-colors cursor-pointer text-amber-300 font-semibold"
          >
            <Icon name="edit" className="w-3.5 h-3.5 text-amber-400" />
            <span>Ubah Nama Formulir</span>
          </button>

          <button
            type="button"
            onClick={() => {
              onClose()
              onHistory(form.formId)
            }}
            className="w-full text-left px-3.5 py-2 hover:bg-slate-800 flex items-center gap-2 transition-colors cursor-pointer"
          >
            <Icon name="history" className="w-3.5 h-3.5 text-slate-400" />
            <span>Riwayat Versi</span>
          </button>

          <button
            type="button"
            onClick={() => {
              onClose()
              onResponses(form.formId)
            }}
            className="w-full text-left px-3.5 py-2 hover:bg-slate-800 flex items-center gap-2 transition-colors cursor-pointer"
          >
            <Icon name="barChart" className="w-3.5 h-3.5 text-slate-400" />
            <span>Hasil & Respons</span>
          </button>

          <button
            type="button"
            onClick={() => {
              onClose()
              onDuplicate(form.formId)
            }}
            disabled={duplicatingFormId === form.formId}
            className="w-full text-left px-3.5 py-2 hover:bg-slate-800 flex items-center gap-2 transition-colors cursor-pointer text-cyan-300"
          >
            <Icon name="copy" className="w-3.5 h-3.5 text-cyan-400" />
            <span>{duplicatingFormId === form.formId ? 'Menduplikat...' : 'Duplikat Formulir'}</span>
          </button>

          {derived.status !== 'archived' && (
            <button
              type="button"
              onClick={() => {
                onClose()
                onArchive(form.formId)
              }}
              className="w-full text-left px-3.5 py-2 hover:bg-rose-500/10 hover:text-rose-300 flex items-center gap-2 transition-colors cursor-pointer text-rose-400 border-t border-slate-800"
            >
              <Icon name="archive" className="w-3.5 h-3.5" />
              <span>Arsipkan</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => {
              onClose()
              onDelete(form)
            }}
            className="w-full text-left px-3.5 py-2 hover:bg-rose-500/20 flex items-center gap-2 transition-colors cursor-pointer text-rose-400 font-bold border-t border-slate-800/80"
          >
            <Icon name="trash" className="w-3.5 h-3.5 text-rose-400" />
            <span>Hapus Formulir Permanen</span>
          </button>
        </div>
      )}
    </div>
  )
}
