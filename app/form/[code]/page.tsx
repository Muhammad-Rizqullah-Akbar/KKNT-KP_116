// app/form/[code]/page.tsx

'use client'

import { useState, useEffect, useRef, useMemo } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { Icon } from '@/components/ui/Icons'
import { 
  getPublishedFormByCode, 
  getFormGroupByCode, 
  getFormsByGroup,
  submitFormResponse,
  incrementFilledCount,
  type FormData,
} from '@/lib/firebase/repositories/forms.repo'
import { ScoringEngine, ScoringResult } from '@/lib/scoring/scoringEngine'
import { getDefaultScoring, getDefaultValidation, getDefaultStage } from '@/components/form-builder/ElementTypes'

type GroupData = {
  id: string
  code: string
  title: string
  description: string
  target: string
  color: string
  formCount: number
}

// ============ SIGNATURE PAD ============
function SignaturePad({ 
  width = 400, height = 200, penColor = '#000000', bgColor = '#ffffff',
  label = 'Tanda Tangan', onChange 
}: { 
  width?: number; height?: number; penColor?: string; bgColor?: string
  label?: string; onChange: (dataUrl: string | null) => void 
}) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const containerRef = useRef<HTMLDivElement | null>(null)
  const [isDrawing, setIsDrawing] = useState(false)
  const [hasSignature, setHasSignature] = useState(false)
  const lastPos = useRef<{ x: number; y: number } | null>(null)

  const getCanvasPos = (clientX: number, clientY: number) => {
    const canvas = canvasRef.current
    if (!canvas) return { x: 0, y: 0 }
    const rect = canvas.getBoundingClientRect()
    const scaleX = canvas.width / rect.width
    const scaleY = canvas.height / rect.height
    return {
      x: (clientX - rect.left) * scaleX,
      y: (clientY - rect.top) * scaleY,
    }
  }

  const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDrawing(true)
    
    if ('touches' in e) {
      const touch = e.touches[0]
      lastPos.current = getCanvasPos(touch.clientX, touch.clientY)
    } else {
      lastPos.current = getCanvasPos(e.clientX, e.clientY)
    }
  }

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (!isDrawing || !canvasRef.current) return
    
    const ctx = canvasRef.current.getContext('2d')
    if (!ctx) return

    let currentPos: { x: number; y: number }
    if ('touches' in e) {
      const touch = e.touches[0]
      currentPos = getCanvasPos(touch.clientX, touch.clientY)
    } else {
      currentPos = getCanvasPos(e.clientX, e.clientY)
    }

    ctx.beginPath()
    ctx.moveTo(lastPos.current?.x || 0, lastPos.current?.y || 0)
    ctx.lineTo(currentPos.x, currentPos.y)
    ctx.strokeStyle = penColor
    ctx.lineWidth = 2.5
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    ctx.stroke()
    
    lastPos.current = currentPos
    setHasSignature(true)
  }

  const stopDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault()
    setIsDrawing(false)
    lastPos.current = null
    if (canvasRef.current && hasSignature) {
      onChange(canvasRef.current.toDataURL('image/png'))
    }
  }

  const clearSignature = () => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    setHasSignature(false)
    onChange(null)
  }

  useEffect(() => {
    const canvas = canvasRef.current
    const container = containerRef.current
    if (!canvas || !container) return
    
    const resizeCanvas = () => {
      const containerWidth = container!.clientWidth
      const maxW = Math.min(width, containerWidth - 4)
      const ratio = height / width
      canvas.width = maxW
      canvas.height = maxW * ratio
    }
    
    resizeCanvas()
    window.addEventListener('resize', resizeCanvas)
    return () => window.removeEventListener('resize', resizeCanvas)
  }, [width, height])

  return (
    <div className="space-y-2 w-full max-w-full">
      <div 
        ref={containerRef}
        className="relative rounded-xl overflow-hidden border-2 border-white/[0.08] mx-auto w-full"
        style={{ maxWidth: Math.min(width, typeof window !== 'undefined' ? window.innerWidth - 80 : 400), touchAction: 'none' }}
      >
        <canvas
          ref={canvasRef}
          width={Math.min(width, 500)}
          height={Math.min(height, 250)}
          className="w-full cursor-crosshair touch-none"
          style={{ backgroundColor: bgColor, touchAction: 'none' }}
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={stopDrawing}
        />
        {!hasSignature && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <p className="text-sm text-gray-400/50">Tanda tangan di sini</p>
          </div>
        )}
      </div>
      <div className="flex items-center justify-between mx-auto w-full max-w-[500px] px-1">
        <p className="text-xs text-white/40">{label}</p>
        {hasSignature && (
          <button type="button" onClick={clearSignature} className="text-xs text-amber-400 hover:text-amber-300">
            ✎ Ulang
          </button>
        )}
      </div>
    </div>
  )
}

