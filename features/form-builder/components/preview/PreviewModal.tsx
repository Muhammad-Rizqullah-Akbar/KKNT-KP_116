'use client'

import { useState, useEffect } from 'react'
import { Icon } from '@/components/ui/Icons'
import { 
  FlexibleQuestion, 
  FormStage,
} from './../shared/ElementTypes'
import { ScoringEngine, ScoringResult } from '@/lib/domain/scoring/preview-engine'
import { ResultModal } from './ResultModal'
import { QuestionRenderer } from './QuestionRenderer'

interface PreviewModalProps {
  isOpen: boolean
  onClose: () => void
  elements: FlexibleQuestion[]
  formTitle: string
  stages?: FormStage[]
  stageMode?: 'single' | 'multi'
  validationMode?: 'all_required' | 'all_required_except' | 'free'
  validationExceptions?: string[]
  scoringDistribution?: Record<string, number>
  scoringMode?: 'auto' | 'hybrid' | 'manual'
}

// ============================================================================
// MAIN PREVIEW MODAL COMPONENT (UPDATED)
// ============================================================================

export function PreviewModal({
  isOpen,
  onClose,
  elements,
  formTitle,
  stages = [],
  stageMode = 'single',
  validationMode = 'all_required',
  validationExceptions = [],
  scoringDistribution = {},
  scoringMode = 'auto',
}: PreviewModalProps) {
  // ===== ALL HOOKS =====
  const [previewAnswers, setPreviewAnswers] = useState<Record<string, any>>({})
  const [filePreviews, setFilePreviews] = useState<Record<string, string>>({})
  const [, setLightboxImage] = useState<{ src: string; alt: string } | null>(null)
  const [, setPdfViewer] = useState<{ src: string; fileName: string } | null>(null)
  const [, setVideoPlayer] = useState<{ src: string; caption?: string } | null>(null)
  const [currentStageIndex, setCurrentStageIndex] = useState(0)
  const [showResult, setShowResult] = useState(false)
  const [scoringResult, setScoringResult] = useState<ScoringResult | null>(null)

  // ===== MULTI-STAGE HELPERS =====
  const getQuestionsByStage = (stageId: string) => {
    return elements.filter(el => el.stageId === stageId)
  }

  const getActiveStages = () => {
    if (stageMode === 'single' || stages.length <= 1) {
      return [{ id: 'all', name: 'Semua Pertanyaan', questionIds: elements.map(el => el.id) }]
    }
    return stages.filter(stage => getQuestionsByStage(stage.id).length > 0)
  }

  const activeStages = getActiveStages()
  const totalStages = activeStages.length
  const currentStage = activeStages[currentStageIndex] || activeStages[0]
  const currentElements = currentStage 
    ? elements.filter(el => stageMode === 'single' || stages.length <= 1 ? true : el.stageId === currentStage.id)
    : elements


  // Cari stage asli untuk cek includeInScoring
  const currentStageData = stages.find(s => s.id === currentStage?.id)

  const progress = totalStages > 1 ? ((currentStageIndex + 1) / totalStages) * 100 : 100
  const isFirstStage = currentStageIndex === 0
  const isLastStage = currentStageIndex === totalStages - 1

  // ===== NAVIGATION FUNCTIONS =====
  const handleNextStage = () => {
    if (!isLastStage) setCurrentStageIndex(prev => prev + 1)
  }

  const handlePrevStage = () => {
    if (!isFirstStage) setCurrentStageIndex(prev => prev - 1)
  }

  // ===== CEK APAKAH PERTANYAAN WAJIB =====
  const isQuestionRequired = (question: FlexibleQuestion): boolean => {
    if (validationMode === 'free') return false
    if (validationMode === 'all_required_except') {
      return !validationExceptions.includes(question.id)
    }
    return question.required
  }

  // ===== CEK APAKAH SEMUA PERTANYAAN WAJIB TERJAWAB =====
  const validateRequiredQuestions = (): { valid: boolean; missing: string[] } => {
    const missing: string[] = []
    
    elements.forEach(q => {
      const type = (q.answerType || 'short-text') as string
      if (isQuestionRequired(q)) {
        const isAnswered = (() => {
          if (type === 'indicator-table' || type === 'likert') {
            const indicators = q.config?.indicators || []
            const statements = (q.config as any)?.statements || (q as any).options || []
            const rows = indicators.length > 0 ? indicators : statements
            return rows.every((_: any, i: number) => {
              const key = `${q.id}-${i}`
              return previewAnswers[key] && previewAnswers[key] !== ''
            })
          }
          if (type === 'multiple-choice') {
            return previewAnswers[q.id] && Array.isArray(previewAnswers[q.id]) && previewAnswers[q.id].length > 0
          }
          if (type === 'signature') {
            return previewAnswers[q.id] !== null && previewAnswers[q.id] !== ''
          }
          if (type === 'image' || type === 'file-upload') {
            return true
          }
          return previewAnswers[q.id] && previewAnswers[q.id] !== ''
        })()
        
        if (!isAnswered) {
          missing.push(q.question || `Pertanyaan ${elements.indexOf(q) + 1}`)
        }
      }
    })
    
    return { valid: missing.length === 0, missing }
  }

  // ===== HANDLE SUBMIT =====
  const handleSubmit = () => {
    const { valid, missing } = validateRequiredQuestions()
    if (!valid) {
      alert(`Pertanyaan berikut wajib diisi:\n\n• ${missing.join('\n• ')}`)
      return
    }

    const scoring = {
      totalPoints: 100,
      mode: scoringMode,
      distribution: scoringDistribution,
      overrides: {},
      allowOverride: true,
      autoBalance: true,
    }
    const validation = {
      mode: validationMode,
      exceptions: validationExceptions,
      allowOverride: true,
    }
    const defaultStages = stages.length > 0 ? stages : [{ 
      id: 'default', 
      name: 'Semua Pertanyaan', 
      order: 0, 
      questionIds: elements.map(el => el.id),
      includeInScoring: true,
    }]

    try {
      const engine = new ScoringEngine(elements, scoring, validation, defaultStages)
      const result = engine.calculateScore(previewAnswers)
      setScoringResult(result)
      setShowResult(true)
    } catch (error) {
      console.error('Scoring error:', error)
      alert('Terjadi kesalahan saat menghitung skor. Silakan coba lagi.')
    }
  }

  // ===== HANDLERS =====
  const handleAnswerChange = (questionId: string, value: any) => {
    setPreviewAnswers(prev => ({ ...prev, [questionId]: value }))
  }

  const handleSimulatedFileUpload = (questionId: string, file: File | null) => {
    if (!file) return
    const localUrl = URL.createObjectURL(file)
    handleAnswerChange(questionId, file.name)
    if (file.type.startsWith('image/')) {
      setFilePreviews(prev => ({ ...prev, [questionId]: localUrl }))
    } else {
      setFilePreviews(prev => { const updated = { ...prev }; delete updated[questionId]; return updated })
    }
  }

  const handleDownload = (url: string, fileName?: string) => {
    const link = document.createElement('a')
    link.href = url
    link.download = fileName || 'file'
    link.target = '_blank'
    link.rel = 'noopener noreferrer'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  // ===== useEffect HOOKS =====
  useEffect(() => {
    if (isOpen) {
      setPreviewAnswers({})
      setCurrentStageIndex(0)
      setShowResult(false)
      setScoringResult(null)
      Object.values(filePreviews).forEach(url => URL.revokeObjectURL(url))
      setFilePreviews({})
    }
  }, [isOpen])

  useEffect(() => {
    return () => {
      Object.values(filePreviews).forEach(url => URL.revokeObjectURL(url))
    }
  }, [filePreviews])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (showResult) {
          setShowResult(false)
          setScoringResult(null)
        } else {
          onClose()
        }
      }
      if (e.key === 'ArrowRight' && !showResult && isOpen) {
        handleNextStage()
      }
      if (e.key === 'ArrowLeft' && !showResult && isOpen) {
        handlePrevStage()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onClose, showResult, currentStageIndex, isOpen])

  // ===== GUARD CLAUSE =====
  if (!isOpen) return null

  // ============================================================================
  // MAIN RENDER
  // ============================================================================

  if (showResult && scoringResult) {
    return (
      <ResultModal
        key="result-modal"
        result={scoringResult}
        stages={stages}
        onClose={() => {
          setShowResult(false)
          setScoringResult(null)
        }}
        onReset={() => {
          setShowResult(false)
          setScoringResult(null)
          setPreviewAnswers({})
          setCurrentStageIndex(0)
        }}
        onClosePreview={onClose}
      />
    )
  }

  return (
    <div key="preview-modal" className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn" onClick={onClose}>
      <div className="relative w-full max-w-3xl max-h-[90vh] bg-[#0e0e1a] border border-white/8 rounded-2xl shadow-2xl flex flex-col" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/6 shrink-0">
          <div>
            <h3 className="font-display text-lg font-semibold text-white flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
              Mode Simulasi Kuesioner
            </h3>
            <p className="text-xs text-white/30 truncate max-w-[500px]">
              {formTitle || 'Formulir Tanpa Judul'}
              {totalStages > 1 && ` • ${currentStageIndex + 1} dari ${totalStages} tahapan`}
              <span className="ml-2 text-cyan-400/60">
                {validationMode === 'all_required' ? '🔒 Semua Wajib' :
                 validationMode === 'all_required_except' ? '🔓 Kecuali Exception' :
                 '📝 Bebas'}
              </span>
            </p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-lg hover:bg-white/5 flex items-center justify-center transition-colors">
            <Icon name="x" className="w-5 h-5 text-white/50" />
          </button>
        </div>

        {/* Progress Bar */}
        {totalStages > 1 && (
          <div className="px-6 pt-4 pb-2">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs text-white/40">Progress</span>
              <span className="text-xs text-white/40">{Math.round(progress)}%</span>
            </div>
            <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
              <div className="h-full bg-linear-to-r from-cyan-400 to-violet-400 rounded-full transition-all duration-300" style={{ width: `${progress}%` }} />
            </div>
          </div>
        )}

        {/* Stage Header - WITH SCORING BADGE */}
        {totalStages > 1 && currentStage && (
          <div className="px-6 pt-2 pb-1">
            <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/3 border border-white/5">
              <Icon name="list" className="w-4 h-4 text-cyan-400" />
              <span className="text-sm font-medium text-white">{currentStage.name}</span>
              <span className="text-xs text-white/30">({currentElements.length} pertanyaan)</span>
              
              {/* NEW: Scoring Badge */}
              {currentStageData && (
                currentStageData.includeInScoring !== false ? (
                  <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 text-[10px] font-medium">
                    📊 Dinilai
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 text-[10px] font-medium">
                    📝 Tidak Dinilai
                  </span>
                )
              )}
              
              <div className="ml-auto flex items-center gap-1.5">
                <button onClick={handlePrevStage} disabled={isFirstStage} className="p-1.5 rounded-lg hover:bg-white/5 transition-colors disabled:opacity-30 disabled:cursor-not-allowed">
                  <Icon name="chevronLeft" className="w-4 h-4 text-white/50" />
                </button>
                <span className="text-xs text-white/20">{currentStageIndex + 1}/{totalStages}</span>
                <button onClick={handleNextStage} disabled={isLastStage} className="p-1.5 rounded-lg hover:bg-white/5 transition-colors disabled:opacity-30 disabled:cursor-not-allowed">
                  <Icon name="chevronRight" className="w-4 h-4 text-white/50" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Content */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-4 bg-grid-pattern">
          <div className="p-3.5 rounded-xl bg-cyan-500/5 border border-cyan-500/10 flex items-start gap-2.5 mb-2">
            <Icon name="info" className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
            <p className="text-xs text-white/40 leading-relaxed">
              Anda berada di dalam sandbox <span className="text-cyan-400">Pratinjau Interaktif</span>. 
              Anda dapat mencoba mengisi formulir, melihat dokumen PDF, memutar video, zoom gambar, 
              dan mengunduh file secara aman tanpa memengaruhi database.
            </p>
          </div>
          
          {currentElements.length === 0 ? (
            <div key="empty-state" className="text-center py-12 text-white/30">
              <Icon name="fileText" className="w-12 h-12 mx-auto mb-2 text-white/10" />
              <p className="text-sm">Tidak ada pertanyaan di tahapan ini.</p>
            </div>
          ) : (
            currentElements.map((element, index) => (
              <div key={element.id || index} className="w-full">
                <QuestionRenderer
                  question={element}
                  index={index}
                  isRequired={isQuestionRequired(element)}
                  previewAnswers={previewAnswers}
                  filePreviews={filePreviews}
                  onAnswerChange={handleAnswerChange}
                  onSimulatedFileUpload={handleSimulatedFileUpload}
                  onOpenLightbox={setLightboxImage}
                  onOpenPdf={setPdfViewer}
                  onOpenVideo={setVideoPlayer}
                  onDownload={handleDownload}
                />
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-white/6 shrink-0">
          <div className="flex items-center gap-3">
            <span className="text-xs text-white/35 font-mono">{Object.keys(previewAnswers).length} Field Berinteraksi</span>
            {totalStages > 1 && <span className="text-xs text-white/20">Tahap {currentStageIndex + 1} dari {totalStages}</span>}
            {currentStageData && (
              <span className={`text-[10px] ${currentStageData.includeInScoring !== false ? 'text-emerald-400/50' : 'text-amber-400/50'}`}>
                {currentStageData.includeInScoring !== false ? '📊 Dinilai' : '📝 Tidak Dinilai'}
              </span>
            )}
          </div>
          <div className="flex gap-2">
            {totalStages > 1 && (
              <>
                <button onClick={handlePrevStage} disabled={isFirstStage} className="px-3 py-2 rounded-xl text-xs font-medium bg-white/5 border border-white/6 text-white/60 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-all flex items-center gap-1">
                  <Icon name="chevronLeft" className="w-3.5 h-3.5" /> Sebelumnya
                </button>
                <button onClick={handleNextStage} disabled={isLastStage} className="px-3 py-2 rounded-xl text-xs font-medium bg-white/5 border border-white/6 text-white/60 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-all flex items-center gap-1">
                  Selanjutnya <Icon name="chevronRight" className="w-3.5 h-3.5" />
                </button>
              </>
            )}
            <button onClick={() => { setPreviewAnswers({}); setFilePreviews({}); setCurrentStageIndex(0) }} disabled={Object.keys(previewAnswers).length === 0} className="px-4 py-2 rounded-xl text-xs font-medium bg-white/5 border border-white/6 text-white/60 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-all">
              Reset Jawaban
            </button>
            <button onClick={handleSubmit} className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-600 to-teal-600 hover:from-cyan-500 hover:to-teal-500 text-sm font-medium text-white transition-all shadow-lg shadow-cyan-600/25 flex items-center gap-2">
              <Icon name="send" className="w-4 h-4" />
              Kirim & Hitung Skor
            </button>
            <button onClick={onClose} className="px-4 py-2.5 rounded-xl bg-white/5 border border-white/6 text-white/60 hover:text-white transition-all">
              Tutup
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
