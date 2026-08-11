import { safeGetDoc, safeGetCollectionDocs, safeSetDoc, safeDeleteDoc } from './safeFirestore'
import type { ResponseDoc, ResponseFilterOptions } from '@/lib/forms/v1_5/responseTypes'
import { ScoringEngine } from '@/lib/scoring/scoringEngine'

const RESPONSES_COLLECTION = 'responses'

/**
 * Creates a new response document in Firestore.
 */
export async function createResponseDoc(docData: ResponseDoc): Promise<ResponseDoc> {
  await safeSetDoc(RESPONSES_COLLECTION, docData.responseId, docData)
  return docData
}

/**
 * Helper: Normalizes legacy V1 or modern V1.5 response document on the fly.
 */
function normalizeResponseDoc(rawData: any, docId?: string): ResponseDoc {
  const responseId = rawData.responseId || rawData.id || docId || 'resp_legacy'
  const distributionCode = rawData.distributionCode || rawData.formCode || rawData.formId || 'V1-LEGACY'
  const status = rawData.status || 'submitted'
  const respondent = rawData.respondent || {
    name: rawData.respondentName || rawData.name || rawData.answers?.respondentName || rawData.answers?.nama || 'Responden Publik',
    email: rawData.respondentEmail || rawData.email || rawData.answers?.respondentEmail || rawData.answers?.email || '',
    phone: rawData.respondentPhone || rawData.phone || rawData.answers?.phone || '',
    address: rawData.address || rawData.answers?.address || '',
  }

  let result = rawData.result
  const rawScoreValue =
    rawData.score ??
    rawData.totalScore ??
    rawData.result?.percentage ??
    rawData.result?.rawScore ??
    rawData.percentage ??
    rawData.scoringDetails?.percentage ??
    rawData.scoringDetails?.score ??
    rawData.finalScore

  let scorePct = rawScoreValue !== undefined && rawScoreValue !== null ? Math.round(Number(rawScoreValue) || 0) : 0

  if ((rawScoreValue === undefined || rawScoreValue === null || scorePct === 0) && rawData.answers && typeof rawData.answers === 'object') {
    const entries = Object.entries(rawData.answers)
    let totalPts = 0
    let earnedPts = 0

    entries.forEach(([_, val]) => {
      if (typeof val === 'number') {
        totalPts += 5
        earnedPts += Math.min(5, Math.max(0, val))
      } else if (typeof val === 'object' && val !== null) {
        Object.values(val).forEach((subVal) => {
          if (typeof subVal === 'number') {
            totalPts += 5
            earnedPts += Math.min(5, Math.max(0, subVal))
          } else if (subVal) {
            totalPts += 5
            earnedPts += 4
          }
        })
      } else if (val !== undefined && val !== null && val !== '') {
        totalPts += 5
        earnedPts += 4
      }
    })

    scorePct = totalPts > 0 ? Math.round((earnedPts / totalPts) * 100) : (entries.length > 0 ? 80 : 0)
  }

  const gradeStr = scorePct >= 80 ? 'A' : scorePct >= 60 ? 'B' : 'C'
  const thresholdTitleStr = scorePct >= 80 ? 'Memenuhi Syarat (MS)' : scorePct >= 60 ? 'Binaan Lanjutan' : 'Perlu Perbaikan'

  if (!result) {
    result = {
      percentage: scorePct,
      grade: gradeStr,
      thresholdTitle: thresholdTitleStr,
      rawScore: scorePct,
      maximumScore: 100,
      aspects: rawData.scoringPerStage
        ? Object.values(rawData.scoringPerStage).map((stg: any) => ({
            aspectId: stg.name || 'stage',
            title: stg.name || 'Aspek Penilaian',
            rawScore: stg.earned || 0,
            maximumScore: stg.possible || 100,
            percentage: stg.percentage || 0,
          }))
        : [],
      questions: [],
    }
  } else {
    result = {
      ...result,
      percentage: Math.round(Number(result.percentage ?? scorePct) || 0),
      grade: result.grade || gradeStr,
      thresholdTitle: result.thresholdTitle || thresholdTitleStr,
    }
  }

  return {
    ...rawData,
    responseId,
    distributionCode,
    status,
    respondent,
    result,
    versionNumber: rawData.versionNumber || (rawData.distributionCode ? 1.5 : 1.0),
    versionId: rawData.versionId || 'v1_legacy',
  } as ResponseDoc
}

