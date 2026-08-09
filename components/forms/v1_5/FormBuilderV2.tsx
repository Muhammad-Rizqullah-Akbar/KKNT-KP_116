'use client'

import React, { useState, useMemo } from 'react'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'

import type { BuilderState, FormAspect } from '@/lib/forms/v1_5/builderState'
import {
  DEFAULT_ASPECTS,
  DEFAULT_SCORING_CONFIG,
  DEFAULT_VALIDATION_CONFIG,
  DEFAULT_THRESHOLDS,
  DEFAULT_RECOMMENDATIONS,
  DEFAULT_DISTRIBUTION,
  addQuestion,
  updateQuestion,
  deleteQuestion,
  reorderQuestion,
  duplicateQuestion,
  moveQuestionToAspect,
  addAspect,
  updateAspect,
  deleteAspect,
  reorderAspect,
  updateMetadata,
  updateScoring,
  updateValidation,
  updateThresholds,
  updateRecommendations,
  updateDistribution,
} from '@/lib/forms/v1_5/builderState'
import type { Question, QuestionType, CanonicalForm } from '@/lib/forms/v1_5/types'
import { validateCanonicalForm, type FormValidationIssue } from '@/lib/forms/v1_5/validation'

import { QuestionNavigator, type QuestionStatus } from './QuestionNavigator'
import { AspectManager } from './AspectManager'
import { AnswerKeyInspector } from './AnswerKeyInspector'
import { FormMetadataEditor } from './FormMetadataEditor'
import { FormVersionSettings } from './FormVersionSettings'
import { FormPreviewModal } from './FormPreviewModal'
import { ConfirmationModal } from './ConfirmationModal'
import { ValidationErrorsBanner } from './ValidationErrorsBanner'
import { FormVersionHistoryModal } from './FormVersionHistoryModal'
import { Icon } from '@/components/ui/Icons'

interface FormBuilderV2Props {
  formId?: string
  activeVersionId?: string
  activeVersionNumber?: number
  initialState?: BuilderState
  onSaveDraft?: (canonical: CanonicalForm) => void
  onSaveDraftToServer?: (state: BuilderState) => Promise<void>
  onPublishVersion?: () => Promise<void>
  onCreateNewVersion?: () => Promise<void>
  onOpenVersionHistory?: () => void
}

