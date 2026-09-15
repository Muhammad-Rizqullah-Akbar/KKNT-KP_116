'use client'

import { useMemo } from 'react'
import {
  getRespondentAspects,
  computeAccountingForStack,
  type StackedAccountingItem,
} from './widgets-utils'
import { computeItemQuestionAnalysis } from './widgets-item-analysis'

type DerivationsInput = {
  accountingStacks: StackedAccountingItem[]
  activeStackId: string
  formCodeSearchTerm: string
  responses: any[]
  forms: any[]
  v15Forms: any[]
  users: any[]
  widgets: any[]
  activeStackObj: StackedAccountingItem
  itemAnalysisFormFilter: string
  selectedFormFilter: string
  selectedQuestionFilter: string
  searchTerm: string
  chartTypeFilter: string
}

// Seluruh perhitungan turunan (useMemo) untuk halaman widget CMS.
export function useWidgetsDerivations(input: DerivationsInput) {
  const {
    accountingStacks, formCodeSearchTerm,
    responses, forms, v15Forms, users, widgets,
    activeStackObj, itemAnalysisFormFilter,
    selectedFormFilter, selectedQuestionFilter, searchTerm, chartTypeFilter,
  } = input

  // COMPUTE PER-ASPECT FORM COMPARISON MATRIX ACROSS ALL STACKED FORMS (SEBAGAIMANA DATA RESPONDEN)
  const aspectFormMatrix = useMemo(() => {
    const allStackedFormIds: string[] = []
    accountingStacks.forEach((stack) => {
      if (stack.pretestFormId && stack.pretestFormId !== 'all') allStackedFormIds.push(stack.pretestFormId)
      if (stack.posttestFormId && stack.posttestFormId !== 'all') allStackedFormIds.push(stack.posttestFormId)
    })

    const uniqueFormIds = Array.from(new Set(allStackedFormIds))
    const targetForms: { id: string; title: string }[] = []

    if (uniqueFormIds.length > 0) {
      uniqueFormIds.forEach((id) => {
        const f15 = v15Forms.find((f) => f.formId === id)
        if (f15) {
          targetForms.push({ id, title: f15.metadata?.title || id })
          return
        }
        const f10 = forms.find((f) => f.id === id)
        if (f10) {
          targetForms.push({ id, title: f10.title || id })
          return
        }
        targetForms.push({ id, title: `Form ${id}` })
      })
    } else {
      forms.slice(0, 4).forEach((f) => {
        if (f.id) {
          targetForms.push({ id: f.id, title: f.title || f.id })
        }
      })
    }

    const normAspectTitle = (title: string) => {
      const clean = title.toLowerCase().trim()
      if (clean.includes('tahu') || clean.includes('know') || clean.includes('kritis') || clean.includes('pemahaman') || clean.includes('materi')) return 'Aspek Pengetahuan'
      if (clean.includes('sikap') || clean.includes('attitud') || clean.includes('persepsi') || clean.includes('pandangan')) return 'Aspek Sikap'
      if (clean.includes('laku') || clean.includes('behavi') || clean.includes('higiene') || clean.includes('sanitasi') || clean.includes('praktik') || clean.includes('tindakan')) return 'Aspek Perilaku'
      return title
    }

    const aspectMap = new Map<string, Record<string, { totalPct: number; count: number }>>()

    const matchFormId = (r: any, targetId: string) => {
      if (!targetId || targetId === 'all') return true
      const tId = String(targetId).toLowerCase().trim()
      const rFormId = String(r.formId || (r as any).metadata?.formId || r.distributionId || r.distributionCode || r.id || r.code || '').toLowerCase().trim()
      return rFormId === tId || (rFormId !== '' && tId !== '' && (rFormId.includes(tId) || tId.includes(rFormId)))
    }

    targetForms.forEach((formObj) => {
      const formResponses = responses.filter(
        (r) =>
          r.formId === formObj.id ||
          (r as any).metadata?.formId === formObj.id ||
          r.formTitle === formObj.title ||
          (r as any).matchedForm?.id === formObj.id ||
          (r as any).matchedForm?.title === formObj.title ||
          matchFormId(r, formObj.id)
      )

      formResponses.forEach((r) => {
        const aspects = getRespondentAspects(r, forms)
        aspects.forEach((asp) => {
          const aspectTitle = normAspectTitle(asp.title)
          if (!aspectMap.has(aspectTitle)) {
            aspectMap.set(aspectTitle, {})
          }
          const row = aspectMap.get(aspectTitle)!
          if (!row[formObj.id]) {
            row[formObj.id] = { totalPct: asp.percentage, count: 1 }
          } else {
            row[formObj.id].totalPct += asp.percentage
            row[formObj.id].count += 1
          }
        })
      })
    })

    const standardizedAspects = ['Aspek Pengetahuan', 'Aspek Sikap', 'Aspek Perilaku']
    const aspectRows = standardizedAspects.map((aspectTitle) => {
      const formScores = aspectMap.get(aspectTitle) || {}
      const formAverages: Record<string, number> = {}
      targetForms.forEach((formObj) => {
        const scoreData = formScores[formObj.id]
        if (scoreData && scoreData.count > 0) {
          formAverages[formObj.id] = Math.round(scoreData.totalPct / scoreData.count)
        } else {
          formAverages[formObj.id] = 0 // no data, jangan menampilkan 75 palsu
        }
      })
      return { aspectTitle, formAverages }
    })

    return { targetForms, aspectRows }
  }, [accountingStacks, forms, v15Forms, responses])

  // MAP OF FORM ID / FORM CODE TO EXACT DETECTED RESPONDENT COUNT
  const formRespondentCountMap = useMemo(() => {
    const map = new Map<string, number>()
    const allKnownForms = [...forms, ...v15Forms]

    allKnownForms.forEach((f: any) => {
      const formId = String(f.id || f.formId || '').toLowerCase().trim()
      const code = String(f.code || f.formCode || f.distributionCode || f.pretestCode || f.posttestCode || '').toLowerCase().trim()
      const title = String(f.title || f.metadata?.title || '').toLowerCase().trim()

      const matchedResponses = responses.filter((r: any) => {
        const matched = r.matchedForm
        if (matched) {
          const mId = String(matched.id || matched.formId || '').toLowerCase().trim()
          const mCode = String(matched.code || matched.formCode || matched.pretestCode || matched.posttestCode || '').toLowerCase().trim()
          if ((formId && mId === formId) || (code && mCode === code)) return true
        }
        const rCode = String(r.formCode || r.distributionCode || r.code || '').toLowerCase().trim()
        const rId = String(r.formId || r.id || '').toLowerCase().trim()
        const rTitle = String(r.formTitle || '').toLowerCase().trim()
        return (formId && rId === formId) || (code && rCode === code) || (title && rTitle === title)
      })

      const count = matchedResponses.length
      if (formId) map.set(formId, count)
      if (code) map.set(code, count)
    })

    return map
  }, [forms, v15Forms, responses])

  const getFormRespondentCount = (idOrCode: string) => {
    if (!idOrCode || idOrCode === 'all') return responses.length
    const key = String(idOrCode).toLowerCase().trim()
    return formRespondentCountMap.get(key) || 0
  }

  // DYNAMIC FORM CODE & FORM TITLE RESPONDENT CLASSIFICATION BREAKDOWN
  const formClassificationBreakdown = useMemo(() => {
    const allKnownForms = [...forms, ...v15Forms]
    const map = new Map<string, {
      id: string
      code: string
      title: string
      version: string
      responses: any[]
      respondentIds: Set<string>
      scores: number[]
    }>()

    allKnownForms.forEach((f: any) => {
      const formId = f.id || f.formId || 'unknown'
      const code = (f.code || f.formCode || f.distributionCode || f.pretestCode || f.posttestCode || '-').trim().toUpperCase()
      const title = f.title || f.metadata?.title || 'Formulir Tanpa Judul'
      const version = '' // tidak ada lagi versi / — single format
      map.set(formId, {
        id: formId,
        code,
        title,
        version,
        responses: [],
        respondentIds: new Set<string>(),
        scores: [],
      })
    })

    responses.forEach((r: any) => {
      const matched = r.matchedForm
      const respondentId = r.respondentId || r.respondentEmail || r.respondentName || r.responseId || r.id
      const score = typeof r.score === 'number' ? r.score : 0

      if (matched) {
        const formId = matched.id || matched.formId
        const item = map.get(formId)
        if (item) {
          item.responses.push(r)
          if (respondentId) item.respondentIds.add(respondentId)
          if (typeof score === 'number') item.scores.push(score)
        }
      } else {
        const code = (r.formCode || r.distributionCode || r.code || 'UNGROUPED').trim().toUpperCase()
        const title = r.formTitle || 'Respon Tanpa Form ID'
        const key = `raw-${code}-${title}`
        if (!map.has(key)) {
          map.set(key, {
            id: key,
            code,
            title,
            version: '',
            responses: [],
            respondentIds: new Set<string>(),
            scores: [],
          })
        }
        const item = map.get(key)!
        item.responses.push(r)
        if (respondentId) item.respondentIds.add(respondentId)
        if (typeof score === 'number') item.scores.push(score)
      }
    })

    const list = Array.from(map.values()).map((item) => {
      const respondentCount = item.responses.length
      const avgScore = item.scores.length > 0 ? Math.round(item.scores.reduce((a, b) => a + b, 0) / item.scores.length) : 0
      return {
        ...item,
        respondentCount,
        avgScore,
      }
    })

    if (!formCodeSearchTerm.trim()) return list

    const s = formCodeSearchTerm.toLowerCase().trim()
    return list.filter(item =>
      item.code.toLowerCase().includes(s) ||
      item.title.toLowerCase().includes(s) ||
      item.version.toLowerCase().includes(s)
    )
  }, [forms, v15Forms, responses, formCodeSearchTerm])

  // Active Selected Accounting Computation
  const activeAccountingResult = useMemo(() => {
    return computeAccountingForStack(activeStackObj, responses, forms, v15Forms, users)
  }, [activeStackObj, responses, forms, v15Forms, users])

  // DYNAMIC RESPONDENT ANSWER DISTRIBUTION BREAKDOWN FOR ACTIVE STACK IN STEP 2 (ACCOUNTING)
  const respondentAnswerDistribution = useMemo(() => {
    const matchedList = activeAccountingResult.matchedResponses || [
      ...(activeAccountingResult.preResponses || []),
      ...(activeAccountingResult.postResponses || []),
    ]
    const listToEvaluate = matchedList.length > 0 ? matchedList : responses

    let highCount = 0
    let midCount = 0
    let lowCount = 0

    const uSet = new Set<string>()

    listToEvaluate.forEach((r: any) => {
      const id = r.respondentId || r.respondentEmail || r.respondentName || r.respondent?.email || r.respondent?.name || r.responseId || r.id
      if (id) uSet.add(id)

      const s = typeof r.score === 'number' && r.score > 0 ? r.score : typeof r.percentage === 'number' ? r.percentage : 0
      if (s >= 80) highCount++
      else if (s >= 60) midCount++
      else lowCount++
    })

    const totalRes = activeAccountingResult.totalRespondents > 0
      ? activeAccountingResult.totalRespondents
      : (uSet.size > 0 ? uSet.size : listToEvaluate.length)

    const evalCount = listToEvaluate.length > 0 ? listToEvaluate.length : 1
    const highPct = Math.round((highCount / evalCount) * 100)
    const midPct = Math.round((midCount / evalCount) * 100)
    const lowPct = Math.max(0, 100 - highPct - midPct)

    return {
      totalRes,
      highCount,
      highPct,
      midCount,
      midPct,
      lowCount,
      lowPct,
    }
  }, [activeAccountingResult, responses])

  // PER-STACKING RESPONDENT PARTITION & CONSOLIDATED DETAILED BREAKDOWN (ALL STACKS)
  const perStackPartitionBreakdown = useMemo(() => {
    const globalTotal = respondentAnswerDistribution.totalRes || 1

    return accountingStacks.map((stack, idx) => {
      const res = computeAccountingForStack(stack, responses, forms, v15Forms, users)
      const stackResCount = res.totalRespondents
      const sharePct = globalTotal > 0 ? Math.round((stackResCount / globalTotal) * 100) : 0

      const matchedList = res.matchedResponses || [...(res.preResponses || []), ...(res.postResponses || [])]
      let highCount = 0
      let midCount = 0
      let lowCount = 0

      matchedList.forEach((r: any) => {
        const s = typeof r.score === 'number' && r.score > 0 ? r.score : typeof r.percentage === 'number' ? r.percentage : 0
        if (s >= 80) highCount++
        else if (s >= 60) midCount++
        else lowCount++
      })

      if (matchedList.length === 0 && stackResCount > 0) {
        const passRatio = res.passRate / 100
        highCount = Math.round(stackResCount * passRatio)
        midCount = Math.round(stackResCount * (1 - passRatio) * 0.7)
        lowCount = Math.max(0, stackResCount - highCount - midCount)
      }

      return {
        stackId: stack.id,
        title: stack.title || `Stacking ${idx + 1}`,
        mode: stack.mode,
        respondentCount: stackResCount,
        preCount: res.preCount || 0,
        postCount: res.postCount || 0,
        sharePct,
        avgPretest: res.avgPretest,
        avgPosttest: res.avgPosttest,
        delta: res.delta,
        passRate: res.passRate,
        highCount,
        midCount,
        lowCount,
      }
    })
  }, [accountingStacks, responses, forms, v15Forms, users, respondentAnswerDistribution.totalRes])

  // DYNAMIC PER-QUESTION ITEM ANALYSIS FOR ACTIVE STACK (SEPARATED PER FORM)
  // Menilai jawaban pakai correctAnswer (kunci jawaban formDocument), bukan heuristik substring.
  const itemQuestionAnalysis = useMemo(
    () => computeItemQuestionAnalysis(activeStackObj, forms, v15Forms, responses, itemAnalysisFormFilter),
    [activeStackObj, forms, v15Forms, responses, itemAnalysisFormFilter]
  )

  // Filtered & Sorted Widgets List
  const filteredWidgets = useMemo(() => {
    return widgets.filter((w) => {
      const matchPre = activeStackObj.pretestFormId === 'all' || w.formId === activeStackObj.pretestFormId
      const matchPost = activeStackObj.posttestFormId === 'all' || w.formId === activeStackObj.posttestFormId
      const matchStackForm = matchPre || matchPost

      const matchFormSelect = selectedFormFilter === 'all' || w.formId === selectedFormFilter
      const matchQuestionSelect = selectedQuestionFilter === 'all' || w.questionId === selectedQuestionFilter || w.id === selectedQuestionFilter

      const matchSearch =
        (w.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (w.questionText || '').toLowerCase().includes(searchTerm.toLowerCase())
      const matchChart = chartTypeFilter === 'all' || w.chartType === chartTypeFilter

      return matchStackForm && matchFormSelect && matchQuestionSelect && matchSearch && matchChart
    })
  }, [widgets, activeStackObj, selectedFormFilter, selectedQuestionFilter, searchTerm, chartTypeFilter])

  return {
    aspectFormMatrix,
    formClassificationBreakdown,
    getFormRespondentCount,
    activeAccountingResult,
    respondentAnswerDistribution,
    perStackPartitionBreakdown,
    itemQuestionAnalysis,
    filteredWidgets,
  }
}

export type WidgetsDerivations = ReturnType<typeof useWidgetsDerivations>
