import { NextResponse } from 'next/server'
import { getAuthorizationContext } from '@/lib/domain/auth/authorization'
import { summarizeQueries, getRecentQueries, findCostHazards } from '@/lib/infra/observability/query-metrics'

/**
 * GET /api/observability/queries
 *
 * Telemetri query & biaya (hanya super_admin).
 * Menampilkan endpoint paling boros, rata-rata durasi, dan error rate.
 * Tidak memuat data pribadi.
 */
export async function GET(request: Request) {
  const authContext = await getAuthorizationContext()
  if (!authContext) {
    return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 })
  }
  if (authContext.role !== 'super_admin') {
    return NextResponse.json({ success: false, message: 'Forbidden' }, { status: 403 })
  }

  const { searchParams } = new URL(request.url)
  const limit = Math.min(Number(searchParams.get('limit') || 50), 500)

  return NextResponse.json({
    success: true,
    data: {
      summary: summarizeQueries(),
      hazards: findCostHazards(100),
      recent: getRecentQueries(limit),
    },
  })
}
