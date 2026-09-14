'use client'

import { useState, useEffect, useMemo } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import { Topbar } from '@/features/dashboard/components/layout/Topbar'
import {
  getAllResponses,
  getForms,
  deleteResponse,
  type FormResponse,
} from '@/lib/repositories/forms.repo'
import { extractRespondentName, extractRespondentEmail } from '@/lib/domain/responses/respondent-utils'
import { queryKeys } from '@/lib/query-keys'
import { useToast } from '@/lib/hooks'
import {
  findMatchingForm,
  getMetricLabel,
  getStatusByScore,
  getRespondentAspects,
} from './helpers'
import { exportRespondentsToExcel } from './export-excel'
import type { Respondent } from './types'
import FilterBar from './filter-bar'
import StatsSection from './stats-section'
import RespondentsTable from './respondents-table'
import PreviewModal from './preview-modal'
import DeleteModal from './delete-modal'
import PrintArea from './print-area'

// ============ PRINT STYLES ============
const printStyles = `
    @media print {
      body * { visibility: hidden; }
      #print-area, #print-area * { visibility: visible; }
      #print-area { position: absolute; left: 0; top: 0; width: 100%; padding: 40px; background: white; color: black; }
      #print-area table { width: 100%; border-collapse: collapse; font-size: 12px; }
      #print-area th, #print-area td { border: 1px solid #ddd; padding: 8px 12px; text-align: left; }
      #print-area th { background: #f5f5f5; font-weight: 600; }
      .print-header { margin-bottom: 20px; }
      .print-header h1 { font-size: 20px; font-weight: bold; margin-bottom: 4px; }
      .print-header p { font-size: 14px; color: #666; margin: 2px 0; }
    }
  `

