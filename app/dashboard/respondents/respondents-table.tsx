'use client'

import { Icon } from '@/components/ui/Icons'
import { SkeletonTable } from '@/components/ui/Skeleton'
import { getRespondentAspects, getScoreColor, getMetricColor, getStatusColor } from './helpers'
import type { Respondent } from './types'
import type { FormData } from '@/lib/repositories/forms.repo'

type RespondentsTableProps = {
  loading: boolean
  paginatedData: Respondent[]
  filteredLength: number
  currentPage: number
  itemsPerPage: number
  totalPages: number
  forms: FormData[]
  onPreview: (respondent: Respondent) => void
  onDelete: (id: string) => void
  onPageChange: (page: number) => void
}

export default function RespondentsTable({
  loading,
  paginatedData,
  filteredLength,
  currentPage,
  itemsPerPage,
  totalPages,
  forms,
  onPreview,
  onDelete,
  onPageChange,
}: RespondentsTableProps) {
  return (
    <div className="rounded-2xl bg-[#080812] border border-white/5 overflow-hidden">
      {loading ? (
        <div className="p-4">
          <SkeletonTable rows={6} cols={6} />
        </div>
      ) : (
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/5 bg-white/1">
                <th className="text-left px-4 py-3 text-xs text-white/35 uppercase">No</th>
                <th className="text-left px-4 py-3 text-xs text-white/35 uppercase">Nama</th>
                <th className="text-left px-4 py-3 text-xs text-white/35 uppercase">Formulir</th>
                <th className="text-left px-4 py-3 text-xs text-white/35 uppercase">Group</th>
                <th className="text-left px-4 py-3 text-xs text-white/35 uppercase">Tanggal</th>
                <th className="text-left px-4 py-3 text-xs text-white/35 uppercase">Skor Overall</th>
                <th className="text-left px-4 py-3 text-xs text-white/35 uppercase">Rincian Aspek</th>
                <th className="text-left px-4 py-3 text-xs text-white/35 uppercase">Metrik</th>
                <th className="text-left px-4 py-3 text-xs text-white/35 uppercase">Status</th>
                <th className="text-left px-4 py-3 text-xs text-white/35 uppercase">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {paginatedData.length === 0 ? (
                <tr>
                  <td colSpan={10} className="text-center py-12 text-white/30">
                    <Icon name="users" className="w-12 h-12 mx-auto mb-3 text-white/10" />
                    <p className="text-base font-medium text-white/40">Tidak ada data responden</p>
                    <p className="text-sm text-white/20 mt-1">Belum ada yang mengisi formulir</p>
                  </td>
                </tr>
              ) : (
                paginatedData.map((r, i) => {
                  const idx = (currentPage - 1) * itemsPerPage + i + 1
                  const respAspects = getRespondentAspects(r, forms)
                  return (
                    <tr key={r.id} className="border-b border-white/3 hover:bg-white/2 transition-colors group">
                      <td className="px-4 py-3 text-white/40 text-xs">{idx}</td>
                      <td className="px-4 py-3 font-medium text-white">
                        {r.name || r.respondentName || 'Responden'}
                      </td>
                      <td className="px-4 py-3 text-white/60 text-sm">{r.formTitle}</td>
                      <td className="px-4 py-3">
                        {r.groupName ? (
                          <span className="px-2 py-0.5 rounded-full bg-violet-500/10 border border-violet-500/20 text-[10px] text-violet-400 flex items-center gap-1 w-fit">
                            <Icon name="users" className="w-3 h-3" />{r.groupName}
                          </span>
                        ) : (
                          <span className="text-xs text-white/30">-</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-white/40 text-xs">{r.date}</td>
                      <td className={`px-4 py-3 font-semibold ${getScoreColor(r.score)}`}>
                        {r.score}%
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-1 max-w-xs">
                          {respAspects.map((asp, aIdx) => (
                            <span
                              key={aIdx}
                              className="px-2 py-0.5 rounded-md bg-white/5 border border-white/10 text-[10px] font-mono text-cyan-300 font-semibold"
                              title={`${asp.title}: ${asp.percentage}%`}
                            >
                              {asp.title}: {asp.percentage}%
                            </span>
                          ))}
                          {respAspects.length === 0 && (
                            <span className="text-xs text-white/30">-</span>
                          )}
                        </div>
                      </td>
                      <td className={`px-4 py-3 font-medium text-sm ${getMetricColor(r.metric)}`}>
                        {r.metric}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2.5 py-1 rounded-full border text-xs ${getStatusColor(r.status)}`}>
                          {r.status}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          <button onClick={() => onPreview(r)} className="p-1.5 rounded-lg hover:bg-white/5 transition-colors" title="Preview">
                            <Icon name="eye" className="w-4 h-4 text-white/50 hover:text-cyan-400" />
                          </button>
                          <button onClick={() => onDelete(r.id)} className="p-1.5 rounded-lg hover:bg-red-500/10 transition-colors" title="Hapus">
                            <Icon name="trash" className="w-4 h-4 text-white/50 hover:text-red-400" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {filteredLength > itemsPerPage && (
        <div className="flex items-center justify-between px-6 py-4 border-t border-white/5">
          <p className="text-xs text-white/35">
            Menampilkan {((currentPage - 1) * itemsPerPage) + 1}-{Math.min(currentPage * itemsPerPage, filteredLength)} dari {filteredLength}
          </p>
          <div className="flex items-center gap-1">
            <button onClick={() => onPageChange(Math.max(currentPage - 1, 1))} disabled={currentPage === 1}
              className="w-8 h-8 rounded-lg bg-white/2 border border-white/5 flex items-center justify-center text-white/40 hover:text-white disabled:opacity-30"
            >
              <Icon name="chevronLeft" className="w-4 h-4" />
            </button>
            {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
              let p
              if (totalPages <= 5) p = i + 1
              else if (currentPage <= 3) p = i + 1
              else if (currentPage >= totalPages - 2) p = totalPages - 4 + i
              else p = currentPage - 2 + i
              return (
                <button
                  key={p}
                  onClick={() => onPageChange(p)}
                  className={`w-8 h-8 rounded-lg text-xs font-medium ${
                    currentPage === p
                      ? 'bg-cyan-500/10 border border-cyan-500/20 text-cyan-400'
                      : 'bg-white/2 border border-white/5 text-white/40 hover:text-white'
                  }`}
                >
                  {p}
                </button>
              )
            })}
            {totalPages > 5 && currentPage < totalPages - 2 && (
              <>
                <span className="text-white/20">...</span>
                <button
                  onClick={() => onPageChange(totalPages)}
                  className="w-8 h-8 rounded-lg bg-white/2 border border-white/5 text-xs text-white/40 hover:text-white"
                >
                  {totalPages}
                </button>
              </>
            )}
            <button onClick={() => onPageChange(Math.min(currentPage + 1, totalPages))} disabled={currentPage === totalPages}
              className="w-8 h-8 rounded-lg bg-white/2 border border-white/5 flex items-center justify-center text-white/40 hover:text-white disabled:opacity-30"
            >
              <Icon name="chevronRight" className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
