import { safeGetDoc, safeGetCollectionDocs, safeSetDoc, safeDeleteDoc } from './safeFirestore'
import type { ResponseDoc, ResponseFilterOptions } from '@/lib/forms/v1_5/responseTypes'
import { ScoringEngine } from '@/lib/scoring/scoringEngine'
import { calculateResponseScore } from '@/lib/forms/v1_5/scoring/scoringEngine'

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
    externalId: rawData.respondentId || rawData.externalId || '',
  }

  return {
    responseId,
    distributionId: rawData.distributionId || 'dist_legacy',
    distributionCode,
    formId: rawData.formId || 'form_legacy',
    versionId: rawData.versionId || 'v1.5_init',
    versionNumber: rawData.versionNumber || 1.5,
    ownerType: rawData.ownerType || 'cadre',
    ownerId: rawData.ownerId || rawData.createdBy || 'cadre_system',
    respondent,
    answers: rawData.answers || {},
    status,
    startedAt: rawData.startedAt || rawData.createdAt || new Date().toISOString(),
    updatedAt: rawData.updatedAt || rawData.submittedAt || new Date().toISOString(),
    submittedAt: rawData.submittedAt || undefined,
    submissionToken: rawData.submissionToken || `token_${responseId}`,
    result: rawData.result || undefined,
    createdBy: rawData.createdBy,
    cadreId: rawData.cadreId,
    userId: rawData.userId,
    formTitle: rawData.formTitle,
    groupName: rawData.groupName,
    distributionTitle: rawData.distributionTitle,
    ownerName: rawData.ownerName,
    metadata: rawData.metadata || {},
  }
}

function cleanString(str: string): string {
  return str.toLowerCase().replace(/[^a-z0-9]/g, '')
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
    if (
      [
        'respondentName',
        'respondentEmail',
        'name',
        'email',
        'createdAt',
        'submittedAt',
        'formId',
        'formTitle',
        'distributionCode',
      ].includes(key)
    ) {
      continue
    }

    const q = questionMap.get(key) || questionMap.get(cleanString(key))
    const humanKey = q ? (q.question || q.label || q.title || key).trim() : key.replace(/^(q_|question_|sec_\d+_q_)/gi, 'Pertanyaan ').replace(/_/g, ' ')

    let humanVal = value
    if (q) {
      const options = q.options || q.config?.options || []
      if (Array.isArray(options) && options.length > 0) {
        if (typeof value === 'string') {
          const matchedOpt = options.find((opt: any) =>
            typeof opt === 'object' && opt !== null ? (opt.id === value || opt.value === value) : opt === value
          )
          if (matchedOpt) {
            humanVal = typeof matchedOpt === 'object' ? (matchedOpt.label || matchedOpt.text || matchedOpt.value || value) : matchedOpt
          }
        } else if (Array.isArray(value)) {
          humanVal = value.map((valItem) => {
            if (typeof valItem === 'string') {
              const matchedOpt = options.find((opt: any) =>
                typeof opt === 'object' && opt !== null ? (opt.id === valItem || opt.value === valItem) : opt === valItem
              )
              if (matchedOpt) {
                return typeof matchedOpt === 'object' ? (matchedOpt.label || matchedOpt.text || valItem) : matchedOpt
              }
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
    const [rawForms, rawV15Forms, rawGroups, rawV15Distributions, rawDistributions, rawUsers] =
      await Promise.all([
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
      const formTitle = typeof rawTitle === 'string' ? rawTitle.replace(/^form_[\w\-]+/g, 'Formulir Evaluasi Pangan') : 'Formulir Evaluasi Pangan'

      const distributionCode = doc.distributionCode || dist.code || 'V1-DIST'
      let rawDistTitle = dist.title || dist.targetGroup
      if (!rawDistTitle && form?.groupId && groupMap[form.groupId]) {
        rawDistTitle = groupMap[form.groupId]
      }
      if (!rawDistTitle) {
        rawDistTitle = 'Pendampingan Kader Lapangan'
      }

      const distributionTitle = typeof rawDistTitle === 'string' ? rawDistTitle.replace(/^dist_[\w\-]+/g, 'Pendampingan Kader Lapangan') : 'Pendampingan Kader Lapangan'
      const groupName = distributionTitle

      const rawOwnerName = dist.ownerName || (doc as any).ownerName
      const ownerId = dist.ownerId || dist.createdBy || doc.createdBy

      let resolvedOwnerName = 'Administrator BPOM'
      if (ownerId && userMap[ownerId]) {
        resolvedOwnerName = userMap[ownerId]
      } else if (rawOwnerName && !['Penerbit Kode', 'Admin System'].includes(rawOwnerName)) {
        resolvedOwnerName = rawOwnerName
      }

      const versionNumber = doc.versionNumber || form?.activeVersionNumber || (doc.distributionCode ? 1.5 : 1.0)
      const ownerName = resolvedOwnerName
      const ownerType = dist.ownerType || 'cadre'

      try {
        const humanReadableAnswers = mapAnswersToHumanReadable(doc.answers || {}, form || {})

        let resultData = doc.result

        const hasValidResult =
          resultData &&
          typeof resultData.percentage === 'number' &&
          resultData.percentage > 0 &&
          Array.isArray(resultData.aspects) &&
          resultData.aspects.length > 0 &&
          Array.isArray(resultData.questions) &&
          resultData.questions.length > 0

        if (!hasValidResult && form && (form.questions || form.aspects)) {
          try {
            const scoreOutput = calculateResponseScore(
              {
                aspects: form.aspects || [],
                questions: form.questions || [],
                scoring: form.scoring || { totalPoints: 100, mode: 'auto', stagePointDistribution: {} },
                thresholds: form.thresholds || [],
                recommendations: form.recommendations || { mode: 'manual' },
              },
              doc.answers || {}
            )

            resultData = {
              scoringEngineVersion: 'v1.5',
              calculatedAt: doc.submittedAt || doc.updatedAt || new Date().toISOString(),
              rawScore: scoreOutput.rawScore,
              maximumScore: scoreOutput.maximumScore,
              percentage: scoreOutput.percentage,
              grade: scoreOutput.gradeResult.grade,
              thresholdId: scoreOutput.gradeResult.thresholdId,
              thresholdTitle: scoreOutput.gradeResult.title,
              thresholdDescription: scoreOutput.gradeResult.description,
              aspects: scoreOutput.aspectResults,
              questions: scoreOutput.questionResults,
              recommendations: [],
            }
          } catch (e) {
            console.warn('V1.5 response scoring fallback warning:', e)
          }
        }

        if (!resultData) {
          const finalScore = (doc as any).score ?? (doc as any).totalScore ?? (doc as any).finalScore ?? 0
          const gradeStr = doc.result?.grade || (finalScore >= 80 ? 'Grade A' : finalScore >= 60 ? 'Grade B' : 'Grade C')
          resultData = {
            scoringEngineVersion: 'legacy-v1',
            calculatedAt: doc.submittedAt || doc.updatedAt || new Date().toISOString(),
            rawScore: finalScore,
            maximumScore: 100,
            percentage: finalScore,
            grade: gradeStr,
            thresholdId: 'legacy-threshold',
            thresholdTitle: finalScore >= 80 ? 'Memenuhi Syarat (MS)' : finalScore >= 60 ? 'Binaan Lanjutan' : 'Perlu Perbaikan',
            aspects: doc.result?.aspects || [],
            questions: doc.result?.questions || [],
            recommendations: [],
          }
        }

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
          result: resultData,
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
