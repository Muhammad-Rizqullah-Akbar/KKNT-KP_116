'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { Icon } from '@/components/ui/Icons'

interface ArticleModalProps {
  article: any
  isOpen: boolean
  onClose: () => void
  categoryBadgeColors: Record<string, string>
}

export function ArticleModal({ article, isOpen, onClose, categoryBadgeColors }: ArticleModalProps) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [isOpen])

  if (!isOpen || !article) return null

  // Deduplikasi array tag agar key tidak bentrok
  const uniqueTags = Array.from(new Set(article.tags || []))
  const displayImage = article.image || article.featuredImage || null

  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center p-4 overflow-y-auto"
      style={{ backgroundColor: 'rgba(0, 0, 0, 0.85)', backdropFilter: 'blur(12px)' }}
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-4xl max-h-[90vh] overflow-y-auto custom-scrollbar bg-[#0e0e1a] border border-white/[0.08] rounded-3xl shadow-2xl animate-slideUp"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors backdrop-blur-sm border border-white/10"
        >
          <Icon name="x" className="w-5 h-5 text-white" />
        </button>

        {/* Header Banner / Featured Image */}
        <div className={`relative h-56 sm:h-72 rounded-t-3xl overflow-hidden bg-gradient-to-br ${article.gradient || 'from-emerald-700/40 to-cyan-800/40'}`}>
          {displayImage ? (
            <img 
              src={displayImage} 
              alt={article.title || 'Featured'} 
              className="w-full h-full object-cover" 
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center">
              <Icon name={(article.icon as any) || 'fileText'} className={`w-20 h-20 ${article.iconColor || 'text-emerald-400'} opacity-40`} />
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-[#0e0e1a] via-transparent to-transparent" />
          <div className="absolute bottom-4 left-6 z-10">
            <span className={`px-3 py-1 rounded-full text-xs font-medium ${categoryBadgeColors[article.category] || 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'}`}>
              {article.category || 'Edukasi'}
            </span>
          </div>
        </div>

        <div className="p-6 sm:p-8 space-y-6">
          <div>
            <h2 className="font-display text-2xl sm:text-3xl font-bold text-white mb-3">
              {article.title}
            </h2>
            <div className="flex flex-wrap items-center gap-4 text-xs text-white/40">
              <span className="flex items-center gap-1.5">
                <Icon name="calendar" className="w-3.5 h-3.5" /> {article.date || '—'}
              </span>
              <span className="text-white/20">•</span>
              <span className="flex items-center gap-1.5">
                <Icon name="clock" className="w-3.5 h-3.5" /> {article.readTime || 5} menit baca
              </span>
              <span className="text-white/20">•</span>
              <span className="flex items-center gap-1.5">
                <Icon name="eye" className="w-3.5 h-3.5" /> {(article.views || 0).toLocaleString()} views
              </span>
              <span className="text-white/20">•</span>
              <span className="flex items-center gap-1.5">
                <Icon name="user" className="w-3.5 h-3.5" /> {article.author || 'Penulis'}
              </span>
            </div>
          </div>

          {article.excerpt && (
            <div className="p-4 rounded-xl bg-white/[0.03] border border-white/[0.06]">
              <p className="text-white/60 text-sm leading-relaxed italic">
                "{article.excerpt}"
              </p>
            </div>
          )}

          <div className="prose prose-invert max-w-none text-white/60 text-sm leading-relaxed space-y-4">
            <div dangerouslySetInnerHTML={{ __html: article.content || '' }} />
          </div>

          {/* 🔥 DEDUPLIKASI TAGS + UNIQUE COMBINED KEY */}
          {uniqueTags.length > 0 && (
            <div className="flex flex-wrap gap-2 pt-4 border-t border-white/[0.06]">
              {uniqueTags.map((tag: string, index: number) => (
                <span 
                  key={`${tag}-${index}`} 
                  className="px-3 py-1.5 rounded-full bg-emerald-500/8 border border-emerald-500/15 text-xs text-emerald-400"
                >
                  {tag.startsWith('#') ? tag : `#${tag}`}
                </span>
              ))}
            </div>
          )}

          <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.05] flex items-start gap-4">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-emerald-500 to-cyan-500 flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
              {(article.author || 'A').split(' ').map((n: string) => n[0]).join('')}
            </div>
            <div>
              <p className="text-sm font-semibold text-white">{article.author || 'Penulis Edukasi'}</p>
              <p className="text-xs text-white/40">{article.authorBio || 'Kontributor Keamanan Pangan'}</p>
            </div>
          </div>

          <div className="flex flex-wrap gap-3 pt-4 border-t border-white/[0.06]">
            <Link href={`/articles/${article.slug}`}>
              <button className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-cyan-600 to-teal-600 hover:from-cyan-500 hover:to-teal-500 text-white text-sm font-medium transition-all shadow-lg shadow-cyan-600/25 flex items-center gap-2">
                <Icon name="bookOpen" className="w-4 h-4" /> Baca Selengkapnya
              </button>
            </Link>
            <button
              onClick={onClose}
              className="px-6 py-2.5 rounded-xl bg-white/[0.03] border border-white/[0.06] text-white/70 hover:text-white transition-all"
            >
              Tutup
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}