'use client'

import { Icon } from '@/components/ui/Icons'

interface Article {
  id: number
  title: string
  slug: string
  excerpt: string
  category: string
  author: string
  date: string
  readTime: number
  gradient: string
  icon: string
  iconColor: string
}

interface ArticleCardProps {
  article: Article
  onClick: (article: Article) => void
  categoryBadgeColors: Record<string, string>
}

export function ArticleCard({ article, onClick, categoryBadgeColors }: ArticleCardProps) {
  return (
    <div
      onClick={() => onClick(article)}
      className="group cursor-pointer relative rounded-2xl bg-white/[0.02] backdrop-blur-2xl border border-white/[0.05] hover:border-emerald-500/20 transition-all duration-500 hover:-translate-y-2 hover:bg-white/[0.04] overflow-hidden glass-edge"
    >
      <div className="relative h-44 overflow-hidden">
        <div className={`absolute inset-0 bg-gradient-to-br ${article.gradient}`} />
        <div className="absolute inset-0 flex items-center justify-center">
          <Icon name={article.icon as any} className={`w-16 h-16 ${article.iconColor} opacity-30 group-hover:opacity-50 transition-opacity`} />
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-emerald-400/20 to-transparent" />
        <div className={`absolute top-3 right-3 px-2.5 py-1 rounded-full bg-black/30 backdrop-blur-sm border border-white/10 text-xs font-medium ${categoryBadgeColors[article.category]}`}>
          {article.category}
        </div>
      </div>
      <div className="p-5">
        <div className="flex items-center gap-2 text-xs text-white/35 mb-3">
          <Icon name="calendar" className="w-3.5 h-3.5" />
          <span>{article.date}</span>
          <span className="text-white/20">•</span>
          <Icon name="clock" className="w-3.5 h-3.5" />
          <span>{article.readTime} min</span>
        </div>
        <h3 className="font-display text-lg font-semibold text-white mb-2 group-hover:text-emerald-300 transition-colors duration-300 leading-tight">
          {article.title}
        </h3>
        <p className="text-white/45 text-sm leading-relaxed line-clamp-2">{article.excerpt}</p>
        <div className="flex items-center gap-2 mt-4 text-xs text-emerald-400/80 font-medium">
          <span>Baca selengkapnya</span>
          <Icon name="arrowUpRight" className="w-3.5 h-3.5 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
        </div>
      </div>
    </div>
  )
}