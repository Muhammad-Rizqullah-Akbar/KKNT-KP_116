import 'server-only'

import {
  getResponseDoc,
  listResponsesDoc,
} from '@/lib/repositories/responses.repo'
import { listDistributionsDoc } from '@/lib/repositories/distributions.repo'
import { recalculateResponseResultWorkflow } from './response.submit'
import type { AuthorizationContext } from '@/lib/domain/auth/authorization'
import type {
  ResponseDoc,
  ResponseFilterOptions,
} from '@/lib/domain/responses/response-types'

/**
 * LIST RESPONSES WORKFLOW:
 * Role-scoped response query for Admin / Cadre / Partnership dashboard.
 */
export async function listResponsesWorkflow(
  authContext: AuthorizationContext,
  options?: ResponseFilterOptions
): Promise<ResponseDoc[]> {
  const isGlobal = authContext.role === 'super_admin'

  if (isGlobal) {
    return await listResponsesDoc(options)
  }

  if (authContext.role === 'partnership') {
    const allResponses = await listResponsesDoc(options)
    // Find all distribution IDs and codes owned by this partnership or subordinate cadres
    const partnerCodes = new Set<string>()
    const partnerCadreUids = new Set<string>([authContext.uid])
    let partnerOrg = ''

    try {
      const { safeGetDoc, safeGetCollectionDocs } = await import('@/lib/repositories/safe-firestore')
      const [userDoc, allUsers, allDists] = await Promise.all([
        safeGetDoc('users', authContext.uid),
        safeGetCollectionDocs('users'),
        listDistributionsDoc(),
      ])

      if (userDoc?.data) {
        partnerOrg = (userDoc.data.organization || userDoc.data.displayName || '').toLowerCase().trim()
      }

      allUsers.forEach((u) => {
        if (
          u.data.partnershipId === authContext.uid ||
          (partnerOrg && u.data.organization && u.data.organization.toLowerCase().trim() === partnerOrg) ||
          (partnerOrg && u.data.partnershipName && u.data.partnershipName.toLowerCase().trim() === partnerOrg)
        ) {
          partnerCadreUids.add(u.id)
        }
      })

      allDists.forEach((d) => {
        const isOwned =
          d.createdBy === authContext.uid ||
          d.ownerId === authContext.uid ||
          d.partnershipId === authContext.uid ||
          (d.createdBy && partnerCadreUids.has(d.createdBy)) ||
          (d.ownerId && partnerCadreUids.has(d.ownerId)) ||
          (partnerOrg && d.ownerName && d.ownerName.toLowerCase().trim() === partnerOrg)

        if (isOwned) {
          if (d.code) partnerCodes.add(String(d.code).toLowerCase().trim())
          if ((d as any).distributionCode) partnerCodes.add(String((d as any).distributionCode).toLowerCase().trim())
          if (d.distributionId) partnerCodes.add(String(d.distributionId).toLowerCase().trim())
        }
      })
    } catch (e) {
      console.warn('Error resolving partnership response scope:', e)
    }

    return allResponses.filter((r) => {
      const code = String(r.distributionCode || (r as any).code || '').toLowerCase().trim()
      const distId = String(r.distributionId || '').toLowerCase().trim()
      const isOwner =
        (r.ownerId && partnerCadreUids.has(r.ownerId)) ||
        (r.createdBy && partnerCadreUids.has(r.createdBy)) ||
        (r.cadreId && partnerCadreUids.has(r.cadreId))
      const isCodeMatch = (code && partnerCodes.has(code)) || (distId && partnerCodes.has(distId))
      return isOwner || isCodeMatch
    })
  }

  // Cadre Scope: Only own responses or responses to own distribution codes
  const allResponses = await listResponsesDoc(options)
  const cadreCodes = new Set<string>()
  try {
    const allDists = await listDistributionsDoc()
    allDists.forEach((d) => {
      if (d.createdBy === authContext.uid || d.ownerId === authContext.uid) {
        if (d.code) cadreCodes.add(String(d.code).toLowerCase().trim())
        if ((d as any).distributionCode) cadreCodes.add(String((d as any).distributionCode).toLowerCase().trim())
        if (d.distributionId) cadreCodes.add(String(d.distributionId).toLowerCase().trim())
      }
    })
  } catch (e) {
    console.warn('Error resolving cadre response scope:', e)
  }

  return allResponses.filter((r) => {
    const code = String(r.distributionCode || (r as any).code || '').toLowerCase().trim()
    const distId = String(r.distributionId || '').toLowerCase().trim()
    const isOwner = r.ownerId === authContext.uid || r.createdBy === authContext.uid || r.cadreId === authContext.uid
    const isCodeMatch = (code && cadreCodes.has(code)) || (distId && cadreCodes.has(distId))
    return isOwner || isCodeMatch
  })
}

