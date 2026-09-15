import { ENGINE_VERSION_CURRENT } from '@/lib/domain/scoring/scoring-versions'

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

export function isCurrentEngineResult(r: any): boolean {
  return (
    r.scoringEngineVersion === ENGINE_VERSION_CURRENT ||
    r.result?.scoringEngineVersion === ENGINE_VERSION_CURRENT ||
    Boolean(r.versionId && String(r.versionId).trim() !== '') ||
    Boolean(r.distributionCode && String(r.distributionCode).trim() !== '')
  )
}

// Extract score deterministik untuk accounting stacks (termasuk evaluasi jawaban egacy)
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

  // Answer evaluation for un-scored records
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

        const pct = count > 0 ? Math.round(scoreSum / count) : Math.round(r.score || r.result?.percentage || 0)
        return {
          aspectId: g.title,
          title: g.title,
          percentage: pct,
        }
      })
    }
  }

  // Tidak ada data aspek valid → return kosong (bukan menampilkan 75% palsu)
  return []
}

export function normAspectTitle(title: string): string {
  const clean = title.toLowerCase().trim()
  if (clean.includes('tahu') || clean.includes('know') || clean.includes('kritis') || clean.includes('pemahaman') || clean.includes('materi')) return 'Aspek Pengetahuan'
  if (clean.includes('sikap') || clean.includes('attitud') || clean.includes('persepsi') || clean.includes('pandangan')) return 'Aspek Sikap'
  if (clean.includes('laku') || clean.includes('behavi') || clean.includes('higiene') || clean.includes('sanitasi') || clean.includes('praktik') || clean.includes('tindakan')) return 'Aspek Perilaku'
  return title
}

// Resolve kode opsi / id ke label teks yang bisa dibaca.
// Format jawaban sekarang = angka murni ("2","4","Benar","Salah"), jadi passthrough
// (jangan menciptakan "Pilihan N" yang menyesatkan).
export function resolveOptionText(val: any): string {
  if (val === undefined || val === null || val === '') return ''
  return String(val).trim()
}