const cleanString = (str: string) => {
  return str
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function mapAnswersToQuestionIds(rawAnswers: Record<string, any>, form: any): Record<string, any> {
  if (!form || !form.questions) return rawAnswers

  const mapped: Record<string, any> = {}
  const questionById: Record<string, any> = {}
  const questionByLabel: Record<string, any> = {}
  const questionByCleanLabel: Record<string, any> = {}

  form.questions.forEach((q: any) => {
    questionById[q.id] = q
    const label = (q.question || q.label || '').trim()
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
        const indicators = q.config?.indicators || []
        const statements = q.config?.statements || q.options || []
        const rows = indicators.length > 0 ? indicators.map((ind: any) => ind.label || ind) : statements

        for (const [rowLabel, rowVal] of Object.entries(value)) {
          const rowIndex = rows.findIndex((r: string) => r === rowLabel || cleanString(r) === cleanString(rowLabel))
          if (rowIndex !== -1) {
            mapped[`${q.id}-${rowIndex}`] = rowVal
          }
        }
      } else {
        mapped[q.id] = value
      }
    } else {
      mapped[key] = value
    }
  }

  return mapped
}

function mapAnswersToHumanReadable(rawAnswers: Record<string, any>, form: any): Record<string, any> {
  if (!rawAnswers || typeof rawAnswers !== 'object') return {}

  const mapped: Record<string, any> = {}
  const questionMap = new Map<string, any>()

  if (form && Array.isArray(form.questions)) {
    form.questions.forEach((q: any) => {
      if (q.id) questionMap.set(q.id, q)
      const label = (q.question || q.label || q.title || '').trim()
      if (label) {
        questionMap.set(label, q)
        questionMap.set(cleanString(label), q)
      }
    })
  }

  for (const [key, value] of Object.entries(rawAnswers)) {
    if (['respondentName', 'respondentEmail', 'name', 'email', 'createdAt', 'submittedAt', 'formId', 'formTitle', 'distributionCode'].includes(key)) {
      continue
    }

    const q = questionMap.get(key) || questionMap.get(cleanString(key))

    let humanKey = key
    if (q) {
      humanKey = (q.question || q.label || q.title || key).trim()
    } else {
      humanKey = key.replace(/^(q_|question_|sec_\d+_q_)/gi, 'Pertanyaan ').replace(/_/g, ' ')
    }

    let humanVal = value
    if (q) {
      const options = q.options || q.config?.options || []
      if (Array.isArray(options) && options.length > 0) {
        if (typeof value === 'string') {
          const matchedOpt = options.find((opt: any) =>
            typeof opt === 'object' ? (opt.id === value || opt.value === value) : opt === value
          )
          if (matchedOpt) {
            humanVal = typeof matchedOpt === 'object' ? (matchedOpt.label || matchedOpt.text || matchedOpt.value || value) : matchedOpt
          }
        } else if (Array.isArray(value)) {
          humanVal = value.map((valItem) => {
            if (typeof valItem === 'string') {
              const matchedOpt = options.find((opt: any) =>
                typeof opt === 'object' ? (opt.id === valItem || opt.value === valItem) : opt === valItem
              )
              return matchedOpt ? (typeof matchedOpt === 'object' ? (matchedOpt.label || matchedOpt.text || valItem) : matchedOpt) : valItem
            }
            return valItem
          })
        }
      }
    }

    mapped[humanKey] = humanVal
  }

  return mapped
}

/**
 * Enriches responses with exact form-based ScoringEngine calculation and full V1.5 Distribution Engine metadata.
 */
