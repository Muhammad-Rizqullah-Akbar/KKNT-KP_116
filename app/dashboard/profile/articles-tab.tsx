'use client'

import Link from 'next/link'
import { Icon } from '@/components/ui/Icons'
import type { ArticleData } from '@/lib/repositories/articles.repo'

type ArticlesTabProps = {
  articles: ArticleData[]
  displayName?: string
}

export default function ArticlesTab({ articles, displayName }: ArticlesTabProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-extrabold text-slate-100 flex items-center gap-2">
          <Icon name="bookOpen" className="w-4 h-4 text-purple-400" />
          <span>Materi Edukasi Pangan Yang Diterbitkan</span>
        </h3>

        <Link
          href="/dashboard/articles"
          className="px-3 py-1.5 rounded-xl bg-purple-600/20 text-purple-300 border border-purple-500/30 text-xs font-bold hover:bg-purple-600/30 transition-all"
        >
          + Tulis Artikel Baru (CMS)
        </Link>
      </div>

      <div className="rounded-3xl bg-slate-900 border border-slate-800 overflow-hidden">
        {articles.length === 0 ? (
          <div className="p-12 text-center text-slate-500 text-xs space-y-2">
            <Icon name="bookOpen" className="w-10 h-10 mx-auto text-slate-700" />
            <p className="font-bold text-slate-300">Belum ada artikel edukasi yang dipublish</p>
            <p className="max-w-md mx-auto text-slate-500">
              Mulai bagikan materi edukasi keamanan pangan untuk sekolah, pasar, dan komunitas Anda melalui CMS.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-800/80">
            {articles.map((art) => (
              <div key={art.id || art.slug} className="p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-slate-800/40 transition-colors">
                <div className="space-y-1.5 max-w-xl">
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-md bg-purple-950 text-purple-300 border border-purple-500/30 text-[10px] font-bold">
                      {art.category || 'Materi Edukasi'}
                    </span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${
                      art.status === 'Published'
                        ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'
                        : 'bg-amber-500/10 text-amber-300 border-amber-500/30'
                    }`}>
                      {art.status}
                    </span>
                  </div>

                  <h4 className="text-sm font-bold text-slate-100">{art.title}</h4>
                  <p className="text-xs text-slate-400 line-clamp-1">{art.excerpt || 'Penulisan edukasi keamanan pangan BPOM.'}</p>

                  <div className="flex items-center gap-3 text-[11px] text-slate-500 font-mono pt-1">
                    <span>Penulis: {art.author || displayName}</span>
                    <span>•</span>
                    <span>{art.views || 0} Pembaca</span>
                    <span>•</span>
                    <span>{art.date}</span>
                  </div>
                </div>

                <Link
                  href="/dashboard/articles"
                  className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold self-start md:self-center transition-colors"
                >
                  Buka di CMS
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
