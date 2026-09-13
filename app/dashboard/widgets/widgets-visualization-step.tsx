'use client'

import { Button } from '@/components/shared/Button'
import { Icon } from '@/components/ui/Icons'
import {
  CHART_TYPES,
  COLOR_SCHEMES,
  type WidgetItem,
} from './widgets-utils'
import { WidgetChartPanel } from './widgets-chart-panel'
import { getWidgetChartData } from './widgets-utils'

type WidgetsVisualizationStepProps = {
  widgets: WidgetItem[]
  filteredWidgets: WidgetItem[]
  selectedFormFilter: string
  setSelectedFormFilter: (v: string) => void
  selectedQuestionFilter: string
  setSelectedQuestionFilter: (v: string) => void
  v15Forms: any[]
  forms: any[]
  responses: any[]
  saveWidgetSettings: (updatedList: WidgetItem[]) => void
  handleToggleWidget: (id: string) => void
  handleOpenEditor: (w: WidgetItem) => void
  handleChangeChartTypeOnCard: (id: string, newType: 'bar' | 'pie' | 'line' | 'number' | 'matrix') => void
  handleChangeColorSchemeOnCard: (id: string, schemeId: string) => void
}

export function WidgetsVisualizationStep({
  widgets,
  filteredWidgets,
  selectedFormFilter,
  setSelectedFormFilter,
  selectedQuestionFilter,
  setSelectedQuestionFilter,
  v15Forms,
  forms,
  responses,
  saveWidgetSettings,
  handleToggleWidget,
  handleOpenEditor,
  handleChangeChartTypeOnCard,
  handleChangeColorSchemeOnCard,
}: WidgetsVisualizationStepProps) {
  return (
    <div className="space-y-6">
      <div className="rounded-3xl bg-slate-900 border border-slate-800 p-6 space-y-4 shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-4">
          <div>
            <h3 className="font-bold text-base text-slate-100 flex items-center gap-2">
              <Icon name="pieChart" className="w-5 h-5 text-amber-400" />
              <span>Langkah 4: Pemilihan Tampilan Visualisasi & Sinkronisasi Ke Dashboard Utama</span>
            </h3>
            <p className="text-xs text-slate-400 font-mono mt-0.5">
              Pilih bentuk grafik (Bar, Donut, Line, Stat, Matrix) dan beri tanda centang <strong className="text-cyan-300">Tampilkan di Dashboard Utama</strong> untuk menerbitkan grafik ke halaman `/dashboard/overview`.
            </p>
          </div>

          <Button
            size="sm"
            variant="primary"
            onClick={() => saveWidgetSettings(widgets)}
            icon="save"
          >
            Simpan & Sync Dashboard Utama
          </Button>
        </div>

        {/* FORM & QUESTION FILTER SELECTOR FOR STEP 4 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 p-4 rounded-2xl bg-slate-950 border border-slate-800 font-mono text-xs">
          <div className="space-y-1">
            <label className="block text-slate-400 font-bold">Filter Menurut Formulir</label>
            <select
              value={selectedFormFilter}
              onChange={(e) => {
                setSelectedFormFilter(e.target.value)
                setSelectedQuestionFilter('all')
              }}
              className="w-full bg-slate-900 border border-slate-700 text-slate-200 rounded-xl px-3 py-2"
            >
              <option value="all">Semua Formulir ({v15Forms.length + forms.length} Form)</option>
              {v15Forms.map((f) => (
                <option key={f.formId} value={f.formId}>
                  [V1.5] {f.metadata?.title || f.formId}
                </option>
              ))}
              {forms.map((f) => (
                <option key={f.id} value={f.id}>
                  [V1.0] {f.title}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <label className="block text-cyan-400 font-bold">Pilih Pertanyaan Spesifik</label>
            <select
              value={selectedQuestionFilter}
              onChange={(e) => setSelectedQuestionFilter(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 text-slate-200 rounded-xl px-3 py-2"
            >
              <option value="all">Semua Pertanyaan ({widgets.length} Soal)</option>
              {widgets
                .filter((w) => selectedFormFilter === 'all' || w.formId === selectedFormFilter)
                .map((w) => (
                  <option key={w.id} value={w.questionId}>
                    {w.questionText}
                  </option>
                ))}
            </select>
          </div>

          <div className="space-y-1 flex flex-col justify-end">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  const nextList = widgets.map((w) => {
                    const isMatch =
                      (selectedFormFilter === 'all' || w.formId === selectedFormFilter) &&
                      (selectedQuestionFilter === 'all' || w.questionId === selectedQuestionFilter)
                    return isMatch ? { ...w, enabled: true } : w
                  })
                  saveWidgetSettings(nextList)
                }}
                className="flex-1 px-3 py-2 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/40 font-bold text-[11px]"
              >
                Centang Hasil Filter Ini
              </button>

              <button
                type="button"
                onClick={() => {
                  setSelectedFormFilter('all')
                  setSelectedQuestionFilter('all')
                }}
                className="px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-400 border border-slate-800 font-bold text-[11px]"
              >
                Reset Filter
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* WIDGET CARDS GRID FOR VISUALIZATION */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredWidgets.map((widget) => {
          const chartData = getWidgetChartData(widget, responses, forms, v15Forms)
          const scheme = COLOR_SCHEMES.find((cs) => cs.id === widget.config?.colorScheme) || COLOR_SCHEMES[0]
          return (
            <div
              key={widget.id}
              className={`p-4 rounded-3xl border transition-all flex flex-col justify-between space-y-3 ${
                widget.enabled
                  ? 'bg-slate-900/90 border-cyan-500/40 shadow-xl'
                  : 'bg-slate-950/60 border-slate-800/80 opacity-60'
              }`}
            >
              {/* Card Header & Controls */}
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[10px] font-mono font-bold text-purple-300 truncate max-w-[160px]">
                    {widget.formTitle}
                  </span>

                  <div className="flex items-center gap-2 shrink-0">
                    {/* TOGGLE PIN TO MAIN DASHBOARD */}
                    <label className="flex items-center gap-1.5 cursor-pointer text-[10px] font-mono font-bold text-slate-300 bg-slate-950 px-2 py-0.5 rounded-lg border border-slate-800 hover:border-cyan-500/50">
                      <input
                        type="checkbox"
                        checked={widget.enabled}
                        onChange={() => handleToggleWidget(widget.id)}
                        className="rounded border-slate-700 bg-slate-900 text-cyan-500 focus:ring-cyan-400 w-3.5 h-3.5 cursor-pointer"
                      />
                      <span>{widget.enabled ? 'Aktif di Dashboard' : 'Sembunyikan'}</span>
                    </label>

                    <button
                      onClick={() => handleOpenEditor(widget)}
                      className="p-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-cyan-400 border border-slate-700 transition-colors"
                      title="Edit Judul & Warna Grafik"
                    >
                      <Icon name="settings" className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <h4 className="font-bold text-sm text-slate-100 line-clamp-2">
                  {widget.config?.title || widget.questionText}
                </h4>
              </div>

              {/* LIVE CHART CANVAS BOX */}
              <div className="rounded-2xl bg-slate-950 border border-slate-800/80 p-2 overflow-hidden">
                <WidgetChartPanel widget={widget} data={chartData} colors={scheme.colors} />
              </div>

              {/* QUICK CHART TYPE & COLOR CONTROLS */}
              <div className="pt-2 border-t border-slate-800 flex items-center justify-between gap-2">
                <div className="flex items-center gap-1 overflow-x-auto no-scrollbar">
                  {CHART_TYPES.map((ct) => (
                    <button
                      key={ct.id}
                      onClick={() => handleChangeChartTypeOnCard(widget.id, ct.id as any)}
                      className={`p-1.5 rounded-lg transition-colors ${
                        widget.chartType === ct.id
                          ? 'bg-cyan-500 text-slate-950 font-bold'
                          : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
                      }`}
                      title={ct.name}
                    >
                      <Icon name={ct.icon} className="w-3.5 h-3.5" />
                    </button>
                  ))}
                </div>

                <div className="flex items-center gap-1">
                  {COLOR_SCHEMES.map((cs) => (
                    <button
                      key={cs.id}
                      onClick={() => handleChangeColorSchemeOnCard(widget.id, cs.id)}
                      className={`w-3.5 h-3.5 rounded-full transition-transform ${
                        widget.config?.colorScheme === cs.id ? 'ring-2 ring-cyan-400 scale-110' : 'opacity-70 hover:opacity-100'
                      }`}
                      style={{ backgroundColor: cs.colors[0] }}
                      title={cs.name}
                    />
                  ))}
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
