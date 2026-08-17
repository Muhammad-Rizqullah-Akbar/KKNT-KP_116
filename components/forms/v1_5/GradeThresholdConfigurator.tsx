'use client'

import React, { useState, useEffect } from 'react'
import type { GradeThreshold, RecommendationConfig } from '@/lib/forms/v1_5/builderState'
import { Icon } from '@/components/ui/Icons'

interface ArticleItem {
  id: string
  title: string
  slug: string
  category: string
}

interface GradeThresholdConfiguratorProps {
  thresholds: GradeThreshold[]
  recommendations: RecommendationConfig
  onChangeThresholds: (thresholds: GradeThreshold[]) => void
  onChangeRecommendations: (recommendations: RecommendationConfig) => void
}

export function GradeThresholdConfigurator({
  thresholds,
  recommendations,
  onChangeThresholds,
  onChangeRecommendations,
}: GradeThresholdConfiguratorProps) {
  const [publishedArticles, setPublishedArticles] = useState<ArticleItem[]>([])
  const [loadingArticles, setLoadingArticles] = useState(false)
  const [isExpanded, setIsExpanded] = useState(false)

  useEffect(() => {
    async function fetchArticles() {
      setLoadingArticles(true)
      try {
        const res = await fetch('/api/v1_5/articles/published')
        const data = await res.json()
        if (data.success && Array.isArray(data.articles)) {
          setPublishedArticles(data.articles)
        }
      } catch (e) {
        // Fallback catch
      } finally {
        setLoadingArticles(false)
      }
    }
    fetchArticles()
  }, [])

  const handleUpdateThreshold = (index: number, update: Partial<GradeThreshold>) => {
    const next = [...thresholds]
    next[index] = { ...next[index], ...update }
    onChangeThresholds(next)
  }

  const handleToggleArticleForGrade = (grade: string, articleId: string) => {
    const currentMap = recommendations.gradeArticleMap || {}
    const currentList = currentMap[grade] || []
    const nextList = currentList.includes(articleId)
      ? currentList.filter((id) => id !== articleId)
      : [...currentList, articleId]

    const nextMap = { ...currentMap, [grade]: nextList }
    onChangeRecommendations({
      ...recommendations,
      mode: 'hybrid',
      gradeArticleMap: nextMap,
    })
  }

  const gradeArticleMap = recommendations.gradeArticleMap || {}

  return (
    <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-4 shadow-md">
      <div className="flex items-center justify-between pb-3 border-b border-slate-800 gap-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
            <Icon name="award" className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-100">Konfigurasi Grade Penilaian & Rekomendasi Artikel</h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Atur batas nilai (Grade A-E) dan petakan rekomendasi materi artikel edukasi secara dinamis.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setIsExpanded(!isExpanded)}
          className="px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 hover:border-slate-700 text-xs font-bold text-slate-300 flex items-center gap-1.5 transition-all shrink-0"
        >
          <span>{isExpanded ? 'Sembunyikan Pengaturan' : 'Atur Batas & Artikel'}</span>
          <Icon name={isExpanded ? 'chevronUp' : 'chevronDown'} className="w-4 h-4" />
        </button>
      </div>

      {/* SUMMARY BADGES */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-xs">
        {thresholds.map((t) => {
          const mappedCount = (gradeArticleMap[t.grade] || []).length
          return (
            <div
              key={t.id || t.grade}
              className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1 text-center"
            >
              <span className="text-[10px] font-mono font-bold text-purple-400 uppercase block">
                Grade {t.grade} ({t.min}%-{t.max}%)
              </span>
              <span className="font-bold text-slate-200 text-xs block truncate">{t.title}</span>
              <span className="text-[9px] text-slate-400 font-mono block">
                {mappedCount} Artikel Direkomendasikan
              </span>
            </div>
          )
        })}
      </div>

      {/* EXPANDED DETAILED FORM CONFIGURATOR */}
      {isExpanded && (
        <div className="pt-3 border-t border-slate-800/80 space-y-5">
          <div className="space-y-4">
            {thresholds.map((t, idx) => {
              const mappedArticles = gradeArticleMap[t.grade] || []
              return (
                <div
                  key={t.id || t.grade}
                  className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-3"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-800/60">
                    <div className="flex items-center gap-2">
                      <span className="w-7 h-7 rounded-lg bg-purple-500/20 text-purple-300 font-black text-xs flex items-center justify-center border border-purple-500/40">
                        {t.grade}
                      </span>
                      <input
                        type="text"
                        value={t.title}
                        onChange={(e) => handleUpdateThreshold(idx, { title: e.target.value })}
                        placeholder="Judul Tingkat (Misal: Sangat Baik)"
                        className="bg-slate-900 border border-slate-700 text-slate-100 text-xs font-bold rounded-lg px-3 py-1.5 focus:outline-none focus:border-purple-400"
                      />
                    </div>

                    {/* RANGE BOUNDARY MIN & MAX */}
                    <div className="flex items-center gap-2 text-xs text-slate-300 font-mono">
                      <span>Batas Nilai:</span>
                      <input
                        type="number"
                        min={0}
                        max={100}
                        value={t.min}
                        onChange={(e) => handleUpdateThreshold(idx, { min: Number(e.target.value) || 0 })}
                        className="w-16 bg-slate-900 border border-slate-700 text-purple-300 text-center font-bold rounded-lg px-2 py-1 focus:outline-none"
                      />
                      <span>% s/d</span>
                      <input
                        type="number"
                        min={0}
                        max={100}
                        value={t.max}
                        onChange={(e) => handleUpdateThreshold(idx, { max: Number(e.target.value) || 0 })}
                        className="w-16 bg-slate-900 border border-slate-700 text-purple-300 text-center font-bold rounded-lg px-2 py-1 focus:outline-none"
                      />
                      <span>%</span>
                    </div>
                  </div>

                  {/* ARTICLE RECOMMENDATIONS MAPPING SELECTOR */}
                  <div className="space-y-2">
                    <span className="text-[11px] font-bold text-slate-300 flex items-center gap-1.5">
                      <Icon name="bookOpen" className="w-3.5 h-3.5 text-cyan-400" />
                      Rekomendasi Artikel Edukasi Untuk Grade {t.grade}:
                    </span>

                    {loadingArticles ? (
                      <div className="text-[11px] text-slate-500 italic">Memuat daftar artikel...</div>
                    ) : publishedArticles.length === 0 ? (
                      <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 text-[11px] text-slate-400 italic">
                        Belum ada artikel terpublikasi di database. Artikel yang nanti dipublikasikan akan otomatis muncul untuk dipetakan.
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                        {publishedArticles.map((art) => {
                          const isSelected = mappedArticles.includes(art.id)
                          return (
                            <button
                              key={art.id}
                              type="button"
                              onClick={() => handleToggleArticleForGrade(t.grade, art.id)}
                              className={`p-2.5 rounded-lg border text-left text-xs transition-all flex items-start justify-between gap-2 ${
                                isSelected
                                  ? 'bg-cyan-500/10 border-cyan-500/40 text-cyan-200'
                                  : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                              }`}
                            >
                              <div className="space-y-0.5 min-w-0">
                                <span className="font-semibold block truncate">{art.title}</span>
                                <span className="text-[9px] text-slate-500 block">Kategori: {art.category}</span>
                              </div>
                              <span
                                className={`text-[9px] font-bold px-1.5 py-0.5 rounded border shrink-0 ${
                                  isSelected
                                    ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40'
                                    : 'bg-slate-800 text-slate-400 border-slate-700'
                                }`}
                              >
                                {isSelected ? 'Dipilih' : '+ Pilih'}
                              </span>
                            </button>
                          )
                        })}
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