async function enrichResponsesWithFormScoring(docs: ResponseDoc[]): Promise<ResponseDoc[]> {
  try {
    const [rawForms, rawV15Forms, rawGroups, rawV15Distributions, rawDistributions, rawUsers] = await Promise.all([
      safeGetCollectionDocs('forms'),
      safeGetCollectionDocs('v1_5_forms'),
      safeGetCollectionDocs('formGroups'),
      safeGetCollectionDocs('v1_5_distributions'),
      safeGetCollectionDocs('distributions'),
      safeGetCollectionDocs('users'),
    ])

    const userMap: Record<string, string> = {}
    rawUsers.forEach((u) => {
      const name = u.data.displayName || u.data.name || (u.data.email ? u.data.email.split('@')[0] : '')
      if (name) {
        userMap[u.id] = name
        if (u.data.email) userMap[u.data.email] = name
      }
    })

    const formMap: Record<string, any> = {}
    const groupMap: Record<string, any> = {}
    const distMap: Record<string, any> = {}

    rawForms.forEach((d) => {
      formMap[d.id] = { id: d.id, ...d.data }
    })
    rawV15Forms.forEach((d) => {
      formMap[d.id] = { id: d.id, ...d.data }
    })
    rawGroups.forEach((d) => {
      groupMap[d.id] = d.data.title || d.data.name || d.data.code
    })
    const mapDistDoc = (d: { id: string; data: any }) => {
      distMap[d.id] = { id: d.id, ...d.data }
      if (d.data.code) distMap[d.data.code] = { id: d.id, ...d.data }
      if (d.data.distributionCode) distMap[d.data.distributionCode] = { id: d.id, ...d.data }
    }

    rawV15Distributions.forEach(mapDistDoc)
    rawDistributions.forEach(mapDistDoc)

    return docs.map((doc) => {
      const form = formMap[doc.formId]
      const dist = distMap[doc.distributionId || doc.distributionCode] || {}

      const rawTitle = form?.metadata?.title || form?.title || form?.name || (doc as any).formTitle || 'Formulir Evaluasi Pangan'
      const formTitle = rawTitle.replace(/^form_[\w\-]+/g, 'Formulir Evaluasi Pangan')

      const distributionCode = doc.distributionCode || dist.code || 'V1-DIST'
      const rawDistTitle = dist.title || dist.targetGroup || (form?.groupId && groupMap[form.groupId]) ? groupMap[form.groupId] : 'Pendampingan Kader Lapangan'
      const distributionTitle = typeof rawDistTitle === 'string' ? rawDistTitle.replace(/^dist_[\w\-]+/g, 'Pendampingan Kader Lapangan') : 'Pendampingan Kader Lapangan'
      const groupName = distributionTitle

      const rawOwnerName = dist.ownerName || (doc as any).ownerName
      const ownerId = dist.ownerId || dist.createdBy || doc.createdBy
      const resolvedOwnerName =
        (ownerId && userMap[ownerId])
          ? userMap[ownerId]
          : (rawOwnerName && !['Penerbit Kode', 'Admin System'].includes(rawOwnerName))
          ? rawOwnerName
          : 'Administrator BPOM'

      const versionNumber = doc.versionNumber || form?.activeVersionNumber || (doc.distributionCode ? 1.5 : 1.0)
      const ownerName = resolvedOwnerName
      const ownerType = dist.ownerType || 'cadre'

      try {
        const mappedAnswers = mapAnswersToQuestionIds(doc.answers || {}, form || {})
        const humanReadableAnswers = mapAnswersToHumanReadable(doc.answers || {}, form || {})

        const scoring = form?.scoring || {
          totalPoints: 100,
          mode: 'auto',
          distribution: {},
          overrides: {},
          allowOverride: true,
          autoBalance: true,
        }

        const validation = form?.validation || {
          mode: 'all_required',
          exceptions: [],
          allowOverride: true,
        }

        let stages = form?.stages
        if (!stages || stages.length === 0) {
          stages = [{
            id: 'default',
            name: 'Semua Pertanyaan',
            order: 0,
            questionIds: (form?.questions || []).map((q: any) => q.id),
            includeInScoring: true,
          }]
        }

        const questionsWithScoring = (form?.questions || []).map((q: any) => {
          const type = q.answerType || q.type || 'short-text'
          let scheme: 'none' | 'binary' | 'likert' | 'rating' | 'indicator' = 'none'
          if (type === 'single-choice' || type === 'dropdown' || type === 'multiple-choice') scheme = 'binary'
          else if (type === 'indicator-table' || type === 'likert') scheme = 'indicator'
          else if (type === 'rating') scheme = 'rating'
          return { ...q, scoring: q.scoring || { scheme, weight: 1 } }
        })

        let finalScore = doc.result?.percentage || 0
        let gradeStr = doc.result?.grade || 'C'

        if (form && form.questions && form.questions.length > 0) {
          const engine = new ScoringEngine(questionsWithScoring, scoring, validation, stages)
          const calcRes = engine.calculateScore(mappedAnswers)
          finalScore = calcRes.percentage || 0
          gradeStr = calcRes.grade || (finalScore >= 80 ? 'A' : finalScore >= 60 ? 'B' : 'C')
        }

        const aspects = doc.result?.aspects?.length ? doc.result.aspects : []

        return {
          ...doc,
          answers: humanReadableAnswers,
          formTitle,
          groupName,
          distributionCode,
          distributionTitle,
          versionNumber,
          ownerName,
          ownerType,
          result: {
            percentage: finalScore,
            grade: gradeStr,
            thresholdTitle: finalScore >= 80 ? 'Memenuhi Syarat (MS)' : finalScore >= 60 ? 'Binaan Lanjutan' : 'Perlu Perbaikan',
            rawScore: doc.result?.rawScore || finalScore,
            maximumScore: doc.result?.maximumScore || 100,
            aspects,
            questions: [],
          },
        }
      } catch (err) {
        return {
          ...doc,
          formTitle,
          groupName,
          distributionCode,
          distributionTitle,
          versionNumber,
          ownerName,
          ownerType,
        }
      }
    })
  } catch (err) {
    return docs
  }
}

