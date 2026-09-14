'use client'

import { Icon } from '@/components/ui/Icons'
import { SkeletonTable } from '@/components/ui/Skeleton'
import { statusColors, formatViews, formatDate } from './articles-types'
import type { Article } from './articles-types'

type ArticlesTableProps = {
  loading: boolean
  paginatedArticles: Article[]
  selectedArticleIds: string[]
  toggleSelectArticle: (id: string) => void
  toggleSelectAllCurrentPage: (currentList: Article[]) => void
  handleEdit: (article: Article) => void
  handleExportArticleJson: (article: Article) => void
  handleDelete: (id: string) => void
  openPreviewFromTable: (article: Article) => void
}

export default function ArticlesTable({
  loading,
  paginatedArticles,
  selectedArticleIds,
  toggleSelectArticle,
  toggleSelectAllCurrentPage,
  handleEdit,
  handleExportArticleJson,
  handleDelete,
  openPreviewFromTable,
}: ArticlesTableProps) {
  return (
    <div className="rounded-2xl bg-[#080812] border border-white/[0.05] overflow-hidden">
      {loading ? (
        <div className="p-4">
          <SkeletonTable rows={6} cols={6} />
        </div>
      ) : (
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/[0.05] bg-white/[0.01]">
              <th className="px-4 py-4 w-10 text-center">
                <input
                  type="checkbox"
                  checked={
                    paginatedArticles.length > 0 &&
                    paginatedArticles.every((article) => article.id && selectedArticleIds.includes(article.id))
                  }
                  onChange={() => toggleSelectAllCurrentPage(paginatedArticles)}
                  className="rounded border-slate-700 bg-slate-900 text-cyan-500 focus:ring-cyan-400 w-4 h-4 cursor-pointer"
                />
              </th>
              <th className="text-left px-6 py-4 text-xs text-white/35 uppercase tracking-wider font-medium">Judul Artikel</th>
              <th className="text-left px-6 py-4 text-xs text-white/35 uppercase tracking-wider font-medium">Kategori</th>
              <th className="text-left px-6 py-4 text-xs text-white/35 uppercase tracking-wider font-medium">Status</th>
              <th className="text-left px-6 py-4 text-xs text-white/35 uppercase tracking-wider font-medium">Views</th>
              <th className="text-left px-6 py-4 text-xs text-white/35 uppercase tracking-wider font-medium">Tanggal</th>
              <th className="text-left px-6 py-4 text-xs text-white/35 uppercase tracking-wider font-medium">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/[0.03]">
            {paginatedArticles.map((article) => (
              <tr key={article.id} className="hover:bg-white/[0.02] transition-colors">
                <td className="px-4 py-4 text-center">
                  {article.id && (
                    <input
                      type="checkbox"
                      checked={selectedArticleIds.includes(article.id)}
                      onChange={() => toggleSelectArticle(article.id!)}
                      className="rounded border-slate-700 bg-slate-900 text-cyan-500 focus:ring-cyan-400 w-4 h-4 cursor-pointer"
                    />
                  )}
                </td>
                <td className="px-6 py-4 font-medium text-white max-w-xs truncate">{article.title}</td>
                <td className="px-6 py-4">
                  <span className="px-2.5 py-1 rounded-full bg-white/[0.03] border border-white/[0.06] text-xs text-cyan-400">
                    {article.category}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <span className={`px-2.5 py-1 rounded-full border text-xs ${statusColors[article.status]}`}>
                    {article.status}
                  </span>
                </td>
                <td className="px-6 py-4 text-white/60">{formatViews(article.views)}</td>
                <td className="px-6 py-4 text-white/40 text-xs">{formatDate(article.date)}</td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-1.5">
                    <button onClick={() => handleEdit(article)} className="p-2 rounded-lg hover:bg-white/[0.05]" title="Edit Form">
                      <Icon name="pencil" className="w-4 h-4 text-white/50 hover:text-cyan-400" />
                    </button>
                    <button onClick={() => openPreviewFromTable(article)} className="p-2 rounded-lg hover:bg-white/[0.05]" title="Live Editor Preview">
                      <Icon name="eye" className="w-4 h-4 text-white/50 hover:text-sky-400" />
                    </button>
                    <button onClick={() => handleExportArticleJson(article)} className="p-2 rounded-lg hover:bg-white/[0.05]" title="Unduh File Draf (.json)">
                      <Icon name="download" className="w-4 h-4 text-white/50 hover:text-emerald-400" />
                    </button>
                    <button onClick={() => handleDelete(article.id!)} className="p-2 rounded-lg hover:bg-red-500/10" title="Hapus">
                      <Icon name="trash" className="w-4 h-4 text-white/50 hover:text-red-400" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}
