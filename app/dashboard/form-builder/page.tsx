// app/dashboard/form-builder/page.tsx

'use client'

import { useState, useCallback, useEffect } from 'react'
import { useAuth } from '@/context/AuthContext'
import { Topbar } from '@/components/dashboard/Topbar'
import { FormToolbar } from '@/components/form-builder/FormToolbar'
import { Canvas } from '@/components/form-builder/Canvas'
import { ResizableToolbar } from '@/components/form-builder/ResizableToolbar'
import { FlexibleElementProperties } from '@/components/form-builder/FlexibleElementProperties'
import { PreviewModal } from '@/components/form-builder/PreviewModal'
import { FormSettingsModal } from '@/components/form-builder/FormSettingsModal'
import { Icon } from '@/components/ui/Icons'
import { 
  FlexibleQuestion, 
  createFlexibleQuestion, 
  ANSWER_TYPES,
  getDefaultConfig,
  type FormStage,
  type FormValidation,
  type FormScoring,
  type ScoringOverride,
  getScoredStages,  // ← NEW IMPORT
} from '@/components/form-builder/ElementTypes'
import { 
  createForm, 
  updateForm, 
  getFormById,
  getFormGroups,
  createFormGroup,
  type FormData,
  type FormGroup,
} from '@/lib/firebase/repositories/forms.repo'

const generateId = () => Math.random().toString(36).substring(2, 9)

const generateFormCode = () => {
  const prefix = 'FRM'
  const random = Math.random().toString(36).substring(2, 6).toUpperCase()
  return `${prefix}-${random}`
}

// ============ DEFAULT CONFIGURATIONS ============
const DEFAULT_VALIDATION: FormValidation = {
  mode: 'all_required',
  exceptions: [],
  allowOverride: true,
}

const DEFAULT_SCORING: FormScoring = {
  totalPoints: 100,
  mode: 'auto',
  distribution: {},
  overrides: {},
  allowOverride: true,
  autoBalance: true,
}

