'use client'

import Link from 'next/link'
import { Icon } from '@/components/ui/Icons'
import { sanitizeHtml } from '@/lib/infra/sanitize-html'
import { getCategoryStyle, type ArticleData } from '@/lib/repositories/articles.repo'
import { formatDate, type HeadingItem, type LightboxImage } from './article-utils'

interface ArticleMainContentProps {
  article: ArticleData
  relatedArticles: ArticleData[]
  isEditMode: boolean
  contentRef: React.RefObject<HTMLDivElement | null>
  uniqueTags: string[]
  parsedHeadings: HeadingItem[]
  activeHeading: string
  onScrollToHeading: (id: string) => void
  onOpenLightbox: (image: LightboxImage) => void
  pretestAvailability?: { available: boolean; reason: string } | null
  posttestAvailability?: { available: boolean; reason: string } | null
}

export function ArticleMainContent({
  article,
  relatedArticles,
  isEditMode,
  contentRef,
  uniqueTags,
  parsedHeadings,
  activeHeading,
  onScrollToHeading,
  onOpenLightbox,
  pretestAvailability,
  posttestAvailability,
}: ArticleMainContentProps) {
  const pretestCode = article.pretestCode || (article as any).pretestFormId
  const posttestCode = article.posttestCode || article.embeddedDistributionCode

  // Banner hanya tampil jika kode ada DAN (belum ada validasi OR validasi = available)
  const showPretest = pretestCode && (!pretestAvailability || pretestAvailability.available)
  const showPosttest = posttestCode && (!posttestAvailability || posttestAvailability.available)

  return (
    <main className="relative w-full max-w-6xl mx-auto mt-8 sm:mt-10 px-4 sm:px-6 lg:px-8">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">

        {/* DESKTOP TOC (SMOOTH SCROLLABLE) */}
        <aside className="hidden lg:block lg:col-span-3">
          <div className="sticky top-28 space-y-6">
            <div className="rounded-2xl bg-[#080812] border border-white/[0.05] p-6">
              <h4 className="text-sm font-semibold text-white/80 mb-4 flex items-center gap-2">
                <Icon name="list" className="w-4 h-4 text-cyan-400" /> Daftar Isi
              </h4>
              {parsedHeadings.length === 0 ? (
                <p className="text-sm text-white/30">
                  {article.content ? 'Tidak ada sub-judul di artikel ini.' : 'Memuat daftar isi...'}
                </p>
              ) : (
                <nav className="space-y-2">
                  {parsedHeadings.map((heading, index) => (
                    <button
                      type="button"
                      key={`${heading.id}-${index}`}
                      onClick={() => onScrollToHeading(heading.id)}
                      className={`block w-full text-left text-sm py-1.5 border-l-2 pl-3 transition-colors ${
                        activeHeading === heading.id ? 'text-cyan-400 border-cyan-400 font-medium' : 'text-white/45 hover:text-cyan-400 border-transparent'
                      }`}
                    >
                      {index + 1}. {heading.text}
                    </button>
                  ))}
                </nav>
              )}
            </div>
          </div>
        </aside>

        {/* KONTEN UTAMA ARTIKEL */}
        <article className="lg:col-span-6 article-content text-white/60 leading-relaxed space-y-8 text-base sm:text-lg">
          {/* 1. PRETEST QUESTIONNAIRE BANNER (AT THE VERY TOP - BEFORE READING ARTICLE) */}
          {showPretest && (
            <div className="mb-8 p-6 rounded-3xl bg-gradient-to-br from-cyan-950/90 via-slate-900 to-slate-950 border-2 border-cyan-500/50 shadow-2xl space-y-3 font-sans">
              <div className="flex items-center justify-between gap-3 border-b border-cyan-500/20 pb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-400 shrink-0 font-bold">
                    <Icon name="fileText" className="w-5 h-5 text-cyan-400" />
                  </div>
                  <div>
                    <h4 className="text-base font-extrabold text-white flex items-center gap-2">
                      <span>📝 Kuesioner Pretest (Evaluasi Baseline Awal)</span>
                    </h4>
                    <p className="text-xs text-cyan-300 font-mono">Kode Akses Pretest: <strong>{pretestCode}</strong></p>
                  </div>
                </div>
                <span className="px-2.5 py-1 rounded-full text-[10px] font-mono font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 shrink-0">
                  TAHAP 1: PRETEST
                </span>
              </div>
              <p className="text-xs text-white/70 leading-relaxed font-sans">
                Sebelum membaca materi edukasi di bawah ini, mohon luangkan waktu 1-2 menit untuk mengisi kuesioner <strong>Pretest</strong> berikut untuk mengukur tingkat pemahaman awal Anda.
              </p>
              <a
                href={`/form/${pretestCode}`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-gradient-to-r from-cyan-500 to-teal-400 hover:from-cyan-400 hover:to-teal-300 text-slate-950 text-xs font-black uppercase tracking-wider shadow-lg shadow-cyan-500/25 transition-all font-mono"
              >
                <span>Mulai Isi Kuesioner Pretest →</span>
              </a>
            </div>
          )}

          {/* MAIN ARTICLE TEXT BODY */}
          <div
            ref={contentRef}
            contentEditable={isEditMode}
            suppressContentEditableWarning
            className={isEditMode ? 'editable-active' : ''}
            dangerouslySetInnerHTML={{ __html: sanitizeHtml(article.content) }}
          />

          {/* TAGS */}
          {uniqueTags.length > 0 && (
            <div className="flex flex-wrap gap-2 pt-8 border-t border-white/[0.06]">
              {uniqueTags.map((tag: string, idx: number) => (
                <span key={`${tag}-${idx}`} className="px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-400">
                  {tag.startsWith('#') ? tag : `#${tag}`}
                </span>
              ))}
            </div>
          )}

          {/* GALERI DOKUMENTASI */}
          {article.gallery && article.gallery.length > 0 && (
            <div className="mt-10">
              <h3 className="font-display text-2xl font-semibold text-white mb-4">Galeri Dokumentasi</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
                {article.gallery.map((image, idx) => (
                  <div
                    key={image.id || idx}
                    onClick={() => onOpenLightbox(image)}
                    className="cursor-pointer group relative rounded-xl overflow-hidden aspect-square border border-white/[0.05] bg-[#080812]"
                  >
                    {image.url ? (
                      <img src={image.url} alt={image.caption} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                    ) : (
                      <div className={`absolute inset-0 bg-gradient-to-br ${image.gradient || 'from-cyan-700/50 to-emerald-800/50'} flex items-center justify-center`}>
                        <Icon name="image" className="w-8 h-8 text-white/30" />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-black/40 group-hover:bg-black/20 transition-colors" />
                    <div className="absolute bottom-2 left-2 right-2 px-2 py-1 rounded bg-black/60 text-[10px] text-white truncate">{image.caption}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 2. POSTTEST QUESTIONNAIRE BANNER (AT THE VERY BOTTOM - AFTER READING ARTICLE & GALLERY) */}
          {showPosttest && (
            <div className="mt-10 p-6 rounded-3xl bg-gradient-to-br from-purple-950/90 via-slate-900 to-slate-950 border-2 border-purple-500/50 shadow-2xl space-y-3 font-sans">
              <div className="flex items-center justify-between gap-3 border-b border-purple-500/20 pb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-purple-500/20 border border-purple-500/40 flex items-center justify-center text-purple-300 shrink-0 font-bold">
                    <Icon name="checkCircle" className="w-5 h-5 text-purple-300" />
                  </div>
                  <div>
                    <h4 className="text-base font-extrabold text-white flex items-center gap-2">
                      <span>🎯 Kuesioner Posttest (Evaluasi Pasca-Membaca)</span>
                    </h4>
                    <p className="text-xs text-purple-300 font-mono">Kode Akses Posttest: <strong>{article.posttestCode || article.embeddedDistributionCode}</strong></p>
                  </div>
                </div>
                <span className="px-2.5 py-1 rounded-full text-[10px] font-mono font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30 shrink-0">
                  TAHAP 2: POSTTEST
                </span>
              </div>
              <p className="text-xs text-white/70 leading-relaxed font-sans">
                Selamat! Anda telah selesai membaca materi edukasi ini. Silakan klik tombol di bawah ini untuk mengisi kuesioner <strong>Posttest</strong> guna mengukur peningkatan pemahaman Anda.
              </p>
              <a
                href={`/form/${article.posttestCode || article.embeddedDistributionCode}`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-gradient-to-r from-purple-500 to-emerald-400 hover:from-purple-400 hover:to-emerald-300 text-slate-950 text-xs font-black uppercase tracking-wider shadow-lg shadow-purple-500/25 transition-all font-mono"
              >
                <span>Mulai Isi Kuesioner Posttest →</span>
              </a>
            </div>
          )}
        </article>

        {/* SIDEBAR REKOMENDASI TERKAIT */}
        <aside className="lg:col-span-3">
          <div className="sticky top-28 space-y-6">
            <div className="rounded-2xl bg-[#080812] border border-white/[0.05] p-6">
              <h4 className="text-sm font-semibold text-white/80 mb-4 flex items-center gap-2">
                <Icon name="bookOpen" className="w-4 h-4 text-emerald-400" /> Artikel Terkait
              </h4>
              {relatedArticles.length === 0 ? (
                <p className="text-xs text-white/30">Belum ada artikel terkait</p>
              ) : (
                relatedArticles.map((ra) => (
                  <Link key={ra.id} href={`/articles/${ra.slug}`} className="block group p-3 rounded-xl hover:bg-white/[0.03] transition-colors border border-transparent hover:border-white/[0.05]">
                    <p className={`text-xs ${getCategoryStyle(ra.category).badge} inline-block px-2 py-0.5 rounded-full mb-1`}>{ra.category}</p>
                    <h5 className="text-sm font-medium text-white group-hover:text-cyan-300 transition-colors">{ra.title}</h5>
                    <p className="text-xs text-white/35 mt-1">{formatDate(ra.date)} • {ra.readTime} min</p>
                  </Link>
                ))
              )}
            </div>
          </div>
        </aside>

      </div>
    </main>
  )
}
