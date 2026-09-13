'use client'

import { useRouter } from 'next/navigation'
import { Icon } from '@/components/ui/Icons'
import { getDerivedLifecycle, type EnrichedFormAggregateDoc } from './forms-utils'
import FormsActionMenu, { type FormsMenuActions } from './forms-action-menu'

type FormsListRowProps = FormsMenuActions & {
  form: EnrichedFormAggregateDoc
  menuOpen: boolean
  onMenuToggle: () => void
  onMenuClose: () => void
  duplicatingFormId: string | null
  onRestore: (formId: string) => void
}

export default function FormsListRow({
  form,
  menuOpen,
  onMenuToggle,
  onMenuClose,
  duplicatingFormId,
  onRestore,
  onPreview,
  onDistribution,
  onEditVersion,
  onEditTitle,
  onHistory,
  onResponses,
  onDuplicate,
  onArchive,
  onDelete,
}: FormsListRowProps) {
  const router = useRouter()
  const derived = getDerivedLifecycle(form)
  const aspectCount = form.aspects?.length || 0
  const questionCount = form.questions?.length || 0
  const responseCount = form.responseCount || 0
  const activeDistCount = form.activeDistributionCount || 0
  const lastUpdatedDate = form.updatedAt
    ? new Date(form.updatedAt).toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      })
    : '—'

  return (
    <div className="p-4 sm:p-5 rounded-2xl bg-slate-900/80 border border-slate-800/90 hover:border-slate-700/80 transition-all space-y-3 shadow-sm group">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* LEFT: Title & Badges */}
        <div className="space-y-1 min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="text-sm font-bold text-slate-100 group-hover:text-emerald-300 transition-colors truncate">
              {form.metadata?.title || form.formId}
            </h3>

            <span
              className={`text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full border ${derived.colorClass}`}
            >
              {derived.label.toUpperCase()}
            </span>

            <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">
              {form.metadata?.category || 'Umum'}
            </span>
          </div>

          <div className="text-[11px] text-slate-400 font-mono flex items-center gap-2 flex-wrap">
            <span className="text-slate-300 font-bold">V{form.activeVersionNumber || 1}.0</span>
            <span>·</span>
            <span>{aspectCount} Aspek</span>
            <span>·</span>
            <span>{questionCount} Pertanyaan</span>
          </div>
        </div>

        {/* RIGHT: Primary Contextual Action & Menu */}
        <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
          {/* Contextual Primary Action Button */}
          {derived.status === 'draft' && (
            <button
              type="button"
              onClick={() => router.push(`/dashboard/forms/${form.formId}/builder`)}
              className="px-4 py-2 rounded-xl bg-purple-600/90 hover:bg-purple-500 text-white text-xs font-bold shadow-md transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <Icon name="edit" className="w-3.5 h-3.5" />
              <span>Lanjutkan</span>
            </button>
          )}

          {derived.status === 'ready' && (
            <button
              type="button"
              onClick={() => router.push(`/dashboard/forms/${form.formId}/builder?step=4`)}
              className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold shadow-md transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <Icon name="checkCircle" className="w-3.5 h-3.5" />
              <span>Publikasikan</span>
            </button>
          )}

          {(derived.status === 'published' || derived.status === 'active') && (
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => onDistribution(form)}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-md transition-all flex items-center gap-1.5 cursor-pointer"
                title="Atur izin distribusi kader & mitra"
              >
                <Icon name="send" className="w-3.5 h-3.5" />
                <span>Akses Distribusi</span>
              </button>

              <button
                type="button"
                onClick={() => onEditVersion(form)}
                className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold border border-slate-700 shadow-md transition-all flex items-center gap-1.5 cursor-pointer"
                title="Pratinjau formulir & konfirmasi pembuatan versi draft baru"
              >
                <Icon name="edit" className="w-3.5 h-3.5 text-purple-400" />
                <span>Pratinjau & Edit</span>
              </button>
            </div>
          )}

          {derived.status === 'archived' && (
            <button
              type="button"
              onClick={() => onRestore(form.formId)}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold border border-slate-700 shadow-md transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <Icon name="refresh" className="w-3.5 h-3.5" />
              <span>Pulihkan</span>
            </button>
          )}

          {/* Secondary Action Dropdown Menu Trigger */}
          <FormsActionMenu
            form={form}
            derived={derived}
            isOpen={menuOpen}
            direction="down"
            duplicatingFormId={duplicatingFormId}
            onToggle={onMenuToggle}
            onClose={onMenuClose}
            onPreview={onPreview}
            onDistribution={onDistribution}
            onEditVersion={onEditVersion}
            onEditTitle={onEditTitle}
            onHistory={onHistory}
            onResponses={onResponses}
            onDuplicate={onDuplicate}
            onArchive={onArchive}
            onDelete={onDelete}
          />
        </div>
      </div>

      {/* BOTTOM STATS & TIMESTAMP */}
      <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 pt-2 border-t border-slate-800/60">
        <div className="flex items-center gap-3">
          <span>{responseCount} Respons</span>
          <span>·</span>
          <span>{activeDistCount} Distribusi</span>
        </div>

        <span>Terakhir diperbarui {lastUpdatedDate}</span>
      </div>
    </div>
  )
}
