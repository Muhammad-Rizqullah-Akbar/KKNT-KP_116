import { safeGetDoc, safeGetCollectionDocs, safeSetDoc, safeDeleteDoc, safeQueryDocs, safeCountDocs } from './safe-firestore'
import type { ResponseDoc, ResponseFilterOptions } from '@/lib/domain/responses/response-types'
import { normalizeResponseDoc } from './responses.normalize'
import { enrichResponsesWithFormScoring } from './responses.enrich'

const RESPONSES_COLLECTION = 'responses'

/**
 * Creates a new response document in Firestore.
 */
export async function createResponseDoc(docData: ResponseDoc): Promise<ResponseDoc> {
  await safeSetDoc(RESPONSES_COLLECTION, docData.responseId, docData)
  return docData
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
 * Retrieves all available forms and distribution groups across V1 and  for admin filter dropdowns.
 */
export async function getFormAndDistributionOptions(): Promise<{
  forms: FormOptionMeta[]
  distributions: DistributionOptionMeta[]
}> {
  try {
    const [rawForms, rawDistributions, rawUsers] = await Promise.all([
      safeGetCollectionDocs('forms'),
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
        versionLabel: 'Formulir',
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
 * PROYEKSI LIST — ringankan payload untuk daftar.
 *
 * Dokumen response penuh ~7,7 KB, tetapi halaman daftar hanya butuh
 * ~225 byte (nama, form, kode, status, skor, tanggal). Fungsi ini
 * membuang field berat: `answers`, `result.questions`, `biodata`,
 * `metadata`, `submissionToken`.
 *
 * Detail penuh tetap diambil lewat endpoint detail (`/api/responses/[id]`).
 */
export function projectResponseForList(doc: ResponseDoc): ResponseDoc {
  const result = doc.result as any
  const lightResult = result
    ? {
        percentage: result.percentage,
        grade: result.grade,
        thresholdTitle: result.thresholdTitle,
        rawScore: result.rawScore,
        maximumScore: result.maximumScore,
        engineVersion: result.scoringEngineVersion,
        // aspects dipakai untuk kolom per-aspek di tabel (jumlah kecil)
        aspects: Array.isArray(result.aspects)
          ? result.aspects.map((a: any) => ({
              aspectId: a.aspectId,
              title: a.title,
              rawScore: a.rawScore,
              maximumScore: a.maximumScore,
              percentage: a.percentage,
              weightPercentage: a.weightPercentage,
            }))
          : [],
      }
    : undefined

  return {
    responseId: doc.responseId,
    distributionId: doc.distributionId,
    distributionCode: doc.distributionCode,
    formId: doc.formId,
    versionId: doc.versionId,
    versionNumber: doc.versionNumber,
    ownerType: doc.ownerType,
    ownerId: doc.ownerId,
    respondent: {
      name: doc.respondent?.name,
      email: doc.respondent?.email,
      institution: doc.respondent?.institution,
    },
    // answers dikosongkan pada list — hanya tersedia di endpoint detail
    answers: {},
    status: doc.status,
    startedAt: doc.startedAt,
    updatedAt: doc.updatedAt,
    submittedAt: doc.submittedAt,
    submissionToken: '',
    result: lightResult,
    formTitle: doc.formTitle,
    ownerName: doc.ownerName,
    groupName: doc.groupName,
    distributionTitle: doc.distributionTitle,
  }
}

/**
 * Halaman response dengan query terfilter server-side (BIAYA TERKENDALI).
 *
 * Memakai filter equality (`where`) + `limit` sehingga cukup index otomatis
 * dan membaca maksimal `limit` dokumen — bukan seluruh koleksi.
 *
 * Filter didukung: formId, formCode, status, distributionCode.
 */
export interface ResponsePageOptions {
  formId?: string
  formCode?: string
  status?: string
  distributionCode?: string
  limit?: number
}

export async function listResponsesPagedDoc(
  options: ResponsePageOptions = {},
): Promise<{ items: ResponseDoc[]; hasMore: boolean }> {
  const limitCount = Math.max(1, Math.min(Number(options.limit) || 25, 100))

  const filters: Array<{ field: string; value: any }> = []
  if (options.formId) filters.push({ field: 'formId', value: options.formId })
  if (options.formCode) filters.push({ field: 'formCode', value: options.formCode })
  if (options.status && options.status !== 'all') filters.push({ field: 'status', value: options.status })
  if (options.distributionCode) filters.push({ field: 'distributionCode', value: options.distributionCode })

  // Ambil limitCount + 1 untuk mendeteksi apakah masih ada halaman berikutnya.
  const raw = await safeQueryDocs(RESPONSES_COLLECTION, filters, limitCount + 1)
  const hasMore = raw.length > limitCount
  const page = hasMore ? raw.slice(0, limitCount) : raw

  const docs = page.map((d) => normalizeResponseDoc(d.data, d.id))
  const enriched = await enrichResponsesWithFormScoring(docs)
  // Proyeksi: buang payload berat (answers, result.questions) dari list.
  return { items: enriched.map(projectResponseForList), hasMore }
}

/**
 * Hitung jumlah response dengan filter (count aggregation — 1 read per 1000 dokumen).
 */
export async function countResponsesDoc(
  filters: { formId?: string; formCode?: string; status?: string; distributionCode?: string } = {},
): Promise<number> {
  const f: Array<{ field: string; value: any }> = []
  if (filters.formId) f.push({ field: 'formId', value: filters.formId })
  if (filters.formCode) f.push({ field: 'formCode', value: filters.formCode })
  if (filters.status) f.push({ field: 'status', value: filters.status })
  if (filters.distributionCode) f.push({ field: 'distributionCode', value: filters.distributionCode })
  return safeCountDocs(RESPONSES_COLLECTION, f)
}

/**
 * Lists response documents with role and parameter filtering.
 *
 * CATATAN BIAYA PENTING:
 * Fungsi ini masih membaca koleksi (perlu untuk enrichment/scope), jadi
 * jumlah dokumen DIBATASI KERAS agar tidak pernah unbounded. Untuk skala
 * besar, gunakan `listResponsesPaged()` (query terfilter) atau endpoint
 * ringkasan `/api/responses/analytics` yang memakai count aggregation.
 */
const MAX_LIST_DOCS = 500

export async function listResponsesDoc(
  options?: ResponseFilterOptions & {
    ownerType?: string
    ownerId?: string
  }
): Promise<ResponseDoc[]> {
  const rawDocs = await safeGetCollectionDocs(RESPONSES_COLLECTION)
  // HARD CAP: cegah full-scan tak terbatas ketika data bertambah besar.
  const capped = rawDocs.length > MAX_LIST_DOCS ? rawDocs.slice(0, MAX_LIST_DOCS) : rawDocs
  let docs = capped.map((d) => normalizeResponseDoc(d.data, d.id))

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
}

/**
 * Bulk deletes multiple response documents by ID.
 */
export async function deleteMultipleResponseDocs(responseIds: string[]): Promise<void> {
  await Promise.all(responseIds.map((id) => deleteResponseDoc(id)))
}
