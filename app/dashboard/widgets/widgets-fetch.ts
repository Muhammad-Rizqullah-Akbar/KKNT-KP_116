import { getAllResponses, getForms } from '@/lib/repositories/forms.repo'
import { extractRespondentName, extractRespondentEmail } from '@/lib/domain/responses/respondent-utils'
import { safeFetchJson } from '@/lib/infra/safe-fetch'
import { resolveOptionLabel } from '@/lib/domain/answers/normalizer'
import type { WidgetItem, WidgetCmsData, ChartData } from './widgets-types'
import { COLOR_SCHEMES } from './widgets-types'
import { mapAnswersToQuestionIds, findMatchingForm } from './widgets-form-matcher'

// Fetch & transform all widget CMS data from database (was previously inline loadWidgetData)
export async function fetchWidgetData(): Promise<WidgetCmsData> {
  const [resData, v10Data, v15Res, usersRes, v15RespRes] = await Promise.all([
    getAllResponses().catch(() => []),
    getForms().catch(() => []),
    safeFetchJson('/api/forms'),
    safeFetchJson('/api/auth/users'),
    safeFetchJson('/api/responses'),
  ])

  const { ScoringEngine } = await import('@/lib/domain/scoring/preview-engine')

  let rawCombined: any[] = Array.isArray(resData) ? [...resData] : []
  if (v15RespRes.ok && v15RespRes.data && Array.isArray(v15RespRes.data.responses)) {
    rawCombined = [...rawCombined, ...v15RespRes.data.responses]
  }

  // DEDUPLICATE BY UNIQUE RESPONSE ID TO PREVENT 2X OVERCOUNTING
  const responseMap = new Map<string, any>()
  rawCombined.forEach((r) => {
    const id = r.responseId || r.id || r.docId
    if (id && !responseMap.has(id)) {
      responseMap.set(id, r)
    } else if (!id) {
      responseMap.set(JSON.stringify(r.answers || {}) + (r.submittedAt || ''), r)
    }
  })
  const uniqueResponses = Array.from(responseMap.values())

  // Transform responses with exact Data Responden score calculation engine
  const transformedResponses = uniqueResponses.map((r: any) => {
    const form = findMatchingForm(r, v10Data)
    const mappedAnswers = mapAnswersToQuestionIds(r.answers || {}, form || null)

    let calculatedScore = 0
    if (form && form.questions && form.questions.length > 0) {
      try {
        const questionsWithScoring = form.questions.map((q: any) => {
          const type = q.answerType || q.type || 'short-text'
          let scheme: 'none' | 'binary' | 'likert' | 'rating' | 'indicator' = 'none'
          if (type === 'single-choice' || type === 'dropdown' || type === 'binary' || type === 'multiple-choice') scheme = 'binary'
          else if (type === 'indicator-table' || type === 'likert') scheme = 'indicator'
          else if (type === 'rating') scheme = 'rating'
          return { ...q, scoring: q.scoring || { scheme, weight: 1 } }
        })

        const scoring = form.scoring || { totalPoints: 100, mode: 'auto', distribution: {}, overrides: {}, allowOverride: true, autoBalance: true }
        const validation = form.validation || { mode: 'all_required', exceptions: [], allowOverride: true }
        const stages = form.stages && form.stages.length > 0 ? form.stages : [{ id: 'default', name: 'Semua Pertanyaan', order: 0, questionIds: form.questions.map((q: any) => q.id), includeInScoring: true }]

        const engine = new ScoringEngine(questionsWithScoring, scoring, validation, stages)
        const result = engine.calculateScore(mappedAnswers)
        if (result && typeof result.percentage === 'number' && !isNaN(result.percentage)) {
          calculatedScore = Math.round(result.percentage)
        }
      } catch {}
    }

    const storedScore =
      typeof r.score === 'number' && r.score > 0
        ? r.score
        : typeof r.result?.percentage === 'number' && r.result.percentage > 0
        ? r.result.percentage
        : typeof r.totalScore === 'number' && r.totalScore > 0
        ? r.totalScore
        : null

    const finalScore = storedScore !== null ? storedScore : calculatedScore

    const respondentName = extractRespondentName(r, form)
    const respondentEmail = extractRespondentEmail(r, form)
    const resolvedFormTitle = form?.title || form?.metadata?.title || r.formTitle || 'Formulir Tanpa Judul'
    const formCode = r.formCode || form?.code || r.distributionCode || ''

    return {
      ...r,
      score: finalScore,
      matchedForm: form,
      respondentName,
      respondentEmail,
      formTitle: resolvedFormTitle,
      formCode,
    }
  })

  const v15Forms: any[] = []
  if (v15Res.ok && v15Res.data && Array.isArray(v15Res.data.forms)) {
    v15Forms.push(...v15Res.data.forms)
  }

  const users: any[] = []
  if (usersRes.ok && usersRes.data && Array.isArray(usersRes.data.users)) {
    users.push(...usersRes.data.users)
  }

  // Generate Dynamic Widgets from REAL questions in database
  const dynamicWidgets: WidgetItem[] = []
  let positionCounter = 0

  // Process V1.0 Questions from Database
  v10Data.forEach((form) => {
    form.questions?.forEach((q: any, qIdx: number) => {
      const type = q.answerType || q.type || 'short-text'
      if (['single-choice', 'multiple-choice', 'dropdown', 'indicator-table', 'likert', 'rating', 'binary'].includes(type)) {
        const qTitle = q.question || q.label || 'Pertanyaan Evaluasi'

        const assignedType: 'bar' | 'pie' | 'line' | 'number' | 'matrix' =
          type === 'indicator-table' || type === 'likert'
            ? 'matrix'
            : type === 'rating'
            ? 'number'
            : qIdx % 3 === 0
            ? 'bar'
            : qIdx % 3 === 1
            ? 'pie'
            : 'line'

        dynamicWidgets.push({
          id: `widget-v10-${q.id}`,
          name: `${form.title}: ${qTitle}`,
          formId: form.id || 'v10-form',
          formTitle: form.title || 'Formulir V1.0',
          questionId: q.id,
          questionText: qTitle,
          chartType: assignedType,
          enabled: positionCounter < 6,
          position: positionCounter++,
          config: {
            title: qTitle,
            colorScheme: COLOR_SCHEMES[positionCounter % COLOR_SCHEMES.length].id,
            showLegend: true,
          },
        })
      }
    })
  })

  // Process V1.5 Questions from Database
  v15Forms.forEach((f15: any) => {
    f15.questions?.forEach((q: any, qIdx: number) => {
      const qTitle = q.title || q.question || 'Pertanyaan V1.5'
      const assignedType: 'bar' | 'pie' | 'line' | 'number' | 'matrix' =
        qIdx % 4 === 0 ? 'bar' : qIdx % 4 === 1 ? 'pie' : qIdx % 4 === 2 ? 'line' : 'matrix'

      dynamicWidgets.push({
        id: `widget-v15-${q.id || crypto.randomUUID()}`,
        name: `[V1.5] ${f15.metadata?.title || 'Form V1.5'}: ${qTitle}`,
        formId: f15.formId,
        formTitle: f15.metadata?.title || 'Form V1.5',
        questionId: q.id || q.questionId,
        questionText: qTitle,
        chartType: assignedType,
        enabled: positionCounter < 8,
        position: positionCounter++,
        config: {
          title: qTitle,
          colorScheme: COLOR_SCHEMES[positionCounter % COLOR_SCHEMES.length].id,
          showLegend: true,
        },
      })
    })
  })

  return {
    responses: transformedResponses,
    forms: v10Data,
    v15Forms,
    users,
    dynamicWidgets,
  }
}

