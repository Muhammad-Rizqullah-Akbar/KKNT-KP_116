'use client'

import React, { useEffect, useState, useRef, use } from 'react'
import Link from 'next/link'
import { PublicReviewScreen } from '@/features/form-builder/components/preview/PublicReviewScreen'
import { PublicCompletionReceipt } from '@/features/form-builder/components/preview/PublicCompletionReceipt'
import type { PublicDistributionDTO, PublicResponseSessionDTO } from '@/lib/domain/distributions/distribution-types'
import { Icon } from '@/components/ui/Icons'

import { resolveFormAspects } from './form-aspects'
import { checkUnansweredQuestions, extractBiodata } from './form-questions'
import { FillingView } from './filling-view'
import { LandingView } from './landing-view'

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
      const res = await fetch(`/api/public/distributions/${code}`)
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
      const res = await fetch('/api/responses/start', {
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
  const checkUnanswered = () => {
    if (!sessionData) return []
    const questions = sessionData.form?.version?.questions || sessionData.form?.questions || []
    return checkUnansweredQuestions(questions, answers)
  }

  // Proceed to Review Step with Strict Completion Check
  const handleGoToReview = () => {
    const unanswered = checkUnanswered()
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

    const unanswered = checkUnanswered()
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
      const res = await fetch(`/api/responses/${sessionData.responseId}/submit`, {
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
      const extractedBiodata = extractBiodata(questionsList, aspectsList, answers)

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

    return (
      <FillingView
        code={code}
        title={title}
        resolvedVersionNumber={resolvedVersionNumber}
        questions={questions}
        aspects={aspects}
        currentQuestionIndex={currentQuestionIndex}
        answers={answers}
        viewMode={viewMode}
        isMobileNavigatorOpen={isMobileNavigatorOpen}
        validationError={validationError}
        onToggleViewMode={(mode) => setViewMode(mode)}
        onToggleNavigator={() => setIsMobileNavigatorOpen((prev) => !prev)}
        onCloseMobileDrawer={() => setIsMobileNavigatorOpen(false)}
        onSelectQuestionIndex={(idx) => setCurrentQuestionIndex(idx)}
        onAnswerChange={(qId, val) => handleAnswersChange(qId, val)}
        onDismissError={() => setValidationError(null)}
        onGoToReview={handleGoToReview}
      />
    )
  }

  const landingQuestions = form?.version?.questions || form?.questions || []
  const rawLandingAspects = form?.version?.aspects || form?.aspects || []
  const landingAspects = resolveFormAspects(rawLandingAspects, landingQuestions)

  // STEP 1: RESPONDENT ENTRY LANDING
  return (
    <LandingView
      code={code}
      title={title}
      description={description}
      ownerName={ownerName}
      resolvedVersionNumber={resolvedVersionNumber}
      aspects={landingAspects}
      questionCount={landingQuestions.length}
      isStartingSession={isStartingSession}
      onStartSession={handleStartSession}
    />
  )
}
