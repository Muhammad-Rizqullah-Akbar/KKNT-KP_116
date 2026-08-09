'use client'

import React, { useState } from 'react'
import type { Question, QuestionType, AnswerKey, Indicator, IndicatorScale } from '@/lib/forms/v1_5/types'
import type { FormAspect, BuilderQuestion } from '@/lib/forms/v1_5/builderState'
import { QUESTION_TYPES } from '@/lib/forms/v1_5/types'
import { LikertScaleEditor } from './LikertScaleEditor'
import { Icon } from '@/components/ui/Icons'

interface QuestionEditorProps {
  question: BuilderQuestion
  aspects?: FormAspect[]
  onUpdate: (update: Omit<Partial<BuilderQuestion>, 'questionId'>) => void
  onClose: () => void
}

export function QuestionEditor({ question, aspects = [], onUpdate, onClose }: QuestionEditorProps) {
  const [activeTab, setActiveTab] = useState<'content' | 'answer' | 'scoring' | 'validation'>('content')

  // Helpers for options
  const addOption = () => {
    const newOptId = `${question.questionId}-option-${crypto.randomUUID()}`
    const updatedOptions = [...question.options, { optionId: newOptId, label: `Opsi ${question.options.length + 1}` }]
    onUpdate({ options: updatedOptions })
  }

  const updateOptionLabel = (optionId: string, label: string) => {
    const updatedOptions = question.options.map((opt) =>
      opt.optionId === optionId ? { ...opt, label } : opt
    )
    onUpdate({ options: updatedOptions })
  }

  const removeOption = (optionId: string) => {
    const updatedOptions = question.options.filter((opt) => opt.optionId !== optionId)
    let updatedAnswerKey = question.answerKey
    if (updatedAnswerKey.kind === 'option') {
      updatedAnswerKey = {
        kind: 'option',
        correctOptionIds: updatedAnswerKey.correctOptionIds.filter((id) => id !== optionId),
      }
    }
    onUpdate({ options: updatedOptions, answerKey: updatedAnswerKey })
  }

  // Answer Key Toggles
  const toggleCorrectOption = (optionId: string) => {
    const currentCorrect =
      question.answerKey.kind === 'option' ? question.answerKey.correctOptionIds : []
    const isSingle = question.type === 'single-choice' || question.type === 'binary' || question.type === 'dropdown'

    let nextCorrect: string[]
    if (isSingle) {
      nextCorrect = currentCorrect.includes(optionId) ? [] : [optionId]
    } else {
      nextCorrect = currentCorrect.includes(optionId)
        ? currentCorrect.filter((id) => id !== optionId)
        : [...currentCorrect, optionId]
    }

    onUpdate({
      answerKey: nextCorrect.length > 0 ? { kind: 'option', correctOptionIds: nextCorrect } : { kind: 'none' },
    })
  }

  return (
    <div className="p-5 border-t border-slate-800 bg-slate-950/80 rounded-b-2xl space-y-5 animate-in slide-in-from-top-2 duration-150 shadow-inner">
      {/* Navigation Tabs */}
      <div className="flex items-center gap-1.5 p-1 bg-slate-900 border border-slate-800 rounded-xl overflow-x-auto">
        <button
          type="button"
          onClick={() => setActiveTab('content')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all ${
            activeTab === 'content'
              ? 'bg-blue-500/20 text-blue-200 border border-blue-500/40 shadow-sm'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
          }`}
        >
          <span className="w-2 h-2 rounded-full bg-blue-400" />
          <span>🔵 KONTEN</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('answer')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all ${
            activeTab === 'answer'
              ? 'bg-emerald-500/20 text-emerald-200 border border-emerald-500/40 shadow-sm'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
          }`}
        >
          <span className="w-2 h-2 rounded-full bg-emerald-400" />
          <span>🟢 KUNCI JAWABAN & SKALA</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('scoring')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all ${
            activeTab === 'scoring'
              ? 'bg-amber-500/20 text-amber-200 border border-amber-500/40 shadow-sm'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
          }`}
        >
          <span className="w-2 h-2 rounded-full bg-amber-400" />
          <span>🟡 SKOR & BOBOT</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('validation')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all ${
            activeTab === 'validation'
              ? 'bg-purple-500/20 text-purple-200 border border-purple-500/40 shadow-sm'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
          }`}
        >
          <span className="w-2 h-2 rounded-full bg-purple-400" />
          <span>🟣 VALIDASI</span>
        </button>
      </div>

      {/* 🔵 SECTION 1: CONTENT */}
      {activeTab === 'content' && (
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">
              Teks Pertanyaan <span className="text-rose-400">*</span>
            </label>
            <input
              type="text"
              value={question.prompt}
              onChange={(e) => onUpdate({ prompt: e.target.value })}
              placeholder="Tuliskan teks pertanyaan di sini..."
              className="w-full bg-slate-900 border border-slate-700 text-slate-100 text-sm rounded-xl px-3.5 py-2.5 focus:outline-none focus:border-cyan-500"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">Tipe Pertanyaan</label>
              <select
                value={question.type}
                onChange={(e) => onUpdate({ type: e.target.value as QuestionType })}
                className="w-full bg-slate-900 border border-slate-700 text-slate-100 text-sm rounded-xl px-3.5 py-2.5 focus:outline-none focus:border-cyan-500"
              >
                {QUESTION_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>

            {aspects.length > 0 && (
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">Aspek / Bagian</label>
                <select
                  value={question.aspectId || aspects[0]?.aspectId}
                  onChange={(e) => onUpdate({ aspectId: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 text-cyan-300 text-sm font-semibold rounded-xl px-3.5 py-2.5 focus:outline-none focus:border-cyan-500"
                >
                  {aspects.map((asp) => (
                    <option key={asp.aspectId} value={asp.aspectId}>
                      {asp.title}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">Petunjuk / Deskripsi</label>
              <input
                type="text"
                value={question.presentation.description || ''}
                onChange={(e) =>
                  onUpdate({ presentation: { ...question.presentation, description: e.target.value } })
                }
                placeholder="Petunjuk pengerjaan..."
                className="w-full bg-slate-900 border border-slate-700 text-slate-100 text-sm rounded-xl px-3.5 py-2.5 focus:outline-none focus:border-cyan-500"
              />
            </div>
          </div>

          {/* Lampiran Gambar */}
          <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/40 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-300 flex items-center gap-2">
                <Icon name="image" className="w-4 h-4 text-cyan-400" />
                Lampiran Gambar Pertanyaan
              </span>
              <button
                type="button"
                onClick={() =>
                  onUpdate({
                    presentation: {
                      ...question.presentation,
                      media:
                        question.presentation.media?.type === 'image'
                          ? { type: 'none' }
                          : { type: 'image', url: '', caption: '' },
                    },
                  })
                }
                className="text-xs text-cyan-400 hover:underline font-medium"
              >
                {question.presentation.media?.type === 'image' ? 'Hapus Lampiran' : 'Tambah Lampiran'}
              </button>
            </div>

            {question.presentation.media?.type === 'image' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">URL Gambar</label>
                  <input
                    type="url"
                    value={question.presentation.media.url || ''}
                    onChange={(e) =>
                      onUpdate({
                        presentation: {
                          ...question.presentation,
                          media: { ...question.presentation.media, type: 'image', url: e.target.value },
                        },
                      })
                    }
                    placeholder="https://example.com/image.jpg"
                    className="w-full bg-slate-950 border border-slate-700 text-slate-200 text-xs rounded-lg px-3 py-2 focus:outline-none focus:border-cyan-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">Caption Gambar</label>
                  <input
                    type="text"
                    value={question.presentation.media.caption || ''}
                    onChange={(e) =>
                      onUpdate({
                        presentation: {
                          ...question.presentation,
                          media: { ...question.presentation.media, type: 'image', caption: e.target.value },
                        },
                      })
                    }
                    placeholder="Keterangan gambar..."
                    className="w-full bg-slate-950 border border-slate-700 text-slate-200 text-xs rounded-lg px-3 py-2 focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 🟢 SECTION 2: ANSWER CONFIGURATION & LIKERT */}
      {activeTab === 'answer' && (
        <div className="space-y-4">
          {/* Options for Choice/Binary/Dropdown */}
          {['single-choice', 'multiple-choice', 'binary', 'dropdown'].includes(question.type) && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-slate-200">
                  Daftar Opsi Jawaban & Kunci Jawaban
                </label>
                <button
                  type="button"
                  onClick={addOption}
                  className="px-3 py-1.5 rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-xs font-medium hover:bg-emerald-500/30 transition-colors flex items-center gap-1.5"
                >
                  <Icon name="plus" className="w-3.5 h-3.5" />
                  <span>Tambah Opsi</span>
                </button>
              </div>

              {question.options.length === 0 ? (
                <div className="p-4 text-center border border-dashed border-slate-800 rounded-xl text-slate-400 text-xs">
                  Belum ada opsi. Klik &quot;Tambah Opsi&quot; di atas.
                </div>
              ) : (
                <div className="space-y-2">
                  {question.options.map((opt, optIdx) => {
                    const isCorrect =
                      question.answerKey.kind === 'option' &&
                      question.answerKey.correctOptionIds.includes(opt.optionId)

                    return (
                      <div
                        key={opt.optionId}
                        className={`flex items-center gap-3 p-2.5 rounded-xl border transition-all ${
                          isCorrect
                            ? 'bg-emerald-950/30 border-emerald-500/60'
                            : 'bg-slate-900 border-slate-800'
                        }`}
                      >
                        <button
                          type="button"
                          onClick={() => toggleCorrectOption(opt.optionId)}
                          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold border transition-all ${
                            isCorrect
                              ? 'bg-emerald-500 text-slate-950 border-emerald-400'
                              : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-emerald-400'
                          }`}
                        >
                          <Icon name="check" className="w-3.5 h-3.5" />
                          <span>{isCorrect ? 'Kunci Benar' : 'Bukan Kunci'}</span>
                        </button>

                        <span className="text-xs font-mono text-slate-500 w-6 text-center">{optIdx + 1}.</span>

                        <input
                          type="text"
                          value={opt.label}
                          onChange={(e) => updateOptionLabel(opt.optionId, e.target.value)}
                          placeholder="Label opsi..."
                          className="flex-1 bg-slate-950 border border-slate-700 text-slate-200 text-xs rounded-lg px-3 py-1.5 focus:outline-none focus:border-cyan-500"
                        />

                        <button
                          type="button"
                          onClick={() => removeOption(opt.optionId)}
                          className="p-1.5 text-slate-500 hover:text-rose-400 transition-colors"
                        >
                          <Icon name="trash" className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )}

          {/* Configurable Likert Scale & Indicator Table Editor */}
          {(question.type === 'likert' || question.type === 'indicator-table') && (
            <LikertScaleEditor
              scales={question.presentation.indicatorScales || []}
              indicators={question.presentation.indicators || []}
              showWeightedScore={question.presentation.showWeightedScore}
              onChangeScales={(scales: IndicatorScale[]) =>
                onUpdate({ presentation: { ...question.presentation, indicatorScales: scales } })
              }
              onChangeIndicators={(indicators: Indicator[]) => {
                const reverseIds = indicators.filter((i) => i.reverse).map((i) => i.indicatorId)
                onUpdate({
                  presentation: { ...question.presentation, indicators },
                  answerKey: reverseIds.length > 0 ? { kind: 'indicator', reverseIndicatorIds: reverseIds } : { kind: 'none' },
                })
              }}
              onChangeShowWeightedScore={(show: boolean) =>
                onUpdate({ presentation: { ...question.presentation, showWeightedScore: show } })
              }
            />
          )}

          {/* Non-scorable / Text / Rating / File Note */}
          {!['single-choice', 'multiple-choice', 'binary', 'dropdown', 'likert', 'indicator-table'].includes(question.type) && (
            <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 text-xs space-y-1">
              <div className="font-semibold text-slate-200">Kunci Jawaban Tipe {question.type}</div>
              <p>
                Tipe pertanyaan ini dikonfigurasi melalui rentang nilai (misal: Rating Min/Max) atau merupakan input teks/file non-skor.
              </p>
            </div>
          )}
        </div>
      )}

      {/* 🟡 SECTION 3: SCORING & WEIGHTS */}
      {activeTab === 'scoring' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">Skema Penilaian (Scoring Scheme)</label>
              <select
                value={question.scoring.scheme}
                onChange={(e) =>
                  onUpdate({
                    scoring: {
                      ...question.scoring,
                      scheme: e.target.value as Question['scoring']['scheme'],
                    },
                  })
                }
                className="w-full bg-slate-900 border border-slate-700 text-slate-100 text-sm rounded-xl px-3.5 py-2.5 focus:outline-none focus:border-amber-500"
              >
                <option value="none">none (Tanpa Skor)</option>
                <option value="binary">binary (Biner 0 / Weight)</option>
                <option value="likert">likert (Skala Likert)</option>
                <option value="indicator">indicator (Tabel Indikator)</option>
                <option value="rating">rating (Bintang / Skor Bertingkat)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">Bobot Pertanyaan (Weight)</label>
              <input
                type="number"
                min={0}
                step={0.5}
                value={question.scoring.weight}
                onChange={(e) =>
                  onUpdate({
                    scoring: {
                      ...question.scoring,
                      weight: Math.max(0, Number(e.target.value) || 0),
                    },
                  })
                }
                className="w-full bg-slate-900 border border-slate-700 text-amber-300 font-bold text-sm rounded-xl px-3.5 py-2.5 focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>
        </div>
      )}

      {/* 🟣 SECTION 4: VALIDATION & CONSTRAINTS */}
      {activeTab === 'validation' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-900 border border-slate-800">
            <div>
              <div className="text-xs font-semibold text-slate-200">Wajib Diisi (Required)</div>
              <div className="text-[11px] text-slate-400">Responden harus mengisi pertanyaan ini sebelum mengirimkan formulir</div>
            </div>
            <input
              type="checkbox"
              checked={question.required}
              onChange={(e) => onUpdate({ required: e.target.checked })}
              className="w-5 h-5 text-purple-500 rounded focus:ring-purple-400"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">Teks Placeholder Input</label>
              <input
                type="text"
                value={question.presentation.placeholder || ''}
                onChange={(e) =>
                  onUpdate({ presentation: { ...question.presentation, placeholder: e.target.value } })
                }
                placeholder="Contoh: Ketik di sini..."
                className="w-full bg-slate-900 border border-slate-700 text-slate-200 text-xs rounded-xl px-3.5 py-2.5 focus:outline-none focus:border-purple-500"
              />
            </div>

            {/* Rating range (1-5, 1-10 support) */}
            {question.type === 'rating' && (
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">Rating Min</label>
                  <input
                    type="number"
                    value={question.presentation.ratingMin ?? 1}
                    onChange={(e) =>
                      onUpdate({
                        presentation: { ...question.presentation, ratingMin: Number(e.target.value) },
                      })
                    }
                    className="w-full bg-slate-900 border border-slate-700 text-slate-200 text-xs rounded-lg px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">Rating Max (1-10)</label>
                  <input
                    type="number"
                    min={2}
                    max={10}
                    value={question.presentation.ratingMax ?? 5}
                    onChange={(e) =>
                      onUpdate({
                        presentation: { ...question.presentation, ratingMax: Number(e.target.value) },
                      })
                    }
                    className="w-full bg-slate-900 border border-slate-700 text-slate-200 text-xs rounded-lg px-3 py-2"
                  />
                </div>
              </div>
            )}

            {/* File upload constraints */}
            {(question.type === 'file-upload' || question.type === 'image') && (
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">Batas Ukuran File (MB)</label>
                <input
                  type="number"
                  min={1}
                  max={50}
                  value={question.presentation.maxFileSizeMb ?? 5}
                  onChange={(e) =>
                    onUpdate({
                      presentation: { ...question.presentation, maxFileSizeMb: Number(e.target.value) },
                    })
                  }
                  className="w-full bg-slate-900 border border-slate-700 text-slate-200 text-xs rounded-xl px-3.5 py-2.5"
                />
              </div>
            )}
          </div>
        </div>
      )}

      {/* Done Editing */}
      <div className="flex justify-end pt-2 border-t border-slate-800">
        <button
          type="button"
          onClick={onClose}
          className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl border border-slate-700 transition-colors"
        >
          Selesai Mengedit Pertanyaan
        </button>
      </div>
    </div>
  )
}
