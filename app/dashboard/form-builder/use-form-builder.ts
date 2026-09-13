'use client'

import { useState, useCallback, useEffect } from 'react'
import { useAuth } from '@/context/AuthContext'
import { useToast } from '@/lib/hooks/use-toast'
import { VIEW_COOLDOWN_MS } from '@/lib/constants'
import {
  FlexibleQuestion,
  createFlexibleQuestion,
  ANSWER_TYPES,
  type FormStage,
  type FormValidation,
  type FormScoring,
} from '@/features/form-builder/components/shared/ElementTypes'
import {
  createForm,
  updateForm,
  getFormById,
  type FormData,
} from '@/lib/repositories/forms.repo'
import {
  generateId,
  DEFAULT_VALIDATION,
  DEFAULT_SCORING,
  computeAutoBalanceDistribution,
  convertQuestionsToElements,
  ensureStageScoring,
} from './form-builder-utils'
import { saveForm } from './form-builder-save'

export function useFormBuilder() {
  const { user } = useAuth()

  const [isLoading, setIsLoading] = useState(false)
  const [formId, setFormId] = useState<string | null>(null)
  const [formTitle, setFormTitle] = useState('Formulir Baru')
  const [elements, setElements] = useState<FlexibleQuestion[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [isPropertiesOpen, setIsPropertiesOpen] = useState(false)
  const [isPreviewOpen, setIsPreviewOpen] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const { visible: showSuccess, show: showToast, hide: hideToast } = useToast(VIEW_COOLDOWN_MS)
  const [generatedCode, setGeneratedCode] = useState('')
  const [isMobile, setIsMobile] = useState(false)

  // ============ FORM SETTINGS STATES ============
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)

  // Validasi
  const [validation, setValidation] = useState<FormValidation>(DEFAULT_VALIDATION)

  // Tahapan
  const [stages, setStages] = useState<FormStage[]>([
    { id: generateId(), name: 'Tahap 1', order: 0, questionIds: [], includeInScoring: true }
  ])
  const [stageMode, setStageMode] = useState<'single' | 'multi'>('multi')

  // Penilaian
  const [scoring, setScoring] = useState<FormScoring>(DEFAULT_SCORING)

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
              setStages(ensureStageScoring(form.stages))
              setStageMode(form.stages.length > 1 ? 'multi' : 'single')
            }

            // Load scoring
            if (form.scoring) {
              setScoring(form.scoring)
            }

            setElements(convertQuestionsToElements(form))
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stageMode])

  // ============ STAGE HELPERS ============
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

  // ============ ELEMENT HANDLERS ============
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
  }, [elements, stages, updateStageQuestionIds])

  const handleDropFromToolbar = useCallback((elementType: string, targetIndex?: number) => {
    const answerType = ANSWER_TYPES.find(candidate => candidate.value === elementType)
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
  }, [elements, updateStageQuestionIds])

  const handleElementDelete = useCallback((id: string) => {
    const newElements = elements.filter(el => el.id !== id)
    setElements(newElements)
    updateStageQuestionIds(newElements)
    if (selectedId === id) {
      setSelectedId(null)
      setIsPropertiesOpen(false)
    }
  }, [elements, selectedId, updateStageQuestionIds])

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
  }, [elements, updateStageQuestionIds])

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
  }, [elements, updateStageQuestionIds])

  const handleReorder = useCallback((startIndex: number, endIndex: number) => {
    if (startIndex === endIndex) return
    const newElements = [...elements]
    const [movedElement] = newElements.splice(startIndex, 1)
    newElements.splice(endIndex, 0, movedElement)
    newElements.forEach((el, i) => el.order = i)
    setElements(newElements)
    updateStageQuestionIds(newElements)
  }, [elements, updateStageQuestionIds])

  // ============ STAGE HANDLERS ============
  const handleAddStage = useCallback(() => {
    const newStage: FormStage = {
      id: generateId(),
      name: `Tahap ${stages.length + 1}`,
      order: stages.length,
      questionIds: [],
      includeInScoring: true,
    }
    setStages([...stages, newStage])
    setStageMode('multi')
  }, [stages])

  const handleRemoveStage = useCallback((stageId: string) => {
    if (stages.length <= 1) {
      alert('Minimal harus ada 1 tahapan!')
      return
    }

    const removedStage = stages.find(stage => stage.id === stageId)
    if (removedStage && removedStage.questionIds.length > 0) {
      const firstStageId = stages.find(stage => stage.id !== stageId)?.id
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

    setStages(stages.filter(stage => stage.id !== stageId))
    updateStageQuestionIds(elements)
  }, [stages, elements, scoring.distribution, updateStageQuestionIds])

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
  }, [elements, updateStageQuestionIds])

  // ===== Stage Scoring Toggle Handler =====
  const handleAutoBalance = useCallback(() => {
    setScoring(prev => ({
      ...prev,
      distribution: computeAutoBalanceDistribution(stages, elements, scoring.totalPoints),
      autoBalance: true,
    }))
  }, [elements, stages, scoring.totalPoints])

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
  }, [scoring.distribution, scoring.mode, handleAutoBalance])

  // --- VALIDATION HANDLERS ---
  const handleValidationChange = useCallback((newValidation: FormValidation) => {
    setValidation(newValidation)
  }, [])

  // --- SCORING HANDLERS ---
  const handleScoringChange = useCallback((newScoring: FormScoring) => {
    setScoring(newScoring)
  }, [])

  // ============ SAVE HANDLER ============
  const handleSave = useCallback(async () => {
    await saveForm({
      formTitle,
      elements,
      formId,
      userUid: user?.uid || '',
      generatedCode,
      validation,
      stages,
      scoring,
      setIsSaving,
      setFormId,
      setGeneratedCode,
      showToast,
    })
  }, [formTitle, elements, formId, user, generatedCode, validation, stages, scoring, showToast])

  const selectedElement = elements.find(el => el.id === selectedId) || null

  return {
    isLoading,
    formId,
    formTitle,
    setFormTitle,
    elements,
    setElements,
    selectedId,
    setSelectedId,
    isPropertiesOpen,
    setIsPropertiesOpen,
    isPreviewOpen,
    setIsPreviewOpen,
    isSaving,
    showSuccess,
    hideToast,
    generatedCode,
    isMobile,
    setIsMobile,
    isSettingsOpen,
    setIsSettingsOpen,
    validation,
    stages,
    stageMode,
    setStageMode,
    scoring,
    selectedElement,
    handleAddElement,
    handleDropFromToolbar,
    handleElementClick,
    handleElementUpdate,
    handleElementDelete,
    handleElementMove,
    handleElementDuplicate,
    handleReorder,
    handleAddStage,
    handleRemoveStage,
    handleStageReorder,
    handleStageNameChange,
    handleMoveQuestionToStage,
    handleStageScoringToggle,
    handleValidationChange,
    handleScoringChange,
    handleAutoBalance,
    handleSave,
  }
}
