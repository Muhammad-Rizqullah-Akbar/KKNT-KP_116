'use client'

// Per-question item analysis — menilai jawaban vs kunci jawaban (correctAnswer formDocument).
// Dipisah dari use-widgets-derivations.ts untuk menjaga file tetap < 500 LOC.

export interface ItemAnalysisQuestion {
  id: string
  text: string
  formTitle: string
  formId: string
  questionId: string
  answerType: string
  correctAnswer: any
  totalAnswers: number
  pretestPass: number
  posttestPass: number
  delta: number
  difficulty: string
  status: string
}

const isScorable = (q: any): boolean => {
  const t = (q.answerType || q.type || '').toLowerCase()
  if (t.startsWith('biodata-')) return false
  // identifierType = 'name'/'email' (biodata). 'none'/'' = bukan identifier.
  const idType = (q.identifierType || '').toLowerCase()
  if (idType && idType !== 'none') return false
  if (q.biodataKey) return false
  if (t === 'number') return false
  if (t === 'short-text' || t === 'long-text' || t === 'text' || t === 'textarea' || t === 'date') return false
  if (t === 'file-upload' || t === 'image' || t === 'signature') return false
  const hasCorrect = q.config?.correctAnswer ?? q.correctAnswer ?? q.answerKey ?? undefined
  if (hasCorrect === undefined || hasCorrect === null || hasCorrect === '') return false
  return true
}

const isAnswerCorrect = (answerType: string, correctAnswer: any, val: any): boolean => {
  if (correctAnswer === undefined || correctAnswer === null || correctAnswer === '') return false
  if (Array.isArray(correctAnswer) && correctAnswer.length === 0) return false

  if (answerType === 'multiple-choice') {
    const correctSet = new Set((Array.isArray(correctAnswer) ? correctAnswer : [correctAnswer]).map((c) => String(c).trim()))
    const selected = Array.isArray(val) ? val : [val]
    if (selected.length === 0) return false
    const selectedSet = new Set(selected.map((s) => String(s).trim()))
    if (selectedSet.size !== correctSet.size) return false
    for (const s of selectedSet) {
      if (!correctSet.has(s)) return false
    }
    return true
  }

  return String(val).trim() === String(correctAnswer).trim()
}

export function computeItemQuestionAnalysis(
  activeStackObj: any,
  forms: any[],
  v15Forms: any[],
  responses: any[],
  itemAnalysisFormFilter: string,
): ItemAnalysisQuestion[] {
  const questionList: { id: string; text: string; formTitle: string; formId: string; questionId: string; answerType: string; correctAnswer: any }[] = []

  v15Forms.forEach((f) => {
    const isSelected =
      itemAnalysisFormFilter === 'all'
        ? activeStackObj.pretestFormId === 'all' ||
          activeStackObj.posttestFormId === 'all' ||
          f.formId === activeStackObj.pretestFormId ||
          f.formId === activeStackObj.posttestFormId
        : f.formId === itemAnalysisFormFilter
    if (isSelected) {
      f.questions?.forEach((q: any) => {
        if (!isScorable(q)) return
        const text = q.title || q.question || 'Pertanyaan Evaluasi'
        questionList.push({
          id: `q-v15-${q.id || q.questionId}`,
          text,
          formTitle: f.metadata?.title || 'Form',
          formId: f.formId,
          questionId: q.id || q.questionId,
          answerType: q.answerType || q.type || 'short-text',
          correctAnswer: q.config?.correctAnswer ?? q.correctAnswer ?? q.answerKey ?? undefined,
        })
      })
    }
  })

  forms.forEach((f) => {
    const isSelected =
      itemAnalysisFormFilter === 'all'
        ? activeStackObj.pretestFormId === 'all' ||
          activeStackObj.posttestFormId === 'all' ||
          f.id === activeStackObj.pretestFormId ||
          f.id === activeStackObj.posttestFormId
        : f.id === itemAnalysisFormFilter
    if (isSelected) {
      f.questions?.forEach((q: any) => {
        if (!isScorable(q)) return
        const text = q.question || q.label || 'Pertanyaan Evaluasi'
        questionList.push({
          id: `q-v10-${q.id}`,
          text,
          formTitle: f.title || 'Form',
          formId: f.id || f.code || '',
          questionId: q.id,
          answerType: q.answerType || q.type || 'short-text',
          correctAnswer: q.config?.correctAnswer ?? q.correctAnswer ?? q.answerKey ?? undefined,
        })
      })
    }
  })

  return questionList.map((qItem) => {
    let totalAnswers = 0
    let validPassAnswers = 0

    responses.forEach((r: any) => {
      if (!r.answers) return
      Object.entries(r.answers).forEach(([key, val]) => {
        const isMatch =
          key === qItem.text ||
          key === qItem.questionId ||
          key.toLowerCase().includes(qItem.text.toLowerCase().trim())

        if (isMatch && val !== undefined && val !== null && String(val).trim() !== '') {
          totalAnswers++
          if (isAnswerCorrect(qItem.answerType, qItem.correctAnswer, val)) {
            validPassAnswers++
          }
        }
      })
    })

    const posttestPass = totalAnswers > 0 ? Math.round((validPassAnswers / totalAnswers) * 100) : 0
    const pretestPass = posttestPass
    const delta = posttestPass - pretestPass

    const difficulty = posttestPass < 50 ? 'Tingkat Tinggi' : posttestPass < 75 ? 'Sedang' : 'Mudah'
    const status =
      totalAnswers === 0
        ? 'Belum Ada Respon'
        : posttestPass >= 75
        ? 'Sangat Dipahami'
        : posttestPass >= 50
        ? 'Cukup Dipahami'
        : 'Perlu Penyuluhan Ulang'

    return {
      ...qItem,
      totalAnswers,
      pretestPass,
      posttestPass,
      delta,
      difficulty,
      status,
    }
  })
}
