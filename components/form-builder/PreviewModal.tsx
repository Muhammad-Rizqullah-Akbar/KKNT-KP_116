'use client'

import { useState, useEffect } from 'react'
import { Icon } from '@/components/ui/Icons'
import { 
  FlexibleQuestion, 
  IndicatorItem, 
  IndicatorScale, 
  FormStage,
  getScoredStages,
  getUnscoredStages,
} from './ElementTypes'
import { ScoringEngine, ScoringResult } from '@/lib/domain/scoring/preview-engine'
import { getDefaultScoring, getDefaultValidation } from './ElementTypes'
import { getFileNameFromFirebaseUrl, cleanFileName, getFileExtension, getFileTypeFromUrl, formatFileSize, getFileIcon, getFileColor } from './file-helpers'
import { SignaturePad } from './SignaturePad'
import { ImageLightbox } from './ImageLightbox'
import { PDFViewerModal } from './PDFViewerModal'
import { VideoPlayerModal } from './VideoPlayerModal'

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
// RESULT MODAL COMPONENT (UPDATED)
// ============================================================================

function ResultModal({ 
  result, 
  onClose, 
  onReset,
  onClosePreview,
  stages = [],
}: { 
  result: ScoringResult
  onClose: () => void
  onReset: () => void
  onClosePreview: () => void
  stages?: FormStage[]
}) {
  const { totalScore, maxScore, percentage, grade, perStage, details, recommendations } = result

  // Filter hanya stage yang dinilai (includeInScoring = true)
  const scoredStageIds = stages.filter(s => s.includeInScoring !== false).map(s => s.id)
  const scoredStagesData = Object.entries(perStage)
    .filter(([stageId]) => scoredStageIds.includes(stageId))
    .sort((a, b) => {
      const stageA = stages.find(s => s.id === a[0])
      const stageB = stages.find(s => s.id === b[0])
      return (stageA?.order || 0) - (stageB?.order || 0)
    })

  // Hitung total unscored questions
  const unscoredCount = details.totalQuestions - (details.scoredQuestions || 0)

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md" onClick={onClose}>
      <div className="relative w-full max-w-2xl max-h-[85vh] bg-[#0e0e1a] border border-white/[0.08] rounded-2xl shadow-2xl flex flex-col" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.06] shrink-0">
          <div>
            <h3 className="font-display text-lg font-semibold text-white">📊 Hasil Penilaian (Preview)</h3>
            <p className="text-xs text-white/30">Simulasi penilaian berdasarkan jawaban yang Anda pilih</p>
          </div>
          <button onClick={() => { onClose(); onClosePreview(); }} className="w-8 h-8 rounded-lg hover:bg-white/[0.05] transition-colors">
            <Icon name="x" className="w-5 h-5 text-white/50" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-6">
          {/* Score Circle */}
          <div className="flex justify-center">
            <div className="relative w-36 h-36">
              <svg className="w-36 h-36 -rotate-90">
                <circle cx="72" cy="72" r="64" fill="none" stroke="white/5" strokeWidth="6" />
                <circle cx="72" cy="72" r="64" fill="none" 
                  stroke={percentage >= 70 ? '#10b981' : percentage >= 50 ? '#f59e0b' : '#ef4444'} 
                  strokeWidth="6" strokeLinecap="round"
                  strokeDasharray={`${(percentage / 100) * 402.123} 402.123`} />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-3xl font-bold font-display">{percentage}%</span>
                <span className="text-[10px] text-white/40">{totalScore} / {maxScore} poin</span>
              </div>
            </div>
          </div>

          {/* Grade */}
          <div className="text-center">
            <div className={`inline-block px-5 py-1.5 rounded-full text-sm font-semibold ${
              percentage >= 90 ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' :
              percentage >= 80 ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' :
              percentage >= 70 ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30' :
              percentage >= 60 ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' :
              'bg-rose-500/20 text-rose-400 border border-rose-500/30'
            }`}>
              {grade}
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-4 gap-3">
            <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.05] text-center">
              <p className="text-xl font-bold text-emerald-400">{details.correctCount}</p>
              <p className="text-[10px] text-white/30 uppercase">Benar</p>
            </div>
            <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.05] text-center">
              <p className="text-xl font-bold text-rose-400">{details.wrongCount}</p>
              <p className="text-[10px] text-white/30 uppercase">Salah</p>
            </div>
            <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.05] text-center">
              <p className="text-xl font-bold text-amber-400">{details.skippedCount}</p>
              <p className="text-[10px] text-white/30 uppercase">Dilewati</p>
            </div>
            <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.05] text-center">
              <p className="text-xl font-bold text-cyan-400">{details.scoredQuestions || details.totalQuestions}</p>
              <p className="text-[10px] text-white/30 uppercase">Dinilai</p>
            </div>
          </div>

          {/* Per Stage - HANYA YANG SCORED */}
          {scoredStagesData.length > 0 && (
            <div>
              <h4 className="text-xs text-white/40 uppercase tracking-wider mb-2">📂 Per Tahapan (Dinilai)</h4>
              <div className="space-y-1.5">
                {scoredStagesData.map(([stageId, data]) => {
                  const stage = stages.find(s => s.id === stageId)
                  const isScored = stage?.includeInScoring !== false
                  
                  return (
                    <div key={stageId} className="flex items-center gap-3 p-2 rounded-lg bg-white/[0.02] border border-white/[0.05]">
                      <span className="text-xs text-white/60 flex-1">
                        {data.name}
                        {!isScored && (
                          <span className="ml-2 text-[10px] text-amber-400/50">(tidak dinilai)</span>
                        )}
                      </span>
                      <span className="text-[10px] text-white/30">{data.earned} / {data.possible}</span>
                      <div className="w-20 h-1.5 bg-white/[0.05] rounded-full overflow-hidden">
                        <div className={`h-full rounded-full ${
                          data.percentage >= 70 ? 'bg-emerald-400' :
                          data.percentage >= 50 ? 'bg-amber-400' : 'bg-rose-400'
                        }`} style={{ width: `${data.percentage}%` }} />
                      </div>
                      <span className={`text-[10px] font-medium min-w-[32px] text-right ${
                        data.percentage >= 70 ? 'text-emerald-400' :
                        data.percentage >= 50 ? 'text-amber-400' : 'text-rose-400'
                      }`}>{data.percentage}%</span>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Total Questions - Include unscored info */}
          <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.05]">
            <div className="flex items-center justify-between">
              <span className="text-xs text-white/40">Total Pertanyaan</span>
              <span className="text-sm text-white/80">{details.totalQuestions}</span>
            </div>
            {unscoredCount > 0 && (
              <div className="flex items-center justify-between mt-1">
                <span className="text-[10px] text-amber-400/50">Tidak dinilai</span>
                <span className="text-xs text-amber-400/50">{unscoredCount} pertanyaan</span>
              </div>
            )}
            {details.scoredQuestions !== undefined && (
              <div className="flex items-center justify-between mt-1">
                <span className="text-[10px] text-emerald-400/50">Dinilai</span>
                <span className="text-xs text-emerald-400/50">{details.scoredQuestions} pertanyaan</span>
              </div>
            )}
          </div>

          {/* Recommendations */}
          {recommendations.length > 0 && (
            <div className="p-4 rounded-xl bg-cyan-500/5 border border-cyan-500/10">
              <h4 className="text-xs font-medium text-cyan-400 mb-2">💡 Rekomendasi</h4>
              <ul className="space-y-1">
                {recommendations.map((rec, i) => (
                  <li key={i} className="text-xs text-white/50 flex items-start gap-2">
                    <span className="text-cyan-400">•</span>
                    {rec}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-white/[0.06] shrink-0">
          <button onClick={onReset} className="px-4 py-2 rounded-xl text-sm text-white/50 hover:text-white hover:bg-white/[0.03] transition-all">
            Isi Ulang
          </button>
          <button onClick={() => { onClose(); onClosePreview(); }} className="px-5 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-sm font-medium text-white transition-all shadow-lg shadow-cyan-600/25">
            Tutup
          </button>
        </div>
      </div>
    </div>
  )
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
  const [lightboxImage, setLightboxImage] = useState<{ src: string; alt: string } | null>(null)
  const [pdfViewer, setPdfViewer] = useState<{ src: string; fileName: string } | null>(null)
  const [videoPlayer, setVideoPlayer] = useState<{ src: string; caption?: string } | null>(null)
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
  const isStageScored = currentStageData?.includeInScoring !== false

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

  // ===== RENDER MEDIA =====
  const renderMedia = (question: FlexibleQuestion) => {
    if (question.media.type === 'none' || !question.media.url) return null
    
    const mediaUrl = question.media.url
    const mediaCaption = question.media.caption
    const rawFileName = getFileNameFromFirebaseUrl(mediaUrl)
    const displayFileName = cleanFileName(rawFileName)
    const fileExtension = getFileExtension(mediaUrl)
    const fileType = getFileTypeFromUrl(mediaUrl)
    const fileSize = (question.media as any).fileSize ? formatFileSize((question.media as any).fileSize) : null
    const fileIcon = getFileIcon(fileType)
    const fileColorClass = getFileColor(fileType)

    if (question.media.type === 'image') {
      return (
        <div key={`media-${question.id}`} className="mb-3 rounded-xl overflow-hidden border border-white/5 max-w-md mx-auto relative group cursor-pointer" onClick={() => setLightboxImage({ src: mediaUrl, alt: mediaCaption || displayFileName })}>
          <img src={mediaUrl} alt={mediaCaption || displayFileName} className="w-full h-48 object-cover transition-transform duration-300 group-hover:scale-105" loading="lazy" />
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all flex items-center justify-center">
            <div className="opacity-0 group-hover:opacity-100 transition-opacity text-center">
              <div className="w-14 h-14 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center mx-auto"><Icon name="search" className="w-7 h-7 text-white" /></div>
              <p className="text-xs text-white/90 mt-2 font-medium">Klik untuk zoom penuh</p>
            </div>
          </div>
        </div>
      )
    }

    if (question.media.type === 'video') {
      return (
        <div key={`media-${question.id}`} className="mb-3 rounded-xl overflow-hidden border border-white/5 max-w-md mx-auto relative cursor-pointer group" onClick={() => setVideoPlayer({ src: mediaUrl, caption: mediaCaption || displayFileName })}>
          <div className="relative w-full h-48 bg-linear-to-br from-gray-900 to-black">
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-16 h-16 rounded-full bg-cyan-500/80 flex items-center justify-center group-hover:bg-cyan-400 transition-all group-hover:scale-110 shadow-2xl">
                <svg className="w-8 h-8 text-white ml-1.5" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
              </div>
            </div>
            <div className="absolute bottom-0 left-0 right-0 p-3 bg-linear-to-t from-black/80 to-transparent">
              <p className="text-xs text-white/70 font-medium">Klik untuk memutar video</p>
              {displayFileName && <p className="text-[10px] text-white/40 truncate mt-0.5">{displayFileName}</p>}
            </div>
          </div>
        </div>
      )
    }

    if (question.media.type === 'file') {
      return (
        <div key={`media-${question.id}`} className="mb-3 rounded-xl overflow-hidden border border-white/5 max-w-md mx-auto p-4 bg-white/2">
          <div className="flex items-start gap-3 mb-4">
            <div className={`w-12 h-12 rounded-xl ${fileColorClass.split(' ')[1]} flex items-center justify-center shrink-0`}>
              <Icon name={fileIcon as any} className={`w-6 h-6 ${fileColorClass.split(' ')[0]}`} />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm text-white/80 font-medium truncate" title={rawFileName}>{displayFileName}</p>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-[10px] font-mono text-white/30 uppercase bg-white/5 px-1.5 py-0.5 rounded">{fileExtension}</span>
                {fileSize && <><span className="w-1 h-1 rounded-full bg-white/10" /><span className="text-[10px] text-white/30">{fileSize}</span></>}
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={(e) => { e.stopPropagation(); if (fileType === 'pdf') setPdfViewer({ src: mediaUrl, fileName: `${displayFileName}.${fileExtension}` }); else if (fileType === 'image') setLightboxImage({ src: mediaUrl, alt: displayFileName }) }} className={`flex-1 px-3 py-2.5 rounded-xl text-xs font-medium transition-all flex items-center justify-center gap-1.5 ${(fileType === 'pdf' || fileType === 'image') ? 'bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400' : 'bg-white/5 text-white/20 cursor-not-allowed'}`} disabled={fileType !== 'pdf' && fileType !== 'image'}>
              <Icon name="eye" className="w-3.5 h-3.5" />{fileType === 'pdf' ? 'Lihat PDF' : fileType === 'image' ? 'Lihat Gambar' : 'Preview N/A'}
            </button>
            <button onClick={(e) => { e.stopPropagation(); handleDownload(mediaUrl, `${displayFileName}.${fileExtension}`) }} className="flex-1 px-3 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-xs text-white/60 font-medium transition-all flex items-center justify-center gap-1.5">
              <Icon name="download" className="w-3.5 h-3.5" />Unduh
            </button>
          </div>
          {mediaCaption && <p className="text-xs text-white/30 p-2.5 text-center bg-black/20 border-t border-white/5 mt-3">{mediaCaption}</p>}
        </div>
      )
    }

    return null
  }

  // ===== RENDER QUESTION - FULL IMPLEMENTATION =====
  const renderQuestion = (question: FlexibleQuestion, index: number) => {
    const answerType = question.answerType
    const config = question.config
    const requiredMark = isQuestionRequired(question) ? <span className="text-rose-400 ml-1">*</span> : null
    const currentAnswer = previewAnswers[question.id]

    switch (answerType) {
      case 'single-choice':
      case 'dropdown':
        return (
          <div key={question.id} className="p-5 rounded-2xl bg-white/2 border border-white/5 space-y-3">
            <p className="text-sm font-medium text-white/90">{index + 1}. {question.question} {requiredMark}</p>
            {renderMedia(question)}
            {answerType === 'single-choice' ? (
              <div className="space-y-2">
                {(config.options || []).map((opt: string, i: number) => (
                  <label key={`${question.id}-option-${i}`} className="flex items-center gap-3 text-sm text-white/60 cursor-pointer hover:text-white transition-colors">
                    <input type="radio" name={`preview-${question.id}`} checked={currentAnswer === opt} onChange={() => handleAnswerChange(question.id, opt)} className="accent-cyan-400 w-4 h-4 cursor-pointer" />{opt}
                  </label>
                ))}
              </div>
            ) : (
              <select value={currentAnswer || ''} onChange={(e) => handleAnswerChange(question.id, e.target.value)} className="w-full max-w-75 px-4 py-2.5 rounded-xl bg-white/4 border border-white/8 text-sm text-white focus:outline-none focus:border-cyan-400/40 transition-all cursor-pointer">
                <option value="" className="bg-[#0e0e1a] text-white/40">Pilih opsi...</option>
                {(config.options || []).map((opt: string, i: number) => (<option key={`${question.id}-dropdown-${i}`} value={opt} className="bg-[#0e0e1a]">{opt}</option>))}
              </select>
            )}
          </div>
        )

      case 'multiple-choice': {
        const selectedOptions = Array.isArray(currentAnswer) ? currentAnswer : []
        return (
          <div key={question.id} className="p-5 rounded-2xl bg-white/2 border border-white/5 space-y-3">
            <p className="text-sm font-medium text-white/90">{index + 1}. {question.question} {requiredMark}</p>
            {renderMedia(question)}
            <div className="space-y-2">
              {(config.options || []).map((opt: string, i: number) => (
                <label key={`${question.id}-checkbox-${i}`} className="flex items-center gap-3 text-sm text-white/60 cursor-pointer hover:text-white transition-colors">
                  <input type="checkbox" checked={selectedOptions.includes(opt)} onChange={(e) => {
                    if (e.target.checked) handleAnswerChange(question.id, [...selectedOptions, opt])
                    else handleAnswerChange(question.id, selectedOptions.filter((v: string) => v !== opt))
                  }} className="accent-cyan-400 w-4 h-4 cursor-pointer" />{opt}
                </label>
              ))}
            </div>
          </div>
        )
      }

      case 'short-text':
        return (
          <div key={question.id} className="p-4 rounded-xl bg-white/2 border border-white/5 space-y-3">
            <p className="text-sm font-medium text-white/90">{index + 1}. {question.question} {requiredMark}</p>
            {renderMedia(question)}
            <input type="text" value={currentAnswer || ''} onChange={(e) => handleAnswerChange(question.id, e.target.value)} placeholder={config.placeholder || 'Tulis jawaban Anda di sini...'} className="w-full px-4 py-2.5 rounded-xl bg-white/3 border border-white/6 text-sm text-white placeholder-white/20 focus:outline-none focus:border-cyan-400/40 transition-all" />
          </div>
        )

      case 'long-text':
        return (
          <div key={question.id} className="p-4 rounded-xl bg-white/2 border border-white/5 space-y-3">
            <p className="text-sm font-medium text-white/90">{index + 1}. {question.question} {requiredMark}</p>
            {renderMedia(question)}
            <textarea value={currentAnswer || ''} onChange={(e) => handleAnswerChange(question.id, e.target.value)} placeholder={config.placeholder || 'Tulis jawaban panjang Anda di sini...'} rows={4} className="w-full px-4 py-2.5 rounded-xl bg-white/3 border border-white/6 text-sm text-white placeholder-white/20 focus:outline-none focus:border-cyan-400/40 transition-all resize-none" />
          </div>
        )

      case 'indicator-table': {
        const indicators: IndicatorItem[] = config.indicators || []
        const scales: IndicatorScale[] = config.indicatorScales || []
        const indicatorTitle = config.indicatorTitle || 'Pertanyaan'
        const showTotal = config.showTotalScore || false
        const showWeighted = config.showWeightedScore || false

        if (indicators.length === 0 || scales.length === 0) {
          return (
            <div key={question.id} className="p-4 rounded-xl bg-white/2 border border-white/5 space-y-3">
              <p className="text-sm font-medium text-white/90">{index + 1}. {question.question || 'Tabel Pertanyaan'} {requiredMark}</p>
              {renderMedia(question)}
              <div className="p-4 rounded-xl border-2 border-dashed border-white/8 text-center">
                <Icon name="table" className="w-8 h-8 text-white/20 mx-auto mb-2" />
                <p className="text-xs text-white/30">{indicators.length === 0 ? 'Belum ada pertanyaan' : 'Belum ada skala jawaban'}</p>
              </div>
            </div>
          )
        }

        const calculateTotal = () => {
          let total = 0
          indicators.forEach((indicator: IndicatorItem, i: number) => {
            const rowKey = `${question.id}-${i}`
            const selLabel = previewAnswers[rowKey]
            const selScale = scales.find((s: IndicatorScale) => s.label === selLabel)
            const selValue = selScale?.value || 0
            const w = indicator.weight || 1
            total += showWeighted ? selValue * w : selValue
          })
          return total
        }

        return (
          <div key={question.id} className="p-4 rounded-xl bg-white/2 border border-white/5 space-y-3">
            <p className="text-sm font-medium text-white/90">{index + 1}. {question.question || 'Tabel Pertanyaan'} {requiredMark}</p>
            {renderMedia(question)}
            {question.description && <p className="text-xs text-white/40">{question.description}</p>}
            <div className="overflow-x-auto custom-scrollbar rounded-lg border border-white/5">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-white/3">
                    <th className="text-left text-xs text-white/40 font-medium py-2.5 px-3 border-r border-white/5 w-10">#</th>
                    <th className="text-left text-xs text-white/40 font-medium py-2.5 px-3 border-r border-white/5 min-w-37.5">{indicatorTitle}</th>
                    {scales.map((scale: IndicatorScale, i: number) => (
                      <th key={`${question.id}-scale-header-${i}`} className="text-center text-xs text-white/40 font-medium py-2.5 px-3 border-r border-white/5">{scale.label}</th>
                    ))}
                    {showTotal && <th className="text-center text-xs text-white/40 font-medium py-2.5 px-3">Skor</th>}
                  </tr>
                </thead>
                <tbody>
                  {indicators.map((indicator: IndicatorItem, i: number) => {
                    const rowKey = `${question.id}-${i}`
                    const selectedScale = previewAnswers[rowKey]
                    const selScale = scales.find((s: IndicatorScale) => s.label === selectedScale)
                    const selValue = selScale?.value || 0
                    const weight = indicator.weight || 1
                    const rowScore = showWeighted ? selValue * weight : selValue
                    return (
                      <tr key={`${question.id}-row-${indicator.id || i}`} className="border-t border-white/3 hover:bg-white/1 transition-colors">
                        <td className="py-2.5 px-3 text-white/30 text-xs border-r border-white/5 text-center">{i + 1}</td>
                        <td className="py-2.5 px-3 text-white/70 text-xs border-r border-white/5">
                          {indicator.label}
                          {showWeighted && weight !== 1 && <span className="text-[10px] text-cyan-400/60 ml-1">(×{weight})</span>}
                        </td>
                        {scales.map((scale: IndicatorScale, j: number) => (
                          <td key={`${question.id}-cell-${i}-${j}`} className="text-center py-2.5 px-3 border-r border-white/5">
                            <input type="radio" name={`preview-indicator-${rowKey}`} checked={previewAnswers[rowKey] === scale.label} onChange={() => handleAnswerChange(rowKey, scale.label)} className="accent-cyan-400 w-4 h-4 cursor-pointer" />
                          </td>
                        ))}
                        {showTotal && (
                          <td className="text-center py-2.5 px-3">
                            <span className={`text-xs font-mono ${selValue > 0 ? 'text-cyan-400' : 'text-white/20'}`}>{selValue > 0 ? rowScore : '-'}</span>
                          </td>
                        )}
                      </tr>
                    )
                  })}
                  {showTotal && (
                    <tr className="border-t border-white/8 bg-white/2 font-medium">
                      <td colSpan={2} className="py-3 px-3 text-white/60 text-xs text-right border-r border-white/5">Total Skor</td>
                      {scales.map((_: IndicatorScale, i: number) => (<td key={`${question.id}-total-${i}`} className="border-r border-white/5"></td>))}
                      <td className="text-center py-3 px-3"><span className="text-sm text-cyan-400 font-bold">{calculateTotal() > 0 ? calculateTotal() : '-'}</span></td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )
      }

      case 'rating': {
        const ratingVal = Number(currentAnswer) || 0
        const maxStars = config.ratingMax || 5
        return (
          <div key={question.id} className="p-4 rounded-xl bg-white/2 border border-white/5 space-y-3">
            <p className="text-sm font-medium text-white/90">{index + 1}. {question.question} {requiredMark}</p>
            {renderMedia(question)}
            <div className="flex gap-2.5 items-center">
              {Array.from({ length: maxStars }, (_: any, i: number) => {
                const starIndex = i + 1
                return (
                  <button key={`${question.id}-star-${i}`} type="button" onClick={() => handleAnswerChange(question.id, starIndex)} className={`text-3xl transition-all hover:scale-110 ${starIndex <= ratingVal ? 'text-amber-400 drop-shadow-[0_0_8px_rgba(245,158,11,0.3)]' : 'text-white/20'}`}>★</button>
                )
              })}
              {ratingVal > 0 && <span className="text-xs text-white/40 ml-2">({ratingVal} / {maxStars})</span>}
            </div>
          </div>
        )
      }

      case 'number':
        return (
          <div key={question.id} className="p-4 rounded-xl bg-white/2 border border-white/5 space-y-3">
            <p className="text-sm font-medium text-white/90">{index + 1}. {question.question} {requiredMark}</p>
            {renderMedia(question)}
            <input type="number" value={currentAnswer || ''} onChange={(e) => handleAnswerChange(question.id, e.target.value)} min={config.min} max={config.max} step={config.step} placeholder="0" className="w-full max-w-37.5 px-4 py-2.5 rounded-xl bg-white/3 border border-white/6 text-sm text-white placeholder-white/20 focus:outline-none focus:border-cyan-400/40 transition-all" />
          </div>
        )

      case 'date':
        return (
          <div key={question.id} className="p-4 rounded-xl bg-white/2 border border-white/5 space-y-3">
            <p className="text-sm font-medium text-white/90">{index + 1}. {question.question} {requiredMark}</p>
            {renderMedia(question)}
            <input type="date" value={currentAnswer || ''} onChange={(e) => handleAnswerChange(question.id, e.target.value)} className="w-full max-w-50 px-4 py-2.5 rounded-xl bg-white/3 border border-white/6 text-sm text-white focus:outline-none focus:border-cyan-400/40 transition-all cursor-pointer" />
          </div>
        )

      case 'file-upload': {
        const simulatedUrl = filePreviews[question.id]
        return (
          <div key={question.id} className="p-4 rounded-xl bg-white/2 border border-white/5 space-y-3">
            <p className="text-sm font-medium text-white/90">{index + 1}. {question.question} {requiredMark}</p>
            {renderMedia(question)}
            <input type="file" id={`file-input-${question.id}`} accept={(config.fileTypes || []).join(',')} onChange={(e) => { const file = e.target.files?.[0] || null; handleSimulatedFileUpload(question.id, file) }} className="hidden" />
            <label htmlFor={`file-input-${question.id}`} className="block p-5 rounded-xl border-2 border-dashed border-white/8 hover:border-cyan-500/40 hover:bg-cyan-500/5 text-center cursor-pointer transition-all">
              <Icon name="upload" className="w-8 h-8 text-white/20 mx-auto mb-2" />
              <p className="text-xs text-white/40">{currentAnswer ? `File terpilih: ${currentAnswer}` : 'Klik area ini untuk simulasi upload file'}</p>
              <p className="text-[10px] text-white/20 mt-1">Maksimal file {config.maxFileSize || 5}MB. Mendukung: {(config.fileTypes || ['image/*', 'application/pdf']).join(', ')}</p>
            </label>
            {simulatedUrl && (
              <div className="mt-3 relative rounded-xl overflow-hidden border border-white/8 max-w-xs mx-auto group cursor-pointer" onClick={() => setLightboxImage({ src: simulatedUrl, alt: currentAnswer || 'Preview' })}>
                <img src={simulatedUrl} alt="Simulated Preview" className="w-full h-32 object-cover" />
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="text-center"><Icon name="search" className="w-8 h-8 text-white mx-auto" /><p className="text-[10px] text-white mt-1">Klik untuk zoom penuh</p></div>
                </div>
              </div>
            )}
          </div>
        )
      }

      case 'signature':
        return (
          <div key={question.id} className="p-4 rounded-xl bg-white/2 border border-white/5 space-y-3">
            <p className="text-sm font-medium text-white/90">{index + 1}. {question.question || 'Tanda Tangan'} {requiredMark}</p>
            {renderMedia(question)}
            {question.description && <p className="text-xs text-white/40">{question.description}</p>}
            <SignaturePad
              width={config.signatureWidth || 400}
              height={config.signatureHeight || 200}
              penColor={config.signaturePenColor || '#000000'}
              bgColor={config.signatureBgColor || '#ffffff'}
              label={config.signatureLabel || 'Tanda Tangan'}
              onChange={(dataUrl) => handleAnswerChange(question.id, dataUrl)}
            />
            {currentAnswer && (
              <div className="p-2 rounded-lg bg-cyan-500/5 border border-cyan-500/10 text-center">
                <p className="text-[10px] text-cyan-400">✅ Tanda tangan tersimpan sebagai PNG ({(currentAnswer.length / 1024).toFixed(1)} KB)</p>
                <button type="button" onClick={() => handleAnswerChange(question.id, null)} className="text-[10px] text-rose-400 hover:text-rose-300 mt-1">Hapus tanda tangan</button>
              </div>
            )}
          </div>
        )

      default:
        return (
          <div key={question.id} className="p-4 rounded-xl bg-white/2 border border-white/5">
            <p className="text-sm font-medium text-white/90">{index + 1}. {question.question} {requiredMark}</p>
            <p className="text-xs text-white/20 mt-1">Tipe: {answerType}</p>
          </div>
        )
    }
  }

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
                {renderQuestion(element, index)}
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