export default function RespondentsPage() {
  const { userData, userRole, loading: authLoading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!authLoading) {
      const effectiveRole = userRole || userData?.role
      if (effectiveRole === 'partnership') {
        router.replace('/dashboard/partnership')
      } else if (effectiveRole === 'cadre') {
        router.replace('/dashboard/monitoring')
      }
    }
  }, [authLoading, userRole, userData, router])

  // ---------- STATE ----------
  const [selectedGroups, setSelectedGroups] = useState<string[]>([])
  const [selectedForms, setSelectedForms] = useState<string[]>([])
  const [currentPage, setCurrentPage] = useState(1)
  const [selectedRespondent, setSelectedRespondent] = useState<Respondent | null>(null)
  const [isPreviewOpen, setIsPreviewOpen] = useState(false)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [respondentToDelete, setRespondentToDelete] = useState<string | null>(null)
  const toast = useToast()
  const itemsPerPage = 10

  const queryClient = useQueryClient()

  // ============ LOAD DATA (TanStack Query) ============
  const { data: respondentsData, isLoading: loading } = useQuery({
    queryKey: queryKeys.dashboard.respondents,
    queryFn: async () => {
      const [responsesData, formsData] = await Promise.all([
        getAllResponses(),
        getForms(),
      ])

      const transformedRespondents: Respondent[] = await Promise.all(
        responsesData.map(async (response: FormResponse) => {
          const form = findMatchingForm(response, formsData)

          // Skor final: prefer result.percentage (authoritative, sudah di-compute di DB)
          const storedScore =
            typeof (response as any).result?.percentage === 'number' && (response as any).result.percentage > 0
              ? (response as any).result.percentage
              : typeof (response as any).score === 'number' && (response as any).score > 0
              ? (response as any).score
              : typeof (response as any).totalScore === 'number' && (response as any).totalScore > 0
              ? (response as any).totalScore
              : null

          const finalScore = storedScore !== null ? Math.round(storedScore) : 0

          const metric = getMetricLabel(finalScore)
          const status = getStatusByScore(finalScore)

          const submittedDate = response.submittedAt
            ? new Date(response.submittedAt)
            : response.createdAt?.toDate?.() || new Date()

          const respondentName = extractRespondentName(response, form)
          const respondentEmail = extractRespondentEmail(response, form)

          const resolvedFormTitle = form?.title || (form as any)?.metadata?.title || response.formTitle || 'Formulir Tanpa Judul'

          return {
            id: response.id || Math.random().toString(36).substring(2, 9),
            name: respondentName,
            formId: response.formId,
            formCode: response.formCode || form?.code || response.distributionCode || '',
            formTitle: resolvedFormTitle,
            groupId: form?.groupId || null,
            groupName: null,
            submittedAt: submittedDate.toISOString(),
            date: submittedDate.toLocaleDateString('id-ID', {
              day: '2-digit', month: 'short', year: 'numeric',
            }),
            answers: response.answers || {}, // 🛡️ PERTAHANKAN STRUKTUR ASLI UNTUK UI & EXCEL
            respondentName,
            respondentEmail,
            score: finalScore,
            metric,
            status,
            result: (response as any).result || null,
          }
        })
      )

      return { respondents: transformedRespondents, forms: formsData }
    },
  })

  const respondents = respondentsData?.respondents ?? []
  const forms = respondentsData?.forms ?? []

  // ============ FILTER ============
  const filteredData = useMemo(() => {
    let data = respondents
    if (selectedGroups.length > 0) data = data.filter(r => r.groupName && selectedGroups.includes(r.groupName))
    if (selectedForms.length > 0) data = data.filter(r => selectedForms.includes(r.formTitle))
    return data
  }, [respondents, selectedGroups, selectedForms])

  // ============ RATA-RATA PENILAIAN PER ASPEK (ASPEK SIKAP, PERILAKU, DLL) ============
  const aspectAverages = useMemo(() => {
    if (filteredData.length === 0) return []

    const map = new Map<string, { title: string; totalPct: number; count: number }>()

    filteredData.forEach((r) => {
      const aspects = getRespondentAspects(r, forms)
      aspects.forEach((asp) => {
        const title = (asp.title || asp.aspectId).trim()
        if (!title) return
        if (!map.has(title)) {
          map.set(title, { title, totalPct: asp.percentage, count: 1 })
        } else {
          const item = map.get(title)!
          item.totalPct += asp.percentage
          item.count += 1
        }
      })
    })

    return Array.from(map.values()).map((item) => ({
      title: item.title,
      avgPercentage: Math.round(item.totalPct / item.count),
      count: item.count,
    }))
  }, [filteredData, forms])

  const groupOptions = useMemo(() => {
    return Array.from(new Set(respondents.map(r => r.groupName).filter(Boolean))) as string[]
  }, [respondents])

  const formOptions = useMemo(() => {
    const titlesFromDb = forms.map((f) => f.title || (f as any).metadata?.title).filter(Boolean)
    const titlesFromResp = respondents.map((r) => r.formTitle).filter(Boolean)
    const combined = Array.from(new Set([...titlesFromDb, ...titlesFromResp]))
    return combined.sort()
  }, [forms, respondents])

  // ============ PAGINATION ============
  const totalPages = Math.ceil(filteredData.length / itemsPerPage)
  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage
    return filteredData.slice(start, start + itemsPerPage)
  }, [filteredData, currentPage])

  useEffect(() => { setCurrentPage(1) }, [selectedGroups, selectedForms])

  // ============ HANDLERS ============
  const handleGroupToggle = (group: string) => {
    if (group === 'Semua Group') { setSelectedGroups([]); return }
    setSelectedGroups(prev => prev.includes(group) ? prev.filter(grp => grp !== group) : [...prev, group])
  }

  const handleFormToggle = (form: string) => {
    if (form === 'Semua Formulir') { setSelectedForms([]); return }
    setSelectedForms(prev => prev.includes(form) ? prev.filter(frm => frm !== form) : [...prev, form])
  }

  const handlePreview = (respondent: Respondent) => {
    setSelectedRespondent(respondent)
    setIsPreviewOpen(true)
  }

  const handleDelete = (id: string) => {
    setRespondentToDelete(id)
    setIsDeleteModalOpen(true)
  }

  const confirmDelete = async () => {
    if (respondentToDelete) {
      try {
        await deleteResponse(respondentToDelete)
        queryClient.setQueryData(['dashboard', 'respondents'], (old: any) => {
          if (!old) return old
          return { ...old, respondents: old.respondents.filter((r: Respondent) => r.id !== respondentToDelete) }
        })
        toast.show('Data responden berhasil dihapus')
      } catch (error) {
        console.error('Error deleting response:', error)
        toast.show('Gagal menghapus data')
      }
    }
    setIsDeleteModalOpen(false)
    setRespondentToDelete(null)
  }

  const handlePrint = () => {
    if (filteredData.length === 0) {
      toast.show('Tidak ada data untuk dicetak')
      return
    }
    window.print()
  }

  const handleExportExcel = () => {
    if (filteredData.length === 0) {
      toast.show('Tidak ada data untuk diexport')
      return
    }
    exportRespondentsToExcel(filteredData, selectedForms, forms)
    toast.show(`${filteredData.length} data berhasil diexport ke Excel!`)
  }

  // ============ RENDER ============
  return (
    <div className="flex flex-col min-h-screen bg-[#06060E]">
      <style>{printStyles}</style>

      <Topbar title="Data Responden" subtitle="Kelola data individu yang telah mengisi formulir" />

      <div className="flex-1 p-6 space-y-6">
        <FilterBar
          selectedGroups={selectedGroups}
          selectedForms={selectedForms}
          groupOptions={groupOptions}
          formOptions={formOptions}
          canExport={filteredData.length > 0}
          onGroupToggle={handleGroupToggle}
          onFormToggle={handleFormToggle}
          onReset={() => { setSelectedGroups([]); setSelectedForms([]) }}
          onExportExcel={handleExportExcel}
          onPrint={handlePrint}
        />

        <StatsSection filteredData={filteredData} aspectAverages={aspectAverages} />

        <RespondentsTable
          loading={loading}
          paginatedData={paginatedData}
          filteredLength={filteredData.length}
          currentPage={currentPage}
          itemsPerPage={itemsPerPage}
          totalPages={totalPages}
          forms={forms}
          onPreview={handlePreview}
          onDelete={handleDelete}
          onPageChange={setCurrentPage}
        />
      </div>

      {isPreviewOpen && selectedRespondent && (
        <PreviewModal
          respondent={selectedRespondent}
          forms={forms}
          onClose={() => setIsPreviewOpen(false)}
        />
      )}

      <DeleteModal
        open={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={confirmDelete}
      />

      {/* ========== TOAST ========== */}
      {toast.visible && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50">
          <div className="px-4 py-2.5 rounded-xl text-sm font-medium shadow-2xl bg-slate-900 border border-slate-700 text-slate-100">
            {toast.message}
          </div>
        </div>
      )}

      <PrintArea filteredData={filteredData} selectedGroups={selectedGroups} selectedForms={selectedForms} />
    </div>
  )
}
