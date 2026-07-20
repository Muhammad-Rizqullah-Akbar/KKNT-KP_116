// components/form-builder/FormSettingsModal.tsx

'use client'

import { useState, useEffect } from 'react'
import { Icon } from '@/components/ui/Icons'
import { 
  FormStage, 
  FormValidation, 
  FormScoring,
  FlexibleQuestion,
  ANSWER_TYPES,
  getScoredStages,
  getUnscoredStages,
  getQuestionsByStage,
  calculateStageWeights,
  validateDistribution,
} from '@/components/form-builder/ElementTypes'

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
    <div className="space-y-4">
      <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.05]">
        <h4 className="text-sm font-medium text-white mb-2">Informasi Formulir</h4>
        <div className="space-y-3">
          <div>
            <label className="text-xs text-white/40 uppercase tracking-wider block mb-1">
              Judul Formulir
            </label>
            <input
              type="text"
              value={formTitle}
              disabled
              className="w-full px-4 py-2 rounded-xl bg-white/[0.03] border border-white/[0.06] text-white/60 cursor-not-allowed"
            />
            <p className="text-xs text-white/30 mt-1">Ubah judul di toolbar utama</p>
          </div>
          <div>
            <label className="text-xs text-white/40 uppercase tracking-wider block mb-1">
              Jumlah Pertanyaan
            </label>
            <p className="text-white/80 font-medium">{elements.length} pertanyaan</p>
          </div>
          <div>
            <label className="text-xs text-white/40 uppercase tracking-wider block mb-1">
              Tipe Pertanyaan
            </label>
            <div className="flex flex-wrap gap-2">
              {(() => {
                const types = elements.reduce((acc, el) => {
                  const type = el.answerType || 'unknown'
                  acc[type] = (acc[type] || 0) + 1
                  return acc
                }, {} as Record<string, number>)
                
                return Object.entries(types).map(([type, count]) => (
                  <span key={type} className="px-2 py-1 rounded-lg bg-white/[0.03] border border-white/[0.05] text-xs text-white/50">
                    {type}: {count}
                  </span>
                ))
              })()}
            </div>
          </div>
        </div>
      </div>
      
      <div className="p-4 rounded-xl bg-cyan-500/5 border border-cyan-500/10">
        <h4 className="text-sm font-medium text-cyan-400 mb-2">💡 Tips</h4>
        <ul className="text-xs text-white/50 space-y-1">
          <li>• Atur validasi jawaban di tab "Validasi"</li>
          <li>• Bagi form menjadi tahapan di tab "Tahapan"</li>
          <li>• Atur sistem penilaian di tab "Penilaian"</li>
        </ul>
      </div>
    </div>
  )

  const renderValidationTab = () => (
    <div className="space-y-4">
      <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.05]">
        <h4 className="text-sm font-medium text-white mb-3">Mode Validasi</h4>
        
        <div className="space-y-2">
          <label className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.02] border border-white/[0.05] cursor-pointer hover:bg-white/[0.04] transition-all">
            <input
              type="radio"
              name="validationMode"
              value="all_required"
              checked={validation.mode === 'all_required'}
              onChange={() => handleValidationModeChange('all_required')}
              className="w-4 h-4 text-cyan-500"
            />
            <div>
              <p className="text-sm text-white/80">Semua pertanyaan wajib diisi</p>
              <p className="text-xs text-white/30">User harus menjawab semua pertanyaan</p>
            </div>
          </label>
          
          <label className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.02] border border-white/[0.05] cursor-pointer hover:bg-white/[0.04] transition-all">
            <input
              type="radio"
              name="validationMode"
              value="all_required_except"
              checked={validation.mode === 'all_required_except'}
              onChange={() => handleValidationModeChange('all_required_except')}
              className="w-4 h-4 text-cyan-500"
            />
            <div>
              <p className="text-sm text-white/80">Semua wajib, kecuali...</p>
              <p className="text-xs text-white/30">Pilih pertanyaan yang tidak wajib</p>
            </div>
          </label>
          
          <label className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.02] border border-white/[0.05] cursor-pointer hover:bg-white/[0.04] transition-all">
            <input
              type="radio"
              name="validationMode"
              value="free"
              checked={validation.mode === 'free'}
              onChange={() => handleValidationModeChange('free')}
              className="w-4 h-4 text-cyan-500"
            />
            <div>
              <p className="text-sm text-white/80">Bebas (tidak wajib)</p>
              <p className="text-xs text-white/30">User bisa skip pertanyaan</p>
            </div>
          </label>
        </div>
      </div>

      {/* Exceptions List */}
      {validation.mode === 'all_required_except' && (
        <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.05]">
          <h4 className="text-sm font-medium text-white mb-3">
            Pertanyaan yang Tidak Wajib ({validation.exceptions.length})
          </h4>
          <div className="space-y-1 max-h-48 overflow-y-auto custom-scrollbar">
            {elements.length === 0 ? (
              <p className="text-xs text-white/30">Belum ada pertanyaan</p>
            ) : (
              elements.map((el) => (
                <label key={el.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-white/[0.03] transition-all cursor-pointer">
                  <input
                    type="checkbox"
                    checked={validation.exceptions.includes(el.id)}
                    onChange={() => handleExceptionToggle(el.id)}
                    className="w-4 h-4 rounded text-cyan-500"
                  />
                  <span className="text-sm text-white/60 truncate flex-1">
                    {el.question || `Pertanyaan ${el.order + 1}`}
                  </span>
                  <span className="text-xs text-white/20 flex-shrink-0">
                    {ANSWER_TYPES.find(t => t.value === el.answerType)?.label || el.answerType}
                  </span>
                </label>
              ))
            )}
          </div>
        </div>
      )}

      <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.05]">
        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={validation.allowOverride}
            onChange={handleAllowOverrideToggle}
            className="w-4 h-4 rounded text-cyan-500"
          />
          <div>
            <p className="text-sm text-white/80">Izinkan override per pertanyaan</p>
            <p className="text-xs text-white/30">Setiap pertanyaan bisa diatur wajib/tidak secara individual</p>
          </div>
        </label>
      </div>
    </div>
  )

  const renderStagesTab = () => (
    <div className="space-y-4">
      {/* Mode Toggle */}
      <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.05]">
        <h4 className="text-sm font-medium text-white mb-3">Mode Tahapan</h4>
        <div className="flex gap-3">
          <button
            onClick={() => onStageModeChange('single')}
            className={`flex-1 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
              stageMode === 'single'
                ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/20'
                : 'bg-white/[0.03] text-white/50 hover:text-white/80 border border-white/[0.05]'
            }`}
          >
            <Icon name="layout" className="w-4 h-4 inline mr-2" />
            1 Tahap
          </button>
          <button
            onClick={() => onStageModeChange('multi')}
            className={`flex-1 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
              stageMode === 'multi'
                ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/20'
                : 'bg-white/[0.03] text-white/50 hover:text-white/80 border border-white/[0.05]'
            }`}
          >
            <Icon name="list" className="w-4 h-4 inline mr-2" />
            Multi Tahap
          </button>
        </div>
      </div>

      {/* Stages List */}
      {stageMode === 'multi' && (
        <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.05]">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-medium text-white">Daftar Tahapan</h4>
            <button
              onClick={onAddStage}
              className="px-3 py-1.5 rounded-lg bg-cyan-500/10 text-cyan-400 text-xs font-medium hover:bg-cyan-500/20 transition-all flex items-center gap-1"
            >
              <Icon name="plus" className="w-3.5 h-3.5" />
              Tambah
            </button>
          </div>
          
          <div className="space-y-2 max-h-64 overflow-y-auto custom-scrollbar">
            {stages.map((stage, index) => (
              <div
                key={stage.id}
                draggable
                onDragStart={() => handleStageDragStart(index)}
                onDragOver={(e) => handleStageDragOver(e, index)}
                onDragEnd={handleStageDragEnd}
                className={`flex items-center gap-3 p-3 rounded-xl bg-white/[0.02] border border-white/[0.05] hover:bg-white/[0.04] transition-all ${
                  draggedStageIndex === index ? 'opacity-50 border-cyan-500/30' : ''
                }`}
              >
                <Icon name="move" className="w-4 h-4 text-white/20 cursor-grab" />
                <div className="flex-1">
                  <input
                    type="text"
                    value={stage.name}
                    onChange={(e) => onStageNameChange(stage.id, e.target.value)}
                    className="w-full px-2 py-1 rounded bg-transparent text-sm text-white/80 border border-transparent hover:border-white/[0.05] focus:border-cyan-400/40 focus:outline-none transition-all"
                    placeholder={`Tahap ${index + 1}`}
                  />
                  <p className="text-xs text-white/30">
                    {stage.questionIds.length} pertanyaan
                  </p>
                </div>
                <button
                  onClick={() => onRemoveStage(stage.id)}
                  className={`p-1.5 rounded-lg transition-all ${
                    stages.length <= 1
                      ? 'text-white/20 cursor-not-allowed'
                      : 'text-white/30 hover:text-rose-400 hover:bg-rose-500/10'
                  }`}
                  disabled={stages.length <= 1}
                  title={stages.length <= 1 ? 'Minimal 1 tahapan' : 'Hapus tahapan'}
                >
                  <Icon name="trash" className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
          
          <p className="text-xs text-white/30 mt-3 flex items-center gap-1">
            <Icon name="info" className="w-3.5 h-3.5" />
            Drag & drop untuk mengubah urutan tahapan
          </p>
        </div>
      )}

      <div className="p-4 rounded-xl bg-cyan-500/5 border border-cyan-500/10">
        <div className="flex items-center gap-3 text-sm">
          <span className="text-white/60">Total Pertanyaan:</span>
          <span className="text-white font-medium">{elements.length}</span>
          <span className="text-white/20">•</span>
          <span className="text-white/60">Tahapan:</span>
          <span className="text-white font-medium">{stageMode === 'single' ? 1 : stages.length}</span>
        </div>
      </div>
    </div>
  )

  // ============ SCORING TAB (UPDATED) ============
  const renderScoringTab = () => {
    const scoredStages = getScoredStages(stages)
    const unscoredStages = getUnscoredStages(stages)
    const totalDistributed = Object.values(scoring.distribution).reduce((sum, val) => sum + val, 0)
    const { valid: isBalanced } = validateDistribution(scoring.distribution, scoring.totalPoints)
    const stageWeights = calculateStageWeights(elements, stages)
    
    // Check if any scored stage has zero weight
    const hasZeroWeightStage = scoredStages.some(stage => 
      (stageWeights[stage.id] || 0) === 0 && 
      getQuestionsByStage(elements, stage.id).length > 0
    )

    return (
      <div className="space-y-4">
        {/* Total Points */}
        <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.05]">
          <h4 className="text-sm font-medium text-white mb-3">Total Nilai</h4>
          <div className="flex items-center gap-4 flex-wrap">
            <input
              type="number"
              value={scoring.totalPoints}
              onChange={(e) => handleTotalPointsChange(Number(e.target.value))}
              min={1}
              className="w-32 px-4 py-2.5 rounded-xl bg-white/[0.03] border border-white/[0.06] text-white focus:outline-none focus:border-cyan-400/40 transition-all"
            />
            <span className="text-sm text-white/40">poin</span>
            <button
              onClick={onAutoBalance}
              className="px-4 py-2.5 rounded-xl bg-cyan-500/20 text-cyan-400 text-sm font-medium hover:bg-cyan-500/30 transition-all flex items-center gap-2"
            >
              <Icon name="refreshCw" className="w-4 h-4" />
              Auto-Balance
            </button>
          </div>
          <p className="text-xs text-white/30 mt-2">
            Klik Auto-Balance untuk distribusi nilai secara proporsional berdasarkan bobot
          </p>
        </div>

        {/* Scoring Mode */}
        <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.05]">
          <h4 className="text-sm font-medium text-white mb-3">Mode Penilaian</h4>
          <div className="space-y-2">
            <label className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.02] border border-white/[0.05] cursor-pointer hover:bg-white/[0.04] transition-all">
              <input
                type="radio"
                name="scoringMode"
                value="auto"
                checked={scoring.mode === 'auto'}
                onChange={() => handleScoringModeChange('auto')}
                className="w-4 h-4 text-cyan-500"
              />
              <div>
                <p className="text-sm text-white/80">Auto-Scoring</p>
                <p className="text-xs text-white/30">Nilai terdistribusi otomatis proporsional berdasarkan bobot</p>
              </div>
            </label>
            
            <label className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.02] border border-white/[0.05] cursor-pointer hover:bg-white/[0.04] transition-all">
              <input
                type="radio"
                name="scoringMode"
                value="hybrid"
                checked={scoring.mode === 'hybrid'}
                onChange={() => handleScoringModeChange('hybrid')}
                className="w-4 h-4 text-cyan-500"
              />
              <div>
                <p className="text-sm text-white/80">Hybrid</p>
                <p className="text-xs text-white/30">Auto + Manual override per pertanyaan</p>
              </div>
            </label>
            
            <label className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.02] border border-white/[0.05] cursor-pointer hover:bg-white/[0.04] transition-all">
              <input
                type="radio"
                name="scoringMode"
                value="manual"
                checked={scoring.mode === 'manual'}
                onChange={() => handleScoringModeChange('manual')}
                className="w-4 h-4 text-cyan-500"
              />
              <div>
                <p className="text-sm text-white/80">Manual</p>
                <p className="text-xs text-white/30">Atur nilai per pertanyaan secara manual</p>
              </div>
            </label>
          </div>
        </div>

        {/* ===== NEW: Distribution with Scoring Toggle ===== */}
        <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.05]">
          <h4 className="text-sm font-medium text-white mb-3">Distribusi Nilai per Tahapan</h4>
          
          <div className="space-y-4">
            {stages.map((stage) => {
              const isScored = stage.includeInScoring !== false
              const points = isScored ? (scoring.distribution[stage.id] || 0) : 0
              const percentage = scoring.totalPoints > 0 
                ? Math.round((points / scoring.totalPoints) * 100) 
                : 0
              const stageQuestionCount = getQuestionsByStage(elements, stage.id).length
              const stageWeight = stageWeights[stage.id] || 0
              const hasWeight = stageWeight > 0
              
              return (
                <div key={stage.id} className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.06]">
                  {/* Header: Stage Name + Toggle */}
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-white/80">{stage.name}</span>
                      <span className="text-xs text-white/30">
                        ({stageQuestionCount} pertanyaan)
                      </span>
                      {!isScored && (
                        <span className="px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 text-[10px] font-medium">
                          Tidak Dinilai
                        </span>
                      )}
                      {isScored && !hasWeight && stageQuestionCount > 0 && (
                        <span className="px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-400 text-[10px] font-medium">
                          ⚠️ Bobot 0
                        </span>
                      )}
                    </div>
                    
                    {/* Toggle Include in Scoring */}
                    <label className="flex items-center gap-2 cursor-pointer">
                      <span className="text-[10px] text-white/40">
                        {isScored ? 'Dinilai' : 'Tidak'}
                      </span>
                      <div className="relative">
                        <input
                          type="checkbox"
                          checked={isScored}
                          onChange={(e) => {
                            onStageScoringToggle(stage.id, e.target.checked)
                            // If turning off, set points to 0
                            if (!e.target.checked) {
                              handleDistributionChange(stage.id, 0)
                            }
                          }}
                          className="sr-only"
                        />
                        <div className={`w-10 h-5 rounded-full transition-all ${
                          isScored ? 'bg-cyan-500' : 'bg-white/20'
                        }`}>
                          <div className={`w-4 h-4 rounded-full bg-white transition-all mt-0.5 ${
                            isScored ? 'ml-5' : 'ml-0.5'
                          }`} />
                        </div>
                      </div>
                    </label>
                  </div>
                  
                  {/* Points Input (only if scored) */}
                  {isScored ? (
                    <div className="flex items-center gap-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <input
                            type="number"
                            value={points}
                            onChange={(e) => handleDistributionChange(stage.id, Number(e.target.value))}
                            min={0}
                            className="w-20 px-2 py-1 rounded-lg bg-white/[0.03] border border-white/[0.06] text-sm text-white focus:outline-none focus:border-cyan-400/40 transition-all text-center"
                          />
                          <span className="text-xs text-white/30">poin</span>
                          <span className="text-xs text-white/20">({percentage}%)</span>
                          {hasWeight && (
                            <span className="text-[10px] text-white/20 ml-2">
                              Bobot: {stageWeight}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="w-24 h-1.5 bg-white/[0.05] rounded-full overflow-hidden">
                        <div 
                          className={`h-full rounded-full transition-all ${
                            percentage > 0 ? 'bg-gradient-to-r from-cyan-500 to-violet-500' : 'bg-white/10'
                          }`}
                          style={{ width: `${Math.min(percentage, 100)}%` }}
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="text-xs text-white/20 italic">
                      Tahapan ini tidak dimasukkan dalam perhitungan nilai
                    </div>
                  )}
                </div>
              )
            })}
          </div>
          
          {/* Summary */}
          <div className="flex items-center justify-between mt-4 pt-3 border-t border-white/[0.05]">
            <div className="flex items-center gap-3">
              <span className="text-sm text-white/40">Total</span>
              <span className="text-xs text-white/30">
                {scoredStages.length} tahapan dinilai
                {unscoredStages.length > 0 && `, ${unscoredStages.length} tidak dinilai`}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className={`text-sm font-medium ${isBalanced ? 'text-emerald-400' : 'text-rose-400'}`}>
                {totalDistributed} / {scoring.totalPoints} poin
              </span>
              {!isBalanced && (
                <span className="text-xs text-rose-400/70 bg-rose-500/10 px-2 py-0.5 rounded-full">
                  ⚠️ Tidak seimbang
                </span>
              )}
              {hasZeroWeightStage && (
                <span className="text-xs text-amber-400/70 bg-amber-500/10 px-2 py-0.5 rounded-full">
                  ⚠️ Ada bobot 0
                </span>
              )}
            </div>
          </div>
        </div>

        {/* ===== NEW: Question Weights (Hybrid/Manual Mode) ===== */}
        {(scoring.mode === 'hybrid' || scoring.mode === 'manual') && (
          <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.05]">
            <h4 className="text-sm font-medium text-white mb-3">
              Bobot Pertanyaan
              <span className="text-xs text-white/30 ml-2">
                (Atur bobot per pertanyaan, 1-100)
              </span>
            </h4>
            
            {stages.map((stage) => {
              const stageQuestions = getQuestionsByStage(elements, stage.id)
              if (stageQuestions.length === 0) return null
              
              const isScored = stage.includeInScoring !== false
              const stageTotalWeight = stageWeights[stage.id] || 1
              
              return (
                <div key={stage.id} className="mb-4 last:mb-0">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xs font-medium text-white/60">{stage.name}</span>
                    <span className="text-[10px] text-white/30">
                      Total bobot: {stageTotalWeight}
                    </span>
                    {!isScored && (
                      <span className="text-[10px] text-amber-400/50">
                        (tidak dinilai)
                      </span>
                    )}
                  </div>
                  
                  <div className="space-y-1.5 max-h-48 overflow-y-auto custom-scrollbar">
                    {stageQuestions.map((el) => {
                      const weight = el.scoring?.weight || 1
                      const percentage = stageTotalWeight > 0 
                        ? Math.round((weight / stageTotalWeight) * 100) 
                        : 0
                      
                      return (
                        <div key={el.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-white/[0.03] transition-all">
                          <span className="text-xs text-white/50 flex-1 truncate">
                            {el.question || `Pertanyaan ${el.order + 1}`}
                          </span>
                          <span className="text-[10px] text-white/20 flex-shrink-0">
                            {ANSWER_TYPES.find(t => t.value === el.answerType)?.label || el.answerType}
                          </span>
                          <input
                            type="number"
                            value={weight}
                            onChange={(e) => {
                              const val = Number(e.target.value)
                              if (val >= 1 && val <= 100) {
                                handleQuestionWeightChange(el.id, val)
                              }
                            }}
                            min={1}
                            max={100}
                            disabled={!isScored}
                            className={`w-16 px-2 py-1 rounded-lg text-sm text-center transition-all ${
                              isScored 
                                ? 'bg-white/[0.03] border border-white/[0.06] text-white focus:outline-none focus:border-cyan-400/40'
                                : 'bg-white/[0.01] border border-white/[0.03] text-white/30 cursor-not-allowed'
                            }`}
                          />
                          <span className="text-[10px] text-white/20 w-12 text-right">
                            {percentage}%
                          </span>
                          <div className="w-12 h-1 bg-white/[0.05] rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-cyan-500/40 rounded-full"
                              style={{ width: `${Math.min(percentage, 100)}%` }}
                            />
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* Override toggle */}
        <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.05]">
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={scoring.allowOverride}
              onChange={handleAllowScoringOverrideToggle}
              className="w-4 h-4 rounded text-cyan-500"
            />
            <div>
              <p className="text-sm text-white/80">Izinkan override per pertanyaan</p>
              <p className="text-xs text-white/30">
                {scoring.allowOverride 
                  ? 'Desainer bisa mengatur skor individual di properties pertanyaan' 
                  : 'Semua pertanyaan mengikuti skema penilaian global'}
              </p>
            </div>
          </label>
        </div>
      </div>
    )
  }

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