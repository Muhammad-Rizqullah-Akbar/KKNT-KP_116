// Shared deterministic helpers reused by fetchWidgetData, getWidgetChartData,
// getRespondentAspects, and computeAccountingForStack.

export const cleanString = (str: string) => str.toLowerCase().replace(/[^a-z0-9]/g, '').trim()

// Pemetaan jawaban mentah ke ID pertanyaan (flatten object & ID)
export function mapAnswersToQuestionIds(rawAnswers: Record<string, any>, form: any): Record<string, any> {
  if (!form || !form.questions) return rawAnswers
  const mapped: Record<string, any> = {}
  const questionById: Record<string, any> = {}
  const questionByLabel: Record<string, any> = {}
  const questionByCleanLabel: Record<string, any> = {}

  form.questions.forEach((q: any) => {
    if (q.id) questionById[q.id] = q
    if (q.questionId) questionById[q.questionId] = q
    const label = (q.question || q.prompt || q.title || q.label || '').trim()
    if (label) {
      questionByLabel[label] = q
      questionByCleanLabel[cleanString(label)] = q
    }
  })

  for (const [key, value] of Object.entries(rawAnswers)) {
    let q = questionByLabel[key] || questionByCleanLabel[cleanString(key)] || questionById[key]
    if (!q) {
      for (const [lbl, ques] of Object.entries(questionByLabel)) {
        if (key.includes(lbl) || cleanString(key).includes(cleanString(lbl))) {
          q = ques
          break
        }
      }
    }
    if (q) {
      const type = q.answerType || q.type || 'short-text'
      if ((type === 'indicator-table' || type === 'likert') && typeof value === 'object' && value !== null && !Array.isArray(value)) {
        const indicators = q.config?.indicators || q.presentation?.indicators || q.indicators || []
        const statements = q.config?.statements || q.options || []
        const rows = indicators.length > 0 ? indicators.map((ind: any) => ind.label || ind) : statements
        for (const [rowLabel, rowVal] of Object.entries(value)) {
          const rowIndex = rows.findIndex((rStr: string) => rStr === rowLabel || cleanString(rStr) === cleanString(rowLabel))
          if (rowIndex !== -1) {
            mapped[`${q.id || q.questionId}-${rowIndex}`] = rowVal
          }
        }
      } else {
        mapped[q.id || q.questionId] = value
      }
    } else {
      mapped[key] = value
    }
  }
  return mapped
}

// Helper: 4-Tier Deterministic Form Matcher (Plek Ketiplek Data Responden Engine)
export function findMatchingForm(response: any, formsList: any[]): any | null {
  if (!formsList || formsList.length === 0 || !response) return null

  // Tier 1: Direct ID Match (formId / id / docId)
  if (response.formId) {
    const match = formsList.find(
      (f) => f.id === response.formId || f.formId === response.formId || f.docId === response.formId
    )
    if (match) return match
  }

  // Tier 2: Code & Distribution Match (code, distributionCode, formCode, pretestCode, posttestCode)
  const codeToMatch = (response.distributionCode || response.formCode || response.code || '').trim().toUpperCase()
  if (codeToMatch) {
    const match = formsList.find((f) => {
      const fCode = (f.code || f.formCode || f.normalizedCode || '').trim().toUpperCase()
      const fPre = (f.pretestCode || '').trim().toUpperCase()
      const fPost = (f.posttestCode || '').trim().toUpperCase()
      const fDist = (f.embeddedDistributionCode || '').trim().toUpperCase()
      return (fCode && fCode === codeToMatch) || (fPre && fPre === codeToMatch) || (fPost && fPost === codeToMatch) || (fDist && fDist === codeToMatch)
    })
    if (match) return match
  }

  // Tier 3: Question Content / Prompt Overlap Matching (100% Deterministic)
  if (response.answers && typeof response.answers === 'object') {
    const answerKeys = Object.keys(response.answers)
    if (answerKeys.length > 0) {
      let bestMatch: any = null
      let maxOverlap = 0

      formsList.forEach((f) => {
        if (!f.questions || !Array.isArray(f.questions)) return
        let overlapCount = 0

        f.questions.forEach((q: any) => {
          const qId = q.id || q.questionId
          const qPrompt = (q.question || q.prompt || q.title || q.label || '').trim().toLowerCase()

          answerKeys.forEach((ansKey) => {
            const cleanAnsKey = ansKey.trim().toLowerCase()
            if (
              (qId && (ansKey === qId || cleanAnsKey === qId.toLowerCase())) ||
              (qPrompt && cleanAnsKey.length > 3 && (cleanAnsKey.includes(qPrompt) || qPrompt.includes(cleanAnsKey)))
            ) {
              overlapCount++
            }
          })
        })

        if (overlapCount > maxOverlap) {
          maxOverlap = overlapCount
          bestMatch = f
        }
      })

      if (bestMatch && maxOverlap > 0) return bestMatch
    }
  }

  // Tier 4: Exact Title Match
  if (response.formTitle) {
    const cleanRespTitle = response.formTitle.trim().toLowerCase()
    const match = formsList.find((f) => {
      const fTitle = (f.title || f.metadata?.title || '').trim().toLowerCase()
      return fTitle && (fTitle === cleanRespTitle || fTitle.includes(cleanRespTitle) || cleanRespTitle.includes(fTitle))
    })
    if (match) return match
  }

  return null
}

// Helper to identify biodata aspects
export function isBiodataAspect(title: string) {
  const clean = title.toLowerCase().trim()
  return (
    clean.includes('data responden') ||
    clean.includes('sumber informasi') ||
    clean.includes('biodata') ||
    clean.includes('identitas')
  )
}
