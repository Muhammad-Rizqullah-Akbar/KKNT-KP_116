import { getForms } from '@/lib/repositories/forms.repo'
import { extractRespondentName, extractRespondentEmail } from '@/lib/domain/responses/respondent-utils'
import { safeFetchJson } from '@/lib/infra/safe-fetch'
import { resolveOptionLabel } from '@/lib/domain/answers/normalizer'
import type { WidgetItem, WidgetCmsData, ChartData } from './widgets-types'
import { COLOR_SCHEMES } from './widgets-types'
import { findMatchingForm } from './widgets-form-matcher'

/**
 * Batas jumlah response yang dianalisis widget. Grafik tetap akurat untuk
 * pola umum, tetapi tidak membaca seluruh koleksi saat data membesar.
 */
const WIDGET_RESPONSE_LIMIT = 100

// Fetch & transform all widget CMS data from database (was previously inline loadWidgetData)
export async function fetchWidgetData(): Promise<WidgetCmsData> {
  // COST: satu sumber response saja. Sebelumnya `getAllResponses()` dan
  // `/api/responses` dipanggil bersamaan -> setiap response dibaca 2x dari Firestore.
  const [v10Data, v15Res, usersRes, v15RespRes] = await Promise.all([
    getForms().catch(() => []),
    safeFetchJson('/api/forms'),
    safeFetchJson('/api/auth/users'),
    // BIAYA: pakai jalur terfilter + limit, bukan seluruh koleksi.
    // `includeAnswers=true` karena grafik membutuhkan jawaban responden.
    safeFetchJson(`/api/responses?paged=true&limit=${WIDGET_RESPONSE_LIMIT}&status=all&includeAnswers=true`),
  ])

  const rawCombined: any[] =
    v15RespRes.ok && v15RespRes.data && Array.isArray(v15RespRes.data.responses)
      ? [...v15RespRes.data.responses]
      : []

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

  // Transform responses — pakai result yang SUDAH di-compute di DB (bukan scoring ulang)
  const transformedResponses = uniqueResponses.map((r: any) => {
    const form = findMatchingForm(r, v10Data)

    // Skor final: prefer result.percentage (authoritative, sudah di-compute via scoring engine formDocument)
    const storedScore =
      typeof r.result?.percentage === 'number' && r.result.percentage > 0
        ? r.result.percentage
        : typeof r.score === 'number' && r.score > 0
        ? r.score
        : typeof r.totalScore === 'number' && r.totalScore > 0
        ? r.totalScore
        : null

    const finalScore = storedScore !== null ? Math.round(storedScore) : 0

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

  // Process questions from Database
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
          formTitle: form.title || 'Formulir',
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

  // Process questions from Database
  v15Forms.forEach((f15: any) => {
    f15.questions?.forEach((q: any, qIdx: number) => {
      const qTitle = q.title || q.question || 'Pertanyaan Evaluasi'
      const assignedType: 'bar' | 'pie' | 'line' | 'number' | 'matrix' =
        qIdx % 4 === 0 ? 'bar' : qIdx % 4 === 1 ? 'pie' : qIdx % 4 === 2 ? 'line' : 'matrix'

      dynamicWidgets.push({
        id: `widget-v15-${q.id || crypto.randomUUID()}`,
        name: `${f15.metadata?.title || 'Form'}: ${qTitle}`,
        formId: f15.formId,
        formTitle: f15.metadata?.title || 'Form',
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
  // Delegate to formDocument normalizer (single source of truth).
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

  // BATAS KATEGORI: grafik hanya menampilkan maksimal 12 kategori terbesar;
  // sisanya digabung menjadi "Lainnya". Ini menjaga payload & render tetap
  // ringan saat jumlah jawaban unik bertambah besar.
  const MAX_CATEGORIES = 12
  if (labels.length > MAX_CATEGORIES) {
    const pairs = labels.map((l, i) => ({ label: l, value: values[i] }))
    pairs.sort((a, b) => b.value - a.value)
    const top = pairs.slice(0, MAX_CATEGORIES - 1)
    const restTotal = pairs.slice(MAX_CATEGORIES - 1).reduce((sum, p) => sum + p.value, 0)
    return {
      labels: [...top.map((p) => p.label), `Lainnya (${pairs.length - MAX_CATEGORIES + 1} kategori)`],
      values: [...top.map((p) => p.value), restTotal],
      isMock: false,
    }
  }

  return { labels, values, isMock: false }
}
