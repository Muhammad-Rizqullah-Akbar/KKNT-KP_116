import { isBiodataAspect } from './widgets-form-matcher'

// Extract per-aspect scores for a given response (Aligned with Data Responden Engine)
export function getRespondentAspects(
  r: any,
  forms: any[]
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

  const matchedForm = forms.find((f) => f.id === r.formId || f.title === r.formTitle) || (r as any).matchedForm
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