export default function FormBuilderPage() {
  const { user } = useAuth()
  const [isLoading, setIsLoading] = useState(false)
  const [formId, setFormId] = useState<string | null>(null)
  const [formTitle, setFormTitle] = useState('Formulir Baru')
  const [elements, setElements] = useState<FlexibleQuestion[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [isPropertiesOpen, setIsPropertiesOpen] = useState(false)
  const [isPreviewOpen, setIsPreviewOpen] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)
  const [generatedCode, setGeneratedCode] = useState('')
  const [isMobile, setIsMobile] = useState(false)

  // ============ FORM SETTINGS STATES ============
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  
  // Validasi
  const [validation, setValidation] = useState<FormValidation>(DEFAULT_VALIDATION)
  
  // Tahapan
  const [stages, setStages] = useState<FormStage[]>([
    { id: generateId(), name: 'Tahap 1', order: 0, questionIds: [], includeInScoring: true }  // ← tambah includeInScoring
  ])
  const [stageMode, setStageMode] = useState<'single' | 'multi'>('multi')
  
  // Penilaian
  const [scoring, setScoring] = useState<FormScoring>(DEFAULT_SCORING)

  // ============ GROUPS ============
  const [groups, setGroups] = useState<FormGroup[]>([])
  const [selectedGroup, setSelectedGroup] = useState<string>('')
  const [isNewGroup, setIsNewGroup] = useState(false)
  const [newGroupData, setNewGroupData] = useState({
    title: '',
    description: '',
    target: '',
    color: 'cyan',
  })
  const [isGroupModalOpen, setIsGroupModalOpen] = useState(false)

  const colorOptions = [
    { id: 'cyan', label: 'Cyan', class: 'bg-cyan-500' },
    { id: 'violet', label: 'Violet', class: 'bg-violet-500' },
    { id: 'rose', label: 'Rose', class: 'bg-rose-500' },
    { id: 'emerald', label: 'Emerald', class: 'bg-emerald-500' },
    { id: 'amber', label: 'Amber', class: 'bg-amber-500' },
  ]

  // ============ LOAD GROUPS ============
  useEffect(() => {
    const loadGroups = async () => {
      try {
        const groupsData = await getFormGroups()
        setGroups(groupsData)
      } catch (error) {
        console.error('Error loading groups:', error)
      }
    }
    loadGroups()
  }, [])

  // ============ LOAD FORM BY ID ============
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search)
    const id = urlParams.get('id')
    if (id) {
      const loadForm = async () => {
        setIsLoading(true)
        try {
          const form = await getFormById(id)
          if (form) {
            setFormId(form.id || null)
            setFormTitle(form.title || 'Formulir Baru')
            
            // Load validation settings
            if (form.validation) {
              setValidation(form.validation)
            }
            
            // Load stages
            if (form.stages && form.stages.length > 0) {
              // Pastikan semua stage punya includeInScoring
              const stagesWithScoring = form.stages.map((stage: any) => ({
                ...stage,
                includeInScoring: stage.includeInScoring !== false,
              }))
              setStages(stagesWithScoring)
              setStageMode(form.stages.length > 1 ? 'multi' : 'single')
            }
            
            // Load scoring
            if (form.scoring) {
              setScoring(form.scoring)
            }
            
            // Konversi questions ke FlexibleQuestion[]
            const loadedElements = (form.questions || []).map((q: any, index: number) => {
              const answerType = q.answerType || q.type || 'short-text'
              const config = q.config || {}
              
              const fullConfig = {
                ...getDefaultConfig(answerType),
                ...config,
              }
              
              return {
                id: q.id || generateId(),
                question: q.question || q.label || '',
                description: q.description || '',
                required: q.required || false,
                order: q.order || index,
                media: q.media || { type: 'none' as const },
                answerType: answerType,
                config: fullConfig,
                isIdentifier: q.isIdentifier || false,
                identifierType: q.identifierType || 'none',
                scoring: q.scoring || { scheme: 'none' as const, weight: 1 },
                stageId: q.stageId || null,
                overridePoints: q.overridePoints || null,
              } as FlexibleQuestion
            })
            
            setElements(loadedElements)
            
            if (form.groupId) {
              setSelectedGroup(form.groupId)
            }
          }
        } catch (error) {
          console.error('Error loading form:', error)
          alert('Gagal memuat formulir. Silakan coba lagi.')
        } finally {
          setIsLoading(false)
        }
      }
      loadForm()
    }
  }, [])

  // ============ AUTO-ASSIGN STAGES TO QUESTIONS ============
  useEffect(() => {
    if (stageMode === 'single' && stages.length > 0) {
      const firstStageId = stages[0].id
      setElements(prev => 
        prev.map(el => ({
          ...el,
          stageId: firstStageId
        }))
      )
      setStages(prev => 
        prev.map((stage, index) => ({
          ...stage,
          questionIds: index === 0 ? elements.map(el => el.id) : []
        }))
      )
    }
  }, [stageMode])

  // ============ HANDLERS ============
  
  // --- ELEMENT HANDLERS ---
  const handleAddElement = useCallback((element: any, targetIndex?: number) => {
    const answerType = element.type || element.answerType || 'short-text'
    const newElement = createFlexibleQuestion(answerType)
    newElement.question = `Pertanyaan ${elements.length + 1}`
    
    if (stages.length > 0) {
      newElement.stageId = stages[0].id
    }
    
    if (targetIndex !== undefined && targetIndex < elements.length) {
      const newElements = [...elements]
      newElement.order = targetIndex
      newElements.splice(targetIndex, 0, newElement)
      newElements.forEach((el, i) => el.order = i)
      setElements(newElements)
      updateStageQuestionIds(newElements)
    } else {
      newElement.order = elements.length
      const newElements = [...elements, newElement]
      setElements(newElements)
      updateStageQuestionIds(newElements)
    }
    
    if (targetIndex === undefined || targetIndex === elements.length) {
      setTimeout(() => {
        const canvas = document.querySelector('.canvas-container')
        if (canvas) canvas.scrollTop = canvas.scrollHeight
      }, 100)
    }
  }, [elements, stages])

  const handleDropFromToolbar = useCallback((elementType: string, targetIndex?: number) => {
    const answerType = ANSWER_TYPES.find(t => t.value === elementType)
    if (answerType) {
      handleAddElement({ type: answerType.value }, targetIndex)
    } else {
      handleAddElement({ type: 'short-text' }, targetIndex)
    }
  }, [handleAddElement])

  const handleElementClick = useCallback((element: FlexibleQuestion) => {
    setSelectedId(element.id)
    setIsPropertiesOpen(true)
  }, [])

  const handleElementUpdate = useCallback((updatedElement: FlexibleQuestion) => {
    setElements(elements.map(el => 
      el.id === updatedElement.id ? updatedElement : el
    ))
    updateStageQuestionIds(elements.map(el => 
      el.id === updatedElement.id ? updatedElement : el
    ))
    setIsPropertiesOpen(false)
    setSelectedId(null)
  }, [elements])

  const handleElementDelete = useCallback((id: string) => {
    const newElements = elements.filter(el => el.id !== id)
    setElements(newElements)
    updateStageQuestionIds(newElements)
    if (selectedId === id) {
      setSelectedId(null)
      setIsPropertiesOpen(false)
    }
  }, [elements, selectedId])

  const handleElementMove = useCallback((id: string, direction: 'up' | 'down') => {
    const index = elements.findIndex(el => el.id === id)
    if (index === -1) return
    if (direction === 'up' && index === 0) return
    if (direction === 'down' && index === elements.length - 1) return

    const newIndex = direction === 'up' ? index - 1 : index + 1
    const newElements = [...elements]
    const [movedElement] = newElements.splice(index, 1)
    newElements.splice(newIndex, 0, movedElement)
    newElements.forEach((el, i) => el.order = i)
    setElements(newElements)
    updateStageQuestionIds(newElements)
  }, [elements])

  const handleElementDuplicate = useCallback((element: FlexibleQuestion) => {
    const newElement = {
      ...element,
      id: generateId(),
      question: `${element.question} (Copy)`,
      order: elements.length,
    }
    const newElements = [...elements, newElement]
    setElements(newElements)
    updateStageQuestionIds(newElements)
  }, [elements])

  const handleReorder = useCallback((startIndex: number, endIndex: number) => {
    if (startIndex === endIndex) return
    const newElements = [...elements]
    const [movedElement] = newElements.splice(startIndex, 1)
    newElements.splice(endIndex, 0, movedElement)
    newElements.forEach((el, i) => el.order = i)
    setElements(newElements)
    updateStageQuestionIds(newElements)
  }, [elements])

  // --- STAGE HANDLERS ---
  const updateStageQuestionIds = useCallback((updatedElements: FlexibleQuestion[]) => {
    setStages(prev => 
      prev.map(stage => ({
        ...stage,
        questionIds: updatedElements
          .filter(el => el.stageId === stage.id)
          .map(el => el.id)
      }))
    )
  }, [])

  const handleAddStage = useCallback(() => {
    const newStage: FormStage = {
      id: generateId(),
      name: `Tahap ${stages.length + 1}`,
      order: stages.length,
      questionIds: [],
      includeInScoring: true,  // ← NEW: default true
    }
    setStages([...stages, newStage])
    setStageMode('multi')
  }, [stages])

  const handleRemoveStage = useCallback((stageId: string) => {
    if (stages.length <= 1) {
      alert('Minimal harus ada 1 tahapan!')
      return
    }
    
    const removedStage = stages.find(s => s.id === stageId)
    if (removedStage && removedStage.questionIds.length > 0) {
      const firstStageId = stages.find(s => s.id !== stageId)?.id
      if (firstStageId) {
        setElements(prev => 
          prev.map(el => 
            el.stageId === stageId ? { ...el, stageId: firstStageId } : el
          )
        )
      }
    }
    
    // Remove from scoring distribution
    const newDistribution = { ...scoring.distribution }
    delete newDistribution[stageId]
    setScoring(prev => ({
      ...prev,
      distribution: newDistribution,
    }))
    
    setStages(stages.filter(s => s.id !== stageId))
    updateStageQuestionIds(elements)
  }, [stages, elements, scoring.distribution])

  const handleStageReorder = useCallback((startIndex: number, endIndex: number) => {
    if (startIndex === endIndex) return
    const newStages = [...stages]
    const [movedStage] = newStages.splice(startIndex, 1)
    newStages.splice(endIndex, 0, movedStage)
    newStages.forEach((stage, i) => stage.order = i)
    setStages(newStages)
  }, [stages])

  const handleStageNameChange = useCallback((stageId: string, newName: string) => {
    setStages(prev => 
      prev.map(stage => 
        stage.id === stageId ? { ...stage, name: newName } : stage
      )
    )
  }, [])

  const handleMoveQuestionToStage = useCallback((questionId: string, stageId: string) => {
    setElements(prev => 
      prev.map(el => 
        el.id === questionId ? { ...el, stageId } : el
      )
    )
    updateStageQuestionIds(elements.map(el => 
      el.id === questionId ? { ...el, stageId } : el
    ))
  }, [elements])

  // ===== NEW: Stage Scoring Toggle Handler =====
  const handleStageScoringToggle = useCallback((stageId: string, include: boolean) => {
    setStages(prev => 
      prev.map(stage => 
        stage.id === stageId ? { ...stage, includeInScoring: include } : stage
      )
    )
    
    // If turning off, remove from distribution
    if (!include) {
      const newDistribution = { ...scoring.distribution }
      delete newDistribution[stageId]
      setScoring(prev => ({
        ...prev,
        distribution: newDistribution,
      }))
    }
    
    // Auto-balance if mode is auto
    if (scoring.mode === 'auto') {
      handleAutoBalance()
    }
  }, [scoring.distribution, scoring.mode])

  // --- VALIDATION HANDLERS ---
  const handleValidationChange = useCallback((newValidation: FormValidation) => {
    setValidation(newValidation)
  }, [])

  // --- SCORING HANDLERS ---
  const handleScoringChange = useCallback((newScoring: FormScoring) => {
    setScoring(newScoring)
  }, [])

  // ===== UPDATED: Auto-Balance with includeInScoring =====
  const handleAutoBalance = useCallback(() => {
    const scoredStages = getScoredStages(stages)
    
    if (scoredStages.length === 0) {
      // No scored stages, set all to 0
      const distribution: Record<string, number> = {}
      stages.forEach(stage => {
        distribution[stage.id] = 0
      })
      setScoring(prev => ({
        ...prev,
        distribution,
        autoBalance: true,
      }))
      return
    }
    
    // Calculate weights per stage
    const stageWeights: Record<string, number> = {}
    let totalWeight = 0
    
    scoredStages.forEach(stage => {
      stageWeights[stage.id] = 0
    })
    
    elements.forEach(el => {
      const stageId = el.stageId || stages[0]?.id
      if (stageId && stageWeights[stageId] !== undefined) {
        let weight = el.scoring?.weight || 1
        if (el.answerType === 'indicator-table' && el.config?.indicators) {
          weight = el.config.indicators.reduce((sum, ind) => sum + (ind.weight || 1), 0)
        }
        stageWeights[stageId] += weight
        totalWeight += weight
      }
    })
    
    if (totalWeight === 0) {
      // Equal distribution if no weight
      const perStage = scoring.totalPoints / scoredStages.length
      const distribution: Record<string, number> = {}
      stages.forEach(stage => {
        distribution[stage.id] = 0
      })
      scoredStages.forEach(stage => {
        distribution[stage.id] = Math.round(perStage * 100) / 100
      })
      setScoring(prev => ({
        ...prev,
        distribution,
        autoBalance: true,
      }))
      return
    }
    
    // Distribute based on weight
    const distribution: Record<string, number> = {}
    stages.forEach(stage => {
      distribution[stage.id] = 0
    })
    
    let distributedTotal = 0
    
    scoredStages.forEach(stage => {
      const weight = stageWeights[stage.id] || 0
      const points = Math.round((weight / totalWeight) * scoring.totalPoints)
      distribution[stage.id] = points
      distributedTotal += points
    })
    
    // Fix rounding issues
    if (distributedTotal !== scoring.totalPoints) {
      const diff = scoring.totalPoints - distributedTotal
      const maxStage = Object.keys(distribution).reduce((a, b) => 
        (distribution[a] || 0) > (distribution[b] || 0) ? a : b
      )
      if (maxStage) {
        distribution[maxStage] = (distribution[maxStage] || 0) + diff
      }
    }
    
    setScoring(prev => ({
      ...prev,
      distribution,
      autoBalance: true,
    }))
  }, [elements, stages, scoring.totalPoints])

  // ============ SAVE HANDLER ============
  const handleSave = useCallback(async () => {
    if (!formTitle.trim()) {
      alert('Judul formulir harus diisi!')
      return
    }
    if (elements.length === 0) {
      alert('Minimal harus ada 1 pertanyaan!')
      return
    }
    if (isNewGroup) {
      if (!newGroupData.title.trim()) {
        alert('Nama group harus diisi!')
        return
      }
      if (!newGroupData.target.trim()) {
        alert('Target group harus diisi!')
        return
      }
    }

    setIsSaving(true)

    try {
      let groupId = selectedGroup
      let groupCode: string | null = null
      
      if (isNewGroup && selectedGroup === 'new') {
        const newGroup = await createFormGroup({
          code: `${newGroupData.title.substring(0, 4).toUpperCase()}-${Math.random().toString(36).substring(2, 4).toUpperCase()}`,
          title: newGroupData.title,
          description: newGroupData.description || `${newGroupData.title} - Group`,
          target: newGroupData.target,
          color: newGroupData.color,
          formCount: 1,
          createdBy: user?.uid || '',
        })
        groupId = newGroup.id
        groupCode = newGroup.code
        setGroups([...groups, newGroup])
        setSelectedGroup(newGroup.id || '')
        setIsNewGroup(false)
        resetGroupForm()
      } else if (selectedGroup) {
        const group = groups.find(g => g.id === selectedGroup)
        groupCode = group?.code || null
      }

      const formCode = formId ? (generatedCode || generateFormCode()) : generateFormCode()
      
      const cleanElements = elements.map(el => ({
        id: el.id,
        question: el.question,
        description: el.description || '',
        required: el.required,
        order: el.order,
        media: el.media,
        answerType: el.answerType,
        config: el.config,
        isIdentifier: el.isIdentifier,
        identifierType: el.identifierType,
        scoring: el.scoring,
        stageId: el.stageId || null,
        overridePoints: el.overridePoints || null,
      }))
      
      const formData: Omit<FormData, 'id' | 'createdAt' | 'updatedAt'> = {
        title: formTitle,
        code: formCode,
        description: '',
        target: newGroupData.target || '',
        category: '',
        status: 'draft',
        questions: cleanElements as any,
        groupId: groupId || null,
        groupCode: groupCode,
        createdBy: user?.uid || '',
        filledCount: 0,
        validation: validation,
        stages: stages,
        scoring: scoring,
      }

      let result
      if (formId) {
        await updateForm(formId, formData)
        result = { id: formId }
      } else {
        result = await createForm(formData)
        setFormId(result.id)
        
        const url = new URL(window.location.href)
        url.searchParams.set('id', result.id || '')
        window.history.replaceState({}, '', url.toString())
      }

      setGeneratedCode(formCode)
      setShowSuccess(true)
      
      setTimeout(() => {
        setShowSuccess(false)
      }, 5000)
    } catch (error: any) {
      console.error('Save error:', error)
      alert(error.message || 'Gagal menyimpan formulir')
    } finally {
      setIsSaving(false)
    }
  }, [formTitle, elements, selectedGroup, isNewGroup, newGroupData, groups, formId, user, generatedCode, validation, stages, scoring])

  const resetGroupForm = () => {
    setNewGroupData({
      title: '',
      description: '',
      target: '',
      color: 'cyan',
    })
    setIsNewGroup(false)
    setSelectedGroup('')
    setIsGroupModalOpen(false)
  }

  const selectedElement = elements.find(el => el.id === selectedId) || null

  // ============ LOADING STATE ============
  if (isLoading) {
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
        subtitle={formId ? 'Edit formulir' : 'Desain formulir baru'} 
      />

      <div className="flex-1 p-4 pb-4 overflow-hidden">
        {/* Toolbar */}
        <div className="mb-4">
          <FormToolbar
            formTitle={formTitle}
            onTitleChange={setFormTitle}
            onSave={handleSave}
            onPreview={() => setIsPreviewOpen(true)}
            onSettings={() => setIsSettingsOpen(true)}
            isSaving={isSaving}
            elementCount={elements.length}
          />
        </div>

        {/* Success Notification */}
        {showSuccess && (
          <div className="mb-4 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-between animate-slideUp">
            <div className="flex items-center gap-3">
              <Icon name="checkCircle" className="w-5 h-5 text-emerald-400" />
              <div>
                <p className="text-sm text-white font-medium">
                  {formId ? 'Formulir berhasil diperbarui!' : 'Formulir berhasil dibuat!'}
                </p>
                <p className="text-xs text-white/50">
                  Kode form: <span className="font-mono text-cyan-400">{generatedCode}</span>
                  {' '}• Simpan lagi untuk publish
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  navigator.clipboard.writeText(generatedCode)
                  alert('Kode form disalin!')
                }}
                className="px-3 py-1.5 rounded-lg bg-white/[0.05] hover:bg-white/[0.1] text-xs text-white/60 transition-colors"
              >
                Salin Kode
              </button>
              <button onClick={() => setShowSuccess(false)} className="p-1.5 rounded-lg hover:bg-white/[0.05] transition-colors">
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
              value={selectedGroup}
              onChange={(e) => {
                const value = e.target.value
                if (value === 'new') {
                  setIsNewGroup(true)
                  setIsGroupModalOpen(true)
                } else {
                  setIsNewGroup(false)
                  setSelectedGroup(value)
                }
              }}
              className="px-4 py-2 rounded-xl bg-white/[0.03] border border-white/[0.06] text-sm text-white/70 focus:outline-none focus:border-cyan-400/40 transition-all cursor-pointer min-w-[200px]"
            >
              <option value="" className="bg-[#080812]">— Mandiri (Tanpa Group) —</option>
              {groups.map((group) => (
                <option key={group.id} value={group.id} className="bg-[#080812]">
                  {group.title} ({group.formCount || 0} form)
                </option>
              ))}
              <option value="new" className="bg-[#080812] text-cyan-400">+ Buat Group Baru</option>
            </select>
            {selectedGroup && !isNewGroup && (
              <span className="text-xs text-emerald-400/70 bg-emerald-500/10 px-2 py-1 rounded-full">
                ✓ Tergabung dalam group
              </span>
            )}
            {isNewGroup && (
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
            elements={elements}
            stages={stages}
            stageMode={stageMode}
            onElementClick={handleElementClick}
            onElementDelete={handleElementDelete}
            onElementMove={handleElementMove}
            onElementDuplicate={handleElementDuplicate}
            onReorder={handleReorder}
            onMoveQuestionToStage={handleMoveQuestionToStage}
            selectedId={selectedId}
            onDropFromToolbar={handleDropFromToolbar}
            validationMode={validation.mode}
            allowScoringOverride={scoring.allowOverride}
            scoringDistribution={scoring.distribution}
          />
        </div>
      </div>

      {/* Resizable Toolbar (kiri) */}
      <ResizableToolbar
        onAddElement={handleAddElement}
        onAddPageBreak={() => {
          handleAddStage()
        }}
        isMobile={isMobile}
      />

      {/* Properties Panel */}
      <FlexibleElementProperties
        element={selectedElement}
        isOpen={isPropertiesOpen}
        onClose={() => {
          setIsPropertiesOpen(false)
          setSelectedId(null)
        }}
        onSave={handleElementUpdate}
        formId={formId || undefined}
        validationMode={validation.mode}
        validationExceptions={validation.exceptions}
        allowScoringOverride={scoring.allowOverride}
        onScoringOverride={(questionId: string, points: number | null) => {
          setElements(prev => 
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
        isOpen={isPreviewOpen}
        onClose={() => setIsPreviewOpen(false)}
        elements={elements}
        formTitle={formTitle}
        stages={stages}
        stageMode={stageMode}
        validationMode={validation.mode}
        validationExceptions={validation.exceptions}
        scoringDistribution={scoring.distribution}
        scoringMode={scoring.mode}
      />

      {/* Form Settings Modal - UPDATED with onStageScoringToggle */}
      <FormSettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        formTitle={formTitle}
        elements={elements}
        validation={validation}
        onValidationChange={handleValidationChange}
        stages={stages}
        stageMode={stageMode}
        onStageModeChange={setStageMode}
        onAddStage={handleAddStage}
        onRemoveStage={handleRemoveStage}
        onStageReorder={handleStageReorder}
        onStageNameChange={handleStageNameChange}
        scoring={scoring}
        onScoringChange={handleScoringChange}
        onAutoBalance={handleAutoBalance}
        onStageScoringToggle={handleStageScoringToggle}  // ← NEW: FIX ERROR
      />

      {/* Group Creation Modal */}
      {isGroupModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ backgroundColor: 'rgba(0, 0, 0, 0.7)' }}
          onClick={() => {
            resetGroupForm()
            setIsGroupModalOpen(false)
          }}
        >
          <div
            className="relative w-full max-w-lg bg-[#0e0e1a] border border-white/[0.08] rounded-2xl shadow-2xl p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-display text-lg font-semibold text-white flex items-center gap-2">
                <Icon name="folder" className="w-5 h-5 text-cyan-400" /> Buat Group Baru
              </h3>
              <button onClick={() => { resetGroupForm(); setIsGroupModalOpen(false) }} className="w-8 h-8 rounded-lg hover:bg-white/[0.05] transition-colors">
                <Icon name="x" className="w-5 h-5 text-white/50" />
              </button>
            </div>
            <p className="text-sm text-white/40 mb-6">Buat group untuk mengelompokkan beberapa formulir terkait.</p>
            <div className="space-y-4">
              <div>
                <label className="text-xs text-white/50 uppercase tracking-wider block mb-1">Nama Group <span className="text-rose-400">*</span></label>
                <input
                  type="text"
                  value={newGroupData.title}
                  onChange={(e) => setNewGroupData({ ...newGroupData, title: e.target.value })}
                  placeholder="Contoh: Program KKN Tematik 2026"
                  className="w-full px-4 py-2.5 rounded-xl bg-white/[0.03] border border-white/[0.06] text-white placeholder-white/20 focus:outline-none focus:border-cyan-400/40 transition-all"
                />
              </div>
              <div>
                <label className="text-xs text-white/50 uppercase tracking-wider block mb-1">Target Pengguna <span className="text-rose-400">*</span></label>
                <input
                  type="text"
                  value={newGroupData.target}
                  onChange={(e) => setNewGroupData({ ...newGroupData, target: e.target.value })}
                  placeholder="Contoh: Mahasiswa KKN, Dosen, Umum"
                  className="w-full px-4 py-2.5 rounded-xl bg-white/[0.03] border border-white/[0.06] text-white placeholder-white/20 focus:outline-none focus:border-cyan-400/40 transition-all"
                />
              </div>
              <div>
                <label className="text-xs text-white/50 uppercase tracking-wider block mb-1">Deskripsi</label>
                <textarea
                  value={newGroupData.description}
                  onChange={(e) => setNewGroupData({ ...newGroupData, description: e.target.value })}
                  placeholder="Deskripsi singkat tentang group ini..."
                  rows={2}
                  className="w-full px-4 py-2.5 rounded-xl bg-white/[0.03] border border-white/[0.06] text-white placeholder-white/20 focus:outline-none focus:border-cyan-400/40 transition-all resize-none"
                />
              </div>
              <div>
                <label className="text-xs text-white/50 uppercase tracking-wider block mb-2">Warna Group</label>
                <div className="flex gap-2 flex-wrap">
                  {colorOptions.map((color) => (
                    <button
                      key={color.id}
                      onClick={() => setNewGroupData({ ...newGroupData, color: color.id })}
                      className={`w-10 h-10 rounded-xl transition-all ${
                        newGroupData.color === color.id
                          ? 'ring-2 ring-white ring-offset-2 ring-offset-[#0e0e1a] scale-110'
                          : 'hover:scale-105'
                      }`}
                    >
                      <div className={`w-full h-full rounded-xl ${color.class}`} />
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => { resetGroupForm(); setIsGroupModalOpen(false) }}
                className="flex-1 px-4 py-2.5 rounded-xl bg-white/[0.03] border border-white/[0.06] text-white/60 hover:bg-white/[0.06] transition-all"
              >
                Batal
              </button>
              <button
                onClick={() => {
                  if (!newGroupData.title.trim() || !newGroupData.target.trim()) {
                    alert('Nama group dan target harus diisi!')
                    return
                  }
                  setIsNewGroup(true)
                  setSelectedGroup('new')
                  setIsGroupModalOpen(false)
                }}
                className="flex-1 px-4 py-2.5 rounded-xl bg-gradient-to-r from-cyan-400 to-violet-400 text-white font-medium hover:opacity-90 transition-all"
              >
                Buat Group
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}