/**
 * GET /api/cost/monitoring
 *
 * Observability: estimasi biaya Firestore DINAMIS.
 *
 * Ukuran koleksi dibaca langsung dari Firestore (`.count()` — 1 read per
 * koleksi, sangat murah), bukan angka hardcoded. Estimasi NET sudah
 * memperhitungkan free tier harian.
 */

import { NextResponse } from 'next/server'
import {
  ENDPOINT_KEYS,
  estimateEndpointCost,
  estimateWithFreeTier,
} from '@/lib/infra/cost/estimator'
import { getAuthorizationContext } from '@/lib/domain/auth/authorization'
import { adminFirestore } from '@/lib/infra/firebase-admin'

// Asumsi traffic realistis per hari (dashboard internal).
const ASSUMED_REQUESTS_PER_DAY = 20

// Koleksi yang ukurannya dipakai estimator (full-scan collections).
const COLLECTIONS_TO_COUNT = ['responses', 'forms', 'distributions', 'users']

export async function GET() {
  const authContext = await getAuthorizationContext()
  if (!authContext) {
    return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 })
  }
  if (authContext.role !== 'super_admin') {
    return NextResponse.json({ success: false, message: 'Forbidden' }, { status: 403 })
  }

  // Baca ukuran koleksi AKTUAL dari Firestore (dinamis, bukan hardcoded).
  const collectionSizes: Record<string, number> = {}
  await Promise.all(
    COLLECTIONS_TO_COUNT.map(async (col) => {
      try {
        const snap = await adminFirestore.collection(col).count().get()
        collectionSizes[col] = snap.data().count
      } catch {
        collectionSizes[col] = 0
      }
    }),
  )

  const endpoints = ENDPOINT_KEYS.map((key) => {
    const est = estimateEndpointCost(key, collectionSizes)
    const net = estimateWithFreeTier(key, ASSUMED_REQUESTS_PER_DAY, 30, collectionSizes)
    return {
      key,
      reads: est.reads,
      writes: est.writes,
      deletes: est.deletes,
      costUsdPerRequest: est.costUsd,
      grossCostUsdPerMonth: est.costUsd * ASSUMED_REQUESTS_PER_DAY * 30,
      netCostUsdPerMonth: net.netCostUsdPerMonth,
      requestsPerDayUntilFreeTierExhausted: net.requestsPerDayUntilFreeTierExhausted,
      breakdown: est.breakdown,
    }
  })

  const totalNetCostUsdPerMonth = endpoints.reduce((sum, e) => sum + e.netCostUsdPerMonth, 0)

  return NextResponse.json({
    success: true,
    assumedRequestsPerDay: ASSUMED_REQUESTS_PER_DAY,
    collectionSizes,
    endpoints,
    totalNetCostUsdPerMonth,
    freeTierDailyReads: 50000,
    freeTierDailyWrites: 20000,
    freeTierDailyDeletes: 20000,
  })
}