export interface FormOptionMeta {
  formId: string
  title: string
  versionNumber: number
  versionLabel: string
}

export interface DistributionOptionMeta {
  distributionId: string
  code: string
  title: string
  ownerName?: string
  ownerType?: string
  formId?: string
}

/**
 * Retrieves all available forms and distribution groups across V1 and V1.5 for admin filter dropdowns.
 */
export async function getFormAndDistributionOptions(): Promise<{
  forms: FormOptionMeta[]
  distributions: DistributionOptionMeta[]
}> {
  try {
    const [rawForms, rawV15Forms, rawGroups, rawV15Distributions, rawDistributions, rawUsers] = await Promise.all([
      safeGetCollectionDocs('forms'),
      safeGetCollectionDocs('v1_5_forms'),
      safeGetCollectionDocs('formGroups'),
      safeGetCollectionDocs('v1_5_distributions'),
      safeGetCollectionDocs('distributions'),
      safeGetCollectionDocs('users'),
    ])

    const userMap: Record<string, string> = {}
    rawUsers.forEach((u) => {
      const name = u.data.displayName || u.data.name || (u.data.email ? u.data.email.split('@')[0] : '')
      if (name) {
        userMap[u.id] = name
        if (u.data.email) userMap[u.data.email] = name
      }
    })

    const formsList: FormOptionMeta[] = []
    const distList: DistributionOptionMeta[] = []

    rawForms.forEach((d) => {
      const title = d.data.title || d.data.name || 'Formulir Evaluasi Pangan'
      formsList.push({
        formId: d.id,
        title: title.replace(/^form_[\w\-]+/g, 'Formulir Evaluasi Pangan'),
        versionNumber: 1.0,
        versionLabel: 'V1.0 Legacy',
      })
    })

    rawV15Forms.forEach((d) => {
      const title = d.data.metadata?.title || d.data.title || d.data.name || 'Formulir Evaluasi Pangan'
      const versionNumber = d.data.activeVersionNumber || 1.5
      formsList.push({
        formId: d.id,
        title: title.replace(/^form_[\w\-]+/g, 'Formulir Evaluasi Pangan'),
        versionNumber,
        versionLabel: `V1.5 (v${versionNumber})`,
      })
    })

    rawGroups.forEach((d) => {
      const title = d.data.title || d.data.name || d.data.code || 'Kelompok Kader'
      distList.push({
        distributionId: d.id,
        code: d.data.code || 'V1-GROUP',
        title: title.replace(/^dist_[\w\-]+/g, 'Kelompok Kader'),
        ownerName: 'Admin System',
        ownerType: 'admin',
      })
    })

    // Push all registered users from User Management to guarantee 100% user coverage
    rawUsers.forEach((u) => {
      const displayName = u.data.displayName || u.data.name || u.data.email?.split('@')[0] || u.data.email
      if (displayName) {
        distList.push({
          distributionId: `user_${u.id}`,
          code: `USER-${u.id.substring(0, 6)}`,
          title: `Kanal ${displayName}`,
          ownerName: displayName,
          ownerType: u.data.role || 'cadre',
        })
      }
    })

    const processDistDoc = (d: { id: string; data: any }) => {
      const title = d.data.title || d.data.targetGroup || d.data.name || 'Channel Distribusi Kader'
      const code = d.data.code || d.data.distributionCode || d.id
      const rawOwnerName = d.data.ownerName
      const ownerId = d.data.ownerId || d.data.createdBy
      const resolvedOwnerName =
        (ownerId && userMap[ownerId])
          ? userMap[ownerId]
          : (rawOwnerName && !['Penerbit Kode', 'Admin System'].includes(rawOwnerName))
          ? rawOwnerName
          : 'Administrator BPOM'

      const ownerType = d.data.ownerType || 'cadre'
      const formId = d.data.formId

      distList.push({
        distributionId: d.id,
        code,
        title: typeof title === 'string' ? title.replace(/^dist_[\w\-]+/g, 'Channel Distribusi Kader') : 'Channel Distribusi Kader',
        ownerName: resolvedOwnerName,
        ownerType,
        formId,
      })
    }

    rawV15Distributions.forEach(processDistDoc)
    rawDistributions.forEach(processDistDoc)

    return {
      forms: formsList,
      distributions: distList,
    }
  } catch (err) {
    return { forms: [], distributions: [] }
  }
}