// HELPER TO RESOLVE OPTION CODE/ID TO HUMAN-READABLE TEXT LABEL
function resolveOptionText(val: any, questionObj?: any): string {
  if (val === undefined || val === null || val === '') return ''
  // Delegate to canonical normalizer (single source of truth).
  const resolved = resolveOptionLabel(questionObj, val)
  if (resolved && resolved !== String(val).trim()) return resolved
  return String(val).trim()
}

// Calculate REAL Answer Frequencies Directly From Database Responses
export function getWidgetChartData(widget: WidgetItem, responses: any[], forms: any[], v15Forms: any[]): ChartData {
  const targetResponses = responses.filter((r) => !widget.formId || r.formId === widget.formId || (r as any).metadata?.formId === widget.formId)
  const counts: Record<string, number> = {}

  let questionObj: any = null
  v15Forms.forEach((f) => {
    f.questions?.forEach((q: any) => {
      if (q.id === widget.questionId || q.title === widget.questionText) questionObj = q
    })
  })
  if (!questionObj) {
    forms.forEach((f) => {
      f.questions?.forEach((q: any) => {
        if (q.id === widget.questionId || q.question === widget.questionText) questionObj = q
      })
    })
  }

  targetResponses.forEach((r) => {
    if (r.answers) {
      Object.entries(r.answers).forEach(([key, val]) => {
        const isMatch =
          key === widget.questionText ||
          key === widget.questionId ||
          key.toLowerCase().includes((widget.questionText || '').toLowerCase().trim())

        if (isMatch) {
          const addValue = (v: any) => {
            const labelText = resolveOptionText(v, questionObj)
            if (labelText && labelText.trim() !== '') {
              counts[labelText] = (counts[labelText] || 0) + 1
            }
          }

          if (typeof val === 'string' || typeof val === 'number') {
            addValue(val)
          } else if (Array.isArray(val)) {
            val.forEach(addValue)
          } else if (typeof val === 'object' && val !== null) {
            Object.values(val).forEach(addValue)
          }
        }
      })
    }
  })

  const labels = Object.keys(counts)
  const values = labels.map((l) => counts[l])

  if (labels.length === 0) {
    return { labels: ['Belum Ada Respon Terdaftar'], values: [0], isMock: false }
  }

  return { labels, values, isMock: false }
}
