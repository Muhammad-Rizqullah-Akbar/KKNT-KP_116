'use client'

import Link from 'next/link'
import { Icon } from '@/components/ui/Icons'
import { ArticleCard } from './ArticleCard'

interface EdukasiSectionProps {
  articles: any[]
  categoryBadgeColors: Record<string, string>
  onOpenArticleModal: (article: any) => void
}

export function EdukasiSection({ articles, categoryBadgeColors, onOpenArticleModal }: EdukasiSectionProps) {
  return (
    <section id="edukasi" className="relative w-full max-w-6xl mx-auto overflow-hidden rounded-3xl bg-[#080812] bg-grid-pattern mb-8 sm:mb-12 scroll-mt-24 px-4 sm:px-6 lg:px-8">
      <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-emerald-500/8 rounded-full blur-[120px] pointer-events-none animate-pulse-slow" />
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-rose-500/6 rounded-full blur-[120px] pointer-events-none animate-pulse-slow" style={{ animationDelay: '3s' }} />
      <div className="absolute inset-0 bg-scanlines pointer-events-none z-10 opacity-40" />

      <div className="relative z-20 py-10 sm:py-14 lg:py-16">
        <div className="text-center mb-12 lg:mb-14">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/[0.03] border border-white/[0.06] mb-5 backdrop-blur-sm">
            <Icon name="bookOpen" className="w-3.5 h-3.5 text-emerald-400" />
            <span className="text-xs font-medium tracking-widest uppercase text-emerald-400/90">Knowledge Hub</span>
          </div>
          <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-semibold tracking-tight text-white mb-4">
            Edukasi <span className="bg-gradient-to-r from-emerald-400 via-teal-300 to-emerald-400 bg-clip-text text-transparent">&</span> Wawasan
          </h2>
          <p className="text-base sm:text-lg text-white/50 max-w-2xl mx-auto leading-relaxed font-light">
            Kumpulan insight, strategi, dan pengetahuan eksklusif untuk mempercepat pertumbuhan Anda di era digital.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 lg:gap-6">
          {articles.map((article) => (
            <ArticleCard
              key={article.id}
              article={article}
              onClick={onOpenArticleModal}
              categoryBadgeColors={categoryBadgeColors}
            />
          ))}
        </div>

        <div className="flex justify-center mt-10">
          <Link href="/articles">
            <button className="group/btn relative inline-flex items-center justify-center gap-3 px-10 py-4 rounded-xl font-semibold text-sm text-white bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-600 hover:from-emerald-500 hover:via-teal-500 hover:to-emerald-500 shadow-lg shadow-emerald-600/25 hover:shadow-emerald-500/40 transition-all duration-400 hover:-translate-y-0.5 overflow-hidden">
              <span className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover/btn:translate-x-full transition-transform duration-700 ease-in-out" />
              <span className="relative z-10 flex items-center gap-2">
                <Icon name="bookOpen" className="w-5 h-5" /> Lihat Semua Artikel
                <Icon name="arrowRight" className="w-4 h-4 transition-transform duration-300 group-hover/btn:translate-x-1" />
              </span>
            </button>
          </Link>
        </div>
      </div>
    </section>
  )
}