/**
 * GET /api/cost/monitoring
 *
 * Observability: estimasi biaya Firestore (statis, read-only, zero-risk).
 * Hanya memanggil cost estimator — TIDAK membaca/menulis Firestore tambahan.
 */

import { NextResponse } from 'next/server'
import {
  ENDPOINT_KEYS,
  estimateEndpointCost,
  estimateWithFreeTier,
} from '@/lib/infra/cost/estimator'
import { getAuthorizationContext } from '@/lib/domain/auth/authorization'

export async function GET() {
  const authContext = await getAuthorizationContext()
  if (!authContext) {
    return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 })
  }
  if (authContext.role !== 'super_admin') {
    return NextResponse.json({ success: false, message: 'Forbidden' }, { status: 403 })
  }

  const endpoints = ENDPOINT_KEYS.map((key) => {
    const est = estimateEndpointCost(key)
    const freeTier = estimateWithFreeTier(key, 100, 30)
    return {
      key,
      reads: est.reads,
      writes: est.writes,
      deletes: est.deletes,
      costUsdPerRequest: est.costUsd,
      costUsdPerMonth: est.costUsd * 100 * 30,
      requestsUntilFreeTierExhausted: freeTier.requestsPerDayUntilFreeTierExhausted,
      breakdown: est.breakdown,
    }
  })

  // Ringkasan total
  const totalCostUsdPerMonth = endpoints.reduce((sum, e) => sum + e.costUsdPerMonth, 0)

  return NextResponse.json({
    success: true,
    data: {
      endpoints,
      totalCostUsdPerMonth,
      freeTierDailyReads: 50000,
      freeTierDailyWrites: 20000,
      freeTierDailyDeletes: 20000,
    },
  })
}
