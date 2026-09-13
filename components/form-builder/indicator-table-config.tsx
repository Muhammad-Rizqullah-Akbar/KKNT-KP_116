// components/form-builder/indicator-table-config.tsx

'use client'

import { Icon } from '@/components/ui/Icons'
import { ConfigPanelProps } from './config-panel-props'
import { IndicatorItem, IndicatorScale } from './ElementTypes'

export function IndicatorTableConfig({ config, element, onUpdate }: ConfigPanelProps) {
  // Helper untuk menghitung max score
  const getMaxScaleValue = (): number => {
    const scales = config.indicatorScales || []
    if (scales.length === 0) return 5
    return Math.max(...scales.map((s: IndicatorScale) => s.value))
  }

  const getTotalMaxScore = (): number => {
    const indicators = config.indicators || []
    const maxVal = getMaxScaleValue()
    let total = 0
    indicators.forEach((ind: IndicatorItem) => {
      total += (ind.weight || 1) * maxVal
    })
    return total
  }

  return (
    <div className="space-y-5">
      {/* ===== SKALA JAWABAN ===== */}
      <div className="space-y-1.5">
        <label className="text-xs text-white/50 uppercase tracking-wider flex items-center justify-between">
          <span>Skala Jawaban (Kolom)</span>
          <button
            type="button"
            onClick={() => {
              const currentScales = config.indicatorScales || []
              const newScales = [
                ...currentScales,
                { value: currentScales.length + 1, label: `Skala ${currentScales.length + 1}` }
              ]
              onUpdate({
                ...element,
                config: { ...config, indicatorScales: newScales, indicatorColumns: newScales.length }
              })
            }}
            className="text-xs text-cyan-400 hover:text-cyan-300 transition-colors flex items-center gap-1"
          >
            <Icon name="plus" className="w-3 h-3" /> Tambah Skala
          </button>
        </label>

        {/* Preset Skala */}
        <div className="flex flex-wrap gap-1.5 mb-2">
          {[
            { label: 'Ya/Tidak', scales: [{ value: 1, label: 'Ya' }, { value: 0, label: 'Tidak' }] },
            { label: 'STS-SS (5)', scales: [
              { value: 1, label: 'STS' }, { value: 2, label: 'TS' },
              { value: 3, label: 'N' }, { value: 4, label: 'S' }, { value: 5, label: 'SS' }
            ]},
            { label: '1-4', scales: [
              { value: 1, label: '1' }, { value: 2, label: '2' },
              { value: 3, label: '3' }, { value: 4, label: '4' }
            ]},
          ].map((preset) => (
            <button
              key={preset.label}
              type="button"
              onClick={() => onUpdate({
                ...element,
                config: { ...config, indicatorScales: preset.scales, indicatorColumns: preset.scales.length }
              })}
              className="px-3 py-1.5 rounded-lg text-[10px] bg-white/[0.03] border border-white/[0.06] text-white/50 hover:text-white hover:border-cyan-500/30 transition-all"
            >
              {preset.label}
            </button>
          ))}
        </div>

        {(!config.indicatorScales || config.indicatorScales.length === 0) ? (
          <div className="text-center py-4 text-white/20">
            <Icon name="columns" className="w-6 h-6 mx-auto mb-1 opacity-30" />
            <p className="text-xs">Gunakan preset di atas atau tambah manual.</p>
          </div>
        ) : (
          <div className="space-y-1.5 max-h-36 overflow-y-auto custom-scrollbar pr-1">
            {(config.indicatorScales || []).map((scale: IndicatorScale, index: number) => {
              const isLowest = scale.value === Math.min(...config.indicatorScales.map((s: IndicatorScale) => s.value))
              const isHighest = scale.value === Math.max(...config.indicatorScales.map((s: IndicatorScale) => s.value))

              return (
                <div key={index} className={`flex items-center gap-2 p-2 rounded-lg transition-colors ${
                  isLowest ? 'bg-red-500/5 border border-red-500/10' :
                  isHighest ? 'bg-emerald-500/5 border border-emerald-500/10' :
                  'hover:bg-white/[0.02]'
                }`}>
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 font-bold text-xs ${
                    isLowest ? 'bg-red-500/20 text-red-400 border border-red-500/20' :
                    isHighest ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/20' :
                    'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20'
                  }`}>
                    {scale.value}
                  </div>
                  <input
                    type="text"
                    value={scale.label}
                    onChange={(e) => {
                      const newScales = [...(config.indicatorScales || [])]
                      newScales[index] = { ...newScales[index], label: e.target.value }
                      onUpdate({ ...element, config: { ...config, indicatorScales: newScales } })
                    }}
                    className="flex-1 px-3 py-2 rounded-lg bg-transparent border border-transparent hover:border-white/[0.06] focus:border-cyan-400/40 text-sm text-white focus:outline-none transition-all"
                    placeholder="Label skala"
                  />
                  <span className="text-[10px] text-white/20 shrink-0">
                    {isLowest ? '⬅️ Terendah' : isHighest ? 'Tertinggi ➡️' : `${scale.value} poin`}
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      const newScales = (config.indicatorScales || []).filter((_: IndicatorScale, i: number) => i !== index)
                      onUpdate({
                        ...element,
                        config: { ...config, indicatorScales: newScales, indicatorColumns: newScales.length }
                      })
                    }}
                    className="p-1.5 rounded-lg hover:bg-red-500/10 transition-colors shrink-0"
                    title="Hapus skala"
                  >
                    <Icon name="trash" className="w-4 h-4 text-white/30 hover:text-red-400" />
                  </button>
                </div>
              )
            })}
          </div>
        )}

        {/* Info skala */}
        {config.indicatorScales && config.indicatorScales.length > 0 && (
          <div className="p-2 rounded-lg bg-cyan-500/5 border border-cyan-500/10">
            <div className="flex items-center gap-2 text-[10px] text-cyan-400/70">
              <Icon name="info" className="w-3.5 h-3.5" />
              <span>
                Skala: {config.indicatorScales.map((s: IndicatorScale) => `${s.label}=${s.value}`).join(' | ')}
              </span>
            </div>
            <div className="flex items-center gap-2 text-[10px] text-cyan-400/40 mt-0.5">
              <span>⬅️ Rendah ({config.indicatorScales[0]?.label}={config.indicatorScales[0]?.value})</span>
              <span className="w-8 h-0.5 bg-cyan-400/20 rounded-full" />
              <span>Tinggi ({config.indicatorScales[config.indicatorScales.length - 1]?.label}={config.indicatorScales[config.indicatorScales.length - 1]?.value}) ➡️</span>
            </div>
          </div>
        )}
      </div>

      <div className="border-t border-white/[0.06]" />

      {/* ===== DAFTAR PERTANYAAN / INDIKATOR ===== */}
      <div className="space-y-1.5">
        <label className="text-xs text-white/50 uppercase tracking-wider flex items-center justify-between">
          <span>Daftar Pertanyaan ({config.indicators?.length || 0})</span>
          <button
            type="button"
            onClick={() => {
              const newIndicators = [
                ...(config.indicators || []),
                {
                  id: `q-${Date.now()}`,
                  label: `Pertanyaan ${(config.indicators || []).length + 1}`,
                  weight: 1,
                  reverse: false,
                }
              ]
              onUpdate({ ...element, config: { ...config, indicators: newIndicators } })
            }}
            className="text-xs text-cyan-400 hover:text-cyan-300 transition-colors flex items-center gap-1"
          >
            <Icon name="plus" className="w-3 h-3" /> Tambah Pertanyaan
          </button>
        </label>

        {(!config.indicators || config.indicators.length === 0) ? (
          <div className="text-center py-8 text-white/20">
            <Icon name="table" className="w-10 h-10 mx-auto mb-2 opacity-30" />
            <p className="text-xs">Belum ada pertanyaan.</p>
            <p className="text-[10px] mt-1">Klik "Tambah Pertanyaan" untuk memulai.</p>
          </div>
        ) : (
          <div className="space-y-2 max-h-72 overflow-y-auto custom-scrollbar pr-1">
            {(config.indicators || []).map((item: IndicatorItem, index: number) => {
              const maxVal = getMaxScaleValue()
              const maxScore = (item.weight || 1) * maxVal

              return (
                <div
                  key={item.id || index}
                  className={`p-3 rounded-xl border transition-all group ${
                    item.reverse === true
                      ? 'bg-amber-500/5 border-amber-500/20'
                      : 'bg-white/[0.02] border-white/[0.05] hover:border-white/[0.08]'
                  }`}
                >
                  {/* Header: Nomor + Label */}
                  <div className="flex items-center gap-2">
                    <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 text-[10px] font-bold ${
                      item.reverse === true
                        ? 'bg-amber-500/10 border border-amber-500/20 text-amber-400'
                        : 'bg-cyan-500/10 border border-cyan-500/20 text-cyan-400'
                    }`}>
                      {index + 1}
                    </div>

                    <input
                      type="text"
                      value={item.label}
                      onChange={(e) => {
                        const newIndicators = [...(config.indicators || [])]
                        newIndicators[index] = { ...newIndicators[index], label: e.target.value }
                        onUpdate({ ...element, config: { ...config, indicators: newIndicators } })
                      }}
                      className="flex-1 px-3 py-1.5 rounded-lg bg-transparent border border-transparent hover:border-white/[0.06] focus:border-cyan-400/40 text-sm text-white placeholder-white/20 focus:outline-none transition-all"
                      placeholder={`Pertanyaan ${index + 1}`}
                    />

                    <button
                      type="button"
                      onClick={() => {
                        const newIndicators = (config.indicators || []).filter((_: IndicatorItem, i: number) => i !== index)
                        onUpdate({ ...element, config: { ...config, indicators: newIndicators } })
                      }}
                      className="p-1.5 rounded-lg hover:bg-red-500/10 transition-colors shrink-0 opacity-0 group-hover:opacity-100"
                    >
                      <Icon name="trash" className="w-4 h-4 text-white/30 hover:text-red-400" />
                    </button>
                  </div>

                  {/* Body: Reverse + Bobot + Info Skor */}
                  <div className="flex items-center gap-4 mt-2 ml-9 flex-wrap">
                    {/* REVERSE SCORING */}
                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={item.reverse === true}
                        onChange={(e) => {
                          const newIndicators = [...(config.indicators || [])]
                          newIndicators[index] = { ...newIndicators[index], reverse: e.target.checked }
                          onUpdate({ ...element, config: { ...config, indicators: newIndicators } })
                        }}
                        className="accent-cyan-400 w-3.5 h-3.5 cursor-pointer rounded"
                      />
                      <span className={`text-[10px] ${item.reverse ? 'text-amber-400 font-medium' : 'text-white/30'}`}>
                        {item.reverse ? '🔄 STS=Baik (Reverse)' : '↕ Normal (SS=Baik)'}
                      </span>
                    </label>

                    {/* BOBOT */}
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] text-white/30">⚖️ Bobot:</span>
                      <input
                        type="number"
                        value={item.weight || 1}
                        onChange={(e) => {
                          const newIndicators = [...(config.indicators || [])]
                          newIndicators[index] = { ...newIndicators[index], weight: parseInt(e.target.value) || 1 }
                          onUpdate({ ...element, config: { ...config, indicators: newIndicators } })
                        }}
                        min={1}
                        max={10}
                        className="w-14 px-2 py-1 rounded-lg bg-white/[0.03] border border-white/[0.06] text-xs text-white focus:outline-none focus:border-cyan-400/40 text-center"
                      />
                      <span className="text-[10px] text-white/20">×</span>
                    </div>

                    {/* INFO SKOR MAKSIMAL */}
                    <div className="ml-auto">
                      <span className={`text-[10px] ${maxScore > 0 ? 'text-emerald-400/60' : 'text-white/20'}`}>
                        📊 Maks: {maxScore} poin
                      </span>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* OPSI TAMBAHAN */}
      <div className="pt-3 border-t border-white/[0.06] space-y-3">
        <div className="space-y-1.5">
          <label className="text-xs text-white/50 uppercase tracking-wider">Label Kolom Pertanyaan</label>
          <input
            type="text"
            value={config.indicatorTitle || 'Pertanyaan'}
            onChange={(e) => onUpdate({
              ...element,
              config: { ...config, indicatorTitle: e.target.value }
            })}
            className="w-full px-4 py-2.5 rounded-xl bg-white/[0.03] border border-white/[0.06] text-sm text-white focus:outline-none focus:border-cyan-400/40"
            placeholder="Label kolom pertanyaan..."
          />
        </div>

        <div className="flex items-center gap-4 flex-wrap">
          <label className="flex items-center gap-2 text-sm text-white/60 cursor-pointer">
            <input
              type="checkbox"
              checked={config.showTotalScore === true}
              onChange={(e) => onUpdate({
                ...element,
                config: { ...config, showTotalScore: e.target.checked }
              })}
              className="accent-cyan-400 w-4 h-4 cursor-pointer rounded"
            />
            <span>Tampilkan Total Skor</span>
          </label>

          <label className="flex items-center gap-2 text-sm text-white/60 cursor-pointer">
            <input
              type="checkbox"
              checked={config.showWeightedScore === true}
              onChange={(e) => onUpdate({
                ...element,
                config: { ...config, showWeightedScore: e.target.checked }
              })}
              className="accent-cyan-400 w-4 h-4 cursor-pointer rounded"
            />
            <span>Skor Berbobot</span>
          </label>

          {/* Total Skor Maksimal */}
          {config.indicators && config.indicators.length > 0 && (
            <span className="text-[10px] text-cyan-400/60 bg-cyan-500/5 px-3 py-1 rounded-full border border-cyan-500/10">
              Total Maks: {getTotalMaxScore()} poin
            </span>
          )}
        </div>
      </div>

      {/* ===== PREVIEW MINI TABEL ===== */}
      {config.indicators && config.indicators.length > 0 && config.indicatorScales && config.indicatorScales.length > 0 && (
        <div className="pt-3 border-t border-white/[0.06]">
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs text-white/50 uppercase tracking-wider">Pratinjau Tabel</label>
            <div className="flex items-center gap-3 text-[9px] text-white/20">
              <span>📊 {config.indicators.length} pertanyaan</span>
              <span>📋 {config.indicatorScales.length} skala</span>
              <span>⚖️ {config.indicators.reduce((sum: number, ind: IndicatorItem) => sum + (ind.weight || 1), 0)} total bobot</span>
            </div>
          </div>
          <div className="overflow-x-auto rounded-xl border border-white/[0.08]">
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-white/[0.03]">
                  <th className="text-left py-2 px-3 text-white/40 font-medium border-r border-white/[0.05] w-8">#</th>
                  <th className="text-left py-2 px-3 text-white/40 font-medium border-r border-white/[0.05] min-w-[150px]">
                    {config.indicatorTitle || 'Pertanyaan'}
                    {config.indicators?.some((ind: IndicatorItem) => ind.reverse === true) && (
                      <span className="text-[9px] text-amber-400/60 ml-1">(↕ STS=baik)</span>
                    )}
                  </th>
                  {(config.indicatorScales || []).map((scale: IndicatorScale, i: number) => {
                    const isLowest = scale.value === Math.min(...config.indicatorScales.map((s: IndicatorScale) => s.value))
                    const isHighest = scale.value === Math.max(...config.indicatorScales.map((s: IndicatorScale) => s.value))

                    return (
                      <th key={i} className={`text-center py-2 px-3 font-medium border-r border-white/[0.05] min-w-[40px] ${
                        isLowest ? 'text-red-400/60' : isHighest ? 'text-emerald-400/60' : 'text-white/40'
                      }`}>
                        <div className="flex flex-col items-center">
                          <span className="font-bold">{scale.label}</span>
                          <span className="text-[8px] text-white/20">({scale.value})</span>
                        </div>
                      </th>
                    )
                  })}
                  {config.showTotalScore && (
                    <th className="text-center py-2 px-3 text-white/40 font-medium min-w-[50px]">Skor</th>
                  )}
                </tr>
              </thead>
              <tbody>
                {(config.indicators || []).slice(0, 4).map((indicator: IndicatorItem, i: number) => {
                  const isReverse = indicator.reverse === true
                  const maxVal = getMaxScaleValue()
                  const displayLabel = isReverse ? `${indicator.label} 🔄` : indicator.label

                  return (
                    <tr key={i} className={`border-t border-white/[0.03] hover:bg-white/[0.01] ${isReverse ? 'bg-amber-500/5' : ''}`}>
                      <td className="py-2 px-3 text-white/30 border-r border-white/[0.05] text-center">{i + 1}</td>
                      <td className="py-2 px-3 text-white/60 border-r border-white/[0.05] truncate max-w-[150px]">
                        {displayLabel}
                        {isReverse && (
                          <span className="text-[8px] text-amber-400/50 ml-1">(STS=baik)</span>
                        )}
                        <span className="text-[8px] text-white/20 ml-1">×{indicator.weight || 1}</span>
                      </td>
                      {(config.indicatorScales || []).map((scale: IndicatorScale, j: number) => {
                        const isHighlight = (isReverse && scale.value === 1) || (!isReverse && scale.value === maxVal)
                        return (
                          <td key={j} className="text-center py-2 px-3 border-r border-white/[0.05]">
                            <div className={`w-4 h-4 mx-auto rounded-full border transition-all ${
                              isHighlight
                                ? 'border-emerald-400/50 bg-emerald-500/10 ring-1 ring-emerald-400/30'
                                : 'border-white/10'
                            }`} />
                          </td>
                        )
                      })}
                      {config.showTotalScore && (
                        <td className="text-center py-2 px-3 text-white/20">-</td>
                      )}
                    </tr>
                  )
                })}
                {config.indicators.length > 4 && (
                  <tr className="border-t border-white/[0.03]">
                    <td colSpan={2 + (config.indicatorScales || []).length + (config.showTotalScore ? 1 : 0)}
                        className="py-2 px-3 text-center text-[10px] text-white/20">
                      + {config.indicators.length - 4} pertanyaan lainnya
                    </td>
                  </tr>
                )}
                {config.showTotalScore && (
                  <tr className="border-t border-white/[0.06] bg-white/[0.02]">
                    <td colSpan={2} className="py-2 px-3 text-white/50 font-medium text-right border-r border-white/[0.05]">
                      Total Skor Maksimal
                    </td>
                    {(config.indicatorScales || []).map((_: IndicatorScale, i: number) => (
                      <td key={i} className="border-r border-white/[0.05]"></td>
                    ))}
                    <td className="text-center py-2 px-3 text-cyan-400 font-bold">
                      {getTotalMaxScore()}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
