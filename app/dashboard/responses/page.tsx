'use client'

import { useEffect, useState, useMemo } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Topbar } from '@/features/dashboard/components/layout/Topbar'
import { Icon } from '@/components/ui/Icons'
import type { ResponseDoc } from '@/lib/domain/responses/response-types'
import { useAuth } from '@/context/AuthContext'
import { safeFetchJson } from '@/lib/infra/safe-fetch'
import { SkeletonCard, SkeletonTable } from '@/components/ui/Skeleton'
import { queryKeys } from '@/lib/query-keys'
import { getRespondentAspects } from './helpers'
import { exportResponsesToExcel } from './export-excel'
import type { FormMetaItem, DistMetaItem, PersonAuthorOption } from './types'
import StatsSection from './stats-section'
import FilterBar from './filter-bar'
import ResponseCard from './response-card'
import ResponseTableRow from './response-table-row'
import AnswerModal from './answer-modal'
import DeleteModal from './delete-modal'
import BulkDeleteModal from './bulk-delete-modal'

export default function ResponsesDashboardPage() {
  const { user } = useAuth()
  const queryClient = useQueryClient()

  // Respondent Preview Modal State
  const [selectedRespondent, setSelectedRespondent] = useState<ResponseDoc | null>(null)
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false)

  // Delete Response Modal State
  const [selectedResponse, setSelectedResponse] = useState<ResponseDoc | null>(null)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  // Bulk Delete State
  const [selectedResponseIds, setSelectedResponseIds] = useState<string[]>([])
  const [isBulkDeleteModalOpen, setIsBulkDeleteModalOpen] = useState(false)
  const [isBulkDeleting, setIsBulkDeleting] = useState(false)

  const handleDeleteResponse = async () => {
    if (!selectedResponse?.responseId) return
    setIsDeleting(true)
    try {
      const res = await safeFetchJson(`/api/responses?id=${selectedResponse.responseId}`, {
        method: 'DELETE',
      })
      if (!res.ok) throw new Error(res.error || 'Gagal menghapus tanggapan.')

      queryClient.setQueryData(['dashboard', 'responses'], (old: any) => {
        if (!old) return old
        return { ...old, responses: old.responses.filter((r: ResponseDoc) => r.responseId !== selectedResponse.responseId) }
      })
      setSelectedResponseIds((prev) => prev.filter((id) => id !== selectedResponse.responseId))
      setIsDeleteModalOpen(false)
      setSelectedResponse(null)
    } catch (err: any) {
      alert('Error: ' + err.message)
    } finally {
      setIsDeleting(false)
    }
  }

  const handleBulkDeleteResponses = async () => {
    if (selectedResponseIds.length === 0) return
    setIsBulkDeleting(true)
    try {
      const res = await safeFetchJson('/api/responses', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: selectedResponseIds }),
      })
      if (!res.ok) throw new Error(res.error || 'Gagal menghapus tanggapan terpilih.')

      queryClient.setQueryData(['dashboard', 'responses'], (old: any) => {
        if (!old) return old
        return { ...old, responses: old.responses.filter((r: ResponseDoc) => !selectedResponseIds.includes(r.responseId)) }
      })
      setSelectedResponseIds([])
      setIsBulkDeleteModalOpen(false)
    } catch (err: any) {
      alert('Error: ' + err.message)
    } finally {
      setIsBulkDeleting(false)
    }
  }

  const handleSelectResponseToggle = (id: string) => {
    setSelectedResponseIds((prev) =>
      prev.includes(id) ? prev.filter((respId) => respId !== id) : [...prev, id]
    )
  }

  // Layout View Mode (Cards vs Table)
  const [viewLayout, setViewLayout] = useState<'cards' | 'table'>('cards')

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 6

  // Pure Person-Based Cascading Filters: Kiri = Formulir, Kanan = Author / Orang (Superadmin, Kader, Mitra)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedFormId, setSelectedFormId] = useState<string>('all')
  const [selectedAuthorCode, setSelectedAuthorCode] = useState<string>('all')

  const {
    data: responsesData,
    isLoading,
    error: queryError,
    refetch,
  } = useQuery({
    queryKey: queryKeys.dashboard.responses,
    queryFn: async () => {
      const [respRes, userRes] = await Promise.all([
        safeFetchJson('/api/responses?status=submitted'),
        safeFetchJson('/api/auth/users'),
      ])

      let combinedDistributions: DistMetaItem[] = []
      let responses: ResponseDoc[] = []
      let dbForms: FormMetaItem[] = []
      let error: string | null = null

      if (respRes.ok && respRes.data) {
        if (Array.isArray(respRes.data.responses)) {
          const submittedOnly = respRes.data.responses.filter((r: ResponseDoc) => r.status === 'submitted')
          responses = submittedOnly
        }
        if (Array.isArray(respRes.data.availableForms)) {
          dbForms = respRes.data.availableForms
        }
        if (Array.isArray(respRes.data.availableDistributions)) {
          combinedDistributions = [...respRes.data.availableDistributions]
        }
      } else {
        error = respRes.error || 'Gagal memuat daftar hasil penilaian.'
      }

      if (userRes.ok && userRes.data && Array.isArray(userRes.data.users)) {
        const userDistItems: DistMetaItem[] = userRes.data.users.map((u: any) => ({
          distributionId: `user_${u.uid}`,
          code: `USER-${u.uid.substring(0, 6)}`,
          title: `Kanal ${u.displayName || u.email}`,
          ownerName: u.displayName || (u.email ? u.email.split('@')[0] : 'Pengguna Terdaftar'),
          ownerType: u.role || 'cadre',
        }))
        combinedDistributions = [...combinedDistributions, ...userDistItems]
      }

      return { responses, dbForms, dbDistributions: combinedDistributions, error }
    },
  })

  const responses = responsesData?.responses ?? []
  const dbForms = responsesData?.dbForms ?? []
  const dbDistributions = responsesData?.dbDistributions ?? []
  const error = responsesData?.error ?? (queryError ? queryError.message || 'Terjadi kesalahan saat terhubung ke server.' : null)

  // 1. KIRI: Dynamic Form options list from Firestore
  const mergedFormOptions = useMemo(() => {
    const map = new Map<string, FormMetaItem>()
    dbForms.forEach((form) => map.set(form.formId, form))

    responses.forEach((r) => {
      if (r.formId && !map.has(r.formId)) {
        map.set(r.formId, {
          formId: r.formId,
          title: r.formTitle || 'Formulir Evaluasi Pangan',
          versionNumber: r.versionNumber || 1.5,
          versionLabel: r.versionNumber >= 1.5 ? `V1.5 (v${r.versionNumber})` : 'V1.0 Legacy',
        })
      }
    })
    return Array.from(map.values())
  }, [dbForms, responses])

  // 2. KANAN: Pure Person/Account Author options grouped by user identity (Superadmin, Kader 1, Mitra, dst)
  const availableAuthors = useMemo(() => {
    let dists = dbDistributions

    if (selectedFormId !== 'all') {
      dists = dists.filter((dist) => dist.formId === selectedFormId || !dist.formId)
    }

    const map = new Map<string, PersonAuthorOption>()

    dists.forEach((dist) => {
      const ownerName = dist.ownerName || 'Kader Lapangan'
      const ownerKey = ownerName.trim().toLowerCase()
      const code = dist.code || dist.distributionId

      if (!map.has(ownerKey)) {
        map.set(ownerKey, {
          ownerKey,
          ownerName,
          ownerType: dist.ownerType || 'cadre',
          codes: code ? [code] : [],
          count: 1,
        })
      } else {
        const existing = map.get(ownerKey)!
        if (code && !existing.codes.includes(code)) {
          existing.codes.push(code)
        }
        existing.count += 1
      }
    })

    responses.forEach((r) => {
      if (selectedFormId === 'all' || r.formId === selectedFormId || r.formTitle === selectedFormId) {
        const ownerName = r.ownerName || 'Kader Lapangan'
        const ownerKey = ownerName.trim().toLowerCase()
        const code = r.distributionCode || r.groupName || 'V1-DIST'

        if (!map.has(ownerKey)) {
          map.set(ownerKey, {
            ownerKey,
            ownerName,
            ownerType: r.ownerType || 'cadre',
            codes: code ? [code] : [],
            count: 1,
          })
        } else {
          const existing = map.get(ownerKey)!
          if (code && !existing.codes.includes(code)) {
            existing.codes.push(code)
          }
        }
      }
    })

    return Array.from(map.values())
  }, [dbDistributions, responses, selectedFormId])

  // Reset Author Selection if selected author is no longer in available list
  useEffect(() => {
    if (selectedAuthorCode !== 'all') {
      const exists = availableAuthors.some((author) => author.ownerKey === selectedAuthorCode || author.ownerName === selectedAuthorCode)
      if (!exists) setSelectedAuthorCode('all')
    }
  }, [selectedFormId, availableAuthors, selectedAuthorCode])

  // Filtered & Strictly Submitted Responses
  const filteredResponses = useMemo(() => {
    return responses.filter((r) => {
      const term = searchTerm.toLowerCase()
      const formTitle = r.formTitle || 'Formulir Evaluasi Keamanan Pangan'
      const distCode = r.distributionCode || 'V1-DIST'
      const distTitle = r.distributionTitle || r.groupName || 'Kader Lapangan'
      const ownerName = r.ownerName || 'Kader Lapangan'
      const ownerKey = ownerName.trim().toLowerCase()

      const matchesSearch =
        (r.responseId || '').toLowerCase().includes(term) ||
        distCode.toLowerCase().includes(term) ||
        distTitle.toLowerCase().includes(term) ||
        formTitle.toLowerCase().includes(term) ||
        ownerName.toLowerCase().includes(term) ||
        (r.respondent?.name || '').toLowerCase().includes(term) ||
        (r.respondent?.email || '').toLowerCase().includes(term)

      const matchesForm = selectedFormId === 'all' || r.formId === selectedFormId || formTitle === selectedFormId

      let matchesAuthor = true
      if (selectedAuthorCode !== 'all') {
        const selectedPerson = availableAuthors.find((author) => author.ownerKey === selectedAuthorCode || author.ownerName === selectedAuthorCode)
        if (selectedPerson) {
          matchesAuthor =
            ownerKey === selectedPerson.ownerKey ||
            selectedPerson.codes.includes(distCode) ||
            ownerName === selectedPerson.ownerName
        } else {
          matchesAuthor = ownerKey === selectedAuthorCode.toLowerCase() || distCode === selectedAuthorCode
        }
      }

      return matchesSearch && matchesForm && matchesAuthor
    })
  }, [responses, searchTerm, selectedFormId, selectedAuthorCode, availableAuthors])

  // Pagination Math
  const totalPages = Math.ceil(filteredResponses.length / itemsPerPage) || 1
  const paginatedResponses = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage
    return filteredResponses.slice(start, start + itemsPerPage)
  }, [filteredResponses, currentPage, itemsPerPage])

  // Reset page to 1 when filters change
  useEffect(() => {
    setCurrentPage(1)
  }, [searchTerm, selectedFormId, selectedAuthorCode])

  // DYNAMIC STATS DRIVEN BY ACTIVE FILTERS
  const stats = useMemo(() => {
    const total = filteredResponses.length

    const extractScore = (r: any): number | null => {
      const val =
        r.result?.percentage ??
        r.result?.rawScore ??
        (r as any).score ??
        (r as any).totalScore ??
        (r as any).percentage ??
        (r as any).finalScore
      if (typeof val === 'number' && !isNaN(val) && val > 0) {
        return Math.min(100, Math.max(0, Math.round(val)))
      }
      return null
    }

    const scoresList = filteredResponses.map(extractScore).filter((scoreVal): scoreVal is number => scoreVal !== null)
    const avgScore = scoresList.length > 0
      ? Math.round(scoresList.reduce((acc, scoreVal) => acc + scoreVal, 0) / scoresList.length)
      : (filteredResponses.length > 0 ? 75 : 0)

    const passCount = scoresList.filter((scoreVal) => scoreVal >= 75).length

    return { total, avgScore, passCount }
  }, [filteredResponses])

  // COMPUTE DYNAMIC PER-ASPECT AVERAGES FOR CURRENTLY FILTERED RESPONSES
  const filteredAspectAverages = useMemo(() => {
    const aspectMap = new Map<string, { title: string; totalPct: number; count: number }>()

    filteredResponses.forEach((r) => {
      const aspects = getRespondentAspects(r)
      aspects.forEach((asp) => {
        const key = (asp.title || asp.aspectId).trim()
        if (!aspectMap.has(key)) {
          aspectMap.set(key, { title: asp.title, totalPct: asp.percentage, count: 1 })
        } else {
          const item = aspectMap.get(key)!
          item.totalPct += asp.percentage
          item.count += 1
        }
      })
    })

    return Array.from(aspectMap.values()).map((asp) => ({
      title: asp.title,
      avgPercentage: Math.round(asp.totalPct / asp.count),
      count: asp.count,
    }))
  }, [filteredResponses])

  const openAnswerModal = (r: ResponseDoc) => {
    setSelectedRespondent(r)
    setIsPreviewModalOpen(true)
  }

  const openDeleteModal = (r: ResponseDoc) => {
    setSelectedResponse(r)
    setIsDeleteModalOpen(true)
  }

  const handleExportExcel = () => {
    if (filteredResponses.length === 0) {
      alert('Tidak ada data respon untuk diexport.')
      return
    }
    exportResponsesToExcel(filteredResponses, selectedFormId)
  }

  const handleResetFilters = () => {
    setSearchTerm('')
    setSelectedFormId('all')
    setSelectedAuthorCode('all')
    setCurrentPage(1)
  }

  return (
    <div className="flex flex-col min-h-screen bg-slate-950 text-slate-100 font-sans">
      <Topbar
        title="Hasil Penilaian Resmi & Data Responden Terverifikasi"
        subtitle="Auditing hasil kuesioner terkirim (submitted), analisis skor lingkaran, dan evaluasi kontribusi kader per orang"
      />

      <div className="flex-1 p-4 sm:p-6 space-y-6 max-w-7xl mx-auto w-full">
        <StatsSection
          stats={stats}
          filteredAspectAverages={filteredAspectAverages}
          selectedFormId={selectedFormId}
          filteredCount={filteredResponses.length}
        />

        <FilterBar
          searchTerm={searchTerm}
          selectedFormId={selectedFormId}
          selectedAuthorCode={selectedAuthorCode}
          mergedFormOptions={mergedFormOptions}
          availableAuthors={availableAuthors}
          selectedResponseIdsCount={selectedResponseIds.length}
          canExport={filteredResponses.length > 0}
          viewLayout={viewLayout}
          onSearchChange={setSearchTerm}
          onFormChange={setSelectedFormId}
          onAuthorChange={setSelectedAuthorCode}
          onReset={handleResetFilters}
          onExportExcel={handleExportExcel}
          onBulkDelete={() => setIsBulkDeleteModalOpen(true)}
          onViewLayoutChange={setViewLayout}
          onRefetch={refetch}
        />

        {/* Content Workspace Canvas */}
        {isLoading ? (
          viewLayout === 'cards' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {Array.from({ length: 6 }).map((_, i) => (
                <SkeletonCard key={i} />
              ))}
            </div>
          ) : (
            <SkeletonTable rows={6} cols={6} />
          )
        ) : error ? (
          <div className="p-8 text-center text-xs text-rose-300 space-y-2 rounded-3xl bg-slate-900 border border-slate-800">
            <p className="font-semibold">{error}</p>
            <button onClick={() => refetch()} className="px-4 py-2 rounded-xl bg-rose-950 border border-rose-500/40 text-rose-200 font-bold">
              Coba Ulang
            </button>
          </div>
        ) : paginatedResponses.length === 0 ? (
          <div className="text-center py-20 text-slate-500 space-y-2 rounded-3xl bg-slate-900 border border-slate-800">
            <Icon name="fileText" className="w-12 h-12 mx-auto text-slate-700" />
            <p className="text-sm font-bold text-slate-300">Belum Ada Tanggapan Terverifikasi</p>
            <p className="text-xs text-slate-500">Kuesioner terkirim yang telah selesai dinilai akan muncul di sini secara otomatis.</p>
          </div>
        ) : viewLayout === 'cards' ? (
          /* CARD LAYOUT WITH CIRCULAR SCORE METRIC DONUT GAUGE */
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {paginatedResponses.map((r) => (
              <ResponseCard
                key={r.responseId}
                r={r}
                selected={selectedResponseIds.includes(r.responseId)}
                onToggleSelect={handleSelectResponseToggle}
                onViewAnswers={openAnswerModal}
                onDelete={openDeleteModal}
              />
            ))}
          </div>
        ) : (
          /* TABLE LAYOUT FALLBACK */
          <div className="rounded-3xl bg-slate-900 border border-slate-800 overflow-hidden shadow-xl">
            <div className="divide-y divide-slate-800/80">
              {paginatedResponses.map((r) => (
                <ResponseTableRow
                  key={r.responseId}
                  r={r}
                  selected={selectedResponseIds.includes(r.responseId)}
                  onToggleSelect={handleSelectResponseToggle}
                  onViewAnswers={openAnswerModal}
                  onDelete={openDeleteModal}
                />
              ))}
            </div>
          </div>
        )}

        {/* PAGINATION CONTROLS BAR */}
        {totalPages > 1 && (
          <div className="p-4 rounded-3xl bg-slate-900 border border-slate-800 flex items-center justify-between gap-4 flex-wrap shadow-md font-mono text-xs">
            <span className="text-slate-400">
              Menampilkan Halaman <strong className="text-cyan-400">{currentPage}</strong> dari <strong>{totalPages}</strong> ({filteredResponses.length} Tanggapan Terverifikasi)
            </span>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                disabled={currentPage <= 1}
                className="px-4 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-300 hover:bg-slate-800 disabled:opacity-40 font-bold transition-colors"
              >
                ← Sebelumnya
              </button>

              <div className="flex items-center gap-1">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((pg) => (
                  <button
                    key={pg}
                    type="button"
                    onClick={() => setCurrentPage(pg)}
                    className={`w-8 h-8 rounded-xl font-bold transition-all ${
                      currentPage === pg
                        ? 'bg-cyan-500 text-slate-950 font-black shadow-md shadow-cyan-500/20'
                        : 'bg-slate-950 text-slate-400 hover:bg-slate-800'
                    }`}
                  >
                    {pg}
                  </button>
                ))}
              </div>

              <button
                type="button"
                onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                disabled={currentPage >= totalPages}
                className="px-4 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-300 hover:bg-slate-800 disabled:opacity-40 font-bold transition-colors"
              >
                Selanjutnya →
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ========== INTEGRATED ANSWER & CODE ANALYSIS MODAL ========== */}
      {isPreviewModalOpen && selectedRespondent && (
        <AnswerModal
          respondent={selectedRespondent}
          onClose={() => setIsPreviewModalOpen(false)}
          onDelete={(r) => {
            setIsPreviewModalOpen(false)
            openDeleteModal(r)
          }}
        />
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {isDeleteModalOpen && selectedResponse && (
        <DeleteModal
          response={selectedResponse}
          isDeleting={isDeleting}
          onClose={() => {
            setIsDeleteModalOpen(false)
            setSelectedResponse(null)
          }}
          onConfirm={handleDeleteResponse}
        />
      )}

      {/* BULK DELETE CONFIRMATION MODAL */}
      {isBulkDeleteModalOpen && selectedResponseIds.length > 0 && (
        <BulkDeleteModal
          count={selectedResponseIds.length}
          isDeleting={isBulkDeleting}
          onClose={() => setIsBulkDeleteModalOpen(false)}
          onConfirm={handleBulkDeleteResponses}
        />
      )}
    </div>
  )
}
