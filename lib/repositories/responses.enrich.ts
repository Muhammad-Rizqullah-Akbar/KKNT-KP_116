import { safeGetCollectionDocs } from './safe-firestore'
import type { ResponseDoc } from '@/lib/domain/responses/response-types'
import { cleanString, mapAnswersToHumanReadable } from './responses.normalize'
import { ENGINE_VERSION_CURRENT, ENGINE_VERSION_ARCHIVED } from '@/lib/domain/scoring/scoring-versions'

/**
 * Melengkapi response dengan metadata form/distribusi/pemilik dan hasil
 * penilaian.
 *
 * ATURAN PENILAIAN (satu jalur, tidak ada perhitungan ulang per-request):
 * - Hasil penilaian dihitung SEKALI saat response dikirim, lalu disimpan di
 *   `result`. Fungsi ini hanya MEMBACA hasil tersebut.
 * - Bila `result` belum ada (data lama), dipakai nilai tersimpan
 *   (`score`/`percentage`) sebagai cadangan — tanpa menjalankan ulang mesin
 *   penilaian. Perbaikan hasil dilakukan lewat workflow terpisah, bukan di
 *   setiap permintaan daftar.
 */
export async function enrichResponsesWithFormScoring(docs: ResponseDoc[]): Promise<ResponseDoc[]> {
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

    const formMap: Record<string, any> = {}
    const distMap: Record<string, any> = {}

    rawForms.forEach((d) => {
      const item = { id: d.id, ...d.data }
      formMap[d.id] = item
      if (d.data.code) formMap[d.data.code] = item
      if (d.data.title) {
        formMap[d.data.title] = item
        formMap[cleanString(d.data.title)] = item
      }
    })

    rawDistributions.forEach((d) => {
      const item = { id: d.id, ...d.data }
      distMap[d.id] = item
      if (d.data.code) distMap[d.data.code] = item
      if (d.data.distributionCode) distMap[d.data.distributionCode] = item
    })

    return docs.map((doc) => {
      const form =
        formMap[doc.formId] ||
        ((doc as any).formCode ? formMap[(doc as any).formCode] : undefined) ||
        ((doc as any).formTitle ? formMap[(doc as any).formTitle] : undefined) ||
        ((doc as any).formTitle ? formMap[cleanString((doc as any).formTitle)] : undefined)

      const dist = distMap[doc.distributionId || doc.distributionCode] || {}

      const rawTitle =
        form?.metadata?.title || form?.title || form?.name || (doc as any).formTitle || 'Formulir Evaluasi Pangan'
      const formTitle =
        typeof rawTitle === 'string' ? rawTitle.replace(/^form_[\w\-]+/g, 'Formulir Evaluasi Pangan') : 'Formulir Evaluasi Pangan'

      const distributionCode = doc.distributionCode || dist.code || '-'
      let rawDistTitle = dist.title || dist.targetGroup || 'Pendampingan Kader Lapangan'
      const distributionTitle =
        typeof rawDistTitle === 'string' ? rawDistTitle.replace(/^dist_[\w\-]+/g, 'Pendampingan Kader Lapangan') : 'Pendampingan Kader Lapangan'
      const groupName = distributionTitle

      const rawOwnerName = dist.ownerName || (doc as any).ownerName
      const ownerId = dist.ownerId || dist.createdBy || doc.createdBy
      let ownerName = 'Administrator'
      if (ownerId && userMap[ownerId]) ownerName = userMap[ownerId]
      else if (rawOwnerName && !['Penerbit Kode', 'Admin System'].includes(rawOwnerName)) ownerName = rawOwnerName

      const versionNumber = doc.versionNumber || form?.activeVersionNumber || 1
      const ownerType = dist.ownerType || 'cadre'

      try {
        const humanReadableAnswers = mapAnswersToHumanReadable(doc.answers || {}, form || {})

        // Hasil penilaian: pakai yang tersimpan. Hitung ulang hanya bila memang
        // belum ada, dan hanya untuk data yang belum punya versi mesin.
        let resultData: any = doc.result

        if (!resultData || typeof resultData.percentage !== 'number') {
          const storedScore =
            (doc as any).score ??
            (doc as any).totalScore ??
            (doc as any).finalScore ??
            undefined

          if (typeof storedScore === 'number' && !isNaN(storedScore)) {
            const pct = Math.min(100, Math.max(0, Math.round(storedScore)))
            resultData = {
              scoringEngineVersion: ENGINE_VERSION_ARCHIVED,
              calculatedAt: doc.submittedAt || doc.updatedAt || new Date().toISOString(),
              rawScore: pct,
              maximumScore: 100,
              percentage: pct,
              grade: pct >= 80 ? 'Grade A' : pct >= 60 ? 'Grade B' : 'Grade C',
              thresholdId: 'default-threshold',
              thresholdTitle: pct >= 80 ? 'Memenuhi Syarat (MS)' : pct >= 60 ? 'Binaan Lanjutan' : 'Perlu Perbaikan',
              thresholdDescription: '',
              aspects: [],
              questions: [],
              recommendations: [],
            }
          } else {
            resultData = {
              scoringEngineVersion: ENGINE_VERSION_ARCHIVED,
              calculatedAt: doc.submittedAt || doc.updatedAt || new Date().toISOString(),
              rawScore: 0,
              maximumScore: 0,
              percentage: 0,
              grade: '-',
              thresholdId: 'default-threshold',
              thresholdTitle: 'Belum dinilai',
              thresholdDescription: '',
              aspects: [],
              questions: [],
              recommendations: [],
            }
          }
        } else if (resultData.scoringEngineVersion !== ENGINE_VERSION_CURRENT) {
          // Tandai hasil lama sebagai versi arsip, tanpa menghitung ulang.
          resultData = { ...resultData, scoringEngineVersion: ENGINE_VERSION_ARCHIVED }
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
      } catch {
        // Bila pemetaan jawaban gagal, tetap kembalikan metadata dasar.
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
  } catch {
    // Bila data pendukung tidak terbaca, kembalikan apa adanya.
    return docs
  }
}
