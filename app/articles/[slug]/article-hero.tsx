'use client'

import { Icon, type IconName } from '@/components/ui/Icons'
import { getCategoryStyle, type ArticleData } from '@/lib/repositories/articles.repo'
import { formatDate, formatViews } from './article-utils'

interface ArticleHeroProps {
  article: ArticleData
  isEditMode: boolean
  onUpdate: (patch: Partial<ArticleData>) => void
  onFeaturedImageUpload: (file: File) => void
}

export function ArticleHero({ article, isEditMode, onUpdate, onFeaturedImageUpload }: ArticleHeroProps) {
  const categoryStyle = getCategoryStyle(article.category)

  return (
    <header className="relative w-full max-w-6xl mx-auto mt-6 sm:mt-10 px-4 sm:px-6 lg:px-8">
      <div className="relative overflow-hidden rounded-3xl bg-[#080812]">
        <div className="relative z-10">
          {/* HERO FEATURED IMAGE / BANNER */}
          <div className="relative w-full h-64 sm:h-80 lg:h-96 overflow-hidden rounded-t-3xl group/banner">
            <div className={`absolute inset-0 bg-gradient-to-br ${categoryStyle.gradient} flex items-center justify-center`}>
              {article.featuredImage ? (
                <img src={article.featuredImage} alt={article.title} className="w-full h-full object-cover" />
              ) : (
                <Icon name={(categoryStyle.icon as IconName) || 'cpu'} className="w-20 h-20 text-white/20 animate-float" />
              )}
            </div>

            {/* OPSI GANTI BANNER JIKA EDIT MODE AKTIF */}
            {isEditMode && (
              <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                <label className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-xs text-white font-medium cursor-pointer flex items-center gap-2 shadow-xl">
                  <Icon name="image" className="w-4 h-4" /> Ganti Banner Utama
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0]
                      if (file) onFeaturedImageUpload(file)
                    }}
                  />
                </label>
              </div>
            )}

            <div className="absolute inset-0 bg-gradient-to-t from-[#080812] via-[#080812]/40 to-transparent pointer-events-none" />
            <div className="absolute top-4 left-4 z-20 flex gap-2">
              <span className={`px-3 py-1.5 rounded-full bg-black/50 backdrop-blur-sm border border-white/10 text-xs font-medium ${categoryStyle.badge}`}>
                {article.category}
              </span>
            </div>
          </div>

          <div className="px-6 py-8 sm:px-10 lg:px-16 lg:py-12 -mt-12 relative z-20">
            <div className="flex flex-wrap items-center gap-3 mb-4">
              <span className="text-xs text-white/40 flex items-center gap-1"><Icon name="calendar" className="w-3.5 h-3.5" /> {formatDate(article.date)}</span>
              <span className="text-xs text-white/25">•</span>
              <span className="text-xs text-white/40 flex items-center gap-1"><Icon name="clock" className="w-3.5 h-3.5" /> {article.readTime} menit baca</span>
              <span className="text-xs text-white/25">•</span>
              <span className="text-xs text-white/40 flex items-center gap-1"><Icon name="eye" className="w-3.5 h-3.5" /> {formatViews(article.views)} views</span>
            </div>

            {/* LIVE EDITABLE TITLE */}
            <h1
              contentEditable={isEditMode}
              suppressContentEditableWarning
              onBlur={(e) => onUpdate({ title: e.currentTarget.innerText })}
              className={`font-display text-3xl sm:text-5xl lg:text-6xl font-bold tracking-tight leading-[1.15] mb-4 text-white ${isEditMode ? 'editable-active' : ''}`}
            >
              {article.title}
            </h1>

            {/* LIVE EDITABLE EXCERPT */}
            <p
              contentEditable={isEditMode}
              suppressContentEditableWarning
              onBlur={(e) => onUpdate({ excerpt: e.currentTarget.innerText })}
              className={`text-base sm:text-xl text-white/50 max-w-3xl leading-relaxed mb-6 ${isEditMode ? 'editable-active' : ''}`}
            >
              {article.excerpt}
            </p>

            <div className="flex flex-wrap items-center justify-between gap-4 border-t border-white/10 pt-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-emerald-500 to-cyan-500 flex items-center justify-center text-white font-bold text-lg">
                  {(article.author || 'A').split(' ').map((word: string) => word[0]).join('')}
                </div>
                <div>
                  <p
                    contentEditable={isEditMode}
                    suppressContentEditableWarning
                    onBlur={(e) => onUpdate({ author: e.currentTarget.innerText })}
                    className={`text-sm font-semibold text-white ${isEditMode ? 'editable-active' : ''}`}
                  >
                    {article.author}
                  </p>
                  <p
                    contentEditable={isEditMode}
                    suppressContentEditableWarning
                    onBlur={(e) => onUpdate({ authorBio: e.currentTarget.innerText })}
                    className={`text-xs text-white/40 ${isEditMode ? 'editable-active' : ''}`}
                  >
                    {article.authorBio || 'Penulis Edukasi'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}
