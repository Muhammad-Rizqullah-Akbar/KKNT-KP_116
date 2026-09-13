// app/dashboard/form-builder/page.tsx

'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import { Topbar } from '@/features/dashboard/components/layout/Topbar'
import { FormToolbar } from '@/features/form-builder/components/canvas/FormToolbar'
import { Canvas } from '@/features/form-builder/components/canvas/Canvas'
import { ResizableToolbar } from '@/features/form-builder/components/canvas/ResizableToolbar'
import { FlexibleElementProperties } from '@/features/form-builder/components/config-panels/FlexibleElementProperties'
import { PreviewModal } from '@/features/form-builder/components/preview/PreviewModal'
import { FormSettingsModal } from '@/features/form-builder/components/shared/FormSettingsModal'
import { Icon } from '@/components/ui/Icons'
import { useFormBuilder } from './use-form-builder'
import GroupModal from './group-modal'

export default function FormBuilderPage() {
  const { userData, userRole, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading) {
      const effectiveRole = userRole || userData?.role
      if (effectiveRole === 'partnership') {
        router.replace('/dashboard/partnership')
      } else if (effectiveRole === 'cadre') {
        router.replace('/dashboard/monitoring')
      }
    }
  }, [loading, userRole, userData, router])

  const fb = useFormBuilder()

  // ============ LOADING STATE ============
  if (fb.isLoading) {
    return (
      <div className="flex flex-col min-h-screen bg-[#06060E]">
        <Topbar title="Form Builder" subtitle="Memuat..." />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center space-y-4">
            <Icon name="loader" className="w-10 h-10 text-cyan-400 animate-spin mx-auto" />
            <p className="text-white/40">Memuat formulir...</p>
          </div>
        </div>
      </div>
    )
  }

  // ============ MAIN RENDER ============
  return (
    <div className="flex flex-col min-h-screen bg-[#06060E]">
      <Topbar
        title="Form Builder"
        subtitle={fb.formId ? 'Edit formulir' : 'Desain formulir baru'}
      />

      <div className="flex-1 p-4 pb-4 overflow-hidden">
        {/* Toolbar */}
        <div className="mb-4">
          <FormToolbar
            formTitle={fb.formTitle}
            onTitleChange={fb.setFormTitle}
            onSave={fb.handleSave}
            onPreview={() => fb.setIsPreviewOpen(true)}
            onSettings={() => fb.setIsSettingsOpen(true)}
            isSaving={fb.isSaving}
            elementCount={fb.elements.length}
          />
        </div>

        {/* Success Notification */}
        {fb.showSuccess && (
          <div className="mb-4 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-between animate-slideUp">
            <div className="flex items-center gap-3">
              <Icon name="checkCircle" className="w-5 h-5 text-emerald-400" />
              <div>
                <p className="text-sm text-white font-medium">
                  {fb.formId ? 'Formulir berhasil diperbarui!' : 'Formulir berhasil dibuat!'}
                </p>
                <p className="text-xs text-white/50">
                  Kode form: <span className="font-mono text-cyan-400">{fb.generatedCode}</span>
                  {' '}• Simpan lagi untuk publish
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  navigator.clipboard.writeText(fb.generatedCode)
                  alert('Kode form disalin!')
                }}
                className="px-3 py-1.5 rounded-lg bg-white/[0.05] hover:bg-white/[0.1] text-xs text-white/60 transition-colors"
              >
                Salin Kode
              </button>
              <button onClick={fb.hideToast} className="p-1.5 rounded-lg hover:bg-white/[0.05] transition-colors">
                <Icon name="x" className="w-4 h-4 text-white/50" />
              </button>
            </div>
          </div>
        )}

        {/* Group Selector */}
        <div className="mb-4 p-4 rounded-xl bg-[#080812] border border-white/[0.05]">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <Icon name="folder" className="w-4 h-4 text-cyan-400" />
              <span className="text-sm text-white/60">Group Formulir:</span>
            </div>
            <select
              value={fb.selectedGroup}
              onChange={(e) => {
                const value = e.target.value
                if (value === 'new') {
                  fb.setIsNewGroup(true)
                  fb.setIsGroupModalOpen(true)
                } else {
                  fb.setIsNewGroup(false)
                  fb.setSelectedGroup(value)
                }
              }}
              className="px-4 py-2 rounded-xl bg-white/[0.03] border border-white/[0.06] text-sm text-white/70 focus:outline-none focus:border-cyan-400/40 transition-all cursor-pointer min-w-[200px]"
            >
              <option value="" className="bg-[#080812]">— Mandiri (Tanpa Group) —</option>
              {fb.groups.map((group) => (
                <option key={group.id} value={group.id} className="bg-[#080812]">
                  {group.title} ({group.formCount || 0} form)
                </option>
              ))}
              <option value="new" className="bg-[#080812] text-cyan-400">+ Buat Group Baru</option>
            </select>
            {fb.selectedGroup && !fb.isNewGroup && (
              <span className="text-xs text-emerald-400/70 bg-emerald-500/10 px-2 py-1 rounded-full">
                ✓ Tergabung dalam group
              </span>
            )}
            {fb.isNewGroup && (
              <span className="text-xs text-cyan-400/70 bg-cyan-500/10 px-2 py-1 rounded-full">
                + Group baru akan dibuat saat save
              </span>
            )}
          </div>
        </div>

        {/* Canvas */}
        <div
          className="rounded-2xl bg-[#080812] border border-white/[0.05] p-4 h-[calc(100vh-300px)] overflow-y-auto custom-scrollbar canvas-container"
        >
          <Canvas
            elements={fb.elements}
            stages={fb.stages}
            stageMode={fb.stageMode}
            onElementClick={fb.handleElementClick}
            onElementDelete={fb.handleElementDelete}
            onElementMove={fb.handleElementMove}
            onElementDuplicate={fb.handleElementDuplicate}
            onReorder={fb.handleReorder}
            onMoveQuestionToStage={fb.handleMoveQuestionToStage}
            selectedId={fb.selectedId}
            onDropFromToolbar={fb.handleDropFromToolbar}
            validationMode={fb.validation.mode}
            allowScoringOverride={fb.scoring.allowOverride}
            scoringDistribution={fb.scoring.distribution}
          />
        </div>
      </div>

      {/* Resizable Toolbar (kiri) */}
      <ResizableToolbar
        onAddElement={fb.handleAddElement}
        onAddPageBreak={() => {
          fb.handleAddStage()
        }}
        isMobile={fb.isMobile}
      />

      {/* Properties Panel */}
      <FlexibleElementProperties
        element={fb.selectedElement}
        isOpen={fb.isPropertiesOpen}
        onClose={() => {
          fb.setIsPropertiesOpen(false)
          fb.setSelectedId(null)
        }}
        onSave={fb.handleElementUpdate}
        formId={fb.formId || undefined}
        validationMode={fb.validation.mode}
        validationExceptions={fb.validation.exceptions}
        allowScoringOverride={fb.scoring.allowOverride}
        onScoringOverride={(questionId: string, points: number | null) => {
          fb.setElements(prev =>
            prev.map(el =>
              el.id === questionId
                ? { ...el, overridePoints: points }
                : el
            )
          )
        }}
      />

      {/* Preview Modal */}
      <PreviewModal
        isOpen={fb.isPreviewOpen}
        onClose={() => fb.setIsPreviewOpen(false)}
        elements={fb.elements}
        formTitle={fb.formTitle}
        stages={fb.stages}
        stageMode={fb.stageMode}
        validationMode={fb.validation.mode}
        validationExceptions={fb.validation.exceptions}
        scoringDistribution={fb.scoring.distribution}
        scoringMode={fb.scoring.mode}
      />

      {/* Form Settings Modal */}
      <FormSettingsModal
        isOpen={fb.isSettingsOpen}
        onClose={() => fb.setIsSettingsOpen(false)}
        formTitle={fb.formTitle}
        elements={fb.elements}
        validation={fb.validation}
        onValidationChange={fb.handleValidationChange}
        stages={fb.stages}
        stageMode={fb.stageMode}
        onStageModeChange={fb.setStageMode}
        onAddStage={fb.handleAddStage}
        onRemoveStage={fb.handleRemoveStage}
        onStageReorder={fb.handleStageReorder}
        onStageNameChange={fb.handleStageNameChange}
        scoring={fb.scoring}
        onScoringChange={fb.handleScoringChange}
        onAutoBalance={fb.handleAutoBalance}
        onStageScoringToggle={fb.handleStageScoringToggle}
      />

      {/* Group Creation Modal */}
      {fb.isGroupModalOpen && (
        <GroupModal
          newGroupData={fb.newGroupData}
          setNewGroupData={fb.setNewGroupData}
          onClose={() => {
            fb.resetGroupForm()
            fb.setIsGroupModalOpen(false)
          }}
          onConfirm={() => {
            if (!fb.newGroupData.title.trim() || !fb.newGroupData.target.trim()) {
              alert('Nama group dan target harus diisi!')
              return
            }
            fb.setIsNewGroup(true)
            fb.setSelectedGroup('new')
            fb.setIsGroupModalOpen(false)
          }}
        />
      )}
    </div>
  )
}
