/**
 * GET /api/cost/monitoring
 *
 * Observability: estimasi biaya Firestore (statis, read-only, zero-risk).
 * Hanya memanggil cost estimator — TIDAK membaca/menulis Firestore tambahan.
 *
 * Estimasi NET: sudah memperhitungkan free tier harian (50k reads, 20k writes,
 * 20k deletes). Dengan ukuran koleksi produksi yang kecil (130 response),
 * biaya riil = $0 karena jauh di bawah free tier.
 */

import { NextResponse } from 'next/server'
import {
  ENDPOINT_KEYS,
  estimateEndpointCost,
  estimateWithFreeTier,
} from '@/lib/infra/cost/estimator'
import { getAuthorizationContext } from '@/lib/domain/auth/authorization'

// Asumsi traffic realistis per hari (bukan 100 — ini dashboard internal,
// dipakai oleh beberapa admin/mitra/kader saja).
const ASSUMED_REQUESTS_PER_DAY = 20

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
    // NET: biaya setelah free tier (reads/writes/deletes yang benar-benar kena biaya)
    const net = estimateWithFreeTier(key, ASSUMED_REQUESTS_PER_DAY, 30)
    return {
      key,
      reads: est.reads,
      writes: est.writes,
      deletes: est.deletes,
      costUsdPerRequest: est.costUsd,
      // Biaya GROSS bulanan (tanpa free tier) — untuk transparansi
      grossCostUsdPerMonth: est.costUsd * ASSUMED_REQUESTS_PER_DAY * 30,
      // Biaya NET bulanan (setelah free tier) — angka yang realistis
      netCostUsdPerMonth: net.netCostUsdPerMonth,
      requestsPerDayUntilFreeTierExhausted: net.requestsPerDayUntilFreeTierExhausted,
      breakdown: est.breakdown,
    }
  })

  // Total NET (setelah free tier) — ini angka yang benar-benar relevan
  const totalNetCostUsdPerMonth = endpoints.reduce((sum, e) => sum + e.netCostUsdPerMonth, 0)

  return NextResponse.json({
    success: true,
    assumedRequestsPerDay: ASSUMED_REQUESTS_PER_DAY,
    endpoints,
    totalNetCostUsdPerMonth,
    freeTierDailyReads: 50000,
    freeTierDailyWrites: 20000,
    freeTierDailyDeletes: 20000,
  })
}
