'use client'

import { useState, useEffect, useRef } from 'react'
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
  const [currentPage, setCurrentPage] = useState<'dashboard' | 'form' | 'success'>('dashboard')
  const [selectedForm, setSelectedForm] = useState<FormData | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showToast, setShowToast] = useState(false)
  const [toastMessage, setToastMessage] = useState('')
  const [toastType, setToastType] = useState<'success' | 'error'>('success')

  const showToastMessage = (message: string, type: 'success' | 'error' = 'success') => {
    setToastMessage(message); setToastType(type); setShowToast(true)
    setTimeout(() => setShowToast(false), 3000)
  }

  // ============ LOAD DATA ============
  useEffect(() => {
    const loadData = async () => {
      if (!code) { router.push('/'); return }
      try {
        setLoading(true)
        
        // Coba sebagai group code dulu
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
        
        // Coba sebagai form code
        const form = await getPublishedFormByCode(code)
        if (form) {
          setFormType('single')
          setFormData(form)
          setSelectedForm(form)
          initializeAnswers(form)
          setCurrentPage('form')
          setLoading(false)
          return
        }
        
        // Tidak ditemukan
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

  // ============ HANDLE SUBMIT ============
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
        } else if (type !== 'image') {
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
      setCurrentPage('success')
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
    if (type === 'image') return true
    return answers[q.id] && answers[q.id] !== ''
  }

  // ============ RENDER QUESTION ============
  const renderQuestion = (q: any, index: number) => {
    const type = q.answerType || q.type || 'short-text'
    const config = q.config || {}
    const isAnswered = isQuestionAnswered(q)
    const qNum = index + 1

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
        <div className="ml-10">{children}</div>
      </div>
    )

    switch (type) {
      // ========== PILIHAN GANDA ==========
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

      // ========== TEXT ==========
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

      // ========== NUMBER ==========
      case 'number':
        return wrapper(
          <input type="number" value={answers[q.id] || ''} onChange={(e) => handleAnswerChange(q.id, e.target.value)}
            min={config.min ?? 0} max={config.max ?? 100} step={config.step ?? 1} placeholder="0"
            className="w-full max-w-[150px] px-4 py-2.5 rounded-xl bg-white/[0.03] border border-white/[0.06] text-sm text-white placeholder-white/20 focus:outline-none focus:border-cyan-400/40 transition-all" />
        )

      // ========== DATE ==========
      case 'date':
        return wrapper(
          <input type="date" value={answers[q.id] || ''} onChange={(e) => handleAnswerChange(q.id, e.target.value)}
            className="w-full max-w-[200px] px-4 py-2.5 rounded-xl bg-white/[0.03] border border-white/[0.06] text-sm text-white focus:outline-none focus:border-cyan-400/40 transition-all cursor-pointer" />
        )

      // ========== RATING ==========
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

      // ========== INDICATOR TABLE ==========
      case 'indicator-table':
      case 'likert': {
        const indicators = config.indicators || []
        const scales = config.indicatorScales || [
          { value: 1, label: 'STS' }, { value: 2, label: 'TS' }, { value: 3, label: 'N' }, { value: 4, label: 'S' }, { value: 5, label: 'SS' }
        ]
        const title = config.indicatorTitle || 'Pertanyaan'
        const items = indicators.length > 0 ? indicators.map((ind: any) => ind.label || ind) : (config.statements || q.options || [])
        const scaleLabels = scales.length > 0 ? scales.map((s: any) => s.label || s) : ['STS', 'TS', 'CS', 'S', 'SS']

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
            <div className="ml-2 sm:ml-10 overflow-x-auto -mx-2 px-2">
              <table className="w-full text-sm border border-white/[0.05] rounded-xl min-w-[300px]">
                <thead>
                  <tr className="bg-white/[0.02]">
                    <th className="text-left text-xs text-white/40 font-medium py-2 px-2 sm:px-3">{title}</th>
                    {scaleLabels.map((label: string) => (
                      <th key={label} className="text-center text-xs text-white/40 font-medium py-2 px-1 sm:px-2">{label}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {items.map((row: string, i: number) => (
                    <tr key={i} className="border-t border-white/[0.05]">
                      <td className="py-2 px-2 sm:px-3 text-sm text-white/60 break-words">{row}</td>
                      {scaleLabels.map((label: string) => (
                        <td key={label} className="text-center py-2 px-1 sm:px-2">
                          <input type="radio" name={`${q.id}-${i}`} value={label}
                            checked={answers[`${q.id}-${i}`] === label}
                            onChange={(e) => handleAnswerChange(`${q.id}-${i}`, e.target.value)}
                            className="accent-cyan-400 w-4 h-4" />
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )
      }

      // ========== SIGNATURE ==========
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

      // ========== FILE UPLOAD ==========
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

      // ========== IMAGE (DISPLAY ONLY) ==========
      case 'image':
        return (
          <div id={`q-${q.id}`} className="p-4 rounded-xl border border-white/[0.05] bg-white/[0.01]">
            <div className="flex items-start gap-3 mb-3">
              <span className="w-7 h-7 rounded-lg bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-xs font-bold text-cyan-400 flex-shrink-0">{qNum}</span>
              <p className="text-sm font-medium text-white/90 break-words">{q.question}</p>
            </div>
            <div className="ml-10">
              <div className="rounded-xl bg-gradient-to-br from-cyan-700/30 to-violet-800/30 border border-white/[0.05] h-48 flex items-center justify-center">
                {q.imageUrl || q.media?.url ? (
                  <img src={q.imageUrl || q.media?.url} alt="Preview" className="h-full w-full object-cover rounded-xl" />
                ) : (
                  <div className="text-center">
                    <Icon name="image" className="w-12 h-12 text-white/20 mx-auto mb-2" />
                    <p className="text-sm text-white/25">Preview gambar</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )

      default:
        return wrapper(
          <p className="text-xs text-white/30 italic">Tipe pertanyaan: {type}</p>
        )
    }
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

  // ============ SUCCESS PAGE ============
  if (currentPage === 'success') {
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
          </div>
        </nav>
        <div className="max-w-sm mx-auto mt-16 text-center px-4">
          <div className="rounded-3xl bg-[#080812] border border-white/[0.06] p-8 sm:p-10 shadow-2xl">
            <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-emerald-500/10 border-2 border-emerald-500/30 flex items-center justify-center animate-bounceIn">
              <svg className="w-12 h-12 text-emerald-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="font-display text-2xl font-bold mb-2">Jawaban Terkirim!</h2>
            <p className="text-white/45 text-sm mb-6">Terima kasih telah mengisi formulir.</p>
            <Link href="/">
              <button className="w-full bg-white/[0.03] border border-white/[0.06] hover:bg-white/[0.06] text-white py-3.5 rounded-xl font-medium text-sm transition-all flex items-center justify-center gap-2">
                <Icon name="arrowLeft" className="w-4 h-4" /> Kembali ke Beranda
              </button>
            </Link>
          </div>
        </div>
      </div>
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
                <div key={form.id} onClick={() => { setSelectedForm(form); setCurrentPage('form'); initializeAnswers(form) }}
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

  // ============ SINGLE FORM ============
  if (selectedForm && currentPage === 'form') {
    const questions = selectedForm.questions || []
    const totalQuestions = questions.filter((q: any) => (q.answerType || q.type || 'short-text') !== 'image').length
    const answeredCount = questions.filter((q: any) => isQuestionAnswered(q)).length
    const progress = totalQuestions > 0 ? Math.round((answeredCount / totalQuestions) * 100) : 0

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
          <div className="flex items-center gap-3 mb-6">
            <h1 className="font-display text-xl font-semibold truncate text-white">{selectedForm.title}</h1>
            <span className="ml-auto text-xs px-3 py-1.5 rounded-full bg-white/[0.03] border border-white/[0.06] flex-shrink-0">
              {progress}% Terjawab ({answeredCount}/{totalQuestions})
            </span>
          </div>

          <div className="w-full h-2.5 bg-white/[0.04] rounded-full mb-8 overflow-hidden">
            <div className="h-full bg-gradient-to-r from-cyan-400 via-teal-400 to-emerald-400 rounded-full transition-all duration-500"
              style={{ width: `${progress}%` }} />
          </div>

          <div className="rounded-2xl bg-[#080812] border border-white/[0.06] p-4 sm:p-8 shadow-2xl">
            <div className="space-y-6">
              {questions.length > 0 ? (
                questions.map((q: any, index: number) => (
                  <div key={q.id || `question-${index}`}>
                    {renderQuestion(q, index)}
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-white/30">
                  <Icon name="fileText" className="w-12 h-12 mx-auto mb-2 text-white/10" /><p>Belum ada pertanyaan</p>
                </div>
              )}
            </div>

            <div className="flex flex-col sm:flex-row justify-between gap-3 mt-8 pt-6 border-t border-white/[0.06]">
              <button onClick={() => { initializeAnswers(selectedForm); window.scrollTo({ top: 0, behavior: 'smooth' }) }}
                className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-white/[0.02] border border-white/[0.06] text-sm text-white/50 hover:text-white/80 transition-all">
                <Icon name="rotateCcw" className="w-4 h-4" /> Reset
              </button>
              <button onClick={handleSubmit} disabled={isSubmitting}
                className="flex items-center justify-center gap-2 px-8 py-3 rounded-xl bg-gradient-to-r from-cyan-600 to-teal-600 hover:from-cyan-500 hover:to-teal-500 text-sm font-semibold text-white transition-all shadow-lg shadow-cyan-600/25 disabled:opacity-70 disabled:cursor-not-allowed">
                <Icon name={isSubmitting ? 'loader' : 'send'} className={`w-4 h-4 ${isSubmitting ? 'animate-spin' : ''}`} />
                {isSubmitting ? 'Mengirim...' : 'Kirim Jawaban'}
              </button>
            </div>
          </div>

          {/* Navigation Dots */}
          {questions.length > 0 && (
            <div className="flex justify-center gap-2 mt-6 flex-wrap">
              {questions.map((q: any, index: number) => (
                <button key={q.id || `dot-${index}`} onClick={() => {
                  const el = document.getElementById(`q-${q.id}`)
                  if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' })
                }}
                  className={`w-3 h-3 rounded-full transition-all duration-300 hover:scale-125 ${
                    isQuestionAnswered(q) ? 'bg-cyan-400 shadow-lg shadow-cyan-400/30' : 'bg-white/[0.1]'
                  }`} title={`${index + 1}. ${q.question || q.label || ''}`} />
              ))}
            </div>
          )}
        </main>

        {/* Toast */}
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