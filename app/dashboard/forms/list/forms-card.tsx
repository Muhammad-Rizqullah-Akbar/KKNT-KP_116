'use client'

import { useRouter } from 'next/navigation'
import { Icon } from '@/components/ui/Icons'
import { getDerivedLifecycle, type EnrichedFormAggregateDoc } from './forms-utils'
import FormsActionMenu, { type FormsMenuActions } from './forms-action-menu'

type FormsCardProps = FormsMenuActions & {
  form: EnrichedFormAggregateDoc
  selected: boolean
  onToggleSelect: (formId: string) => void
  menuOpen: boolean
  onMenuToggle: () => void
  onMenuClose: () => void
  isGlobalRole: boolean
  duplicatingFormId: string | null
  onRestore: (formId: string) => void
}

export default function FormsCard({
  form,
  selected,
  onToggleSelect,
  menuOpen,
  onMenuToggle,
  onMenuClose,
  isGlobalRole,
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
}: FormsCardProps) {
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
    <div
      className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800/90 hover:border-slate-700/80 transition-all flex flex-col justify-between space-y-4 shadow-sm group hover:shadow-emerald-500/5 relative"
    >
      {/* TOP BADGES & ACTIONS */}
      <div className="space-y-3">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={selected}
              onChange={() => onToggleSelect(form.formId)}
              className="w-4 h-4 rounded border-slate-700 bg-slate-950 text-emerald-500 focus:ring-emerald-500 focus:ring-offset-slate-950 cursor-pointer shrink-0"
              title="Pilih formulir ini"
            />
            <span
              className={`text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full border ${derived.colorClass}`}
            >
              {derived.label.toUpperCase()}
            </span>
          </div>

          <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">
            {form.metadata?.category || 'Umum'}
          </span>
        </div>

        {/* TITLE & DESCRIPTION */}
        <div className="space-y-1">
          <h3 className="text-sm font-bold text-slate-100 group-hover:text-emerald-300 transition-colors line-clamp-1">
            {form.metadata?.title || form.formId}
          </h3>
          {form.metadata?.description && (
            <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed">
              {form.metadata.description}
            </p>
          )}
        </div>
      </div>

      {/* METRICS & FOOTER */}
      <div className="space-y-3 pt-2 border-t border-slate-800/60">
        <div className="flex items-center justify-between text-[11px] font-mono text-slate-400">
          <div className="flex items-center gap-1.5">
            <span className="text-slate-300 font-bold">V{form.activeVersionNumber || 1}.0</span>
            <span>·</span>
            <span>{aspectCount} Aspek</span>
            <span>·</span>
            <span>{questionCount} Soal</span>
          </div>

          <span className="text-[10px] text-slate-400">{lastUpdatedDate}</span>
        </div>

        <div className="p-2.5 rounded-xl bg-slate-950/70 border border-slate-800/80 flex items-center justify-between text-xs font-mono">
          <span className="text-slate-400">Respons & Distribusi</span>
          <span className="font-bold text-emerald-400">{responseCount} Respons · {activeDistCount} Distribusi</span>
        </div>

        {/* CARD ACTIONS FOOTER */}
        <div className="flex items-center justify-between gap-2 pt-1">
          {derived.status === 'draft' && (
            <button
              type="button"
              onClick={() => router.push(`/dashboard/forms/${form.formId}/builder`)}
              className="flex-1 py-2 rounded-xl bg-purple-600/90 hover:bg-purple-500 text-white text-xs font-bold shadow-md transition-all flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Icon name="edit" className="w-3.5 h-3.5" />
              <span>Lanjutkan</span>
            </button>
          )}

          {derived.status === 'ready' && (
            <button
              type="button"
              onClick={() => router.push(`/dashboard/forms/${form.formId}/builder?step=4`)}
              className="flex-1 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold shadow-md transition-all flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Icon name="checkCircle" className="w-3.5 h-3.5" />
              <span>Publikasikan</span>
            </button>
          )}

          {(derived.status === 'published' || derived.status === 'active') && (
            <div className="flex items-center gap-1.5 flex-1 min-w-0">
              {isGlobalRole ? (
                <>
                  <button
                    type="button"
                    onClick={() => onDistribution(form)}
                    className="flex-1 py-2 px-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-md transition-all flex items-center justify-center gap-1 cursor-pointer truncate"
                    title="Atur izin distribusi kader & mitra"
                  >
                    <Icon name="send" className="w-3.5 h-3.5 shrink-0" />
                    <span className="truncate">Akses Distribusi</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => onEditVersion(form)}
                    className="py-2 px-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold border border-slate-700 shadow-md transition-all flex items-center justify-center gap-1 cursor-pointer shrink-0"
                    title="Pratinjau formulir & konfirmasi pembuatan versi draft baru"
                  >
                    <Icon name="edit" className="w-3.5 h-3.5 shrink-0 text-purple-400" />
                    <span>Pratinjau & Edit</span>
                  </button>
                </>
              ) : form.allowCadreDistribution !== false ? (
                <button
                  type="button"
                  onClick={() => router.push(`/dashboard/distributions?formId=${form.formId}`)}
                  className="flex-1 py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-md transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Icon name="send" className="w-3.5 h-3.5 shrink-0" />
                  <span>Buat Kode Distribusi Saya →</span>
                </button>
              ) : (
                <div className="flex items-center justify-between w-full">
                  <span className="text-[10px] font-mono font-bold text-rose-400 px-2 py-1 rounded bg-rose-500/10 border border-rose-500/20">
                    🔒 Khusus BPOM Pusat
                  </span>
                  <button
                    type="button"
                    onClick={() => onPreview(form)}
                    className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700"
                  >
                    Pratinjau
                  </button>
                </div>
              )}
            </div>
          )}

          {derived.status === 'archived' && (
            <button
              type="button"
              onClick={() => onRestore(form.formId)}
              className="flex-1 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold border border-slate-700 shadow-md transition-all flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Icon name="refresh" className="w-3.5 h-3.5" />
              <span>Pulihkan</span>
            </button>
          )}

          {/* Secondary Dropdown Menu */}
          <FormsActionMenu
            form={form}
            derived={derived}
            isOpen={menuOpen}
            direction="up"
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
    </div>
  )
}