export function FormBuilderV2({
  formId,
  activeVersionId,
  activeVersionNumber,
  initialState,
  onSaveDraft,
  onSaveDraftToServer,
  onPublishVersion,
  onCreateNewVersion,
  onOpenVersionHistory,
}: FormBuilderV2Props) {
  // Master state
  const [state, setState] = useState<BuilderState>(
    initialState || {
      metadata: {
        title: 'Formulir Penilaian BPOM V1.5',
        description: 'Formulir evaluasi standar cadre dan sarana pangan...',
        target: 'Komunitas & Cadre Pangan',
        category: 'Kuesioner Evaluasi',
        kind: 'official',
        status: 'draft',
      },
      aspects: DEFAULT_ASPECTS,
      questions: [],
      scoring: DEFAULT_SCORING_CONFIG,
      validation: DEFAULT_VALIDATION_CONFIG,
      thresholds: DEFAULT_THRESHOLDS,
      recommendations: DEFAULT_RECOMMENDATIONS,
      distribution: DEFAULT_DISTRIBUTION,
    }
  )

  // UI View States
  const [activeTab, setActiveTab] = useState<'editor' | 'inspector' | 'settings'>('editor')
  const [editingQuestionId, setEditingQuestionId] = useState<string | null>(null)
  const [deletingQuestionId, setDeletingQuestionId] = useState<string | null>(null)
  const [isPreviewOpen, setIsPreviewOpen] = useState(false)
  const [isVersionModalOpen, setIsVersionModalOpen] = useState(false)
  const [validationIssues, setValidationIssues] = useState<FormValidationIssue[]>([])
  const [toastMessage, setToastMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null)
  const [lastSaved, setLastSaved] = useState<string | null>(null)
  const [isSavedState, setIsSavedState] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [isPublishing, setIsPublishing] = useState(false)

  // DND Sensors
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor)
  )

  // Toast Helper
  const showToast = (type: 'success' | 'error' | 'info', text: string) => {
    setToastMessage({ type, text })
    setTimeout(() => setToastMessage(null), 4000)
  }

  // Canonical Form Construction
  const canonicalForm: CanonicalForm = useMemo(() => {
    const currentFormId = formId || `form_${state.metadata.title.toLowerCase().replace(/[^a-z0-9]/g, '_') || 'v1_5'}`
    const vId = activeVersionId || `${currentFormId}_v${activeVersionNumber || 1}`

    return {
      form: {
        formId: currentFormId,
        metadata: state.metadata,
        activeVersionId: vId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      version: {
        versionId: vId,
        formId: currentFormId,
        versionNumber: activeVersionNumber || 1,
        status: state.metadata.status,
        questions: state.questions,
        scoring: state.scoring,
        validation: state.validation,
        createdAt: new Date().toISOString(),
      },
    }
  }, [state, formId, activeVersionId, activeVersionNumber])

  // Question Statuses for Navigator
  const questionStatuses = useMemo(() => {
    const statuses: Record<string, QuestionStatus> = {}
    state.questions.forEach((q) => {
      if (!q.prompt.trim()) {
        statuses[q.questionId] = 'error'
      } else if (
        ['single-choice', 'multiple-choice', 'dropdown', 'binary'].includes(q.type) &&
        q.options.length === 0
      ) {
        statuses[q.questionId] = 'warning'
      } else {
        statuses[q.questionId] = 'valid'
      }
    })
    return statuses
  }, [state.questions])

  // State Change Handler
  const handleStateChange = (nextState: BuilderState) => {
    setState(nextState)
    setIsSavedState(false)
  }

  // Question Navigator Scroll & Focus
  const handleSelectQuestion = (qId: string) => {
    setActiveTab('editor')
    setEditingQuestionId(qId)
    setTimeout(() => {
      const el = document.getElementById(`question-${qId}`)
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' })
      }
    }, 100)
  }

  // DND Drag Handler for Aspects & Questions
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id) return

    const activeId = String(active.id)
    const overId = String(over.id)

    // Case A: Dragging an Aspect
    const activeAspectIdx = state.aspects.findIndex((a) => a.aspectId === activeId)
    const overAspectIdx = state.aspects.findIndex((a) => a.aspectId === overId)

    if (activeAspectIdx !== -1 && overAspectIdx !== -1) {
      handleStateChange(reorderAspect(state, activeId, overAspectIdx))
      return
    }

    // Case B: Dragging a Question
    const activeQIdx = state.questions.findIndex((q) => q.questionId === activeId)
    const overQIdx = state.questions.findIndex((q) => q.questionId === overId)

    if (activeQIdx !== -1) {
      if (overQIdx !== -1) {
        const overQ = state.questions[overQIdx]
        let nextState = state
        if (state.questions[activeQIdx].aspectId !== overQ.aspectId && overQ.aspectId) {
          nextState = moveQuestionToAspect(nextState, activeId, overQ.aspectId)
        }
        nextState = reorderQuestion(nextState, activeId, overQIdx)
        handleStateChange(nextState)
      } else if (overAspectIdx !== -1) {
        const targetAspect = state.aspects[overAspectIdx]
        handleStateChange(moveQuestionToAspect(state, activeId, targetAspect.aspectId))
      }
    }
  }

  // Aspect Operations
  const handleAddAspect = () => {
    const nextNum = state.aspects.length + 1
    const newAspect: FormAspect = {
      aspectId: `aspect_${crypto.randomUUID()}`,
      title: `Aspek ${nextNum} — Dimensi Baru`,
      description: 'Deskripsi penilaian aspek...',
    }
    try {
      const updated = addAspect(state, newAspect)
      handleStateChange(updated)
      showToast('info', 'Aspek baru berhasil ditambahkan.')
    } catch (err: any) {
      showToast('error', err.message || 'Gagal menambah aspek.')
    }
  }

  const handleUpdateAspect = (aspectId: string, update: Partial<FormAspect>) => {
    const updated = updateAspect(state, aspectId, update)
    handleStateChange(updated)
  }

  const handleDeleteAspect = (aspectId: string) => {
    try {
      const updated = deleteAspect(state, aspectId)
      handleStateChange(updated)
      showToast('info', 'Aspek berhasil dihapus.')
    } catch (err: any) {
      showToast('error', err.message || 'Gagal menghapus aspek.')
    }
  }

  const handleMoveAspectUp = (idx: number) => {
    if (idx <= 0) return
    const aspId = state.aspects[idx].aspectId
    const updated = reorderAspect(state, aspId, idx - 1)
    handleStateChange(updated)
  }

  const handleMoveAspectDown = (idx: number) => {
    if (idx >= state.aspects.length - 1) return
    const aspId = state.aspects[idx].aspectId
    const updated = reorderAspect(state, aspId, idx + 1)
    handleStateChange(updated)
  }

  // Question Operations
  const handleAddQuestionToAspect = (aspectId: string, type: QuestionType = 'single-choice') => {
    const newId = `q_${crypto.randomUUID()}`
    const defaultQuestion: Question & { aspectId?: string } = {
      questionId: newId,
      aspectId,
      type,
      prompt: `Pertanyaan Baru (${type})`,
      required: true,
      options:
        ['single-choice', 'multiple-choice', 'dropdown', 'binary'].includes(type)
          ? [
              { optionId: `${newId}-option-1`, label: 'Opsi 1' },
              { optionId: `${newId}-option-2`, label: 'Opsi 2' },
            ]
          : [],
      presentation: {
        description: '',
        media: { type: 'none' },
        indicators: [],
        indicatorScales: [],
      },
      scoring: { scheme: 'none', weight: 1 },
      answerKey: { kind: 'none' },
    }

    try {
      const updated = addQuestion(state, defaultQuestion)
      handleStateChange(updated)
      handleSelectQuestion(newId)
      showToast('info', 'Pertanyaan baru ditambahkan.')
    } catch (err: any) {
      showToast('error', err.message || 'Gagal menambahkan pertanyaan.')
    }
  }

  const handleUpdateQuestion = (qId: string, update: any) => {
    const updated = updateQuestion(state, qId, update)
    handleStateChange(updated)
  }

  const handleDeleteQuestionConfirm = () => {
    if (!deletingQuestionId) return
    const updated = deleteQuestion(state, deletingQuestionId)
    handleStateChange(updated)
    if (editingQuestionId === deletingQuestionId) {
      setEditingQuestionId(null)
    }
    setDeletingQuestionId(null)
    showToast('info', 'Pertanyaan berhasil dihapus.')
  }

  const handleDuplicateQuestion = (qId: string) => {
    try {
      const updated = duplicateQuestion(state, qId)
      handleStateChange(updated)
      showToast('success', 'Pertanyaan berhasil diduplikat.')
    } catch (err: any) {
      showToast('error', err.message || 'Gagal menduplikat pertanyaan.')
    }
  }

  const handleMoveQuestionUp = (idx: number) => {
    if (idx <= 0) return
    const qId = state.questions[idx].questionId
    const updated = reorderQuestion(state, qId, idx - 1)
    handleStateChange(updated)
  }

  const handleMoveQuestionDown = (idx: number) => {
    if (idx >= state.questions.length - 1) return
    const qId = state.questions[idx].questionId
    const updated = reorderQuestion(state, qId, idx + 1)
    handleStateChange(updated)
  }

  const handleMoveQuestionToAspect = (qId: string, targetAspectId: string) => {
    const updated = moveQuestionToAspect(state, qId, targetAspectId)
    handleStateChange(updated)
    showToast('info', 'Pertanyaan dipindahkan ke aspek terpilih.')
  }

  // Save Draft Action (Server / In-Memory)
  const handleSaveDraft = async () => {
    const issues = validateCanonicalForm(canonicalForm)
    setValidationIssues(issues)

    if (issues.length > 0) {
      showToast('error', `Terdapat ${issues.length} masalah validasi sebelum dapat disimpan.`)
      return
    }

    if (onSaveDraftToServer) {
      setIsSaving(true)
      try {
        await onSaveDraftToServer(state)
        setIsSavedState(true)
        setLastSaved(new Date().toLocaleTimeString())
        showToast('success', 'Draft formulir berhasil tersimpan ke Firebase!')
      } catch (err: any) {
        showToast('error', err.message || 'Gagal menyimpan draft ke server.')
      } finally {
        setIsSaving(false)
      }
    } else {
      setIsSavedState(true)
      setLastSaved(new Date().toLocaleTimeString())
      onSaveDraft?.(canonicalForm)
      showToast('success', 'Formulir berhasil disimpan sebagai draft (In-Memory)!')
    }
  }

  // Publish Version Action
  const handlePublish = async () => {
    const issues = validateCanonicalForm(canonicalForm)
    setValidationIssues(issues)

    if (issues.length > 0) {
      showToast('error', `Gagal publikasi: Terdapat ${issues.length} kesalahan validasi.`)
      return
    }

    if (!onPublishVersion) {
      showToast('info', 'Mode pratinjau lokal: Publikasi memerlukan integrasi server.')
      return
    }

    setIsPublishing(true)
    try {
      await onPublishVersion()
      setState((prev) => ({
        ...prev,
        metadata: { ...prev.metadata, status: 'published' },
      }))
      setIsSavedState(true)
      showToast('success', 'Formulir & Versi Snapshot berhasil dipublikasikan secara atomis!')
    } catch (err: any) {
      showToast('error', err.message || 'Gagal mempublikasikan versi formulir.')
    } finally {
      setIsPublishing(false)
    }
  }

  // Create New Version Action
  const handleCreateNewVersion = async () => {
    if (!onCreateNewVersion) return
    try {
      await onCreateNewVersion()
      showToast('success', 'Draft versi baru berhasil dibuat.')
    } catch (err: any) {
      showToast('error', err.message || 'Gagal membuat versi baru.')
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* Top Navbar */}
      <header className="sticky top-0 z-30 bg-slate-900/90 border-b border-slate-800/90 backdrop-blur-md px-4 sm:px-6 py-3 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-md">
        <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-start">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
              <Icon name="fileText" className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base font-bold text-slate-100 max-w-xs sm:max-w-md truncate">
                  {state.metadata.title || 'Formulir Penilaian V1.5'}
                </h1>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded border uppercase ${
                    state.metadata.status === 'published'
                      ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                      : state.metadata.status === 'archived'
                      ? 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                      : 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                  }`}
                >
                  {state.metadata.status} (v{activeVersionNumber || 1})
                </span>
              </div>
              <div className="flex items-center gap-3 text-xs text-slate-400 mt-0.5">
                <span>{state.aspects.length} Aspek</span>
                <span>•</span>
                <span>{state.questions.length} Pertanyaan</span>
                <span>•</span>
                {isSavedState ? (
                  <span className="text-emerald-400 flex items-center gap-1 font-medium">
                    <Icon name="checkCircle" className="w-3 h-3" /> Draft Tersimpan {lastSaved && `(${lastSaved})`}
                  </span>
                ) : (
                  <span className="text-amber-400 font-medium">Perubahan Belum Disimpan</span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 flex-wrap w-full sm:w-auto justify-end">
          {/* Main View Tabs */}
          <div className="flex items-center p-1 bg-slate-950 border border-slate-800 rounded-xl">
            <button
              type="button"
              onClick={() => setActiveTab('editor')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                activeTab === 'editor'
                  ? 'bg-cyan-500/20 text-cyan-200 border border-cyan-500/40 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Icon name="edit" className="w-3.5 h-3.5" />
              <span>Editor</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('inspector')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                activeTab === 'inspector'
                  ? 'bg-emerald-500/20 text-emerald-200 border border-emerald-500/40'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Icon name="shieldCheck" className="w-3.5 h-3.5" />
              <span>Inspector Kunci</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('settings')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                activeTab === 'settings'
                  ? 'bg-purple-500/20 text-purple-200 border border-purple-500/40'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Icon name="settings" className="w-3.5 h-3.5" />
              <span>Pengaturan</span>
            </button>
          </div>

          {formId && (
            <button
              type="button"
              onClick={() => {
                if (onOpenVersionHistory) onOpenVersionHistory()
                else setIsVersionModalOpen(true)
              }}
              className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold border border-slate-700 flex items-center gap-1.5 transition-colors"
            >
              <Icon name="history" className="w-4 h-4 text-purple-400" />
              <span className="hidden md:inline">Riwayat Versi</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => setIsPreviewOpen(true)}
            className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 flex items-center gap-1.5 transition-colors"
          >
            <Icon name="eye" className="w-4 h-4 text-cyan-400" />
            <span className="hidden md:inline">Pratinjau Publik</span>
          </button>

          {state.metadata.status === 'published' ? (
            <button
              type="button"
              onClick={handleCreateNewVersion}
              className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold shadow-lg shadow-purple-500/20 flex items-center gap-1.5 transition-all"
            >
              <Icon name="plus" className="w-4 h-4" />
              <span>Buat Versi Baru</span>
            </button>
          ) : (
            <>
              <button
                type="button"
                onClick={handleSaveDraft}
                disabled={isSaving}
                className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 disabled:bg-slate-800 text-white text-xs font-bold shadow-lg shadow-cyan-500/20 flex items-center gap-1.5 transition-all"
              >
                {isSaving ? <Icon name="loader" className="w-4 h-4 animate-spin" /> : <Icon name="save" className="w-4 h-4" />}
                <span>{isSaving ? 'Menyimpan...' : 'Simpan Draft'}</span>
              </button>

              <button
                type="button"
                onClick={handlePublish}
                disabled={isPublishing}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-800 text-white text-xs font-bold shadow-lg shadow-emerald-500/20 flex items-center gap-1.5 transition-all"
              >
                {isPublishing ? <Icon name="loader" className="w-4 h-4 animate-spin" /> : <Icon name="checkCircle" className="w-4 h-4" />}
                <span>{isPublishing ? 'Mempublikasikan...' : 'Publikasikan'}</span>
              </button>
            </>
          )}
        </div>
      </header>

      {/* Mobile Sticky Horizontal Navigator */}
      {activeTab === 'editor' && (
        <QuestionNavigator
          questions={state.questions}
          aspects={state.aspects}
          activeQuestionId={editingQuestionId}
          questionStatuses={questionStatuses}
          onSelectQuestion={handleSelectQuestion}
          isMobileOnly
        />
      )}

      {/* Main Container Layout */}
      <div className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 flex items-start gap-6">
        {/* Desktop Persistent Left-Side Sidebar Navigator */}
        {activeTab === 'editor' && (
          <QuestionNavigator
            questions={state.questions}
            aspects={state.aspects}
            activeQuestionId={editingQuestionId}
            questionStatuses={questionStatuses}
            onSelectQuestion={handleSelectQuestion}
            isDesktopOnly
          />
        )}

        {/* Main Content Workspace Canvas */}
        <main className="flex-1 min-w-0 space-y-6">
          {/* Validation Issues Banner */}
          <ValidationErrorsBanner issues={validationIssues} onDismiss={() => setValidationIssues([])} />

          {/* VIEW 1: ASPECT-BASED EDITOR WITH DND */}
          {activeTab === 'editor' && (
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
              <div className="space-y-6">
                {/* Header Control Bar for Adding Aspects */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-900/90 border border-slate-800 p-4 rounded-2xl shadow-md">
                  <div>
                    <h2 className="text-base font-bold text-slate-100">Struktur Aspek & Pertanyaan Formulir</h2>
                    <p className="text-xs text-slate-400 mt-0.5">Dukung drag & drop aspek/pertanyaan serta kontrol panah aksesibilitas</p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleAddAspect}
                      className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold flex items-center gap-1.5 shadow transition-colors"
                    >
                      <Icon name="plus" className="w-4 h-4" />
                      <span>+ Tambah Aspek Baru</span>
                    </button>
                  </div>
                </div>

                {/* Sortable Aspects Context */}
                <SortableContext items={state.aspects.map((a) => a.aspectId)} strategy={verticalListSortingStrategy}>
                  {state.aspects.map((asp, aspIdx) => {
                    const aspectQuestions = state.questions.filter(
                      (q) => (q.aspectId || state.aspects[0]?.aspectId) === asp.aspectId
                    )

                    return (
                      <SortableContext
                        key={asp.aspectId}
                        items={aspectQuestions.map((q) => q.questionId)}
                        strategy={verticalListSortingStrategy}
                      >
                        <AspectManager
                          aspect={asp}
                          aspectIndex={aspIdx}
                          totalAspects={state.aspects.length}
                          allocatedPoints={state.scoring.stagePointDistribution[asp.aspectId] || 0}
                          questions={aspectQuestions}
                          allAspects={state.aspects}
                          editingQuestionId={editingQuestionId}
                          onUpdateAspect={handleUpdateAspect}
                          onUpdateAllocatedPoints={(aspId, pts) => {
                            const updatedDist = { ...state.scoring.stagePointDistribution, [aspId]: pts }
                            handleStateChange(updateScoring(state, { stagePointDistribution: updatedDist }))
                          }}
                          onDeleteAspect={handleDeleteAspect}
                          onMoveAspectUp={() => handleMoveAspectUp(aspIdx)}
                          onMoveAspectDown={() => handleMoveAspectDown(aspIdx)}
                          onAddQuestionToAspect={(aspId) => handleAddQuestionToAspect(aspId)}
                          onToggleEditQuestion={(qId) => setEditingQuestionId(editingQuestionId === qId ? null : qId)}
                          onMoveQuestionUp={(qIdx) => handleMoveQuestionUp(qIdx)}
                          onMoveQuestionDown={(qIdx) => handleMoveQuestionDown(qIdx)}
                          onMoveQuestionToAspect={handleMoveQuestionToAspect}
                          onDuplicateQuestion={handleDuplicateQuestion}
                          onDeleteQuestion={(qId) => setDeletingQuestionId(qId)}
                          onUpdateQuestion={handleUpdateQuestion}
                        />
                      </SortableContext>
                    )
                  })}
                </SortableContext>
              </div>
            </DndContext>
          )}

          {/* VIEW 2: DIRECT EDITABLE INSPECTOR MODE */}
          {activeTab === 'inspector' && (
            <AnswerKeyInspector
              questions={state.questions}
              aspects={state.aspects}
              scoring={state.scoring}
              onUpdateQuestion={handleUpdateQuestion}
              onUpdateScoring={(update) => handleStateChange(updateScoring(state, update))}
              onSelectQuestion={handleSelectQuestion}
            />
          )}

          {/* VIEW 3: FORM SETTINGS & METADATA */}
          {activeTab === 'settings' && (
            <div className="space-y-6">
              <FormMetadataEditor
                metadata={state.metadata}
                onChange={(update) => handleStateChange(updateMetadata(state, update))}
              />

              <FormVersionSettings
                scoring={state.scoring}
                validation={state.validation}
                thresholds={state.thresholds}
                recommendations={state.recommendations}
                aspects={state.aspects}
                questions={state.questions}
                onScoringChange={(update) => handleStateChange(updateScoring(state, update))}
                onValidationChange={(update) => handleStateChange(updateValidation(state, update))}
                onThresholdsChange={(thresholds) => handleStateChange(updateThresholds(state, thresholds))}
                onRecommendationsChange={(update) => handleStateChange(updateRecommendations(state, update))}
              />
            </div>
          )}
        </main>
      </div>

      {/* Floating Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 animate-in slide-in-from-bottom-3 duration-200">
          <div
            className={`px-4 py-3 rounded-xl border shadow-2xl flex items-center gap-3 text-xs font-semibold ${
              toastMessage.type === 'success'
                ? 'bg-emerald-950 border-emerald-500/50 text-emerald-200'
                : toastMessage.type === 'error'
                ? 'bg-rose-950 border-rose-500/50 text-rose-200'
                : 'bg-slate-900 border-slate-700 text-slate-200'
            }`}
          >
            <Icon
              name={toastMessage.type === 'success' ? 'checkCircle' : toastMessage.type === 'error' ? 'alertCircle' : 'info'}
              className="w-4 h-4"
            />
            <span>{toastMessage.text}</span>
          </div>
        </div>
      )}

      {/* Confirmation Dialog */}
      <ConfirmationModal
        isOpen={Boolean(deletingQuestionId)}
        title="Hapus Pertanyaan?"
        message="Pertanyaan yang dihapus akan terhapus dari draft formulir. Tindakan ini tidak dapat dibatalkan."
        confirmLabel="Ya, Hapus"
        cancelLabel="Batal"
        onConfirm={handleDeleteQuestionConfirm}
        onCancel={() => setDeletingQuestionId(null)}
      />

      {/* Canonical Public Form Preview Modal */}
      <FormPreviewModal
        isOpen={isPreviewOpen}
        canonicalForm={canonicalForm}
        onClose={() => setIsPreviewOpen(false)}
      />

      {/* Form Version History Modal */}
      {formId && (
        <FormVersionHistoryModal
          isOpen={isVersionModalOpen}
          formId={formId}
          activeVersionId={activeVersionId}
          onClose={() => setIsVersionModalOpen(false)}
        />
      )}
    </div>
  )
}
