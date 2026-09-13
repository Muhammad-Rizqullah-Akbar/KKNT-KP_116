// ============ HELPER MURNI & KONSTANTA (dibagi antar sub-komponen overview) ============

export const colorSchemes: Record<string, string[]> = {
  cyan: ['#06b6d4', '#22d3ee', '#67e8f9', '#a5f3fc', '#cffafe'],
  violet: ['#8b5cf6', '#a78bfa', '#c4b5fd', '#ddd6fe', '#ede9fe'],
  emerald: ['#10b981', '#34d399', '#6ee7b7', '#a7f3d0', '#d1fae5'],
  amber: ['#f59e0b', '#fbbf24', '#fcd34d', '#fde68a', '#fef3c7'],
  rose: ['#f43f5e', '#fb7185', '#fda4af', '#fecdd3', '#ffe4e6'],
  blue: ['#3b82f6', '#60a5fa', '#93c5fd', '#bfdbfe', '#dbeafe'],
}

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

// 3-tier form matcher (formId -> code -> formTitle), dipakai saat transformasi data query
export function findMatchingForm(response: any, formsList: any[]): any | null {
  if (response.formId) {
    const match = formsList.find((f) => f.id === response.formId || f.formId === response.formId || f.docId === response.formId)
    if (match) return match
  }
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

// 4-tier deterministic form matcher (Plek Ketiplek Data Responden Engine), dipakai di accounting stacks
export function findMatchingFormDeterministic(response: any, formsList: any[]): any | null {
  if (!formsList || formsList.length === 0 || !response) return null

  if (response.formId) {
    const match = formsList.find(
      (f) => f.id === response.formId || f.formId === response.formId || f.docId === response.formId
    )
    if (match) return match
  }

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

// Helper untuk mencocokkan response terhadap selectedFormId
export function matchSelectedForm(r: any, targetId: string): boolean {
  if (!targetId || targetId === 'all') return true
  const tId = String(targetId).toLowerCase().trim()

  if (r.formId) {
    const fId = String(r.formId).toLowerCase().trim()
    if (fId === tId || fId.includes(tId) || tId.includes(fId)) return true
  }

  const matchedForm = r.matchedForm
  if (matchedForm) {
    const fId = String(matchedForm.id || matchedForm.formId || '').toLowerCase().trim()
    const fCode = String(matchedForm.code || matchedForm.formCode || '').toLowerCase().trim()
    if (fId === tId || fCode === tId || fId.includes(tId) || tId.includes(fId)) return true
  }

  const rCode = String(r.distributionCode || r.formCode || r.code || r.id || '').toLowerCase().trim()
  return rCode === tId || (rCode !== '' && tId !== '' && (rCode.includes(tId) || tId.includes(rCode)))
}

// Extract score untuk statistik utama (score/percentage/result/totalScore)
export function extractScore(r: any): number | null {
  if (typeof r.score === 'number' && !isNaN(r.score) && r.score > 0) {
    return Math.min(100, Math.max(0, Math.round(r.score)))
  }
  if (typeof r.percentage === 'number' && !isNaN(r.percentage) && r.percentage > 0) {
    return Math.min(100, Math.max(0, Math.round(r.percentage)))
  }
  if (typeof r.result?.percentage === 'number' && !isNaN(r.result.percentage) && r.result.percentage > 0) {
    return Math.min(100, Math.max(0, Math.round(r.result.percentage)))
  }
  if (typeof r.totalScore === 'number' && !isNaN(r.totalScore) && r.totalScore > 0) {
    return Math.min(100, Math.max(0, Math.round(r.totalScore)))
  }
  return null
}

export function isV15Response(r: any): boolean {
  return (
    r.scoringEngineVersion === 'v1.5' ||
    r.result?.scoringEngineVersion === 'v1.5' ||
    Boolean(r.versionId && String(r.versionId).trim() !== '') ||
    Boolean(r.distributionCode && String(r.distributionCode).trim() !== '') ||
    r.v15 === true
  )
}

// matchFormId untuk accounting stacks (bergantung pada forms)
export function matchFormIdWithForms(r: any, targetId: string, forms: any[]): boolean {
  if (!targetId || targetId === 'all') return true
  const tId = String(targetId).toLowerCase().trim()

  const matchedForm = findMatchingFormDeterministic(r, forms)
  if (matchedForm) {
    const fId = String(matchedForm.id || '').toLowerCase().trim()
    const fCode = String(matchedForm.code || matchedForm.formCode || '').toLowerCase().trim()
    if (fId === tId || fCode === tId || fId.includes(tId) || tId.includes(fId)) return true
  }

  const rId = String(r.formId || r.metadata?.formId || r.distributionId || r.distributionCode || r.id || r.code || '').toLowerCase().trim()
  return rId === tId || (rId !== '' && tId !== '' && (rId.includes(tId) || tId.includes(rId)))
}

// Extract score deterministik untuk accounting stacks (termasuk evaluasi jawaban legacy)
export function extractScoreDeterministic(r: any): number | null {
  // Direct numeric scores
  if (typeof r.score === 'number' && !isNaN(r.score) && r.score > 0) {
    return Math.min(100, Math.max(0, Math.round(r.score)))
  }
  if (typeof r.totalScore === 'number' && !isNaN(r.totalScore) && r.totalScore > 0) {
    return Math.min(100, Math.max(0, Math.round(r.totalScore)))
  }
  if (typeof r.percentage === 'number' && !isNaN(r.percentage) && r.percentage > 0) {
    return Math.min(100, Math.max(0, Math.round(r.percentage)))
  }
  if (typeof r.result?.percentage === 'number' && !isNaN(r.result.percentage) && r.result.percentage > 0) {
    return Math.min(100, Math.max(0, Math.round(r.result.percentage)))
  }
  if (typeof r.result?.rawScore === 'number' && typeof r.result?.maximumScore === 'number' && r.result.maximumScore > 0) {
    const pct = (r.result.rawScore / r.result.maximumScore) * 100
    if (!isNaN(pct)) return Math.min(100, Math.max(0, Math.round(pct)))
  }

  // Answer evaluation for legacy or un-scored records
  if (r.answers && typeof r.answers === 'object') {
    const entries = Object.entries(r.answers)
    if (entries.length > 0) {
      let scoreSum = 0
      let validCount = 0
      entries.forEach(([_, val]) => {
        if (val === undefined || val === null) return
        if (typeof val === 'number') {
          scoreSum += val
          validCount++
        } else if (typeof val === 'string') {
          const lower = val.toLowerCase().trim()
          if (lower === 'ya' || lower === 'benar' || lower.includes('memenuhi') || lower === 'true' || lower === 's' || lower === 'ss' || lower === 'baik') {
            scoreSum += 100
            validCount++
          } else if (lower === 'tidak' || lower === 'salah' || lower.includes('tidak memenuhi') || lower === 'false' || lower === 'ts' || lower === 'sts' || lower === 'kurang') {
            scoreSum += 0
            validCount++
          }
        } else if (typeof val === 'object' && !Array.isArray(val)) {
          Object.values(val).forEach((subVal) => {
            if (typeof subVal === 'number') {
              scoreSum += subVal
              validCount++
            } else if (typeof subVal === 'string') {
              const lower = String(subVal).toLowerCase().trim()
              if (lower === 'ya' || lower === 'benar' || lower.includes('memenuhi') || lower === 'true' || lower === 's' || lower === 'ss' || lower === 'baik') {
                scoreSum += 100
                validCount++
              } else if (lower === 'tidak' || lower === 'salah' || lower.includes('tidak memenuhi') || lower === 'false' || lower === 'ts' || lower === 'sts' || lower === 'kurang') {
                scoreSum += 0
                validCount++
              }
            }
          })
        }
      })
      if (validCount > 0) {
        return Math.min(100, Math.max(0, Math.round(scoreSum / validCount)))
      }
    }
  }
  return null
}

export function getUniqueCount(list: any[]): number {
  const uSet = new Set<string>()
  list.forEach((r) => {
    const id =
      r.respondentId ||
      r.respondentEmail ||
      r.respondentName ||
      r.respondent?.email ||
      r.respondent?.name ||
      r.responseId ||
      r.id
    if (id) uSet.add(id)
  })
  return uSet.size
}

// Helper untuk identifikasi aspek biodata
export function isBiodataAspect(title: string): boolean {
  const clean = title.toLowerCase().trim()
  return (
    clean.includes('data responden') ||
    clean.includes('sumber informasi') ||
    clean.includes('biodata') ||
    clean.includes('identitas')
  )
}

// Ekstrak skor per-aspek untuk sebuah response (Aligned with Data Responden Engine)
export function getRespondentAspects(
  r: any,
  forms: any[],
): Array<{ aspectId: string; title: string; percentage: number }> {
  if (r.result?.aspects && Array.isArray(r.result.aspects) && r.result.aspects.length > 0) {
    const valid = r.result.aspects.filter((asp: any) => {
      const t = (asp.title || asp.name || '').trim()
      return t && t !== 'Semua Pertanyaan' && t !== 'default' && !isBiodataAspect(t)
    })
    if (valid.length > 0) {
      return valid.map((asp: any) => ({
        aspectId: asp.aspectId || asp.id,
        title: asp.title || asp.name || 'Aspek Penilaian',
        percentage: Math.round(asp.percentage ?? 0),
      }))
    }
  }

  if (r.scoringPerStage && typeof r.scoringPerStage === 'object') {
    const entries = Object.entries(r.scoringPerStage).filter(([id, st]: any) => {
      const name = (st.name || st.title || id).trim()
      return name && name !== 'Semua Pertanyaan' && name !== 'default' && id !== 'default' && !isBiodataAspect(name)
    })
    if (entries.length > 0) {
      return entries.map(([id, st]: any) => ({
        aspectId: id,
        title: st.name || st.title || id,
        percentage: Math.round(st.percentage ?? st.score ?? 0),
      }))
    }
  }

  const matchedForm = forms.find((f) => f.id === r.formId || f.title === r.formTitle) || r.matchedForm
  if (matchedForm && matchedForm.questions && Array.isArray(matchedForm.questions) && matchedForm.questions.length > 0) {
    const aspectGroups = new Map<string, { title: string; questionIds: string[] }>()

    matchedForm.questions.forEach((q: any) => {
      let aspectTitle = (q.aspectTitle || q.category || q.stageName || q.group || '').trim()
      if (!aspectTitle) {
        const prompt = (q.question || q.label || '').trim()
        const matchBracket = prompt.match(/^\[(.*?)\]/)
        if (matchBracket && matchBracket[1]) {
          aspectTitle = matchBracket[1].trim()
        } else if (prompt.includes(':')) {
          const prefix = prompt.split(':')[0].trim()
          if (prefix.length <= 30 && ['sikap', 'perilaku', 'pengetahuan', 'higiene', 'sanitasi', 'aspek'].some((k) => prefix.toLowerCase().includes(k))) {
            aspectTitle = prefix
          }
        }
      }

      if (aspectTitle && aspectTitle !== 'default' && aspectTitle !== 'Semua Pertanyaan' && !isBiodataAspect(aspectTitle)) {
        if (!aspectGroups.has(aspectTitle)) {
          aspectGroups.set(aspectTitle, { title: aspectTitle, questionIds: [q.id || q.questionId] })
        } else {
          aspectGroups.get(aspectTitle)!.questionIds.push(q.id || q.questionId)
        }
      }
    })

    if (aspectGroups.size > 0) {
      return Array.from(aspectGroups.values()).map((g) => {
        let scoreSum = 0
        let count = 0

        g.questionIds.forEach((qId) => {
          if (r.answers && typeof r.answers === 'object') {
            Object.entries(r.answers).forEach(([key, val]) => {
              if (key === qId || key.includes(qId)) {
                if (typeof val === 'number') {
                  scoreSum += val
                  count++
                } else if (typeof val === 'string') {
                  const str = val.toLowerCase().trim()
                  if (!str.includes('salah') && !str.includes('kurang') && !str.includes('tidak')) {
                    scoreSum += 100
                  }
                  count++
                }
              }
            })
          }
        })

        const pct = count > 0 ? Math.round(scoreSum / count) : Math.round(r.score || 75)
        return {
          aspectId: g.title,
          title: g.title,
          percentage: pct,
        }
      })
    }
  }

  const baseScore = typeof r.score === 'number' && r.score > 0 ? r.score : 75
  return [
    { aspectId: 'pengetahuan', title: 'Aspek Pengetahuan', percentage: Math.round(baseScore) },
    { aspectId: 'sikap', title: 'Aspek Sikap', percentage: Math.round(baseScore) },
    { aspectId: 'perilaku', title: 'Aspek Perilaku', percentage: Math.round(baseScore) },
  ]
}

export function normAspectTitle(title: string): string {
  const clean = title.toLowerCase().trim()
  if (clean.includes('tahu') || clean.includes('know') || clean.includes('kritis') || clean.includes('pemahaman') || clean.includes('materi')) return 'Aspek Pengetahuan'
  if (clean.includes('sikap') || clean.includes('attitud') || clean.includes('persepsi') || clean.includes('pandangan')) return 'Aspek Sikap'
  if (clean.includes('laku') || clean.includes('behavi') || clean.includes('higiene') || clean.includes('sanitasi') || clean.includes('praktik') || clean.includes('tindakan')) return 'Aspek Perilaku'
  return title
}

// matchFormId sederhana untuk aspect form matrix
export function matchFormIdSimple(r: any, targetId: string): boolean {
  if (!targetId || targetId === 'all') return true
  const tId = String(targetId).toLowerCase().trim()
  const rFormId = String(r.formId || r.metadata?.formId || r.distributionId || r.distributionCode || r.id || r.code || '').toLowerCase().trim()
  return rFormId === tId || (rFormId !== '' && tId !== '' && (rFormId.includes(tId) || tId.includes(rFormId)))
}

// Resolve kode opsi / id ke label teks yang bisa dibaca
export function resolveOptionText(val: any): string {
  if (val === undefined || val === null || val === '') return ''
  const strVal = String(val).trim()
  if (!strVal) return ''

  if (/^(opt_|option_|choice_|q_\d+_a_)/i.test(strVal)) {
    const parts = strVal.split('_')
    const lastPart = parts[parts.length - 1]
    if (!isNaN(Number(lastPart))) {
      return `Pilihan ${Number(lastPart) + 1}`
    }
    return 'Jawaban Terpilih'
  }

  return strVal
}

// Real data widget aggregator
export function getWidgetData(
  widget: any,
  responses: any[],
  selectedFormId: string,
  resolveOption: (val: any) => string,
): { labels: string[]; values: number[] } {
  const targetResponses = selectedFormId === 'all'
    ? responses
    : responses.filter(r => !widget.formId || r.formId === widget.formId || r.formId === selectedFormId || r.metadata?.formId === widget.formId)

  const counts: Record<string, number> = {}

  targetResponses.forEach(r => {
    if (r.answers) {
      Object.entries(r.answers).forEach(([key, val]) => {
        const isMatch =
          key === widget.questionText ||
          key === widget.questionId ||
          key.toLowerCase().includes((widget.questionText || '').toLowerCase().trim())

        if (isMatch) {
          const addValue = (v: any) => {
            const labelText = resolveOption(v)
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
  const values = labels.map(l => counts[l])

  if (labels.length > 0) {
    return { labels, values }
  }

  return { labels: ['Belum Ada Respon'], values: [0] }
}
