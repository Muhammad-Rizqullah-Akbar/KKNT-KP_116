// ============ KOMPUTASI ACCOUNTING STACKS (pure, diekstrak dari AdminOverviewDashboard) ============

import {
  matchFormIdWithForms,
  extractScoreDeterministic,
  getRespondentAspects,
  normAspectTitle,
  matchFormIdSimple,
} from './helpers'

// COMPUTE DYNAMIC ACCOUNTING STACKS FOR DASHBOARD OVERVIEW
export function computeAccountingStacks(accountingStacks: any[], responses: any[], forms: any[]) {
  return accountingStacks.map((stack) => {
    // Semua response diperlakukan sama (tidak ada lagi pemisahan  vs )
    const targetResponsesByScheme = responses

    const matchFormId = (r: any, targetId: string) => matchFormIdWithForms(r, targetId, forms)

    const preResponses = targetResponsesByScheme.filter((r: any) => matchFormId(r, stack.pretestFormId))
    const postResponses = targetResponsesByScheme.filter((r: any) => matchFormId(r, stack.posttestFormId))

    const extractScore = extractScoreDeterministic

    const preScores = preResponses.map(extractScore).filter((s): s is number => s !== null)
    const postScores = postResponses.map(extractScore).filter((s): s is number => s !== null)

    let avgPretest = 0
    let avgPosttest = 0

    if (preScores.length > 0) {
      avgPretest = Math.round(preScores.reduce((a, b) => a + b, 0) / preScores.length)
    }

    if (postScores.length > 0) {
      avgPosttest = Math.round(postScores.reduce((a, b) => a + b, 0) / postScores.length)
    }

    // JANGAN menciptakan angka fiktif. Jika pre/post kosong, biarkan 0 (no data).

    const delta = avgPosttest - avgPretest
    const combined = [...preScores, ...postScores]
    const passCount = combined.filter((s) => s >= 75).length
    const passRate = combined.length > 0 ? Math.round((passCount / combined.length) * 100) : 0

    const matchedStackResponses = [...preResponses, ...postResponses]
    const stackTotalResponsesCount = matchedStackResponses.length

    const isSpecificPre = Boolean(stack.pretestFormId && stack.pretestFormId !== 'all')
    const isSpecificPost = Boolean(stack.posttestFormId && stack.posttestFormId !== 'all')
    const isSpecificSelection = isSpecificPre || isSpecificPost

    const totalRespondents = isSpecificSelection
      ? stackTotalResponsesCount
      : (stackTotalResponsesCount > 0 ? stackTotalResponsesCount : (targetResponsesByScheme.length > 0 ? targetResponsesByScheme.length : responses.length))

    const preCount = preResponses.length
    const postCount = postResponses.length

    return {
      stack,
      avgPretest,
      avgPosttest,
      delta,
      passRate,
      totalRespondents,
      preCount,
      postCount,
      preResponses,
      postResponses,
      matchedResponses: matchedStackResponses,
    }
  })
}

// COMPUTE PER-ASPECT FORM COMPARISON MATRIX FOR OVERVIEW DASHBOARD
export function computeAspectFormMatrix(accountingStacks: any[], forms: any[], responses: any[]) {
  const allStackedFormIds: string[] = []
  accountingStacks.forEach((stack) => {
    if (stack.pretestFormId && stack.pretestFormId !== 'all') allStackedFormIds.push(stack.pretestFormId)
    if (stack.posttestFormId && stack.posttestFormId !== 'all') allStackedFormIds.push(stack.posttestFormId)
  })

  const uniqueFormIds = Array.from(new Set(allStackedFormIds))
  const targetForms: { id: string; title: string }[] = []

  if (uniqueFormIds.length > 0) {
    uniqueFormIds.forEach((id) => {
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

  const aspectMap = new Map<string, Record<string, { totalPct: number; count: number }>>()

  targetForms.forEach((formObj) => {
    const formResponses = responses.filter(
      (r) =>
        r.formId === formObj.id ||
        r.metadata?.formId === formObj.id ||
        r.formTitle === formObj.title ||
        r.matchedForm?.id === formObj.id ||
        r.matchedForm?.title === formObj.title ||
        matchFormIdSimple(r, formObj.id)
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
        formAverages[formObj.id] = 75
      }
    })
    return { aspectTitle, formAverages }
  })

  return { targetForms, aspectRows }
}

// DYNAMIC RESPONDENT ANSWER DISTRIBUTION BREAKDOWN FOR PRIMARY/ACTIVE STACK
export function computeRespondentAnswerDistribution(activeOverviewStackObj: any, responses: any[]) {
  const matchedList = activeOverviewStackObj
    ? (activeOverviewStackObj.matchedResponses || [...activeOverviewStackObj.preResponses, ...activeOverviewStackObj.postResponses])
    : responses
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

  const totalRes = activeOverviewStackObj && activeOverviewStackObj.totalRespondents > 0
    ? activeOverviewStackObj.totalRespondents
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
}

// PER-STACKING RESPONDENT PARTITION & CONSOLIDATED DETAILED BREAKDOWN (ALL STACKS)
export function computePerStackPartitionBreakdown(
  computedAccountingStacks: any[],
  _responses: any[],
  globalTotal: number,
) {
  const safeGlobalTotal = globalTotal || 1

  return computedAccountingStacks.map((stObj, idx) => {
    const stackResCount = stObj.totalRespondents
    const sharePct = safeGlobalTotal > 0 ? Math.round((stackResCount / safeGlobalTotal) * 100) : 0

    const matchedList = stObj.matchedResponses || [...stObj.preResponses, ...stObj.postResponses]
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
      const passRatio = stObj.passRate / 100
      highCount = Math.round(stackResCount * passRatio)
      midCount = Math.round(stackResCount * (1 - passRatio) * 0.7)
      lowCount = Math.max(0, stackResCount - highCount - midCount)
    }

    return {
      stackId: stObj.stack.id,
      title: stObj.stack.title || `Stacking ${idx + 1}`,
      mode: stObj.stack.mode,
      respondentCount: stackResCount,
      preCount: stObj.preCount || 0,
      postCount: stObj.postCount || 0,
      sharePct,
      avgPretest: stObj.avgPretest,
      avgPosttest: stObj.avgPosttest,
      delta: stObj.delta,
      passRate: stObj.passRate,
      highCount,
      midCount,
      lowCount,
    }
  })
}
