'use client'

import React from 'react'
import type { IndicatorScale, Indicator } from '@/lib/forms/v1_5/types'
import { Icon } from '@/components/ui/Icons'

export type DetailedIndicator = Indicator & {
  scores?: Record<string, number> // Map scale choice label or index to custom score
}

interface LikertScaleEditorProps {
  scales: IndicatorScale[]
  indicators: DetailedIndicator[]
  showWeightedScore?: boolean
  onChangeScales: (scales: IndicatorScale[]) => void
  onChangeIndicators: (indicators: DetailedIndicator[]) => void
  onChangeShowWeightedScore: (show: boolean) => void
}

export function LikertScaleEditor({
  scales,
  indicators,
  showWeightedScore = false,
  onChangeScales,
  onChangeIndicators,
  onChangeShowWeightedScore,
}: LikertScaleEditorProps) {
  const currentScales =
    scales && scales.length > 0
      ? scales
      : [
          { value: 1, label: 'Sangat Tidak Setuju (STS)' },
          { value: 2, label: 'Tidak Setuju (TS)' },
          { value: 3, label: 'Netral (N)' },
          { value: 4, label: 'Setuju (S)' },
          { value: 5, label: 'Sangat Setuju (SS)' },
        ]

  // Add scale choice column
  const addScalePoint = () => {
    const nextVal = currentScales.length + 1
    const updated = [...currentScales, { value: nextVal, label: `Skala ${nextVal}` }]
    onChangeScales(updated)
  }

  const updateScalePoint = (index: number, update: Partial<IndicatorScale>) => {
    const updated = currentScales.map((s, i) => (i === index ? { ...s, ...update } : s))
    onChangeScales(updated)
  }

  const removeScalePoint = (index: number) => {
    if (currentScales.length <= 2) return
    const updated = currentScales.slice(0, currentScales.length - 1)
    onChangeScales(updated)
  }

  // Add indicator row
  const addIndicatorRow = () => {
    const indId = `ind_${crypto.randomUUID()}`
    const defaultScores: Record<string, number> = {}
    currentScales.forEach((s) => {
      defaultScores[s.label || `op_${s.value}`] = s.value
    })

    const updated = [
      ...indicators,
      { indicatorId: indId, label: `Indikator ${indicators.length + 1}`, weight: 1, scores: defaultScores },
    ]
    onChangeIndicators(updated)
  }

  const updateIndicatorRow = (indId: string, update: Partial<DetailedIndicator>) => {
    const updated = indicators.map((ind) => (ind.indicatorId === indId ? { ...ind, ...update } : ind))
    onChangeIndicators(updated)
  }

  const updateIndicatorChoiceScore = (indId: string, choiceKey: string, score: number) => {
    const targetInd = indicators.find((i) => i.indicatorId === indId)
    if (!targetInd) return

    const currentScores = targetInd.scores || {}
    const updatedScores = { ...currentScores, [choiceKey]: score }
    updateIndicatorRow(indId, { scores: updatedScores })
  }

  const removeIndicatorRow = (indId: string) => {
    const updated = indicators.filter((ind) => ind.indicatorId !== indId)
    onChangeIndicators(updated)
  }

  // Reset a specific indicator row scores back to default scale values
  const resetIndicatorRowScores = (indId: string) => {
    const defaultScores: Record<string, number> = {}
    currentScales.forEach((s) => {
      defaultScores[s.label || `op_${s.value}`] = s.value
    })
    updateIndicatorRow(indId, { scores: defaultScores })
  }

  return (
    <div className="space-y-5 p-4 rounded-xl bg-slate-900/80 border border-slate-800">
      {/* 1. SCALE COLUMNS (GLOBAL OPTIONS) */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <label className="text-xs font-semibold text-cyan-300 flex items-center gap-1.5">
            <Icon name="sliders" className="w-4 h-4 text-cyan-400" />
            Kolom Opsi Skala Jawaban
          </label>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={addScalePoint}
              className="px-2.5 py-1 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-200 border border-cyan-500/40 text-xs font-medium transition-colors"
            >
              + Opsi Skala
            </button>
            {currentScales.length > 2 && (
              <button
                type="button"
                onClick={() => removeScalePoint(currentScales.length - 1)}
                className="px-2.5 py-1 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/40 text-xs font-medium transition-colors"
              >
                - Kurangi
              </button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-5 gap-2">
          {currentScales.map((scale, scIdx) => (
            <div key={scIdx} className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1.5">
              <div className="text-[11px] font-mono text-cyan-400 font-bold">Opsi {scIdx + 1}</div>
              <input
                type="text"
                value={scale.label}
                onChange={(e) => updateScalePoint(scIdx, { label: e.target.value })}
                placeholder="Label skala..."
                className="w-full bg-slate-900 border border-slate-700 text-slate-200 text-xs rounded px-2.5 py-1.5 focus:outline-none focus:border-cyan-500 font-medium"
              />
            </div>
          ))}
        </div>
      </div>

      {/* 2. PER-INDICATOR CUSTOM SCORING DETAILS */}
      <div className="space-y-3 pt-3 border-t border-slate-800">
        <div className="flex items-center justify-between">
          <label className="text-xs font-semibold text-amber-300 flex items-center gap-1.5">
            <Icon name="list" className="w-4 h-4 text-amber-400" />
            Detail Skor Fleksibel Per Setiap Indikator
          </label>
          <button
            type="button"
            onClick={addIndicatorRow}
            className="px-2.5 py-1 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 border border-amber-500/40 text-xs font-medium transition-colors"
          >
            + Tambah Indikator
          </button>
        </div>

        {indicators.length === 0 ? (
          <p className="text-xs text-slate-500 italic p-3 text-center border border-dashed border-slate-800 rounded-lg">
            Belum ada indikator. Klik &quot;+ Tambah Indikator&quot; di atas.
          </p>
        ) : (
          <div className="space-y-3">
            {indicators.map((ind, indIdx) => {
              const indScores = ind.scores || {}

              return (
                <div
                  key={ind.indicatorId}
                  className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3 shadow-sm"
                >
                  {/* Indicator Title & Row Reset */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-2 flex-1">
                      <span className="text-xs font-mono font-bold text-cyan-400 w-5">{indIdx + 1}.</span>
                      <input
                        type="text"
                        value={ind.label}
                        onChange={(e) => updateIndicatorRow(ind.indicatorId, { label: e.target.value })}
                        placeholder="Teks pertanyaan indikator..."
                        className="flex-1 bg-slate-900 border border-slate-700 text-slate-200 text-xs rounded-lg px-3 py-1.5 focus:outline-none focus:border-amber-500 font-semibold"
                      />
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => resetIndicatorRowScores(ind.indicatorId)}
                        className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-medium border border-slate-700 transition-colors"
                        title="Reset skor indikator ini ke standar"
                      >
                        Reset Skor Baris Ini
                      </button>

                      <button
                        type="button"
                        onClick={() => removeIndicatorRow(ind.indicatorId)}
                        className="p-1 text-slate-500 hover:text-rose-400 transition-colors"
                        title="Hapus Indikator"
                      >
                        <Icon name="trash" className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Flexible Per-Choice Score Inputs for this Specific Indicator */}
                  <div className="p-3 rounded-lg bg-slate-900/90 border border-slate-800/80 space-y-1">
                    <div className="text-[11px] font-medium text-slate-400 mb-1.5">
                      Atur Skor Setiap Opsi Untuk Indikator Ini:
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                      {currentScales.map((scale, scIdx) => {
                        const choiceKey = scale.label || `op_${scale.value}`
                        const currentScoreVal = indScores[choiceKey] !== undefined ? indScores[choiceKey] : scale.value

                        return (
                          <div
                            key={scIdx}
                            className="p-2 rounded-lg bg-slate-950 border border-slate-800 flex items-center justify-between gap-1 text-xs"
                          >
                            <span className="text-[11px] font-semibold text-slate-300 truncate pr-1">
                              {scale.label.split(' ')[0] || `Opsi ${scIdx + 1}`}
                            </span>
                            <div className="flex items-center gap-1">
                              <input
                                type="number"
                                value={currentScoreVal}
                                onChange={(e) =>
                                  updateIndicatorChoiceScore(
                                    ind.indicatorId,
                                    choiceKey,
                                    Number(e.target.value) || 0
                                  )
                                }
                                className="w-12 bg-slate-900 border border-slate-700 text-amber-300 font-bold text-center text-xs rounded px-1 py-0.5 focus:outline-none focus:border-amber-500"
                              />
                              <span className="text-[10px] text-slate-500 font-mono">pt</span>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Show Weighted Score Checkbox */}
      <div className="flex items-center justify-between p-3 rounded-lg bg-slate-950 border border-slate-800">
        <div className="text-xs text-slate-300">
          <span className="font-semibold">Kalikan Skor Dengan Bobot Indikator (Weighted Score Calculation)</span>
        </div>
        <input
          type="checkbox"
          checked={showWeightedScore}
          onChange={(e) => onChangeShowWeightedScore(e.target.checked)}
          className="w-4 h-4 text-cyan-500 rounded focus:ring-cyan-400"
        />
      </div>
    </div>
  )
}
