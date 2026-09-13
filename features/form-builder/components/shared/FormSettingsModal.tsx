// components/form-builder/FormSettingsModal.tsx

'use client'

import { useState, useEffect } from 'react'
import { Icon } from '@/components/ui/Icons'
import { 
  FormStage, 
  FormValidation, 
  FormScoring,
  FlexibleQuestion,
  getScoredStages,
  calculateStageWeights,
  validateDistribution,
} from '@/features/form-builder/components/shared/ElementTypes'
import { InfoTab } from './InfoTab'
import { ValidationTab } from './ValidationTab'
import { StagesTab } from './StagesTab'
import { ScoringTab } from './ScoringTab'

interface FormSettingsModalProps {
  isOpen: boolean
  onClose: () => void
  formTitle: string
  elements: FlexibleQuestion[]
  
  // Validation props
  validation: FormValidation
  onValidationChange: (validation: FormValidation) => void
  
  // Stages props
  stages: FormStage[]
  stageMode: 'single' | 'multi'
  onStageModeChange: (mode: 'single' | 'multi') => void
  onAddStage: () => void
  onRemoveStage: (stageId: string) => void
  onStageReorder: (startIndex: number, endIndex: number) => void
  onStageNameChange: (stageId: string, newName: string) => void
  
  // Scoring props
  scoring: FormScoring
  onScoringChange: (scoring: FormScoring) => void
  onAutoBalance: () => void
  
  // NEW: Toggle includeInScoring
  onStageScoringToggle: (stageId: string, include: boolean) => void
}

type TabType = 'info' | 'validation' | 'stages' | 'scoring'

