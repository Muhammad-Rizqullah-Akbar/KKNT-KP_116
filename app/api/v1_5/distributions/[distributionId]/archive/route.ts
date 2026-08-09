import { NextResponse } from 'next/server'
import { requireRole } from '@/lib/auth/server'
import { archiveDistributionWorkflow } from '@/lib/forms/v1_5/distribution.service'

interface RouteParams {
  params: Promise<{ distributionId: string }>
}

/**
 * POST /api/v1_5/distributions/[distributionId]/archive
 */
export async function POST(_request: Request, { params }: RouteParams) {
  try {
    const { distributionId } = await params
    const authContext = await requireRole(['admin', 'super_admin', 'cadre', 'partnership'])

    const updated = await archiveDistributionWorkflow(distributionId, authContext)
    return NextResponse.json({
      success: true,
      message: `Distribusi "${distributionId}" berhasil diarsipkan.`,
      distribution: updated,
    })
  } catch (error: any) {
    const status = error.status || 500
    return NextResponse.json(
      { success: false, message: error.message || 'Gagal mengarsipkan distribusi.' },
      { status }
    )
  }
}