/**
 * GET RESPONSE DETAIL WORKFLOW:
 * Server-enforced role authorization check.
 */
export async function getResponseDetailWorkflow(
  responseId: string,
  authContext: AuthorizationContext
): Promise<ResponseDoc> {
  const resp = await getResponseDoc(responseId)
  if (!resp) {
    throw new Error(`Respon dengan ID "${responseId}" tidak ditemukan.`)
  }

  const isAdmin = authContext.role === 'super_admin'
  if (!isAdmin && resp.ownerId !== authContext.uid) {
    throw new Error('Anda tidak memiliki hak akses untuk melihat respon ini.')
  }

  // Preserve legacy forms vs V1.5 modern forms
  if (!resp.result || !Array.isArray(resp.result.aspects) || resp.result.aspects.length === 0) {
    try {
      if (resp.formId || resp.versionId) {
        const { recalculatedResult } = await recalculateResponseResultWorkflow(responseId)
        if (recalculatedResult && recalculatedResult.aspects && recalculatedResult.aspects.length > 0) {
          resp.result = recalculatedResult
          return resp
        }
      }
    } catch (e) {
      console.warn(`Lazy recalculate fallback for response ${responseId}:`, e)
    }

    if (!resp.result) {
      const legacyScore =
        (resp as any).score ??
        (resp as any).totalScore ??
        (resp as any).finalScore ??
        (resp as any).scoringDetails?.score ??
        0
      const scorePct = Math.min(100, Math.max(0, Math.round(Number(legacyScore) || 0)))

      resp.result = {
        scoringEngineVersion: 'legacy-v1',
        calculatedAt: resp.submittedAt || (resp as any).createdAt || (resp as any).updatedAt || new Date().toISOString(),
        rawScore: scorePct,
        maximumScore: 100,
        percentage: scorePct,
        grade: scorePct >= 80 ? 'Grade A' : scorePct >= 60 ? 'Grade B' : 'Grade C',
        thresholdId: 'legacy-threshold',
        thresholdTitle: scorePct >= 80 ? 'Memenuhi Syarat (MS)' : scorePct >= 60 ? 'Binaan Lanjutan' : 'Perlu Perbaikan',
        aspects: [],
        questions: [],
        recommendations: [],
      }
    }
  }

  return resp
}

/**
 * GET PUBLIC RESPONSE RESULT WORKFLOW:
 * Public read-only projection for respondent completion certificate.
 */
export async function getPublicResponseResultWorkflow(
  responseId: string
): Promise<{
  responseId: string
  code: string
  submittedAt: string
  result?: {
    percentage: number
    grade: string
    thresholdTitle: string
    thresholdDescription?: string
    aspects?: any[]
    recommendations?: any[]
  }
}> {
  const resp = await getResponseDoc(responseId)
  if (!resp) {
    throw new Error(`Tanggapan dengan ID "${responseId}" tidak ditemukan.`)
  }

  return {
    responseId: resp.responseId,
    code: resp.distributionCode || 'N/A',
    submittedAt: resp.submittedAt || resp.updatedAt,
    result: resp.result
      ? {
          percentage: resp.result.percentage,
          grade: resp.result.grade,
          thresholdTitle: resp.result.thresholdTitle,
          thresholdDescription: resp.result.thresholdDescription,
          aspects: resp.result.aspects || [],
          recommendations: resp.result.recommendations || [],
        }
      : undefined,
  }
}
