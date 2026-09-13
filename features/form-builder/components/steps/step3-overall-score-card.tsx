'use client'

import { Icon } from '@/components/ui/Icons'

export interface SimulatedGradeResult {
  title: string
  grade: string
}

export interface SimulatedOverallResult {
  percentage: number
  rawScore: number
  maximumScore: number
  gradeResult: SimulatedGradeResult
}

interface OverallScoreCardProps {
  result: SimulatedOverallResult
  gradeArticleMap: Record<string, string[]>
  publishedArticlesMap: Record<string, any>
}

export function OverallScoreCard({ result, gradeArticleMap, publishedArticlesMap }: OverallScoreCardProps) {
  const grade = result.gradeResult.grade
  const mappedArticleIds = gradeArticleMap[grade] || []
  const recommendedArticles = mappedArticleIds.map((id) => publishedArticlesMap[id]).filter(Boolean)

  return (
    <div className="space-y-4">
      <div className="p-6 rounded-xl bg-gradient-to-br from-slate-950 to-purple-950/40 border border-purple-500/30 flex flex-col md:flex-row items-center justify-between gap-6 shadow-lg">
        <div className="space-y-1.5 text-center md:text-left">
          <span className="text-xs font-mono font-bold uppercase tracking-wider text-purple-400">
            SKOR AKHIR KESELURUHAN (OVERALL SCORE)
          </span>
          <h3 className="text-3xl font-extrabold text-slate-100">{result.percentage}%</h3>
          <div className="flex items-center gap-2 justify-center md:justify-start">
            <span className="px-2.5 py-0.5 rounded-md bg-purple-500/20 text-purple-300 border border-purple-500/40 text-xs font-bold">
              Tingkat: {result.gradeResult.title} ({result.gradeResult.grade})
            </span>
            <span className="text-xs text-slate-400">
              ({result.rawScore} / {result.maximumScore} Poin Raw)
            </span>
          </div>
        </div>

        <div className="w-24 h-24 rounded-full border-4 border-purple-500/40 flex items-center justify-center bg-slate-950 shadow-inner shrink-0">
          <span className="text-2xl font-black text-purple-300">{result.percentage}%</span>
        </div>
      </div>

      {/* DYNAMIC ARTICLE RECOMMENDATIONS CARD FOR CALCULATED GRADE */}
      <div className="p-4 rounded-xl bg-slate-950 border border-cyan-500/30 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-cyan-300 flex items-center gap-2">
            <Icon name="bookOpen" className="w-4 h-4 text-cyan-400" />
            Rekomendasi Artikel Edukasi (Korelasi Grade {grade}):
          </span>
          <span className="text-[10px] text-slate-400 font-mono">
            {recommendedArticles.length} Artikel Direkomendasikan
          </span>
        </div>

        {recommendedArticles.length === 0 ? (
          <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 text-[11px] text-slate-400 italic">
            Belum ada artikel edukasi yang dipetakan untuk Grade {grade}. Anda dapat memilih artikel pada panel "Konfigurasi Grade Penilaian & Rekomendasi Artikel" di atas.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {recommendedArticles.map((art) => (
              <div
                key={art.id}
                className="p-3 rounded-xl bg-slate-900 border border-slate-800 hover:border-cyan-500/40 space-y-1.5 transition-all"
              >
                <span className="text-[9px] font-bold text-cyan-400 uppercase tracking-wider block">
                  {art.category}
                </span>
                <h5 className="text-xs font-bold text-slate-100 line-clamp-2">{art.title}</h5>
                <a
                  href={`/edukasi/${art.slug}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[10px] font-semibold text-cyan-400 hover:underline inline-block pt-1"
                >
                  Baca Artikel Edukasi →
                </a>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
