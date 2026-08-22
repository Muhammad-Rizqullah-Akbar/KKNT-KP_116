'use client'

import React, { useEffect, useState, useRef, use } from 'react'
import Link from 'next/link'
import { FormPublicRenderer } from '@/components/forms/v1_5/FormPublicRenderer'
import { PublicProgressHeader } from '@/components/forms/v1_5/PublicProgressHeader'
import { PublicQuestionNavigator } from '@/components/forms/v1_5/PublicQuestionNavigator'
import { PublicReviewScreen } from '@/components/forms/v1_5/PublicReviewScreen'
import { PublicCompletionReceipt } from '@/components/forms/v1_5/PublicCompletionReceipt'
import type { PublicDistributionDTO, PublicResponseSessionDTO } from '@/lib/forms/v1_5/distributionTypes'
import { Icon } from '@/components/ui/Icons'
import { safeFetchJson } from '@/lib/shared/safeFetch'

import { isBiodataAspect } from '@/lib/forms/v1_5/scoring/scoringEngine'

interface PageProps {
  params: Promise<{ code: string }>
}

export default function PublicDistributionPage({ params }: PageProps) {
  const { code } = use(params)

  const [distribution, setDistribution] = useState<PublicDistributionDTO | null>(null)
  const [sessionData, setSessionData] = useState<PublicResponseSessionDTO | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isStartingSession, setIsStartingSession] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [validationError, setValidationError] = useState<string | null>(null)

  // Step flow: 'landing' | 'filling' | 'review' | 'submitted'
  const [flowStep, setFlowStep] = useState<'landing' | 'filling' | 'review' | 'submitted'>('landing')
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [answers, setAnswers] = useState<Record<string, any>>({})
  const [isMobileNavigatorOpen, setIsMobileNavigatorOpen] = useState(false)
  const [submittedReceipt, setSubmittedReceipt] = useState<{
    responseId: string
    submittedAt: string
    result?: any
    biodata?: Array<{ label: string; value: string }>
  } | null>(null)

  // Submission lock guard to prevent double-clicks
  const [isSubmitting, setIsSubmitting] = useState(false)
  const isSubmittingRef = useRef(false)
  const [viewMode, setViewMode] = useState<'single' | 'aspect_all'>('aspect_all')

  // 1. Load Distribution Baseline Landing Info
  const loadPublicDistribution = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/v1_5/public/distributions/${code}`)
      const data = await res.json()

      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Distribusi formulir tidak ditemukan.')
      }

      setDistribution(data.distribution)
    } catch (err: any) {
      setError(err.message || 'Terjadi kesalahan saat memuat formulir.')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (code) loadPublicDistribution()
  }, [code])

  // 2. Local Draft Recovery
  useEffect(() => {
    if (sessionData?.responseId) {
      const savedKey = `kkpd_draft_${sessionData.responseId}`
      const savedDraft = localStorage.getItem(savedKey)
      if (savedDraft) {
        try {
          const parsed = JSON.parse(savedDraft)
          if (parsed && typeof parsed === 'object') {
            setAnswers(parsed)
          }
        } catch (e) {
          console.error('Failed to parse draft:', e)
        }
      }
    }
  }, [sessionData?.responseId])

  // Auto-save draft changes to localStorage
  const handleAnswersChange = (qId: string, val: any) => {
    const updated = { ...answers, [qId]: val }
    setAnswers(updated)
    setValidationError(null)

    if (sessionData?.responseId) {
      try {
        localStorage.setItem(`kkpd_draft_${sessionData.responseId}`, JSON.stringify(updated))
      } catch (e) {
        console.error('Failed to save draft:', e)
      }
    }
  }

  // 3. Handle Start Session Call (Phase D Integration)
  const handleStartSession = async () => {
    setIsStartingSession(true)
    setError(null)
    try {
      const res = await fetch('/api/v1_5/responses/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ distributionCode: code }),
      })
      const data = await res.json()

      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Gagal memulai sesi kuesioner.')
      }

      setSessionData(data.session)
      setCurrentQuestionIndex(0)
      setFlowStep('filling')
    } catch (err: any) {
      setError(err.message || 'Gagal memulai sesi pengisian.')
    } finally {
      setIsStartingSession(false)
    }
  }

  // 4. Keyboard Navigation Shortcuts (ArrowLeft / ArrowRight)
  useEffect(() => {
    if (flowStep !== 'filling' || !sessionData) return

    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)) {
        return // Ignore keyboard shortcuts when typing in input/textarea
      }

      const totalQuestions = sessionData.form.questions?.length || 0

      if (e.key === 'ArrowLeft') {
        e.preventDefault()
        setCurrentQuestionIndex((prev) => Math.max(0, prev - 1))
        window.scrollTo({ top: 0, behavior: 'smooth' })
      } else if (e.key === 'ArrowRight') {
        e.preventDefault()
        setCurrentQuestionIndex((prev) => Math.min(totalQuestions - 1, prev + 1))
        window.scrollTo({ top: 0, behavior: 'smooth' })
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [flowStep, sessionData])

  // Check unanswered mandatory questions
  const checkUnansweredQuestions = () => {
    if (!sessionData) return []
    const questions = sessionData.form?.version?.questions || sessionData.form?.questions || []
    const unanswered: { index: number; questionId: string; prompt: string }[] = []

    questions.forEach((q: any, idx: number) => {
      if (q.required === false) return

      const val = answers[q.questionId]
      let isAnswered = false

      if (val !== undefined && val !== null && val !== '') {
        const type = q.type || q.answerType
        if (type === 'indicator-table' || type === 'likert') {
          const indicators = q.presentation?.indicators || q.indicators || q.config?.indicators || []
          if (indicators.length === 0) {
            isAnswered = true
          } else {
            isAnswered = typeof val === 'object' && indicators.every((ind: any) => {
              const indId = ind.indicatorId || ind.id || ind
              return val[indId] !== undefined && val[indId] !== null && val[indId] !== ''
            })
          }
        } else if (type === 'multiple-choice') {
          isAnswered = Array.isArray(val) && val.length > 0
        } else if (typeof val === 'object') {
          isAnswered = Object.keys(val).length > 0
        } else {
          isAnswered = true
        }
      }

      if (!isAnswered) {
        unanswered.push({
          index: idx,
          questionId: q.questionId,
          prompt: q.prompt,
        })
      }
    })

    return unanswered
  }

  // Proceed to Review Step with Strict Completion Check
  const handleGoToReview = () => {
    const unanswered = checkUnansweredQuestions()
    if (unanswered.length > 0) {
      const numList = unanswered.map((u) => `Soal ${String(u.index + 1).padStart(2, '0')}`).slice(0, 5).join(', ')
      const moreStr = unanswered.length > 5 ? ` dan ${unanswered.length - 5} soal lainnya` : ''
      setValidationError(`Silakan lengkapi seluruh pertanyaan terlebih dahulu. Masih ada ${unanswered.length} pertanyaan yang belum diisi (${numList}${moreStr}).`)
      setCurrentQuestionIndex(unanswered[0].index)
      window.scrollTo({ top: 0, behavior: 'smooth' })
      return
    }

    setValidationError(null)
    setFlowStep('review')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  // Handle Final Atomic Submission (Phase D Integration)
  const handleSubmitResponse = async () => {
    if (!sessionData) return
    if (isSubmittingRef.current) return

    const unanswered = checkUnansweredQuestions()
    if (unanswered.length > 0) {
      const numList = unanswered.map((u) => `Soal ${String(u.index + 1).padStart(2, '0')}`).slice(0, 5).join(', ')
      const moreStr = unanswered.length > 5 ? ` dan ${unanswered.length - 5} soal lainnya` : ''
      setValidationError(`Gagal mengirim: Masih ada ${unanswered.length} pertanyaan yang belum diisi (${numList}${moreStr}). Harap lengkapi semua jawaban terlebih dahulu.`)
      setFlowStep('filling')
      setCurrentQuestionIndex(unanswered[0].index)
      window.scrollTo({ top: 0, behavior: 'smooth' })
      return
    }

    isSubmittingRef.current = true
    setIsSubmitting(true)
    setValidationError(null)

    try {
      const res = await fetch(`/api/v1_5/responses/${sessionData.responseId}/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          submissionToken: sessionData.submissionToken,
          answers,
        }),
      })
      const data = await res.json()

      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Gagal mengirimkan kuesioner.')
      }

      // Clear local storage draft upon success
      try {
        localStorage.removeItem(`kkpd_draft_${sessionData.responseId}`)
      } catch (e) {
        console.error('Failed to clear draft:', e)
      }

      // Extract biodata entries for receipt summary
      const questionsList = sessionData.form?.version?.questions || sessionData.form?.questions || []
      const aspectsList = sessionData.form?.version?.aspects || sessionData.form?.aspects || []
      const extractedBiodata: { label: string; value: string }[] = []

      questionsList.forEach((q: any) => {
        const prompt = q.prompt || q.title || q.label || ''
        const promptLower = prompt.toLowerCase()
        const aspectObj = aspectsList.find((a: any) => a.aspectId === q.aspectId || a.id === q.aspectId)
        const aspectTitle = aspectObj?.title || aspectObj?.name || q.aspectTitle || q.category || ''
        const isNonScoredAspect = (aspectObj && aspectObj.isScored === false) || isBiodataAspect(aspectTitle)
        const isBiodataQuestion =
          isNonScoredAspect ||
          q.category === 'biodata' ||
          q.isBiodata === true ||
          !!q.biodataKey ||
          (typeof q.type === 'string' && q.type.startsWith('biodata-')) ||
          promptLower.includes('nama') ||
          promptLower.includes('email') ||
          promptLower.includes('telepon') ||
          promptLower.includes('no. hp') ||
          promptLower.includes('hp') ||
          promptLower.includes('instansi') ||
          promptLower.includes('organisasi') ||
          promptLower.includes('lokasi') ||
          promptLower.includes('alamat') ||
          promptLower.includes('sumber informasi') ||
          promptLower.includes('darimana')

        if (isBiodataQuestion) {
          const val = answers[q.questionId]
          if (val !== undefined && val !== null && val !== '') {
            let displayVal = String(val)
            if (Array.isArray(val) && q.options) {
              const selectedLabels = val.map((v: any) => {
                const opt = q.options.find((o: any) => o.id === v || o.optionId === v || o.val === v || o.value === v)
                return opt ? (opt.label || opt.text || opt.prompt || v) : v
              })
              displayVal = selectedLabels.join(', ')
            } else if (typeof val === 'string' && q.options) {
              const opt = q.options.find((o: any) => o.id === val || o.optionId === val || o.val === val || o.value === val)
              if (opt) displayVal = opt.label || opt.text || opt.prompt || val
            }
            extractedBiodata.push({
              label: prompt,
              value: displayVal,
            })
          }
        }
      })

      setSubmittedReceipt({
        responseId: data.receipt.responseId,
        submittedAt: data.receipt.submittedAt,
        result: data.receipt.result,
        biodata: extractedBiodata,
      })
      setFlowStep('submitted')
    } catch (err: any) {
      setValidationError(err.message || 'Terjadi kesalahan saat pengiriman.')
      isSubmittingRef.current = false
      setIsSubmitting(false)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-slate-400 font-sans p-4">
        <Icon name="loader" className="w-8 h-8 text-cyan-400 animate-spin mb-3" />
        <p className="text-sm font-semibold">Memuat Kuesioner Resmi BPOM...</p>
        <p className="text-xs text-slate-600 mt-1 font-mono">Kode Akses: {code}</p>
      </div>
    )
  }

  if (error || !distribution) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-slate-400 font-sans p-6">
        <div className="p-8 max-w-md w-full rounded-3xl bg-slate-900 border border-slate-800 text-center space-y-4 shadow-2xl">
          <div className="w-14 h-14 rounded-2xl bg-amber-500/10 text-amber-400 flex items-center justify-center mx-auto border border-amber-500/20">
            <Icon name="alertCircle" className="w-7 h-7" />
          </div>
          <h2 className="text-lg font-bold text-slate-100">Formulir Tidak Tersedia</h2>
          <p className="text-xs text-slate-300 leading-relaxed">{error || 'Kode distribusi tidak valid.'}</p>
          <div className="pt-2">
            <Link
              href="/"
              className="inline-block px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition-colors"
            >
              Kembali ke Beranda
            </Link>
          </div>
        </div>
      </div>
    )
  }

  const { form, title, description, ownerName, resolvedVersionNumber } = distribution

  // STEP 4: SUBMITTED SUCCESS RECEIPT
  if (flowStep === 'submitted' && submittedReceipt) {
    return (
      <PublicCompletionReceipt
        responseId={submittedReceipt.responseId}
        code={code}
        submittedAt={submittedReceipt.submittedAt}
        result={submittedReceipt.result}
        biodata={submittedReceipt.biodata}
      />
    )
  }

  // Derive resolved aspects array from form version (aspects or stages) or extract dynamically from questions
  const resolveFormAspects = (rawAspects: any[], rawQuestions: any[], rawStages?: any[]) => {
    if (Array.isArray(rawAspects) && rawAspects.length > 0) {
      return rawAspects.map((asp: any, idx: number) => {
        const rawTitle = asp.title || asp.name || asp.label || `Aspek ${idx + 1}`
        const isRandom = typeof rawTitle === 'string' && (rawTitle.startsWith('asp_') || rawTitle.startsWith('stg_'))
        return {
          ...asp,
          aspectId: asp.aspectId || asp.id || `asp_${idx + 1}`,
          title: isRandom ? `Aspek Penilaian ${idx + 1}` : rawTitle,
        }
      })
    }
    if (Array.isArray(rawStages) && rawStages.length > 0) {
      return rawStages.map((stg: any, idx: number) => {
        const rawTitle = stg.name || stg.title || stg.label || `Aspek ${idx + 1}`
        const isRandom = typeof rawTitle === 'string' && (rawTitle.startsWith('stg_') || rawTitle.startsWith('asp_'))
        return {
          aspectId: stg.id || stg.stageId || `stg_${idx + 1}`,
          title: isRandom ? `Aspek Penilaian ${idx + 1}` : rawTitle,
          description: stg.description || '',
        }
      })
    }

    const aspectMap = new Map<string, string>()
    rawQuestions.forEach((q: any) => {
      const aId = q.aspectId || q.stageId || q.stage_id || q.aspect || q.category || 'default'
      let aTitle = q.aspectTitle || q.stageName || (typeof q.aspect === 'string' && !q.aspect.startsWith('asp_') ? q.aspect : null) || (typeof q.category === 'string' && q.category !== 'default' ? q.category : null)
      if (!aTitle || aTitle.startsWith('asp_') || aTitle.startsWith('stg_')) {
        aTitle = aId === 'default' ? 'Evaluasi Kebersihan & Keamanan Pangan' : `Aspek Penilaian ${aspectMap.size + 1}`
      }
      if (!aspectMap.has(aId)) {
        aspectMap.set(aId, aTitle)
      }
    })
    return Array.from(aspectMap.entries()).map(([aspectId, title], idx) => ({
      aspectId,
      title: (title.startsWith('asp_') || title.startsWith('stg_')) ? `Aspek Penilaian ${idx + 1}` : title,
      description: '',
    }))
  }

  // STEP 3: REVIEW ANSWERS STEP
  if (flowStep === 'review' && sessionData) {
    const questions = sessionData.form?.version?.questions || sessionData.form?.questions || []
    const rawAspects = sessionData.form?.version?.aspects || sessionData.form?.aspects || []
    const aspects = resolveFormAspects(rawAspects, questions)

    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 font-sans p-4 sm:p-6">
        <PublicReviewScreen
          code={code}
          title={title}
          aspects={aspects}
          questions={questions}
          answers={answers}
          onBackToFilling={() => {
            setFlowStep('filling')
            window.scrollTo({ top: 0, behavior: 'smooth' })
          }}
          onSubmit={handleSubmitResponse}
          onAnswerChange={(qId, val) => handleAnswersChange(qId, val)}
          isSubmitting={isSubmitting}
          errorMessage={validationError}
        />
      </div>
    )
  }

  // STEP 2: ACTIVE QUESTION FILLING MODE (Desktop & Mobile Responsive Assessment Shell)
  if (flowStep === 'filling' && sessionData) {
    const questions = sessionData.form?.version?.questions || sessionData.form?.questions || []
    const rawAspects = sessionData.form?.version?.aspects || sessionData.form?.aspects || []
    const aspects = resolveFormAspects(rawAspects, questions)

    const activeQuestion = questions[currentQuestionIndex]
    const activeAspectId = (activeQuestion as any)?.aspectId || (activeQuestion as any)?.stageId || aspects[0]?.aspectId
    const activeAspect = aspects.find((a) => a.aspectId === activeAspectId) || aspects[0]

    // Questions belonging to active aspect for 'aspect_all' mode, sorted by global question index
    const activeAspectQuestions = questions.filter((q: any) => {
      const aId = (q as any).aspectId || (q as any).stageId || (q as any).stage_id || 'default'
      return aId === activeAspectId || aId === activeAspect?.aspectId
    })
    activeAspectQuestions.sort((a: any, b: any) => {
      const idxA = questions.findIndex((q: any) => q.questionId === a.questionId)
      const idxB = questions.findIndex((q: any) => q.questionId === b.questionId)
      return idxA - idxB
    })

    const currentAspectIndex = aspects.findIndex((a) => a.aspectId === activeAspectId)
    const isFirstAspect = currentAspectIndex <= 0
    const isLastAspect = currentAspectIndex >= aspects.length - 1

    const isFirstQuestion = currentQuestionIndex === 0
    const isLastQuestion = currentQuestionIndex === questions.length - 1

    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 font-sans flex flex-col">
        {/* Sticky Responsive Progress Header */}
        <PublicProgressHeader
          code={code}
          title={title}
          activeAspectTitle={activeAspect?.title}
          currentQuestionIndex={currentQuestionIndex}
          totalQuestions={questions.length}
          versionNumber={resolvedVersionNumber}
          viewMode={viewMode}
          onToggleViewMode={(mode) => setViewMode(mode)}
          onToggleNavigator={() => setIsMobileNavigatorOpen((prev) => !prev)}
          isNavigatorOpen={isMobileNavigatorOpen}
        />

        {/* Main Workspace Layout */}
        <div className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 flex items-start gap-6">
          {/* Desktop Persistent Left-Side Question Navigator */}
          <PublicQuestionNavigator
            aspects={aspects}
            questions={questions}
            currentQuestionIndex={currentQuestionIndex}
            answers={answers}
            hasAttemptedSubmit={!!validationError}
            onSelectQuestionIndex={(idx) => {
              setCurrentQuestionIndex(idx)
              window.scrollTo({ top: 0, behavior: 'smooth' })
            }}
          />

          {/* Mobile Drawer Navigator */}
          {isMobileNavigatorOpen && (
            <PublicQuestionNavigator
              aspects={aspects}
              questions={questions}
              currentQuestionIndex={currentQuestionIndex}
              answers={answers}
              hasAttemptedSubmit={!!validationError}
              onSelectQuestionIndex={(idx) => {
                setCurrentQuestionIndex(idx)
                window.scrollTo({ top: 0, behavior: 'smooth' })
              }}
              isMobileDrawer
              onCloseMobileDrawer={() => setIsMobileNavigatorOpen(false)}
            />
          )}

          {/* Focused Question Workspace Canvas */}
          <main className="flex-1 min-w-0 space-y-6">
            {validationError && (
              <div className="p-4 rounded-2xl bg-amber-950/60 border border-amber-500/50 text-amber-200 text-xs font-semibold flex items-center justify-between gap-3 shadow-lg animate-in fade-in duration-200">
                <div className="flex items-center gap-2.5">
                  <Icon name="alertCircle" className="w-5 h-5 text-amber-400 flex-shrink-0" />
                  <span>{validationError}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setValidationError(null)}
                  className="text-amber-400 hover:text-white p-1"
                >
                  <Icon name="x" className="w-4 h-4" />
                </button>
              </div>
            )}

            {activeAspect && (
              <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 flex items-center justify-between shadow-sm">
                <div className="space-y-0.5">
                  <span className="text-[10px] text-cyan-400 font-mono font-bold uppercase tracking-wider">
                    Aspek {currentAspectIndex >= 0 ? currentAspectIndex + 1 : 1} dari {aspects.length}
                  </span>
                  <h2 className="text-sm font-bold text-slate-100">{activeAspect.title}</h2>
                </div>
                {activeAspect.description && (
                  <span className="text-xs text-slate-400 hidden sm:inline line-clamp-1">
                    {activeAspect.description}
                  </span>
                )}
              </div>
            )}

            {/* View Mode Canvas Rendering */}
            {viewMode === 'aspect_all' ? (
              /* Mode All Questions in Aspect */
              <div className="space-y-6">
                <FormPublicRenderer
                  questions={activeAspectQuestions.length > 0 ? activeAspectQuestions : [activeQuestion]}
                  answers={answers}
                  onAnswerChange={(qId, val) => handleAnswersChange(qId, val)}
                  allQuestions={questions}
                />

                <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-between gap-3 flex-wrap shadow-lg">
                  <button
                    type="button"
                    onClick={() => {
                      if (!isFirstAspect) {
                        const prevAspect = aspects[currentAspectIndex - 1]
                        const firstQ = questions.findIndex(
                          (q: any) => ((q as any).aspectId || (q as any).stageId || 'default') === prevAspect.aspectId
                        )
                        if (firstQ >= 0) setCurrentQuestionIndex(firstQ)
                      }
                      window.scrollTo({ top: 0, behavior: 'smooth' })
                    }}
                    disabled={isFirstAspect}
                    className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-200 text-xs font-bold transition-all flex items-center gap-1.5"
                  >
                    <Icon name="arrowLeft" className="w-4 h-4" />
                    <span>Aspek Sebelumnya</span>
                  </button>

                  {isLastAspect ? (
                    <button
                      type="button"
                      onClick={() => {
                        handleGoToReview()
                        window.scrollTo({ top: 0, behavior: 'smooth' })
                      }}
                      className="px-6 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-extrabold shadow-lg shadow-cyan-600/25 flex items-center gap-2 transition-all cursor-pointer"
                    >
                      <span>Tinjau & Kirim Jawaban</span>
                      <Icon name="arrowRight" className="w-4 h-4" />
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => {
                        const nextAspect = aspects[currentAspectIndex + 1]
                        const firstQ = questions.findIndex(
                          (q: any) => ((q as any).aspectId || (q as any).stageId || 'default') === nextAspect.aspectId
                        )
                        if (firstQ >= 0) setCurrentQuestionIndex(firstQ)
                        window.scrollTo({ top: 0, behavior: 'smooth' })
                      }}
                      className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
                    >
                      <span>Aspek Selanjutnya</span>
                      <Icon name="arrowRight" className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            ) : (
              /* Mode Single Question */
              <div className="space-y-6">
                {activeQuestion ? (
                  <FormPublicRenderer
                    questions={[activeQuestion]}
                    answers={answers}
                    onAnswerChange={(qId, val) => handleAnswersChange(qId, val)}
                    allQuestions={questions}
                  />
                ) : (
                  <div className="p-8 text-center text-xs text-slate-400 bg-slate-900 rounded-2xl border border-slate-800">
                    Tidak ada pertanyaan pada indeks ini.
                  </div>
                )}

                {/* Previous / Next Controls Bar */}
                <div className="flex items-center justify-between pt-4 border-t border-slate-800/80">
                  <button
                    type="button"
                    onClick={() => {
                      setCurrentQuestionIndex((prev) => Math.max(0, prev - 1))
                      window.scrollTo({ top: 0, behavior: 'smooth' })
                    }}
                    disabled={isFirstQuestion}
                    className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 disabled:opacity-40 text-slate-300 text-xs font-semibold border border-slate-800 flex items-center gap-1.5 transition-colors"
                  >
                    <Icon name="arrowLeft" className="w-4 h-4" />
                    <span>Sebelumnya</span>
                  </button>

                  {isLastQuestion ? (
                    <button
                      type="button"
                      onClick={handleGoToReview}
                      className="px-6 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-extrabold shadow-lg shadow-cyan-600/25 flex items-center gap-2 transition-all"
                    >
                      <span>Tinjau Jawaban</span>
                      <Icon name="arrowRight" className="w-4 h-4" />
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => {
                        setCurrentQuestionIndex((prev) => Math.min(questions.length - 1, prev + 1))
                        window.scrollTo({ top: 0, behavior: 'smooth' })
                      }}
                      className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-cyan-300 text-xs font-semibold border border-slate-800 flex items-center gap-1.5 transition-colors"
                    >
                      <span>Selanjutnya</span>
                      <Icon name="arrowRight" className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            )}
          </main>
        </div>
      </div>
    )
  }

  const landingQuestions = form?.version?.questions || form?.questions || []
  const rawLandingAspects = form?.version?.aspects || form?.aspects || []
  const landingAspects = resolveFormAspects(rawLandingAspects, landingQuestions)

  // STEP 1: RESPONDENT ENTRY LANDING
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-4 sm:p-6 font-sans">
      <div className="max-w-xl w-full rounded-3xl bg-slate-900 border border-slate-800 p-6 sm:p-8 space-y-6 shadow-2xl">
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 shadow-sm">
              <Icon name="fileText" className="w-6 h-6" />
            </div>
            <div>
              <span className="text-[10px] font-mono text-cyan-400 uppercase font-bold tracking-wider">
                Instrumen Evaluasi Resmi BPOM
              </span>
              <h1 className="text-lg font-bold text-slate-100">{title}</h1>
            </div>
          </div>
          <span className="font-mono text-cyan-300 font-extrabold text-xs px-3 py-1 rounded-xl bg-cyan-950 border border-cyan-500/40">
            {code}
          </span>
        </div>

        <div className="space-y-4">
          <p className="text-xs text-slate-300 leading-relaxed bg-slate-950 p-4 rounded-2xl border border-slate-800/80">
            {description || 'Silakan isi formulir penilaian di bawah ini sesuai dengan kondisi riil di lapangan.'}
          </p>

          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 space-y-0.5">
              <span className="text-[10px] text-slate-500 uppercase font-mono">Penyelenggara / Pemilik</span>
              <p className="font-semibold text-slate-200 truncate">{ownerName}</p>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 space-y-0.5">
              <span className="text-[10px] text-slate-500 uppercase font-mono">Struktur Soal</span>
              <p className="font-semibold text-cyan-300 font-mono">
                {landingAspects.length} Aspek • {landingQuestions.length} Pertanyaan
              </p>
            </div>
          </div>
        </div>

        <div className="pt-2 flex flex-col sm:flex-row items-center gap-3 justify-between border-t border-slate-800">
          <span className="text-[11px] text-slate-500 font-mono">
            Versi Instrumen: v{resolvedVersionNumber}
          </span>

          <button
            type="button"
            onClick={handleStartSession}
            disabled={isStartingSession}
            className="w-full sm:w-auto px-6 py-3 rounded-2xl bg-cyan-600 hover:bg-cyan-500 disabled:bg-slate-800 text-white text-xs font-extrabold shadow-lg shadow-cyan-600/25 flex items-center justify-center gap-2 transition-all"
          >
            {isStartingSession ? (
              <>
                <Icon name="loader" className="w-4 h-4 animate-spin" />
                <span>Memulai Sesi...</span>
              </>
            ) : (
              <>
                <span>Mulai Pengisian Formulir</span>
                <Icon name="arrowRight" className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}