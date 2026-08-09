'use client'

import React, { useState, useEffect } from 'react'
import type { ScoringConfig, ValidationConfig } from '@/lib/forms/v1_5/types'
import type { FormAspect, BuilderQuestion, GradeThreshold, RecommendationConfig } from '@/lib/forms/v1_5/builderState'
import { Icon } from '@/components/ui/Icons'

interface ArticleItem {
  id: string
  title: string
  slug: string
  category: string
  status: string
}

interface FormVersionSettingsProps {
  scoring: ScoringConfig
  validation: ValidationConfig
  thresholds: GradeThreshold[]
  recommendations: RecommendationConfig
  aspects: FormAspect[]
  questions: BuilderQuestion[]
  onScoringChange: (update: Partial<ScoringConfig>) => void
  onValidationChange: (update: Partial<ValidationConfig>) => void
  onThresholdsChange: (thresholds: GradeThreshold[]) => void
  onRecommendationsChange: (update: Partial<RecommendationConfig>) => void
}

export function FormVersionSettings({
  scoring,
  validation,
  thresholds,
  recommendations,
  aspects,
  questions,
  onScoringChange,
  onValidationChange,
  onThresholdsChange,
  onRecommendationsChange,
}: FormVersionSettingsProps) {
  const [publishedArticles, setPublishedArticles] = useState<ArticleItem[]>([])
  const [isLoadingArticles, setIsLoadingArticles] = useState(false)

  // Fetch published-only articles for recommendation mapping
  useEffect(() => {
    async function loadArticles() {
      setIsLoadingArticles(true)
      try {
        const res = await fetch('/api/v1_5/articles/published')
        const data = await res.json()
        if (data.success && Array.isArray(data.articles)) {
          setPublishedArticles(data.articles)
        }
      } catch (err) {
        console.error('Failed to load published articles:', err)
      } finally {
        setIsLoadingArticles(false)
      }
    }
    loadArticles()
  }, [])

  // Toggle question validation exception
  const toggleException = (qId: string) => {
    const current = validation.exceptionQuestionIds || []
    const updated = current.includes(qId) ? current.filter((id) => id !== qId) : [...current, qId]
    onValidationChange({ exceptionQuestionIds: updated })
  }

  // Update aspect points distribution
  const updateAspectPoints = (aspectId: string, points: number) => {
    const updatedDist = { ...scoring.stagePointDistribution, [aspectId]: Math.min(100, Math.max(0, points)) }
    onScoringChange({ stagePointDistribution: updatedDist })
  }

  // Auto-distribute 100% across aspects
  const handleAutoDistributeAspects = () => {
    if (aspects.length === 0) return
    const autoPts = Math.floor(100 / aspects.length)
    const updatedDist: Record<string, number> = {}
    aspects.forEach((a, idx) => {
      updatedDist[a.aspectId] = idx === aspects.length - 1 ? 100 - autoPts * (aspects.length - 1) : autoPts
    })
    onScoringChange({ stagePointDistribution: updatedDist })
  }

  // Threshold helpers
  const updateThresholdItem = (index: number, update: Partial<GradeThreshold>) => {
    const updated = thresholds.map((t, i) => (i === index ? { ...t, ...update } : t))
    onThresholdsChange(updated)
  }

  const addThresholdItem = () => {
    const newT: GradeThreshold = {
      id: `t_${crypto.randomUUID()}`,
      min: 0,
      max: 50,
      grade: 'F',
      title: 'Tingkat Baru',
      description: 'Keterangan tingkat...',
    }
    onThresholdsChange([...thresholds, newT])
  }

  const removeThresholdItem = (index: number) => {
    if (thresholds.length <= 1) return
    onThresholdsChange(thresholds.filter((_, i) => i !== index))
  }

  // Toggle attached article for grade threshold recommendation
  const toggleGradeArticle = (gradeCode: string, articleId: string) => {
    const currentMap = recommendations.gradeArticleMap || {}
    const currentList = currentMap[gradeCode] || []
    const updatedList = currentList.includes(articleId)
      ? currentList.filter((id) => id !== articleId)
      : [...currentList, articleId]

    const updatedMap = { ...currentMap, [gradeCode]: updatedList }
    onRecommendationsChange({ gradeArticleMap: updatedMap })
  }

  const sumAspectPoints = Object.values(scoring.stagePointDistribution || {}).reduce((a, b) => a + (b || 0), 0)
  const isDistributionValid = sumAspectPoints === 100

  return (
    <div className="space-y-6">
      {/* 🟡 1. ASPECT POINT DISTRIBUTION (100% TOTAL RULE) */}
      <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-4 shadow-md">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-800 gap-2">
          <div>
            <h3 className="text-sm font-semibold text-amber-400 flex items-center gap-2">
              <Icon name="zap" className="w-4 h-4" />
              <span>Distribusi Bobot Aspek / Dimensi (Harus Tepat 100%)</span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">Alokasikan rasio persentase target poin per Aspek Penilaian</p>
          </div>

          <button
            type="button"
            onClick={handleAutoDistributeAspects}
            className="px-3 py-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 border border-amber-500/40 text-xs font-semibold self-start sm:self-auto transition-colors"
          >
            Bagi Rata (Otomatis)
          </button>
        </div>

        {/* Live Total Indicator */}
        <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950 border border-slate-800">
          <span className="text-xs text-slate-300 font-semibold">Total Alokasi Aspek:</span>
          <span
            className={`text-xs font-mono font-bold px-2.5 py-1 rounded-lg border ${
              isDistributionValid
                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                : 'bg-amber-500/20 text-amber-300 border-amber-500/40'
            }`}
          >
            {sumAspectPoints} / 100% {isDistributionValid ? '✓ Sesuai' : `(Sisa: ${100 - sumAspectPoints}%)`}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {aspects.map((asp) => (
            <div key={asp.aspectId} className="flex items-center justify-between p-3 rounded-xl bg-slate-950 border border-slate-800">
              <span className="text-xs font-semibold text-slate-200 truncate pr-2">{asp.title}</span>
              <div className="flex items-center gap-1.5">
                <input
                  type="number"
                  min={0}
                  max={100}
                  value={scoring.stagePointDistribution[asp.aspectId] ?? 0}
                  onChange={(e) => updateAspectPoints(asp.aspectId, Number(e.target.value) || 0)}
                  className="w-20 bg-slate-900 border border-slate-700 text-amber-300 font-bold text-center text-xs rounded-lg px-2 py-1 focus:outline-none focus:border-amber-500"
                />
                <span className="text-xs text-slate-400">%</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 🔵 2. RESULT THRESHOLDS & GRADES CONFIGURATION */}
      <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-4 shadow-md">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div>
            <h3 className="text-sm font-semibold text-cyan-400 flex items-center gap-2">
              <Icon name="sliders" className="w-4 h-4" />
              <span>Tingkat Hasil & Grade Penilaian (Result Thresholds)</span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">Konfigurasi batas nilai (0–100), kode grade, dan predikat hasil</p>
          </div>

          <button
            type="button"
            onClick={addThresholdItem}
            className="px-3 py-1.5 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-200 border border-cyan-500/40 text-xs font-semibold transition-colors"
          >
            + Tambah Grade
          </button>
        </div>

        <div className="space-y-3">
          {thresholds.map((t, idx) => {
            const attachedArticles = (recommendations.gradeArticleMap || {})[t.grade] || []

            return (
              <div key={t.id} className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono text-cyan-300 font-bold text-xs">Grade:</span>
                    <input
                      type="text"
                      value={t.grade}
                      onChange={(e) => updateThresholdItem(idx, { grade: e.target.value })}
                      className="w-14 bg-slate-900 border border-slate-700 text-cyan-300 font-bold text-center text-xs rounded px-2 py-1 uppercase"
                    />

                    <span className="font-mono text-slate-400 text-xs">Judul:</span>
                    <input
                      type="text"
                      value={t.title}
                      onChange={(e) => updateThresholdItem(idx, { title: e.target.value })}
                      className="bg-slate-900 border border-slate-700 text-slate-200 font-semibold text-xs rounded px-2.5 py-1 focus:outline-none"
                    />
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-400 font-mono">Rentang:</span>
                    <input
                      type="number"
                      min={0}
                      max={100}
                      value={t.min}
                      onChange={(e) => updateThresholdItem(idx, { min: Number(e.target.value) || 0 })}
                      className="w-14 bg-slate-900 border border-slate-700 text-slate-200 text-center text-xs rounded px-1.5 py-1"
                    />
                    <span className="text-slate-500 text-xs">–</span>
                    <input
                      type="number"
                      min={0}
                      max={100}
                      value={t.max}
                      onChange={(e) => updateThresholdItem(idx, { max: Number(e.target.value) || 0 })}
                      className="w-14 bg-slate-900 border border-slate-700 text-slate-200 text-center text-xs rounded px-1.5 py-1"
                    />
                    <span className="text-slate-400 text-xs">%</span>

                    {thresholds.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeThresholdItem(idx)}
                        className="p-1 text-slate-500 hover:text-rose-400 transition-colors ml-1"
                      >
                        <Icon name="trash" className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                <input
                  type="text"
                  value={t.description || ''}
                  onChange={(e) => updateThresholdItem(idx, { description: e.target.value })}
                  placeholder="Deskripsi rekomendasi hasil grade ini..."
                  className="w-full bg-slate-900 border border-slate-800 text-slate-400 text-xs rounded px-2.5 py-1 focus:outline-none"
                />

                {/* Article Recommendation Selector for this Grade */}
                {recommendations.mode !== 'disabled' && (
                  <div className="p-3 rounded-lg bg-slate-900 border border-slate-800/80 space-y-2">
                    <div className="flex items-center justify-between text-xs font-semibold text-emerald-400">
                      <span>Artikel Edukasi Direkomendasikan untuk Grade {t.grade}:</span>
                      <span className="font-mono text-[10px] text-slate-400">
                        {attachedArticles.length} Dipilih (Terpublikasi)
                      </span>
                    </div>

                    {isLoadingArticles ? (
                      <p className="text-xs text-slate-500 italic">Memuat artikel terpublikasi...</p>
                    ) : publishedArticles.length === 0 ? (
                      <p className="text-xs text-slate-500 italic">Belum ada artikel terpublikasi tersedia di CMS.</p>
                    ) : (
                      <div className="max-h-36 overflow-y-auto space-y-1 p-2 bg-slate-950 rounded-lg border border-slate-800">
                        {publishedArticles.map((art) => {
                          const isSelected = attachedArticles.includes(art.id)
                          return (
                            <label
                              key={art.id}
                              className={`flex items-center justify-between p-2 rounded text-xs cursor-pointer ${
                                isSelected
                                  ? 'bg-emerald-950/40 text-emerald-200 border border-emerald-500/30 font-semibold'
                                  : 'text-slate-300 hover:bg-slate-900'
                              }`}
                            >
                              <div className="truncate pr-2">
                                <span className="text-[10px] font-mono text-cyan-400 mr-1.5">[{art.category}]</span>
                                {art.title}
                              </div>
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={() => toggleGradeArticle(t.grade, art.id)}
                                className="w-4 h-4 text-emerald-500 rounded focus:ring-emerald-400"
                              />
                            </label>
                          )
                        })}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* 🟢 3. RECOMMENDATION MODE CONFIGURATION */}
      <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-4 shadow-md">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div>
            <h3 className="text-sm font-semibold text-emerald-400 flex items-center gap-2">
              <Icon name="fileText" className="w-4 h-4" />
              <span>Konfigurasi Rekomendasi Artikel (Recommendation Mode)</span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">Pengaturan penayangan artikel edukasi setelah formulir diselesaikan</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Mode Rekomendasi</label>
            <select
              value={recommendations.mode}
              onChange={(e) => onRecommendationsChange({ mode: e.target.value as RecommendationConfig['mode'] })}
              className="w-full bg-slate-950 border border-slate-700 text-slate-200 text-xs rounded-xl px-3.5 py-2.5 focus:outline-none focus:border-emerald-500"
            >
              <option value="disabled">Disabled (Non-aktifkan rekomendasi artikel)</option>
              <option value="manual">Manual (Pilih artikel terpublikasi secara manual)</option>
              <option value="automatic">Automatic (Otomatis berdasarkan topik/grade hasil)</option>
              <option value="hybrid">Hybrid (Utamakan manual dengan fallback otomatis)</option>
            </select>
          </div>

          <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center gap-3">
            <Icon name="info" className="w-5 h-5 text-emerald-400 flex-shrink-0" />
            <p className="text-xs text-slate-400 leading-relaxed">
              Mode <strong className="text-emerald-300">{recommendations.mode}</strong> akan digunakan oleh engine publik setelah responden menyelesaikan kuesioner. Hanya artikel <strong>Terpublikasi</strong> yang akan ditampilkan.
            </p>
          </div>
        </div>
      </div>

      {/* 🟣 4. VERSION VALIDATION CONFIGURATION */}
      <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-4 shadow-md">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div>
            <h3 className="text-sm font-semibold text-purple-400 flex items-center gap-2">
              <Icon name="shieldCheck" className="w-4 h-4" />
              <span>Pengaturan Validasi Pengisian (ValidationConfig)</span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">Konfigurasi aturan pengisian wajib/opsional seluruh formulir</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Mode Validasi (mode)</label>
            <select
              value={validation.mode}
              onChange={(e) => onValidationChange({ mode: e.target.value as ValidationConfig['mode'] })}
              className="w-full bg-slate-950 border border-slate-700 text-slate-200 text-xs rounded-xl px-3.5 py-2.5 focus:outline-none focus:border-purple-500"
            >
              <option value="all_required">all_required (Semua Pertanyaan Wajib)</option>
              <option value="all_required_except">all_required_except (Wajib Kecuali Dikecualikan)</option>
              <option value="free">free (Bebas / Pengisian Fleksibel)</option>
            </select>
          </div>

          <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950 border border-slate-800">
            <div>
              <div className="text-xs font-semibold text-slate-200">Izinkan Override (allowOverride)</div>
              <div className="text-[11px] text-slate-400">Izinkan override validasi tingkat pertanyaan</div>
            </div>
            <input
              type="checkbox"
              checked={validation.allowOverride}
              onChange={(e) => onValidationChange({ allowOverride: e.target.checked })}
              className="w-4 h-4 text-purple-500 rounded focus:ring-purple-400"
            />
          </div>
        </div>

        {validation.mode === 'all_required_except' && (
          <div className="pt-2 space-y-2">
            <label className="block text-xs font-medium text-purple-300">
              Pertanyaan Yang Dikecualikan Dari Aturan Wajib (Exceptions):
            </label>
            <div className="max-h-48 overflow-y-auto space-y-1.5 p-2 bg-slate-950 rounded-xl border border-slate-800">
              {questions.map((q) => {
                const isExcepted = (validation.exceptionQuestionIds || []).includes(q.questionId)
                return (
                  <label
                    key={q.questionId}
                    className={`flex items-center justify-between p-2 rounded-lg text-xs cursor-pointer ${
                      isExcepted
                        ? 'bg-purple-950/40 text-purple-200 border border-purple-500/30'
                        : 'text-slate-300 hover:bg-slate-900'
                    }`}
                  >
                    <span className="truncate pr-2">{q.prompt || q.questionId}</span>
                    <input
                      type="checkbox"
                      checked={isExcepted}
                      onChange={() => toggleException(q.questionId)}
                      className="w-4 h-4 text-purple-500 rounded"
                    />
                  </label>
                )
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
