'use client'

import { useState, useEffect, useMemo } from 'react'
import { Topbar } from '@/components/dashboard/Topbar'
import { Icon } from '@/components/ui/Icons'
import { PreviewModal } from '@/components/form-builder/PreviewModal'
import Link from 'next/link'
import { 
  getForms, 
  deleteForm, 
  updateFormStatus,
  createForm,
  getFormGroups,
  type FormData,
  type FormGroup,
} from '@/lib/firebase/repositories/forms.repo'
import { useAuth } from '@/context/AuthContext'

// ============ HELPERS ============
const generateId = () => Math.random().toString(36).substring(2, 9)

// ============ STATUS MAPPING ============
const statusColors: Record<string, string> = {
  draft: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
  published: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
  archived: 'text-rose-400 bg-rose-500/10 border-rose-500/20',
}

const statusLabels: Record<string, string> = {
  draft: 'Draft',
  published: 'Published',
  archived: 'Diarsipkan',
}

const statusOptions = [
  { value: 'draft', label: 'Draft', color: 'text-amber-400' },
  { value: 'published', label: 'Published', color: 'text-emerald-400' },
  { value: 'archived', label: 'Diarsipkan', color: 'text-rose-400' },
]

// ============ CATEGORY COLORS ============
const categoryColors: Record<string, string> = {
  'Kuesioner': 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20',
  'Fasilitasi': 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
  'Observasi': 'text-violet-400 bg-violet-500/10 border-violet-500/20',
  'Evaluasi': 'text-amber-400 bg-amber-500/10 border-amber-500/20',
}

// ============ GENERATE FORM CODE ============
const generateFormCode = () => {
  const prefix = 'FRM'
  const random = Math.random().toString(36).substring(2, 6).toUpperCase()
  return `${prefix}-${random}`
}