export function FormSettingsModal({
  isOpen,
  onClose,
  formTitle,
  elements,
  validation,
  onValidationChange,
  stages,
  stageMode,
  onStageModeChange,
  onAddStage,
  onRemoveStage,
  onStageReorder,
  onStageNameChange,
  scoring,
  onScoringChange,
  onAutoBalance,
  onStageScoringToggle,  // ← NEW
}: FormSettingsModalProps) {
  
  const [activeTab, setActiveTab] = useState<TabType>('info')
  const [draggedStageIndex, setDraggedStageIndex] = useState<number | null>(null)
  const [showWeightWarning, setShowWeightWarning] = useState<boolean>(false)
  const [showBalanceWarning, setShowBalanceWarning] = useState<boolean>(false)
  
  // Reset tab saat modal dibuka
  useEffect(() => {
    if (isOpen) {
      setActiveTab('info')
      // Reset warnings
      setShowWeightWarning(false)
      setShowBalanceWarning(false)
    }
  }, [isOpen])

  // ============ HANDLERS ============
  
  // --- Validation Handlers ---
  const handleValidationModeChange = (mode: FormValidation['mode']) => {
    onValidationChange({
      ...validation,
      mode,
      exceptions: mode === 'all_required' ? [] : validation.exceptions,
    })
  }

  const handleExceptionToggle = (questionId: string) => {
    const newExceptions = validation.exceptions.includes(questionId)
      ? validation.exceptions.filter(id => id !== questionId)
      : [...validation.exceptions, questionId]
    
    onValidationChange({
      ...validation,
      exceptions: newExceptions,
    })
  }

  const handleAllowOverrideToggle = () => {
    onValidationChange({
      ...validation,
      allowOverride: !validation.allowOverride,
    })
  }

  // --- Scoring Handlers ---
  const handleTotalPointsChange = (value: number) => {
    if (value > 0) {
      onScoringChange({
        ...scoring,
        totalPoints: value,
      })
      // Check balance
      const { valid } = validateDistribution(scoring.distribution, value)
      setShowBalanceWarning(!valid)
    }
  }

  const handleScoringModeChange = (mode: FormScoring['mode']) => {
    onScoringChange({
      ...scoring,
      mode,
    })
  }

  const handleAllowScoringOverrideToggle = () => {
    onScoringChange({
      ...scoring,
      allowOverride: !scoring.allowOverride,
    })
  }

  const handleDistributionChange = (stageId: string, points: number) => {
    if (points >= 0) {
      const newDistribution = {
        ...scoring.distribution,
        [stageId]: points,
      }
      
      const { valid } = validateDistribution(newDistribution, scoring.totalPoints)
      setShowBalanceWarning(!valid)
      
      onScoringChange({
        ...scoring,
        distribution: newDistribution,
      })
    }
  }

  // --- NEW: Handle Question Weight Change ---
  const handleQuestionWeightChange = (questionId: string, weight: number) => {
    if (weight >= 1 && weight <= 100) {
      // Update weight di question
      const updatedElements = elements.map(el => {
        if (el.id === questionId) {
          return {
            ...el,
            scoring: {
              ...el.scoring,
              weight: weight,
            }
          }
        }
        return el
      })
      
      // Trigger update ke parent
      // (Ini perlu di-handle di page.tsx dengan callback)
      // Untuk sekarang, kita simpan local dulu
      
      // Re-calculate stage weights
      const stageWeights = calculateStageWeights(updatedElements, stages)
      
      // Check if any scored stage has zero weight
      const scoredStages = getScoredStages(stages)
      const hasZeroWeight = scoredStages.some(stage => 
        (stageWeights[stage.id] || 0) === 0 && 
        stage.questionIds.length > 0
      )
      setShowWeightWarning(hasZeroWeight)
    }
  }

  // --- Stage Handlers ---
  const handleStageDragStart = (index: number) => {
    setDraggedStageIndex(index)
  }

  const handleStageDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault()
    if (draggedStageIndex === null || draggedStageIndex === index) return
    
    const newStages = [...stages]
    const [dragged] = newStages.splice(draggedStageIndex, 1)
    newStages.splice(index, 0, dragged)
    newStages.forEach((stage, i) => stage.order = i)
    
    onStageReorder(draggedStageIndex, index)
    setDraggedStageIndex(index)
  }

  const handleStageDragEnd = () => {
    setDraggedStageIndex(null)
  }

  // ============ RENDER FUNCTIONS ============
  
  const renderTabButton = (tab: TabType, label: string, icon: string) => (
    <button
      onClick={() => setActiveTab(tab)}
      className={`px-4 py-2.5 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${
        activeTab === tab
          ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/20'
          : 'text-white/40 hover:text-white/70 hover:bg-white/[0.03]'
      }`}
    >
      <Icon name={icon as any} className="w-4 h-4" />
      {label}
    </button>
  )

  // ============ TAB CONTENT ============
  const renderInfoTab = () => (
    <InfoTab formTitle={formTitle} elements={elements} />
  )

  const renderValidationTab = () => (
    <ValidationTab
      validation={validation}
      elements={elements}
      onValidationModeChange={handleValidationModeChange}
      onExceptionToggle={handleExceptionToggle}
      onAllowOverrideToggle={handleAllowOverrideToggle}
    />
  )

  const renderStagesTab = () => (
    <StagesTab
      stages={stages}
      stageMode={stageMode}
      elementsLength={elements.length}
      draggedStageIndex={draggedStageIndex}
      onStageModeChange={onStageModeChange}
      onAddStage={onAddStage}
      onRemoveStage={onRemoveStage}
      onStageNameChange={onStageNameChange}
      onStageDragStart={handleStageDragStart}
      onStageDragOver={handleStageDragOver}
      onStageDragEnd={handleStageDragEnd}
    />
  )

  const renderScoringTab = () => (
    <ScoringTab
      scoring={scoring}
      stages={stages}
      elements={elements}
      onTotalPointsChange={handleTotalPointsChange}
      onScoringModeChange={handleScoringModeChange}
      onAllowScoringOverrideToggle={handleAllowScoringOverrideToggle}
      onDistributionChange={handleDistributionChange}
      onQuestionWeightChange={handleQuestionWeightChange}
      onStageScoringToggle={onStageScoringToggle}
      onAutoBalance={onAutoBalance}
    />
  )

  // ============ TAB CONTENT MAP ============
  const tabContent: Record<TabType, React.ReactNode> = {
    info: renderInfoTab(),
    validation: renderValidationTab(),
    stages: renderStagesTab(),
    scoring: renderScoringTab(),
  }

  // ============ MODAL RENDER ============
  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(0, 0, 0, 0.7)' }}
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-3xl bg-[#0e0e1a] border border-white/[0.08] rounded-2xl shadow-2xl max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/[0.05] flex-shrink-0">
          <div>
            <h3 className="font-display text-lg font-semibold text-white flex items-center gap-2">
              <Icon name="settings" className="w-5 h-5 text-cyan-400" />
              Pengaturan Form
            </h3>
            <p className="text-xs text-white/30">Atur validasi, tahapan, dan penilaian formulir</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-lg hover:bg-white/[0.05] transition-colors">
            <Icon name="x" className="w-5 h-5 text-white/50" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-1 px-6 pt-4 border-b border-white/[0.05] flex-wrap flex-shrink-0">
          {renderTabButton('info', 'Informasi', 'info')}
          {renderTabButton('validation', 'Validasi', 'checkCircle')}
          {renderTabButton('stages', 'Tahapan', 'list')}
          {renderTabButton('scoring', 'Penilaian', 'barChart')}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
          {tabContent[activeTab]}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-white/[0.05] flex-shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl bg-white/[0.03] border border-white/[0.06] text-white/60 hover:bg-white/[0.06] transition-all"
          >
            Tutup
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-cyan-400 to-violet-400 text-white font-medium hover:opacity-90 transition-all flex items-center gap-2"
          >
            <Icon name="check" className="w-4 h-4" />
            Simpan
          </button>
        </div>
      </div>
    </div>
  )
}