/**
 * Retrieves a response document by ID.
 */
export async function getResponseDoc(responseId: string): Promise<ResponseDoc | null> {
  const docObj = await safeGetDoc(RESPONSES_COLLECTION, responseId)
  if (!docObj) return null
  const normalized = normalizeResponseDoc(docObj.data, responseId)
  const [enriched] = await enrichResponsesWithFormScoring([normalized])
  return enriched
}

/**
 * Atomically transitions response status from 'in_progress' to 'submitted'.
 * Ensures single-submission / double-submission lock protection.
 */
export async function submitResponseDoc(
  responseId: string,
  submissionToken: string,
  answers: Record<string, any>,
  resultData?: any
): Promise<ResponseDoc> {
  const currentObj = await safeGetDoc(RESPONSES_COLLECTION, responseId)
  if (!currentObj) {
    throw new Error(`Sesi respon dengan ID "${responseId}" tidak ditemukan.`)
  }

  const current = normalizeResponseDoc(currentObj.data, responseId)

  if (current.submissionToken && current.submissionToken !== submissionToken) {
    throw new Error('Token sesi pengiriman tidak valid atau tidak cocok.')
  }

  if (current.status === 'submitted') {
    throw new Error('Sesi formulir ini sudah pernah dikirimkan sebelumnya. Pengiriman ganda tidak diperbolehkan.')
  }

  const now = new Date().toISOString()
  const updatedData: ResponseDoc = {
    ...current,
    answers,
    status: 'submitted',
    submittedAt: now,
    updatedAt: now,
    result: resultData || undefined,
  }

  await safeSetDoc(RESPONSES_COLLECTION, responseId, updatedData)
  return updatedData
}

/**
 * Lists response documents with role and parameter filtering.
 */
export async function listResponsesDoc(
  options?: ResponseFilterOptions & {
    ownerType?: string
    ownerId?: string
  }
): Promise<ResponseDoc[]> {
  const rawDocs = await safeGetCollectionDocs(RESPONSES_COLLECTION)
  let docs = rawDocs.map((d) => normalizeResponseDoc(d.data, d.id))

  if (options?.distributionId) {
    docs = docs.filter((d) => d.distributionId === options.distributionId)
  }
  if (options?.formId) {
    docs = docs.filter((d) => d.formId === options.formId)
  }
  if (options?.versionId) {
    docs = docs.filter((d) => d.versionId === options.versionId)
  }
  if (options?.status && options.status !== 'all') {
    docs = docs.filter((d) => d.status === options.status)
  }
  if (options?.ownerId) {
    docs = docs.filter((d) => d.ownerId === options.ownerId)
  }

  if (options?.search) {
    const term = options.search.toLowerCase()
    docs = docs.filter(
      (d) =>
        d.responseId?.toLowerCase().includes(term) ||
        d.distributionCode?.toLowerCase().includes(term) ||
        (d.respondent?.name && d.respondent.name.toLowerCase().includes(term)) ||
        (d.respondent?.email && d.respondent.email.toLowerCase().includes(term))
    )
  }

  const enrichedDocs = await enrichResponsesWithFormScoring(docs)

  // Sort by updatedAt descending
  return enrichedDocs.sort(
    (a, b) => new Date(b.updatedAt || b.submittedAt || 0).getTime() - new Date(a.updatedAt || a.submittedAt || 0).getTime()
  )
}

/**
 * Deletes a single response document by ID from all response collections.
 */
export async function deleteResponseDoc(responseId: string): Promise<void> {
  try {
    await safeDeleteDoc(RESPONSES_COLLECTION, responseId)
  } catch (e) {
    console.warn(`safeDeleteDoc warning for ${RESPONSES_COLLECTION}:`, e)
  }
  try {
    await safeDeleteDoc('v1_5_responses', responseId)
  } catch (e) {
    console.warn('safeDeleteDoc warning for v1_5_responses:', e)
  }
}

/**
 * Bulk deletes multiple response documents by ID.
 */
export async function deleteMultipleResponseDocs(responseIds: string[]): Promise<void> {
  await Promise.all(responseIds.map((id) => deleteResponseDoc(id)))
}
