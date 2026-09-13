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

  // Deduplikasi array tag
  const uniqueTags = Array.from(new Set(article.tags || []))
  const displayImage = article.image || article.featuredImage || null

  return (
    <div
      className="fixed inset-0 z-[120] flex items-center justify-center p-4 sm:p-6 overflow-y-auto bg-black/85 backdrop-blur-xl animate-fadeIn"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-4xl max-h-[88vh] overflow-y-auto custom-scrollbar bg-slate-950 border border-slate-800 rounded-3xl shadow-2xl animate-slideUp text-slate-100"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-20 w-10 h-10 rounded-full bg-slate-900/80 hover:bg-slate-800 text-slate-300 hover:text-white flex items-center justify-center transition-all border border-slate-700/80 shadow-lg"
        >
          <Icon name="x" className="w-5 h-5" />
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
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/30 to-transparent" />
          <div className="absolute bottom-4 left-6 z-10">
            <span className={`px-3 py-1 rounded-full text-xs font-bold font-mono border shadow-md ${categoryBadgeColors[article.category] || 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'}`}>
              {article.category || 'Edukasi'}
            </span>
          </div>
        </div>

        <div className="p-6 sm:p-8 space-y-6">
          <div>
            <h2 className="font-display text-2xl sm:text-3xl font-extrabold text-white mb-3 leading-snug">
              {article.title}
            </h2>
            <div className="flex flex-wrap items-center gap-4 text-xs font-mono text-slate-400">
              <span className="flex items-center gap-1.5">
                <Icon name="calendar" className="w-3.5 h-3.5 text-emerald-400" /> {article.date || '—'}
              </span>
              <span className="text-slate-600">•</span>
              <span className="flex items-center gap-1.5">
                <Icon name="clock" className="w-3.5 h-3.5 text-cyan-400" /> {article.readTime || 5} menit baca
              </span>
              <span className="text-slate-600">•</span>
              <span className="flex items-center gap-1.5">
                <Icon name="eye" className="w-3.5 h-3.5 text-amber-400" /> {(article.views || 0).toLocaleString()} views
              </span>
              <span className="text-slate-600">•</span>
              <span className="flex items-center gap-1.5">
                <Icon name="user" className="w-3.5 h-3.5 text-purple-400" /> {article.author || 'Penulis KKPD'}
              </span>
            </div>
          </div>

          {article.excerpt && (
            <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800">
              <p className="text-cyan-200 text-sm leading-relaxed italic font-sans">
                "{article.excerpt}"
              </p>
            </div>
          )}

          {/* Article Content with Crisp White Text */}
          <div className="prose prose-invert max-w-none text-slate-100 text-sm leading-relaxed space-y-4 font-sans">
            <div
              className="[&>p]:text-slate-200 [&>p]:leading-relaxed [&>p]:mb-3 [&>h2]:text-white [&>h2]:font-extrabold [&>h2]:text-lg [&>h2]:mt-6 [&>h2]:mb-2 [&>blockquote]:p-4 [&>blockquote]:rounded-2xl [&>blockquote]:bg-emerald-950/30 [&>blockquote]:border-l-4 [&>blockquote]:border-emerald-500 [&>blockquote]:text-emerald-200 [&>ul]:list-disc [&>ul]:pl-5 [&>ul]:space-y-1 [&>ul]:text-slate-200"
              dangerouslySetInnerHTML={{ __html: article.content || '<p>Isi artikel edukasi...</p>' }}
            />
          </div>

          {/* Tags */}
          {uniqueTags.length > 0 && (
            <div className="flex flex-wrap gap-2 pt-4 border-t border-slate-800">
              {uniqueTags.map((tag: any, index: number) => (
                <span 
                  key={`${String(tag)}-${index}`} 
                  className="px-3 py-1 rounded-lg bg-slate-900 border border-slate-800 text-xs font-mono text-cyan-300"
                >
                  {String(tag).startsWith('#') ? String(tag) : `#${String(tag)}`}
                </span>
              ))}
            </div>
          )}

          {/* Call-to-Action Questionnaire Widget */}
          <div className="rounded-2xl bg-gradient-to-r from-purple-950/80 via-slate-900 to-cyan-950/80 border border-purple-500/40 p-5 space-y-3 shadow-xl">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-md bg-purple-500/20 text-purple-300 border border-purple-500/30 text-[10px] font-extrabold flex items-center gap-1 font-mono uppercase">
                <Icon name="checkCircle" className="w-3.5 h-3.5 text-purple-400" />
                <span>Kuesioner Keamanan Pangan Interaktif</span>
              </span>
            </div>

            <div>
              <h4 className="text-base font-extrabold text-white">Dukung Edukasi Keamanan Pangan & Isi Kuesioner Resmi</h4>
              <p className="text-xs text-slate-300 leading-relaxed mt-1">
                Bantu kader penyuluhan <strong className="text-purple-300">{article.author || 'KKPD-KP'}</strong> dengan mengisi kuesioner evaluasi hygiene & sanitasi pangan.
              </p>
            </div>

            <div className="flex items-center gap-3 pt-1">
              <a
                href={`/form/${article.embeddedDistributionCode || 'KKPD-MASTER'}`}
                target="_blank"
                rel="noreferrer"
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-purple-500 to-cyan-500 hover:from-purple-400 hover:to-cyan-400 text-slate-950 font-extrabold text-xs shadow-lg shadow-purple-500/20 flex items-center gap-2 transition-all font-mono"
              >
                <Icon name="clipboardList" className="w-4 h-4 text-slate-950" />
                <span>Isi Kuesioner Sekarang (Kode: {article.embeddedDistributionCode || 'KKPD-MASTER'})</span>
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}