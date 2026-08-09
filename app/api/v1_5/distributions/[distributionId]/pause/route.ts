import { NextResponse } from 'next/server'
import { requireRole } from '@/lib/auth/server'
import { pauseDistributionWorkflow } from '@/lib/forms/v1_5/distribution.service'

interface RouteParams {
  params: Promise<{ distributionId: string }>
}

/**
 * POST /api/v1_5/distributions/[distributionId]/pause
 */
export async function POST(_request: Request, { params }: RouteParams) {
  try {
    const { distributionId } = await params
    const authContext = await requireRole(['admin', 'super_admin', 'cadre', 'partnership'])

    const updated = await pauseDistributionWorkflow(distributionId, authContext)
    return NextResponse.json({
      success: true,
      message: `Status distribusi berhasil diubah menjadi "${updated.status}".`,
      distribution: updated,
    })
  } catch (error: any) {
    const status = error.status || 500
    return NextResponse.json(
      { success: false, message: error.message || 'Gagal mengubah status jeda distribusi.' },
      { status }
    )
  }
}