// ============ COMPONENT ============
export default function FormsPage() {
  const { user } = useAuth()
  const [forms, setForms] = useState<FormData[]>([])
  const [groups, setGroups] = useState<FormGroup[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState('Semua Status')
  const [filterCategory, setFilterCategory] = useState('Semua Kategori')
  const [filterGroup, setFilterGroup] = useState('Semua Group')
  const [selectedForms, setSelectedForms] = useState<string[]>([])
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [formToDelete, setFormToDelete] = useState<string | null>(null)
  
  // ============ PREVIEW MODAL ============
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false)
  const [previewForm, setPreviewForm] = useState<FormData | null>(null)
  
  // ============ LOAD DATA ============
  const loadData = async () => {
    setLoading(true)
    try {
      const [formsData, groupsData] = await Promise.all([
        getForms(),
        getFormGroups(),
      ])
      setForms(formsData)
      setGroups(groupsData)
    } catch (error) {
      console.error('Error loading data:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  // ============ GET UNIQUE GROUPS FOR FILTER ============
  const groupOptions = useMemo(() => {
    const groupSet = new Set<string>()
    forms.forEach(f => {
      if (f.groupId) {
        const group = groups.find(g => g.id === f.groupId)
        if (group) groupSet.add(group.title)
      }
    })
    return ['Semua Group', ...Array.from(groupSet)]
  }, [forms, groups])

  // ============ FILTER FORMS ============
  const filteredForms = useMemo(() => {
    return forms.filter(form => {
      const matchesSearch = form.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            form.code.toLowerCase().includes(searchTerm.toLowerCase())
      
      const matchesStatus = filterStatus === 'Semua Status' || 
                            statusLabels[form.status] === filterStatus ||
                            form.status === filterStatus
      
      const matchesCategory = filterCategory === 'Semua Kategori' || 
                              form.category === filterCategory
      
      let matchesGroup = true
      if (filterGroup !== 'Semua Group') {
        const group = groups.find(g => g.id === form.groupId)
        matchesGroup = group?.title === filterGroup
      }
      
      return matchesSearch && matchesStatus && matchesCategory && matchesGroup
    })
  }, [forms, searchTerm, filterStatus, filterCategory, filterGroup, groups])

  // ============ STATS ============
  const stats = useMemo(() => {
    const total = forms.length
    const active = forms.filter(f => f.status === 'published').length
    const draft = forms.filter(f => f.status === 'draft').length
    const totalGroups = groups.length
    const totalFilled = forms.reduce((acc, f) => acc + (f.filledCount || 0), 0)
    return { total, active, draft, totalGroups, totalFilled }
  }, [forms, groups])

  // ============ UPDATE STATUS ============
  const handleStatusChange = async (formId: string, newStatus: 'draft' | 'published' | 'archived') => {
    try {
      await updateFormStatus(formId, newStatus)
      setForms(prev => prev.map(f => 
        f.id === formId ? { ...f, status: newStatus } : f
      ))
    } catch (error) {
      console.error('Error updating status:', error)
      alert('Gagal mengubah status formulir')
    }
  }

  // ============ DUPLICATE FORM ============
  const handleDuplicate = async (form: FormData) => {
    try {
      const newCode = generateFormCode()
      
      const newForm: Omit<FormData, 'id' | 'createdAt' | 'updatedAt'> = {
        title: `${form.title} (Copy)`,
        code: newCode,
        description: form.description || '',
        target: form.target || '',
        category: form.category || '',
        status: 'draft',
        groupId: form.groupId || null,
        groupCode: form.groupCode || null,
        questions: form.questions.map(q => ({
          ...q,
          id: generateId(),
          options: q.options || [],
          required: q.required || false,
          imageUrl: q.imageUrl || '',
          config: q.config || {},
          media: q.media || { type: 'none' },
          answerType: q.answerType || q.type || 'short-text',
          isIdentifier: q.isIdentifier || false,
          identifierType: q.identifierType || 'none',
          scoring: q.scoring || { scheme: 'none', weight: 1 },
        })),
        createdBy: user?.uid || '',
        filledCount: 0,
      }
      
      await createForm(newForm)
      await loadData()
    } catch (error: any) {
      console.error('Error duplicating form:', error)
      alert(error.message || 'Gagal menduplikasi formulir')
    }
  }

  // ============ DELETE ============
  const handleDelete = (id: string) => {
    setFormToDelete(id)
    setIsDeleteModalOpen(true)
  }

  const confirmDelete = async () => {
    if (formToDelete) {
      try {
        await deleteForm(formToDelete)
        setForms(forms.filter(f => f.id !== formToDelete))
        setSelectedForms(selectedForms.filter(id => id !== formToDelete))
      } catch (error) {
        console.error('Error deleting form:', error)
      }
    }
    setIsDeleteModalOpen(false)
    setFormToDelete(null)
  }

  // ============ PREVIEW ============
  const handlePreview = (form: FormData) => {
    setPreviewForm(form)
    setIsPreviewModalOpen(true)
  }

  // ============ SELECT HANDLERS ============
  const handleSelectAll = () => {
    if (selectedForms.length === filteredForms.length) {
      setSelectedForms([])
    } else {
      setSelectedForms(filteredForms.map(f => f.id || '').filter(Boolean))
    }
  }

  const handleSelectOne = (id: string) => {
    setSelectedForms(prev =>
      prev.includes(id) ? prev.filter(fid => fid !== id) : [...prev, id]
    )
  }

  // ============ GET GROUP NAME ============
  const getGroupName = (groupId: string | null | undefined) => {
    if (!groupId) return '- (Mandiri)'
    const group = groups.find(g => g.id === groupId)
    return group?.title || '- (Mandiri)'
  }

  // ============ CONVERT QUESTIONS TO FLEXIBLE QUESTION FORMAT ============
  const convertToFlexibleQuestions = (questions: any[]) => {
    return (questions || []).map((q: any, index: number) => ({
      id: q.id || generateId(),
      question: q.question || q.label || '',
      description: q.description || '',
      required: q.required || false,
      order: q.order || index,
      media: q.media || { type: 'none' as const, url: q.imageUrl || '', caption: '' },
      answerType: q.answerType || q.type || 'short-text',
      config: q.config || {
        options: q.options || [],
        statements: q.statements || [],
        scale: q.scale || 5,
        placeholder: q.placeholder || '',
        indicators: q.indicators || [],
        indicatorScales: q.indicatorScales || [],
        indicatorTitle: q.indicatorTitle || 'Pertanyaan',
        showTotalScore: q.showTotalScore || false,
        showWeightedScore: q.showWeightedScore || false,
        ratingMax: q.ratingMax || 5,
        ratingMin: q.ratingMin || 1,
        signatureWidth: q.signatureWidth || 400,
        signatureHeight: q.signatureHeight || 200,
        signaturePenColor: q.signaturePenColor || '#000000',
        signatureBgColor: q.signatureBgColor || '#ffffff',
        signatureLabel: q.signatureLabel || 'Tanda Tangan',
      },
      isIdentifier: q.isIdentifier || false,
      identifierType: q.identifierType || 'none',
      scoring: q.scoring || { scheme: 'none' as const, weight: 1 },
    }))
  }

  // ============ RENDER ============
  return (
    <div className="flex flex-col min-h-screen">
      <Topbar 
        title="Daftar Formulir" 
        subtitle="Kelola semua formulir dan konfigurasi visualisasinya" 
      />

      <div className="flex-1 p-6 space-y-6">
        {/* Action Bar */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative">
              <Icon name="search" className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/25" />
              <input
                type="text"
                placeholder="Cari formulir..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2.5 rounded-xl bg-white/3 border border-white/6 text-sm text-white placeholder-white/25 focus:outline-none focus:border-cyan-400/40 transition-all w-64"
              />
            </div>

            <select 
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-4 py-2.5 rounded-xl bg-white/3 border border-white/6 text-sm text-white/70 focus:outline-none focus:border-cyan-400/40 transition-all cursor-pointer"
            >
              <option value="Semua Status" className="bg-[#080812]">Semua Status</option>
              <option value="published" className="bg-[#080812]">Published</option>
              <option value="draft" className="bg-[#080812]">Draft</option>
              <option value="archived" className="bg-[#080812]">Diarsipkan</option>
            </select>

            <select 
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="px-4 py-2.5 rounded-xl bg-white/3 border border-white/6 text-sm text-white/70 focus:outline-none focus:border-cyan-400/40 transition-all cursor-pointer"
            >
              <option value="Semua Kategori" className="bg-[#080812]">Semua Kategori</option>
              <option value="Kuesioner" className="bg-[#080812]">Kuesioner</option>
              <option value="Fasilitasi" className="bg-[#080812]">Fasilitasi</option>
              <option value="Observasi" className="bg-[#080812]">Observasi</option>
              <option value="Evaluasi" className="bg-[#080812]">Evaluasi</option>
            </select>

            <select 
              value={filterGroup}
              onChange={(e) => setFilterGroup(e.target.value)}
              className="px-4 py-2.5 rounded-xl bg-white/3 border border-white/6 text-sm text-white/70 focus:outline-none focus:border-cyan-400/40 transition-all cursor-pointer"
            >
              {groupOptions.map(group => (
                <option key={group} value={group} className="bg-[#080812]">{group}</option>
              ))}
            </select>
          </div>

          <Link href="/dashboard/form-builder">
            <button className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-sm font-medium text-white transition-all shadow-lg shadow-cyan-600/25">
              <Icon name="plus" className="w-4 h-4" /> Buat Formulir
            </button>
          </Link>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="rounded-2xl bg-[#080812] border border-white/5 p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs text-white/40 uppercase tracking-wider">Total Formulir</span>
              <Icon name="fileText" className="w-4 h-4 text-cyan-400" />
            </div>
            <p className="text-2xl font-bold font-display mt-2">{stats.total}</p>
          </div>
          <div className="rounded-2xl bg-[#080812] border border-white/5 p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs text-white/40 uppercase tracking-wider">Published</span>
              <Icon name="checkCircle" className="w-4 h-4 text-emerald-400" />
            </div>
            <p className="text-2xl font-bold font-display mt-2">{stats.active}</p>
          </div>
          <div className="rounded-2xl bg-[#080812] border border-white/5 p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs text-white/40 uppercase tracking-wider">Draft</span>
              <Icon name="edit" className="w-4 h-4 text-amber-400" />
            </div>
            <p className="text-2xl font-bold font-display mt-2">{stats.draft}</p>
          </div>
          <div className="rounded-2xl bg-[#080812] border border-white/5 p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs text-white/40 uppercase tracking-wider">Total Group</span>
              <Icon name="users" className="w-4 h-4 text-violet-400" />
            </div>
            <p className="text-2xl font-bold font-display mt-2">{stats.totalGroups}</p>
          </div>
        </div>

        {/* Table */}
        <div className="rounded-2xl bg-[#080812] border border-white/5 overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Icon name="loader" className="w-8 h-8 text-cyan-400 animate-spin" />
              <span className="ml-3 text-white/40">Memuat data...</span>
            </div>
          ) : (
            <div className="overflow-x-auto custom-scrollbar">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/5 bg-white/1">
                    <th className="text-left px-4 py-3 text-xs text-white/35 uppercase tracking-wider font-medium w-10">
                      <input
                        type="checkbox"
                        checked={selectedForms.length === filteredForms.length && filteredForms.length > 0}
                        onChange={handleSelectAll}
                        className="accent-cyan-400 w-4 h-4 cursor-pointer"
                      />
                    </th>
                    <th className="text-left px-4 py-3 text-xs text-white/35 uppercase tracking-wider font-medium">Kode</th>
                    <th className="text-left px-4 py-3 text-xs text-white/35 uppercase tracking-wider font-medium">Judul</th>
                    <th className="text-left px-4 py-3 text-xs text-white/35 uppercase tracking-wider font-medium">Kategori</th>
                    <th className="text-left px-4 py-3 text-xs text-white/35 uppercase tracking-wider font-medium">Target</th>
                    <th className="text-left px-4 py-3 text-xs text-white/35 uppercase tracking-wider font-medium">Status</th>
                    <th className="text-left px-4 py-3 text-xs text-white/35 uppercase tracking-wider font-medium">Group</th>
                    <th className="text-left px-4 py-3 text-xs text-white/35 uppercase tracking-wider font-medium">Diisi</th>
                    <th className="text-left px-4 py-3 text-xs text-white/35 uppercase tracking-wider font-medium">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredForms.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="text-center py-8 text-white/30">
                        <Icon name="fileText" className="w-8 h-8 mx-auto mb-2 text-white/10" />
                        <p>Tidak ada formulir yang ditemukan</p>
                      </td>
                    </tr>
                  ) : (
                    filteredForms.map((form) => {
                      const groupName = getGroupName(form.groupId)
                      const isMandiri = groupName === '- (Mandiri)'
                      
                      return (
                        <tr key={form.id} className="border-b border-white/3 hover:bg-white/2 transition-colors group">
                          <td className="px-4 py-3">
                            <input
                              type="checkbox"
                              checked={selectedForms.includes(form.id || '')}
                              onChange={() => handleSelectOne(form.id || '')}
                              className="accent-cyan-400 w-4 h-4 cursor-pointer"
                            />
                          </td>
                          <td className="px-4 py-3 font-mono text-xs text-cyan-400 font-medium">{form.code}</td>
                          <td className="px-4 py-3 text-white/80 font-medium">{form.title}</td>
                          <td className="px-4 py-3">
                            <span className={`px-2.5 py-1 rounded-full border text-xs ${categoryColors[form.category as keyof typeof categoryColors] || 'text-white/40 bg-white/5 border-white/5'}`}>
                              {form.category || 'Umum'}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <span className="px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-400">
                              {form.target || 'Umum'}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <select
                              value={form.status}
                              onChange={(e) => handleStatusChange(form.id || '', e.target.value as 'draft' | 'published' | 'archived')}
                              className={`px-2.5 py-1 rounded-full border text-xs font-medium cursor-pointer transition-all focus:outline-none focus:ring-2 focus:ring-cyan-400/20 ${
                                statusColors[form.status]
                              }`}
                            >
                              {statusOptions.map((opt) => (
                                <option key={opt.value} value={opt.value} className="bg-[#080812]">
                                  {opt.label}
                                </option>
                              ))}
                            </select>
                          </td>
                          <td className="px-4 py-3">
                            {isMandiri ? (
                              <span className="text-xs text-white/30">-</span>
                            ) : (
                              <span className="px-2.5 py-1 rounded-full bg-violet-500/10 border border-violet-500/20 text-xs text-violet-400 flex items-center gap-1 w-fit">
                                <Icon name="users" className="w-3 h-3" />
                                {groupName}
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-white/60">{form.filledCount || 0}</td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-1">
                              <Link href={`/dashboard/form-builder?id=${form.id}`}>
                                <button className="p-1.5 rounded-lg hover:bg-white/5 transition-colors" title="Edit">
                                  <Icon name="pencil" className="w-4 h-4 text-white/50 hover:text-cyan-400 transition-colors" />
                                </button>
                              </Link>
                              <button 
                                onClick={() => handlePreview(form)}
                                className="p-1.5 rounded-lg hover:bg-white/5 transition-colors"
                                title="Preview Formulir"
                              >
                                <Icon name="eye" className="w-4 h-4 text-white/50 hover:text-sky-400 transition-colors" />
                              </button>
                              <button 
                                onClick={() => handleDuplicate(form)}
                                className="p-1.5 rounded-lg hover:bg-white/5 transition-colors"
                                title="Duplikat Formulir"
                              >
                                <Icon name="copy" className="w-4 h-4 text-white/50 hover:text-amber-400 transition-colors" />
                              </button>
                              <button 
                                onClick={() => handleDelete(form.id || '')}
                                className="p-1.5 rounded-lg hover:bg-red-500/10 transition-colors"
                                title="Hapus"
                              >
                                <Icon name="trash" className="w-4 h-4 text-white/50 hover:text-red-400 transition-colors" />
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
        </div>
      </div>

      {/* ========== PREVIEW MODAL (MENGGUNAKAN PreviewModal DARI FORM BUILDER) ========== */}
      {isPreviewModalOpen && previewForm && (
        <PreviewModal
          isOpen={isPreviewModalOpen}
          onClose={() => setIsPreviewModalOpen(false)}
          elements={convertToFlexibleQuestions(previewForm.questions || [])}
          formTitle={previewForm.title}
        />
      )}

      {/* ========== DELETE CONFIRMATION MODAL ========== */}
      {isDeleteModalOpen && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ backgroundColor: 'rgba(0, 0, 0, 0.7)' }}
          onClick={() => setIsDeleteModalOpen(false)}
        >
          <div 
            className="relative w-full max-w-md bg-[#0e0e1a] border border-white/8 rounded-2xl shadow-2xl p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-rose-500/10 border border-rose-500/20 flex items-center justify-center">
                <Icon name="alertCircle" className="w-8 h-8 text-rose-400" />
              </div>
              <h3 className="font-display text-lg font-semibold text-white mb-2">Hapus Formulir</h3>
              <p className="text-sm text-white/50 mb-6">
                Apakah Anda yakin ingin menghapus formulir ini? Tindakan ini tidak dapat dibatalkan.
              </p>
              <div className="flex gap-3 justify-center">
                <button
                  onClick={() => setIsDeleteModalOpen(false)}
                  className="px-5 py-2.5 rounded-xl bg-white/3 border border-white/6 text-sm text-white/70 hover:text-white transition-all"
                >
                  Batal
                </button>
                <button
                  onClick={confirmDelete}
                  className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-sm font-medium text-white transition-all"
                >
                  Ya, Hapus
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}