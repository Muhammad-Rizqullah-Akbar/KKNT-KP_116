'use client'

import { Icon } from '@/components/ui/Icons'
import { computeAccountingForStack, type StackedAccountingItem } from './widgets-utils'

interface ClassificationItem {
  id: string
  code: string
  title: string
  version: string
  responses: any[]
  respondentIds: Set<string>
  scores: number[]
  respondentCount: number
  avgScore: number
}

interface WidgetsStackingStepProps {
  accountingStacks: StackedAccountingItem[]
  activeStackId: string
  setActiveStackId: (id: string) => void
  formCodeSearchTerm: string
  setFormCodeSearchTerm: (term: string) => void
  isClassificationExpanded: boolean
  setIsClassificationExpanded: (v: boolean) => void
  formClassificationBreakdown: ClassificationItem[]
  responses: any[]
  forms: any[]
  v15Forms: any[]
  users: any[]
  getFormRespondentCount: (idOrCode: string) => number
  handleAddAccountingStack: () => void
  handleRemoveAccountingStack: (id: string) => void
  handleUpdateStackItem: (stackId: string, updates: Partial<StackedAccountingItem>) => void
  onContinue: () => void
  show: (message: string) => void
}

export function WidgetsStackingStep({
  accountingStacks,
  activeStackId,
  setActiveStackId,
  formCodeSearchTerm,
  setFormCodeSearchTerm,
  isClassificationExpanded,
  setIsClassificationExpanded,
  formClassificationBreakdown,
  responses,
  forms,
  v15Forms,
  users,
  getFormRespondentCount,
  handleAddAccountingStack,
  handleRemoveAccountingStack,
  handleUpdateStackItem,
  onContinue,
  show,
}: WidgetsStackingStepProps) {
  return (
    <div className="space-y-6">
      {/* MODUL KLASIFIKASI & PELAKAN RESPONDEN BERDASARKAN FORM CODE / NAMA FORM */}
      <div className="rounded-3xl bg-slate-900 border border-slate-800 p-6 space-y-5 shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-4">
          <div>
            <h3 className="font-bold text-base text-slate-100 flex items-center gap-2">
              <Icon name="search" className="w-5 h-5 text-cyan-400" />
              <span>Klasifikasi & Pelacakan Jumlah Responden per Kode Form / Nama Form</span>
            </h3>
            <p className="text-xs text-slate-400 font-mono mt-0.5">
              Lacak dan kelompokkan jumlah pasti responden dari database berdasarkan satu kode form atau nama formulir.
            </p>
          </div>

          <div className="relative w-full md:w-80">
            <Icon name="search" className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={formCodeSearchTerm}
              onChange={(e) => setFormCodeSearchTerm(e.target.value)}
              placeholder="Cari Kode Form / Nama Form..."
              className="w-full pl-9 pr-8 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-slate-100 placeholder-slate-500 font-mono focus:outline-none focus:border-cyan-400"
            />
            {formCodeSearchTerm && (
              <button
                onClick={() => setFormCodeSearchTerm('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 text-xs font-bold"
              >
                ×
              </button>
            )}
          </div>
        </div>

        {/* CLASSIFICATION CARDS GRID (DEFAULT 2X3 GRID = 6 CARDS) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {formClassificationBreakdown.length === 0 ? (
            <div className="col-span-full p-6 text-center text-slate-500 font-mono text-xs bg-slate-950 rounded-2xl border border-slate-800">
              Tidak ditemukan formulir yang cocok dengan filter "{formCodeSearchTerm}".
            </div>
          ) : (
            (isClassificationExpanded
              ? formClassificationBreakdown
              : formClassificationBreakdown.slice(0, 6)
            ).map((item) => (
              <div
                key={item.id}
                className="p-4 rounded-2xl bg-slate-950 border border-slate-800/80 hover:border-cyan-500/40 transition-all space-y-3"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="space-y-1 min-w-0">
                    <span className="px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 font-mono font-bold text-[10px] border border-cyan-500/30">
                      {item.version}
                    </span>
                    <h4 className="font-bold text-slate-100 text-xs truncate" title={item.title}>
                      {item.title}
                    </h4>
                    <p className="text-[11px] font-mono text-slate-400">
                      Kode Form: <span className="text-cyan-300 font-bold">{item.code}</span>
                    </p>
                  </div>

                  <div className="text-right shrink-0">
                    <span className="px-2.5 py-1 rounded-xl bg-emerald-500/20 text-emerald-300 font-mono font-bold text-xs border border-emerald-500/30 block">
                      {item.respondentCount} Responden
                    </span>
                    <span className="text-[10px] font-mono text-slate-400 mt-1 block">
                      Rata²: {item.avgScore}%
                    </span>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-800/60 flex items-center justify-between text-[11px] font-mono">
                  <span className="text-slate-400 text-[10px]">Terdeteksi dari DB</span>
                  <button
                    type="button"
                    onClick={() => {
                      const activeStack = accountingStacks.find((s) => s.id === activeStackId) || accountingStacks[0]
                      handleUpdateStackItem(activeStack.id, { pretestFormId: item.id })
                      show(`Form '${item.title}' (${item.respondentCount} Responden) diset ke Pretest Stacking!`)
                    }}
                    className="text-cyan-400 hover:text-cyan-300 font-bold text-[11px] underline cursor-pointer"
                  >
                    + Set di Pretest Stacking
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* EXPAND / COLLAPSE BUTTON FOR 2X3 GRID */}
        {formClassificationBreakdown.length > 6 && (
          <div className="flex justify-center pt-2 border-t border-slate-800/80">
            <button
              type="button"
              onClick={() => setIsClassificationExpanded(!isClassificationExpanded)}
              className="px-4 py-2 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-700 text-cyan-300 font-mono font-bold text-xs flex items-center gap-2 transition-all shadow-md cursor-pointer"
            >
              <Icon name={isClassificationExpanded ? 'chevronUp' : 'chevronDown'} className="w-4 h-4 text-cyan-400" />
              <span>
                {isClassificationExpanded
                  ? 'Tutup Grid (Kembali ke 2x3)'
                  : `Lihat Selengkapnya (${formClassificationBreakdown.length - 6} Form Lainnya)`}
              </span>
            </button>
          </div>
        )}
      </div>

      {/* STACKING SETUP CARDS HEADER & LIST */}
      <div className="rounded-3xl bg-slate-900 border border-slate-800 p-6 space-y-6 shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-4">
          <div>
            <h3 className="font-bold text-base text-slate-100 flex items-center gap-2">
              <Icon name="layers" className="w-5 h-5 text-cyan-400" />
              <span>Setup Stacking Perbandingan Assessment ({accountingStacks.length} Stack)</span>
            </h3>
            <p className="text-xs text-slate-400 font-mono mt-0.5">
              Bebas menambah perbandingan 1, perbandingan 2, dst. Angka responden langsung terdeteksi otomatis per-formulir.
            </p>
          </div>

          <div className="flex items-center gap-2 self-start md:self-auto">
            <button
              type="button"
              onClick={handleAddAccountingStack}
              className="px-3.5 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs font-mono flex items-center gap-1.5 transition-all shadow-lg shadow-cyan-500/10"
            >
              <Icon name="plus" className="w-4 h-4" />
              <span>+ Tambah Perbandingan Baru</span>
            </button>

            <button
              type="button"
              onClick={onContinue}
              className="px-3.5 py-2 rounded-xl bg-purple-500 hover:bg-purple-400 text-slate-950 font-bold text-xs font-mono flex items-center gap-1.5 transition-all"
            >
              <span>Lanjut ke Accounting</span>
              <Icon name="chevronRight" className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* STACKED CARDS LIST */}
        <div className="space-y-4">
          {accountingStacks.map((stack, idx) => {
            const stackMetrics = computeAccountingForStack(stack, responses, forms, v15Forms, users)

            return (
              <div
                key={stack.id}
                onClick={() => setActiveStackId(stack.id)}
                className={`p-5 rounded-2xl border transition-all space-y-4 cursor-pointer ${
                  activeStackId === stack.id
                    ? 'bg-slate-950 border-cyan-500/60 shadow-xl'
                    : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
                  <div className="flex items-center gap-3 flex-1">
                    <span className="w-7 h-7 rounded-xl bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 font-mono font-bold text-xs flex items-center justify-center shrink-0">
                      #{idx + 1}
                    </span>
                    <input
                      type="text"
                      value={stack.title}
                      onChange={(e) => handleUpdateStackItem(stack.id, { title: e.target.value })}
                      className="bg-slate-900 border border-slate-700 text-slate-100 rounded-xl px-3 py-1.5 font-bold text-sm w-full max-w-md focus:outline-none focus:border-cyan-400"
                      placeholder="Nama Judul Perbandingan..."
                    />
                  </div>

                  <div className="flex items-center gap-3 shrink-0 text-xs font-mono">
                    <label className="flex items-center gap-1.5 cursor-pointer text-slate-300 bg-slate-900 px-3 py-1 rounded-xl border border-slate-800">
                      <input
                        type="checkbox"
                        checked={stack.enabled}
                        onChange={(e) => handleUpdateStackItem(stack.id, { enabled: e.target.checked })}
                        className="rounded border-slate-700 bg-slate-950 text-cyan-500 focus:ring-cyan-400 w-3.5 h-3.5"
                      />
                      <span>{stack.enabled ? 'Publish ke Overview' : 'Sembunyikan'}</span>
                    </label>

                    {accountingStacks.length > 1 && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleRemoveAccountingStack(stack.id)
                        }}
                        className="p-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 transition-colors"
                        title="Hapus Stack Perbandingan Ini"
                      >
                        <Icon name="trash" className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>

                {/* DETEKSI REAL-TIME RESPONDEN STACKING BANNER */}
                <div className="flex flex-wrap items-center gap-2 p-3 rounded-xl bg-slate-900/90 border border-slate-800 text-xs font-mono">
                  <span className="text-slate-300 font-bold flex items-center gap-1.5">
                    <Icon name="search" className="w-3.5 h-3.5 text-cyan-400" />
                    Deteksi Responden Real-time:
                  </span>
                  <span className="px-2.5 py-1 rounded-lg bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 font-bold">
                    Pretest: {stackMetrics.preCount} Responden
                  </span>
                  <span className="px-2.5 py-1 rounded-lg bg-purple-500/20 text-purple-300 border border-purple-500/30 font-bold">
                    Posttest: {stackMetrics.postCount} Responden
                  </span>
                  <span className="px-2.5 py-1 rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-bold">
                    Total Unique: {stackMetrics.totalRespondents} Responden
                  </span>
                  <span className="px-2.5 py-1 rounded-lg bg-amber-500/20 text-amber-200 border border-amber-500/30 font-bold sm:ml-auto">
                    Rata-rata: {stackMetrics.avgPretest}% → {stackMetrics.avgPosttest}% (+{stackMetrics.delta}%)
                  </span>
                </div>

                {/* MODE, SCHEME, & FORM SELECTORS FOR THIS STACK */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs font-mono">
                  <div className="space-y-1">
                    <label className="block text-slate-400 font-bold">Struktur Assessment</label>
                    <select
                      value={stack.mode}
                      onChange={(e) => handleUpdateStackItem(stack.id, { mode: e.target.value as any })}
                      className="w-full bg-slate-900 border border-slate-700 text-slate-200 rounded-xl px-3 py-2"
                    >
                      <option value="single">1 Form Multi-Stage (Pre & Post)</option>
                      <option value="dual">2 Form Terpisah (Form A vs Form B)</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="block text-emerald-400 font-bold">Skema Penilaian Data</label>
                    <select
                      value={stack.scoringScheme || 'all'}
                      onChange={(e) => handleUpdateStackItem(stack.id, { scoringScheme: e.target.value as any })}
                      className="w-full bg-slate-900 border border-emerald-500/40 text-emerald-300 rounded-xl px-3 py-2 font-bold"
                    >
                      <option value="all">Semua Skema (Gabungan V1.0 & V1.5)</option>
                      <option value="v1_0">Skema V1.0 (Data Responden Legacy)</option>
                      <option value="v1_5">Skema V1.5 (Hasil Penilaian Resmi)</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="block text-cyan-400 font-bold">Formulir Pretest (Skor Awal)</label>
                    <select
                      value={stack.pretestFormId}
                      onChange={(e) => handleUpdateStackItem(stack.id, { pretestFormId: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-700 text-slate-200 rounded-xl px-3 py-2"
                    >
                      <option value="all">Semua Form Pretest ({responses.length} Responden DB)</option>
                      {v15Forms.map((f) => {
                        const cnt = getFormRespondentCount(f.formId || f.id)
                        const codeStr = f.code || f.formCode || f.distributionCode || ''
                        return (
                          <option key={f.formId} value={f.formId}>
                            [V1.5] {f.metadata?.title || f.formId} {codeStr ? `(Kode: ${codeStr})` : ''} — {cnt} Responden Terdeteksi
                          </option>
                        )
                      })}
                      {forms.map((f) => {
                        const formIdStr = f.id || (f as any).formId || ''
                        const cnt = getFormRespondentCount(formIdStr)
                        const codeStr = f.code || (f as any).formCode || ''
                        return (
                          <option key={formIdStr || codeStr} value={formIdStr}>
                            [V1.0] {f.title} {codeStr ? `(Kode: ${codeStr})` : ''} — {cnt} Responden Terdeteksi
                          </option>
                        )
                      })}
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="block text-purple-300 font-bold">Formulir Posttest (Skor Akhir)</label>
                    <select
                      disabled={stack.mode === 'single'}
                      value={stack.posttestFormId}
                      onChange={(e) => handleUpdateStackItem(stack.id, { posttestFormId: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-700 text-slate-200 rounded-xl px-3 py-2 disabled:opacity-40"
                    >
                      <option value="all">Semua Form Posttest ({responses.length} Responden DB)</option>
                      {v15Forms.map((f) => {
                        const cnt = getFormRespondentCount(f.formId || f.id)
                        const codeStr = f.code || f.formCode || f.distributionCode || ''
                        return (
                          <option key={f.formId} value={f.formId}>
                            [V1.5] {f.metadata?.title || f.formId} {codeStr ? `(Kode: ${codeStr})` : ''} — {cnt} Responden Terdeteksi
                          </option>
                        )
                      })}
                      {forms.map((f) => {
                        const formIdStr = f.id || (f as any).formId || ''
                        const cnt = getFormRespondentCount(formIdStr)
                        const codeStr = f.code || (f as any).formCode || ''
                        return (
                          <option key={formIdStr || codeStr} value={formIdStr}>
                            [V1.0] {f.title} {codeStr ? `(Kode: ${codeStr})` : ''} — {cnt} Responden Terdeteksi
                          </option>
                        )
                      })}
                    </select>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