// ============ RESULT PAGE COMPONENT ============
function ResultPage({ 
  result, 
  formTitle, 
  onReset,
  onHome
}: { 
  result: ScoringResult
  formTitle: string
  onReset: () => void
  onHome: () => void
}) {
  const { totalScore, maxScore, percentage, grade, perStage, details, recommendations } = result

  return (
    <div className="min-h-screen bg-[#06060E] text-white">
      <nav className="sticky top-0 z-50 bg-[#080812]/90 backdrop-blur-xl border-b border-white/[0.06] px-4 sm:px-6 py-3">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-500 to-violet-500 flex items-center justify-center shadow-lg shadow-cyan-500/20">
              <Icon name="hexagon" className="w-4 h-4 text-white" />
            </div>
            <span className="font-display font-bold text-sm text-white">KKNT-KP<span className="text-cyan-400"> UH</span></span>
          </div>
          <button onClick={onHome} className="px-3 py-1.5 rounded-lg bg-white/[0.03] border border-white/[0.06] text-xs text-white/50 hover:text-white transition-all">
            <Icon name="home" className="w-3.5 h-3.5 inline mr-1" /> Beranda
          </button>
        </div>
      </nav>

      <main className="max-w-3xl w-full mx-auto px-4 py-10">
        <div className="rounded-3xl bg-[#080812] border border-white/[0.06] p-6 sm:p-10 shadow-2xl">
          <div className="text-center mb-8">
            <h1 className="font-display text-2xl font-bold text-white">Hasil Penilaian</h1>
            <p className="text-white/40 text-sm">{formTitle}</p>
          </div>

          <div className="flex justify-center mb-8">
            <div className="relative w-40 h-40">
              <svg className="w-40 h-40 -rotate-90">
                <circle cx="80" cy="80" r="72" fill="none" stroke="white/5" strokeWidth="8" />
                <circle cx="80" cy="80" r="72" fill="none" 
                  stroke={percentage >= 70 ? '#10b981' : percentage >= 50 ? '#f59e0b' : '#ef4444'} 
                  strokeWidth="8" strokeLinecap="round"
                  strokeDasharray={`${(percentage / 100) * 452.389} 452.389`} />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-4xl font-bold font-display">{percentage}%</span>
                <span className="text-xs text-white/40">{totalScore} / {maxScore} poin</span>
              </div>
            </div>
          </div>

          <div className="text-center mb-8">
            <div className={`inline-block px-6 py-2 rounded-full text-sm font-semibold ${
              percentage >= 70 ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' :
              percentage >= 50 ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' :
              'bg-rose-500/20 text-rose-400 border border-rose-500/30'
            }`}>
              {grade}
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
            <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.05] text-center">
              <p className="text-2xl font-bold text-emerald-400">{details.correctCount}</p>
              <p className="text-[10px] text-white/30 uppercase">Benar</p>
            </div>
            <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.05] text-center">
              <p className="text-2xl font-bold text-rose-400">{details.wrongCount}</p>
              <p className="text-[10px] text-white/30 uppercase">Salah</p>
            </div>
            <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.05] text-center">
              <p className="text-2xl font-bold text-amber-400">{details.skippedCount}</p>
              <p className="text-[10px] text-white/30 uppercase">Dilewati</p>
            </div>
            <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.05] text-center">
              <p className="text-2xl font-bold text-cyan-400">{details.totalQuestions}</p>
              <p className="text-[10px] text-white/30 uppercase">Total Soal</p>
            </div>
          </div>

          {Object.keys(perStage).length > 1 && (
            <div className="mb-8">
              <h3 className="text-sm font-medium text-white/60 mb-3">📂 Per Tahapan</h3>
              <div className="space-y-2">
                {Object.entries(perStage).map(([stageId, data]) => (
                  <div key={stageId} className="flex items-center gap-3 p-2.5 rounded-xl bg-white/[0.02] border border-white/[0.05]">
                    <span className="text-sm text-white/70 flex-1">{data.name}</span>
                    <span className="text-xs text-white/30">{data.earned} / {data.possible}</span>
                    <div className="w-24 h-1.5 bg-white/[0.05] rounded-full overflow-hidden">
                      <div className={`h-full rounded-full transition-all ${
                        data.percentage >= 70 ? 'bg-emerald-400' :
                        data.percentage >= 50 ? 'bg-amber-400' : 'bg-rose-400'
                      }`} style={{ width: `${data.percentage}%` }} />
                    </div>
                    <span className={`text-xs font-medium min-w-[40px] text-right ${
                      data.percentage >= 70 ? 'text-emerald-400' :
                      data.percentage >= 50 ? 'text-amber-400' : 'text-rose-400'
                    }`}>{data.percentage}%</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {recommendations.length > 0 && (
            <div className="mb-8 p-4 rounded-xl bg-cyan-500/5 border border-cyan-500/10">
              <h3 className="text-sm font-medium text-cyan-400 mb-2">💡 Rekomendasi</h3>
              <ul className="space-y-1">
                {recommendations.map((rec, i) => (
                  <li key={i} className="text-xs text-white/60 flex items-start gap-2">
                    <span className="text-cyan-400">•</span>
                    {rec}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button onClick={() => window.print()} 
              className="px-6 py-2.5 rounded-xl bg-white/[0.03] border border-white/[0.06] text-sm text-white/60 hover:text-white transition-all flex items-center justify-center gap-2">
              <Icon name="printer" className="w-4 h-4" /> Cetak Hasil
            </button>
            <button onClick={onReset}
              className="px-6 py-2.5 rounded-xl bg-white/[0.05] border border-white/[0.06] text-sm text-white/60 hover:text-white transition-all flex items-center justify-center gap-2">
              <Icon name="rotateCcw" className="w-4 h-4" /> Isi Ulang
            </button>
            <button onClick={onHome}
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-cyan-600 to-teal-600 hover:from-cyan-500 hover:to-teal-500 text-sm font-semibold text-white transition-all shadow-lg shadow-cyan-600/25 flex items-center justify-center gap-2 w-full sm:w-auto">
              <Icon name="home" className="w-4 h-4" /> Kembali ke Beranda
            </button>
          </div>
        </div>
      </main>
    </div>
  )
}

// ============ MAIN COMPONENT ============
export default function DynamicFormPage() {
  const router = useRouter()
  const params = useParams()
  const code = (params.code as string)?.toUpperCase()
  
  const [loading, setLoading] = useState(true)
  const [formData, setFormData] = useState<FormData | null>(null)
  const [groupData, setGroupData] = useState<GroupData | null>(null)
  const [formsInGroup, setFormsInGroup] = useState<FormData[]>([])
  const [formType, setFormType] = useState<'single' | 'group' | null>(null)
  const [answers, setAnswers] = useState<Record<string, any>>({})
  const [currentPage, setCurrentPage] = useState<'dashboard' | 'form' | 'result'>('dashboard')
  const [selectedForm, setSelectedForm] = useState<FormData | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showToast, setShowToast] = useState(false)
  const [toastMessage, setToastMessage] = useState('')
  const [toastType, setToastType] = useState<'success' | 'error'>('success')
  
  // ===== PAGINATION STATES =====
  const [currentStageIndex, setCurrentStageIndex] = useState(0)
  const [currentPageIndex, setCurrentPageIndex] = useState(0)
  const ITEMS_PER_PAGE = 10

  // ===== SCORING RESULT STATE =====
  const [scoringResult, setScoringResult] = useState<ScoringResult | null>(null)

  const showToastMessage = (message: string, type: 'success' | 'error' = 'success') => {
    setToastMessage(message); setToastType(type); setShowToast(true)
    setTimeout(() => setShowToast(false), 3000)
  }

  // ============ GROUP QUESTIONS BY STAGE ============
  const getQuestionsByStage = (questions: any[]) => {
    if (!questions || questions.length === 0) return []
    
    const hasStages = questions.some((q: any) => q.stageId)
    if (hasStages) {
      const stageMap: Record<string, any[]> = {}
      questions.forEach((q: any) => {
        const stageId = q.stageId || 'default'
        if (!stageMap[stageId]) stageMap[stageId] = []
        stageMap[stageId].push(q)
      })
      return Object.values(stageMap)
    }
    
    return [questions]
  }

  // ============ GET STAGE NAME ============
  const getStageName = (stageId: string, index: number): string => {
    const stages = selectedForm?.stages || []
    const stage = stages.find((s: any) => s.id === stageId)
    if (stage) return stage.name
    return `Bagian ${index + 1}`
  }

  // ============ LOAD DATA ============
  useEffect(() => {
    const loadData = async () => {
      if (!code) { router.push('/'); return }
      try {
        setLoading(true)
        
        const group = await getFormGroupByCode(code)
        if (group) {
          setFormType('group')
          setGroupData(group)
          const forms = await getFormsByGroup(group.id)
          setFormsInGroup(forms)
          setCurrentPage('dashboard')
          setLoading(false)
          return
        }
        
        const form = await getPublishedFormByCode(code)
        if (form) {
          setFormType('single')
          setFormData(form)
          setSelectedForm(form)
          initializeAnswers(form)
          setCurrentPage('form')
          setCurrentStageIndex(0)
          setCurrentPageIndex(0)
          setLoading(false)
          return
        }
        
        showToastMessage('Kode akses tidak valid atau formulir belum dipublikasikan', 'error')
        setTimeout(() => router.push('/'), 3000)
      } catch (error) {
        console.error('Error loading form:', error)
        showToastMessage('Gagal memuat formulir. Periksa koneksi Anda.', 'error')
      } finally { 
        setLoading(false) 
      }
    }
    loadData()
  }, [code, router])

  // ============ INITIALIZE ANSWERS ============
  const initializeAnswers = (form: FormData) => {
    const initial: Record<string, any> = {}
    form.questions?.forEach((q: any) => {
      const type = q.answerType || q.type || 'short-text'
      if (type === 'indicator-table' || type === 'likert') {
        const indicators = q.config?.indicators || []
        const statements = q.config?.statements || q.options || []
        const rows = indicators.length > 0 ? indicators : statements
        rows.forEach((_: any, i: number) => {
          initial[`${q.id}-${i}`] = ''
        })
      } else if (type === 'multiple-choice') {
        initial[q.id] = []
      } else if (type === 'signature') {
        initial[q.id] = null
      } else {
        initial[q.id] = ''
      }
    })
    setAnswers(initial)
  }

  // ============ HANDLE ANSWER CHANGE ============
  const handleAnswerChange = (questionId: string, value: any) => {
    setAnswers(prev => ({ ...prev, [questionId]: value }))
  }

  // ============ HANDLE SUBMIT DENGAN SCORING ============
  const handleSubmit = async () => {
    if (!selectedForm) return
    const missingQuestions: string[] = []
    
    selectedForm.questions?.forEach((q: any) => {
      const type = q.answerType || q.type || 'short-text'
      if (q.required) {
        if (type === 'indicator-table' || type === 'likert') {
          const indicators = q.config?.indicators || []
          const statements = q.config?.statements || q.options || []
          const rows = indicators.length > 0 ? indicators : statements
          rows.forEach((_: any, i: number) => {
            if (!answers[`${q.id}-${i}`] || answers[`${q.id}-${i}`] === '') {
              missingQuestions.push(`${q.question} - Baris ${i + 1}`)
            }
          })
        } else if (type === 'multiple-choice') {
          if (!answers[q.id] || (Array.isArray(answers[q.id]) && answers[q.id].length === 0)) {
            missingQuestions.push(q.question || q.label)
          }
        } else if (type === 'signature') {
          if (!answers[q.id]) missingQuestions.push(q.question || q.label)
        } else if (type !== 'image' && type !== 'file-upload') {
          if (!answers[q.id] || answers[q.id] === '') missingQuestions.push(q.question || q.label)
        }
      }
    })

    if (missingQuestions.length > 0) {
      showToastMessage(`${missingQuestions.length} pertanyaan wajib belum diisi`, 'error')
      return
    }

    setIsSubmitting(true)
    try {
      await submitFormResponse(
        selectedForm.id || '', 
        selectedForm.code, 
        selectedForm.title,
        answers, 
        selectedForm.questions
      )
      await incrementFilledCount(selectedForm.id || '')
      
      const scoring = selectedForm.scoring || getDefaultScoring()
      const validation = selectedForm.validation || getDefaultValidation()
      const stages = selectedForm.stages || [{ id: 'default', name: 'Semua Pertanyaan', order: 0, questionIds: [] }]
      
      const engine = new ScoringEngine(
        selectedForm.questions || [],
        scoring,
        validation,
        stages
      )
      
      const result = engine.calculateScore(answers)
      setScoringResult(result)
      setCurrentPage('result')
      
      showToastMessage('Jawaban berhasil dikirim! 🎉', 'success')
    } catch (error) {
      console.error('Error submitting form:', error)
      showToastMessage('Gagal mengirim jawaban. Silakan coba lagi.', 'error')
    } finally { 
      setIsSubmitting(false) 
    }
  }

  // ============ CHECK IF ANSWERED ============
  const isQuestionAnswered = (q: any) => {
    const type = q.answerType || q.type || 'short-text'
    if (type === 'indicator-table' || type === 'likert') {
      const indicators = q.config?.indicators || []
      const statements = q.config?.statements || q.options || []
      const rows = indicators.length > 0 ? indicators : statements
      if (rows.length === 0) return true
      return rows.every((_: any, i: number) => 
        answers[`${q.id}-${i}`] && answers[`${q.id}-${i}`] !== ''
      )
    }
    if (type === 'multiple-choice') {
      return answers[q.id] && Array.isArray(answers[q.id]) && answers[q.id].length > 0
    }
    if (type === 'signature') return answers[q.id] !== null && answers[q.id] !== ''
    if (type === 'image' || type === 'file-upload') return true
    return answers[q.id] && answers[q.id] !== ''
  }

  // ============ RENDER MEDIA/GAMBAR ============
  const renderMedia = (q: any) => {
    const media = q.media || {}
    const imageUrl = q.imageUrl || media.url || ''
    const caption = media.caption || ''
    
    if (!imageUrl) return null
    
    return (
      <div className="mb-4 rounded-xl overflow-hidden border border-white/[0.05]">
        <img 
          src={imageUrl} 
          alt={caption || q.question || 'Gambar'} 
          className="w-full h-auto max-h-64 object-contain bg-[#080812]"
          loading="lazy"
        />
        {caption && (
          <p className="text-xs text-white/30 p-2 text-center bg-[#080812] border-t border-white/[0.05]">
            {caption}
          </p>
        )}
      </div>
    )
  }

  // ============ RENDER QUESTION ============
  const renderQuestion = (q: any, index: number) => {
    const type = q.answerType || q.type || 'short-text'
    const config = q.config || {}
    const isAnswered = isQuestionAnswered(q)
    const qNum = index + 1
    const hasImage = (q.media && q.media.url) || q.imageUrl

    const wrapper = (children: React.ReactNode) => (
      <div id={`q-${q.id}`} className={`p-4 rounded-xl border transition-all ${isAnswered ? 'border-emerald-500/30 bg-emerald-500/5' : 'border-white/[0.05] bg-white/[0.01]'}`}>
        <div className="flex items-start gap-3 mb-3">
          <span className="w-7 h-7 rounded-lg bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-xs font-bold text-cyan-400 flex-shrink-0">{qNum}</span>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-white/90 break-words">
              {q.question || q.label} 
              {q.required && <span className="text-rose-400 ml-1">*</span>}
            </p>
            {q.description && <p className="text-xs text-white/30 mt-0.5">{q.description}</p>}
          </div>
        </div>
        {hasImage && renderMedia(q)}
        <div className="ml-10">{children}</div>
      </div>
    )

    switch (type) {
      case 'single-choice':
      case 'binary':
        return wrapper(
          <div className="space-y-2">
            {(config.options || q.options || (type === 'binary' ? ['Ya', 'Tidak'] : ['Opsi 1', 'Opsi 2', 'Opsi 3'])).map((opt: string) => (
              <label key={opt} className="flex items-center gap-3 text-sm text-white/60 cursor-pointer py-1">
                <input type="radio" name={q.id} value={opt} checked={answers[q.id] === opt}
                  onChange={(e) => handleAnswerChange(q.id, e.target.value)} className="accent-cyan-400 w-4 h-4 flex-shrink-0" />
                <span className="break-words">{opt}</span>
              </label>
            ))}
          </div>
        )

      case 'dropdown':
        return wrapper(
          <select value={answers[q.id] || ''} onChange={(e) => handleAnswerChange(q.id, e.target.value)}
            className="w-full max-w-[300px] px-4 py-2.5 rounded-xl bg-white/[0.03] border border-white/[0.06] text-sm text-white focus:outline-none focus:border-cyan-400/40">
            <option value="">Pilih opsi...</option>
            {(config.options || ['Opsi 1', 'Opsi 2', 'Opsi 3']).map((opt: string) => (
              <option key={opt} value={opt}>{opt}</option>
            ))}
          </select>
        )

      case 'multiple-choice':
        return wrapper(
          <div className="space-y-2">
            {(config.options || ['Opsi 1', 'Opsi 2', 'Opsi 3']).map((opt: string) => (
              <label key={opt} className="flex items-center gap-3 text-sm text-white/60 cursor-pointer py-1">
                <input type="checkbox" value={opt} checked={(answers[q.id] || []).includes(opt)}
                  onChange={(e) => {
                    const current = answers[q.id] || []
                    handleAnswerChange(q.id, e.target.checked ? [...current, opt] : current.filter((v: string) => v !== opt))
                  }} className="accent-cyan-400 w-4 h-4 flex-shrink-0" />
                <span className="break-words">{opt}</span>
              </label>
            ))}
          </div>
        )

      case 'short-text':
      case 'text':
        return wrapper(
          <input type="text" value={answers[q.id] || ''} onChange={(e) => handleAnswerChange(q.id, e.target.value)}
            placeholder={config.placeholder || 'Tulis jawaban Anda...'}
            className="w-full px-4 py-2.5 rounded-xl bg-white/[0.03] border border-white/[0.06] text-sm text-white placeholder-white/20 focus:outline-none focus:border-cyan-400/40 transition-all" />
        )

      case 'long-text':
      case 'textarea':
        return wrapper(
          <textarea value={answers[q.id] || ''} onChange={(e) => handleAnswerChange(q.id, e.target.value)}
            rows={4} placeholder={config.placeholder || 'Tulis jawaban Anda...'}
            className="w-full px-4 py-2.5 rounded-xl bg-white/[0.03] border border-white/[0.06] text-sm text-white placeholder-white/20 focus:outline-none focus:border-cyan-400/40 transition-all resize-none" />
        )

      case 'number':
        return wrapper(
          <input type="number" value={answers[q.id] || ''} onChange={(e) => handleAnswerChange(q.id, e.target.value)}
            min={config.min ?? 0} max={config.max ?? 100} step={config.step ?? 1} placeholder="0"
            className="w-full max-w-[150px] px-4 py-2.5 rounded-xl bg-white/[0.03] border border-white/[0.06] text-sm text-white placeholder-white/20 focus:outline-none focus:border-cyan-400/40 transition-all" />
        )

      case 'date':
        return wrapper(
          <input type="date" value={answers[q.id] || ''} onChange={(e) => handleAnswerChange(q.id, e.target.value)}
            className="w-full max-w-[200px] px-4 py-2.5 rounded-xl bg-white/[0.03] border border-white/[0.06] text-sm text-white focus:outline-none focus:border-cyan-400/40 transition-all cursor-pointer" />
        )

      case 'rating': {
        const ratingVal = Number(answers[q.id]) || 0
        const maxStars = config.ratingMax || 5
        return wrapper(
          <div className="flex gap-2.5 items-center flex-wrap">
            {Array.from({ length: maxStars }, (_: any, i: number) => {
              const starIndex = i + 1
              return (
                <button key={i} type="button" onClick={() => handleAnswerChange(q.id, starIndex)}
                  className={`text-3xl transition-all hover:scale-110 ${starIndex <= ratingVal ? 'text-amber-400 drop-shadow-[0_0_8px_rgba(245,158,11,0.3)]' : 'text-white/20'}`}>★</button>
              )
            })}
            {ratingVal > 0 && <span className="text-xs text-white/40 ml-2">({ratingVal} / {maxStars})</span>}
          </div>
        )
      }

      case 'indicator-table':
      case 'likert': {
        const indicators = config.indicators || []
        const scales = config.indicatorScales || [
          { value: 1, label: 'STS' }, { value: 2, label: 'TS' }, { value: 3, label: 'N' }, { value: 4, label: 'S' }, { value: 5, label: 'SS' }
        ]
        const title = config.indicatorTitle || 'Pertanyaan'
        const items = indicators.length > 0 ? indicators.map((ind: any) => ind.label || ind) : (config.statements || q.options || [])
        const scaleLabels = scales.length > 0 ? scales.map((s: any) => s.label || s) : ['STS', 'TS', 'CS', 'S', 'SS']
        const hasReverse = indicators.some((ind: any) => ind.reverse === true)

        return (
          <div id={`q-${q.id}`} className={`p-4 rounded-xl border transition-all ${isAnswered ? 'border-emerald-500/30 bg-emerald-500/5' : 'border-white/[0.05] bg-white/[0.01]'}`}>
            <div className="flex items-start gap-3 mb-3">
              <span className="w-7 h-7 rounded-lg bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-xs font-bold text-cyan-400 flex-shrink-0">{qNum}</span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-white/90 break-words">
                  {q.question || q.label} 
                  {q.required && <span className="text-rose-400 ml-1">*</span>}
                </p>
                {q.description && <p className="text-xs text-white/30 mt-0.5">{q.description}</p>}
              </div>
            </div>
            {hasImage && renderMedia(q)}
            <div className="ml-2 sm:ml-10 overflow-x-auto -mx-2 px-2">
              <table className="w-full text-sm border border-white/[0.05] rounded-xl min-w-[300px]">
                <thead>
                  <tr className="bg-white/[0.02]">
                    <th className="text-left text-xs text-white/40 font-medium py-2 px-2 sm:px-3">
                      {title}
                      {hasReverse && (
                        <span className="text-[9px] text-amber-400/60 ml-1">(↕ STS=baik)</span>
                      )}
                    </th>
                    {scaleLabels.map((label: string) => (
                      <th key={label} className="text-center text-xs text-white/40 font-medium py-2 px-1 sm:px-2">{label}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {items.map((row: string, i: number) => {
                    const isReverse = indicators[i]?.reverse === true
                    const displayRow = isReverse ? `${row} ↕` : row
                    
                    return (
                      <tr key={i} className="border-t border-white/[0.05]">
                        <td className="py-2 px-2 sm:px-3 text-sm text-white/60 break-words">
                          {displayRow}
                          {isReverse && (
                            <span className="text-[8px] text-amber-400/50 ml-0.5">(STS=baik)</span>
                          )}
                        </td>
                        {scaleLabels.map((label: string) => (
                          <td key={label} className="text-center py-2 px-1 sm:px-2">
                            <input type="radio" name={`${q.id}-${i}`} value={label}
                              checked={answers[`${q.id}-${i}`] === label}
                              onChange={(e) => handleAnswerChange(`${q.id}-${i}`, e.target.value)}
                              className="accent-cyan-400 w-4 h-4" />
                          </td>
                        ))}
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )
      }

      case 'signature':
        return wrapper(
          <div className="space-y-2">
            <SignaturePad
              width={config.signatureWidth || 400} 
              height={config.signatureHeight || 200}
              penColor={config.signaturePenColor || '#000000'} 
              bgColor={config.signatureBgColor || '#ffffff'}
              label={config.signatureLabel || 'Tanda Tangan'}
              onChange={(dataUrl) => handleAnswerChange(q.id, dataUrl)} />
            {answers[q.id] && (
              <p className="text-[10px] text-cyan-400 text-center">✅ Tanda tangan tersimpan ({(answers[q.id]?.length / 1024).toFixed(1)} KB)</p>
            )}
          </div>
        )

      case 'file-upload':
        return wrapper(
          <div className="space-y-2">
            <input type="file" id={`file-${q.id}`} accept={(config.fileTypes || ['image/*', 'application/pdf']).join(',')}
              onChange={(e) => { const file = e.target.files?.[0]; if (file) handleAnswerChange(q.id, file.name) }} className="hidden" />
            <label htmlFor={`file-${q.id}`} className="block p-5 rounded-xl border-2 border-dashed border-white/[0.08] hover:border-cyan-500/40 text-center cursor-pointer transition-all">
              <Icon name="upload" className="w-8 h-8 text-white/20 mx-auto mb-2" />
              <p className="text-xs text-white/40">{answers[q.id] ? `File: ${answers[q.id]}` : 'Klik untuk upload file'}</p>
              <p className="text-[10px] text-white/20 mt-1">Max {config.maxFileSize || 5}MB</p>
            </label>
          </div>
        )

      case 'image':
        return (
          <div id={`q-${q.id}`} className="p-4 rounded-xl border border-white/[0.05] bg-white/[0.01]">
            <div className="flex items-start gap-3 mb-3">
              <span className="w-7 h-7 rounded-lg bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-xs font-bold text-cyan-400 flex-shrink-0">{qNum}</span>
              <p className="text-sm font-medium text-white/90 break-words">{q.question}</p>
            </div>
            <div className="ml-10">
              {renderMedia(q)}
            </div>
          </div>
        )

      default:
        return wrapper(
          <p className="text-xs text-white/30 italic">Tipe pertanyaan: {type}</p>
        )
    }
  }

  // ============ PAGINATION HELPERS ============
  const allQuestions = selectedForm?.questions || []
  
  const stageGroups = useMemo(() => {
    if (!allQuestions.length) return []
    return getQuestionsByStage(allQuestions)
  }, [allQuestions])

  const currentStageQuestions = stageGroups[currentStageIndex] || []
  
  const totalPagesInStage = Math.ceil(currentStageQuestions.length / ITEMS_PER_PAGE)
  const paginatedQuestions = useMemo(() => {
    const start = currentPageIndex * ITEMS_PER_PAGE
    const end = start + ITEMS_PER_PAGE
    return currentStageQuestions.slice(start, end)
  }, [currentStageQuestions, currentPageIndex])

  const answeredInStage = currentStageQuestions.filter((q: any) => isQuestionAnswered(q)).length
  const totalInStage = currentStageQuestions.length

  // ===== OVERALL PROGRESS - TAMBAHKAN INI =====
  const totalQuestions = allQuestions.length
  const totalAnswered = allQuestions.filter((q: any) => isQuestionAnswered(q)).length
  const overallProgress = totalQuestions > 0 ? Math.round((totalAnswered / totalQuestions) * 100) : 0
  const isLastStage = currentStageIndex === stageGroups.length - 1
  const isLastPage = currentPageIndex === totalPagesInStage - 1 || totalPagesInStage === 0
  const isFirstStage = currentStageIndex === 0
  const isFirstPage = currentPageIndex === 0

  // ============ NAVIGASI SEDERHANA ============
  const handleNavigate = () => {
    if (currentPageIndex < totalPagesInStage - 1) {
      setCurrentPageIndex(currentPageIndex + 1)
      window.scrollTo({ top: 0, behavior: 'smooth' })
      return
    }

    if (currentStageIndex < stageGroups.length - 1) {
      setCurrentStageIndex(currentStageIndex + 1)
      setCurrentPageIndex(0)
      window.scrollTo({ top: 0, behavior: 'smooth' })
      return
    }

    handleSubmit()
  }

  const isNextDisabled = () => {
    if (isSubmitting) return true
    const hasRequiredUnanswered = paginatedQuestions.some((q: any) => {
      if (!q.required) return false
      return !isQuestionAnswered(q)
    })
    return hasRequiredUnanswered
  }

  const getButtonLabel = () => {
    if (isSubmitting) return 'Mengirim...'
    if (currentPageIndex < totalPagesInStage - 1) {
      return 'Selanjutnya'
    }
    if (currentStageIndex < stageGroups.length - 1) {
      const nextStageName = stageGroups[currentStageIndex + 1]?.[0]?.stageId 
        ? getStageName(stageGroups[currentStageIndex + 1][0].stageId, currentStageIndex + 1)
        : `Bagian ${currentStageIndex + 2}`
      return `Lanjut ke ${nextStageName}`
    }
    return 'Kirim Jawaban'
  }

  // ============ LOADING ============
  if (loading) {
    return (
      <div className="min-h-screen bg-[#06060E] flex items-center justify-center">
        <div className="text-center">
          <Icon name="loader" className="w-10 h-10 text-cyan-400 animate-spin mx-auto mb-4" />
          <p className="text-white/40">Memuat formulir...</p>
        </div>
      </div>
    )
  }

  // ============ RESULT PAGE ============
  if (currentPage === 'result' && scoringResult) {
    return (
      <ResultPage
        result={scoringResult}
        formTitle={selectedForm?.title || 'Formulir'}
        onReset={() => {
          if (selectedForm) {
            initializeAnswers(selectedForm)
            setCurrentPage('form')
            setScoringResult(null)
            setCurrentStageIndex(0)
            setCurrentPageIndex(0)
          }
        }}
        onHome={() => router.push('/')}
      />
    )
  }

  // ============ GROUP DASHBOARD ============
  if (formType === 'group' && currentPage === 'dashboard') {
    return (
      <div className="min-h-screen bg-[#06060E] text-white">
        <nav className="sticky top-0 z-50 bg-[#080812]/90 backdrop-blur-xl border-b border-white/[0.06] px-4 sm:px-6 py-3">
          <div className="max-w-4xl mx-auto flex items-center justify-between">
            <Link href="/" className="flex items-center gap-3 group">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-500 to-violet-500 flex items-center justify-center shadow-lg shadow-cyan-500/20">
                <Icon name="hexagon" className="w-4 h-4 text-white" />
              </div>
              <span className="font-display font-bold text-sm text-white">KKNT-KP<span className="text-cyan-400"> UH</span></span>
            </Link>
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/[0.03] border border-white/[0.06] text-xs text-white/60">
              <Icon name="users" className="w-3.5 h-3.5" /><span>{groupData?.target || 'User'}</span>
            </div>
          </div>
        </nav>
        <main className="max-w-3xl w-full mx-auto px-4 py-10">
          <h1 className="font-display text-2xl font-bold text-white mb-2">{groupData?.title}</h1>
          <p className="text-white/50 text-sm mb-6">{groupData?.description}</p>
          <div className="space-y-3">
            {formsInGroup.length === 0 ? (
              <div className="text-center py-8 text-white/30">
                <Icon name="fileText" className="w-12 h-12 mx-auto mb-2 text-white/10" /><p>Belum ada formulir</p>
              </div>
            ) : (
              formsInGroup.map((form) => (
                <div key={form.id} onClick={() => { setSelectedForm(form); setCurrentPage('form'); initializeAnswers(form); setCurrentStageIndex(0); setCurrentPageIndex(0) }}
                  className="rounded-2xl bg-[#080812] border border-white/[0.05] p-5 cursor-pointer hover:border-cyan-500/30 transition-all group">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-display font-semibold text-white group-hover:text-cyan-300 transition-colors">{form.title}</h3>
                      <div className="flex gap-2 mt-1.5 text-xs text-white/35">
                        <span><Icon name="helpCircle" className="w-3 h-3 inline mr-1" />{form.questions?.length || 0} soal</span>
                      </div>
                    </div>
                    <span className="px-3 py-1 rounded-full text-xs font-medium bg-cyan-500/20 text-cyan-400">Isi</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </main>
      </div>
    )
  }

  // ============ SINGLE FORM WITH SIMPLE NAVIGATION ============
  if (selectedForm && currentPage === 'form') {
    const stageName = stageGroups.length > 1 
      ? getStageName(currentStageQuestions[0]?.stageId || '', currentStageIndex)
      : 'Semua Pertanyaan'

    const buttonLabel = getButtonLabel()
    const isDisabled = isNextDisabled()

    return (
      <div className="min-h-screen bg-[#06060E] text-white">
        <nav className="sticky top-0 z-50 bg-[#080812]/90 backdrop-blur-xl border-b border-white/[0.06] px-4 sm:px-6 py-3">
          <div className="max-w-4xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-500 to-violet-500 flex items-center justify-center shadow-lg shadow-cyan-500/20">
                <Icon name="hexagon" className="w-4 h-4 text-white" />
              </div>
              <span className="font-display font-bold text-sm text-white">KKNT-KP<span className="text-cyan-400"> UH</span></span>
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/[0.03] border border-white/[0.06] text-xs text-white/60">
              <Icon name="user" className="w-3.5 h-3.5" /><span>{selectedForm?.target || 'User'}</span>
            </div>
          </div>
        </nav>

        <main className="max-w-3xl w-full mx-auto px-4 py-6 sm:py-10">
          <div className="flex items-center justify-between gap-3 mb-2">
            <h1 className="font-display text-xl font-semibold truncate text-white">{selectedForm.title}</h1>
            <span className="text-xs px-3 py-1.5 rounded-full bg-white/[0.03] border border-white/[0.06] flex-shrink-0">
              {overallProgress}% Terjawab
            </span>
          </div>

          <div className="w-full h-2 bg-white/[0.04] rounded-full mb-4 overflow-hidden">
            <div className="h-full bg-gradient-to-r from-cyan-400 via-teal-400 to-emerald-400 rounded-full transition-all duration-500"
              style={{ width: `${overallProgress}%` }} />
          </div>

          <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <span className="text-xs text-white/40">📂 {stageName}</span>
              {stageGroups.length > 1 && (
                <span className="text-xs text-white/20">
                  ({currentStageIndex + 1}/{stageGroups.length})
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-white/30">
                {answeredInStage}/{totalInStage} terjawab
              </span>
              {totalPagesInStage > 1 && (
                <span className="text-xs text-white/20">
                  Halaman {currentPageIndex + 1}/{totalPagesInStage}
                </span>
              )}
            </div>
          </div>

          {totalInStage > 0 && (
            <div className="w-full h-1.5 bg-white/[0.04] rounded-full mb-6 overflow-hidden">
              <div className="h-full bg-gradient-to-r from-cyan-400 to-blue-400 rounded-full transition-all duration-500"
                style={{ width: `${(answeredInStage / totalInStage) * 100}%` }} />
            </div>
          )}

          <div className="rounded-2xl bg-[#080812] border border-white/[0.06] p-4 sm:p-8 shadow-2xl">
            <div className="space-y-6">
              {paginatedQuestions.length > 0 ? (
                paginatedQuestions.map((q: any, index: number) => {
                  const globalIndex = allQuestions.indexOf(q)
                  return (
                    <div key={q.id || `question-${globalIndex}`}>
                      {renderQuestion(q, globalIndex)}
                    </div>
                  )
                })
              ) : (
                <div className="text-center py-8 text-white/30">
                  <Icon name="fileText" className="w-12 h-12 mx-auto mb-2 text-white/10" />
                  <p>Tidak ada pertanyaan di bagian ini</p>
                </div>
              )}
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 mt-8 pt-6 border-t border-white/[0.06]">
              <button
                onClick={() => {
                  if (currentPageIndex > 0) {
                    setCurrentPageIndex(currentPageIndex - 1)
                    window.scrollTo({ top: 0, behavior: 'smooth' })
                  } else if (currentStageIndex > 0) {
                    setCurrentStageIndex(currentStageIndex - 1)
                    setCurrentPageIndex(0)
                    window.scrollTo({ top: 0, behavior: 'smooth' })
                  }
                }}
                disabled={isFirstStage && isFirstPage}
                className="px-4 py-2.5 rounded-xl text-sm font-medium bg-white/[0.02] border border-white/[0.06] text-white/60 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-all flex items-center gap-1.5"
              >
                <Icon name="chevronLeft" className="w-4 h-4" />
                Kembali
              </button>

              <button
                onClick={handleNavigate}
                disabled={isDisabled}
                className={`px-6 py-2.5 rounded-xl text-sm font-semibold transition-all flex items-center gap-2 shadow-lg ${
                  isSubmitting 
                    ? 'bg-white/10 text-white/40 cursor-not-allowed' 
                    : currentStageIndex === stageGroups.length - 1 && currentPageIndex === totalPagesInStage - 1
                      ? 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-emerald-600/25'
                      : 'bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white shadow-cyan-600/25'
                }`}
              >
                {isSubmitting ? (
                  <>
                    <Icon name="loader" className="w-4 h-4 animate-spin" />
                    Mengirim...
                  </>
                ) : (
                  <>
                    {currentStageIndex === stageGroups.length - 1 && currentPageIndex === totalPagesInStage - 1 ? (
                      <Icon name="send" className="w-4 h-4" />
                    ) : (
                      <Icon name="chevronRight" className="w-4 h-4" />
                    )}
                    {buttonLabel}
                  </>
                )}
              </button>
            </div>

            {paginatedQuestions.some((q: any) => q.required && !isQuestionAnswered(q)) && (
              <p className="text-xs text-rose-400/70 text-center mt-3 flex items-center justify-center gap-1.5">
                <Icon name="alertCircle" className="w-3.5 h-3.5" />
                Jawab semua pertanyaan bertanda * untuk melanjutkan
              </p>
            )}
          </div>

          {paginatedQuestions.length > 0 && (
            <div className="flex justify-center gap-1.5 mt-4 flex-wrap">
              {paginatedQuestions.map((q: any) => (
                <button
                  key={q.id}
                  onClick={() => {
                    const el = document.getElementById(`q-${q.id}`)
                    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' })
                  }}
                  className={`w-2.5 h-2.5 rounded-full transition-all duration-300 hover:scale-125 ${
                    isQuestionAnswered(q) 
                      ? 'bg-cyan-400 shadow-lg shadow-cyan-400/30' 
                      : q.required 
                        ? 'bg-rose-400/30 hover:bg-rose-400/50' 
                        : 'bg-white/[0.1] hover:bg-white/[0.2]'
                  }`}
                  title={q.question || ''}
                />
              ))}
            </div>
          )}
        </main>

        {showToast && (
          <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50">
            <div className={`px-4 py-2.5 rounded-xl text-sm font-medium shadow-2xl ${
              toastType === 'success' ? 'bg-emerald-600 text-white' : 'bg-rose-600 text-white'
            }`}>{toastMessage}</div>
          </div>
        )}
      </div>
    )
  }

  // ============ FALLBACK ============
  return (
    <div className="min-h-screen bg-[#06060E] flex items-center justify-center">
      <div className="text-center px-4">
        <Icon name="alertCircle" className="w-12 h-12 text-rose-400 mx-auto mb-4" />
        <h2 className="text-white text-xl font-semibold mb-2">Formulir Tidak Ditemukan</h2>
        <p className="text-white/50 text-sm">Kode akses tidak valid atau formulir belum dipublikasikan.</p>
        <Link href="/">
          <button className="mt-6 px-6 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-sm font-medium transition-all">
            Kembali ke Beranda
          </button>
        </Link>
      </div>
    </div>
  )
}