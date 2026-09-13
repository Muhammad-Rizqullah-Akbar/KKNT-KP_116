import { NextResponse } from 'next/server'
import { getAuthorizationContext } from '@/lib/domain/auth/authorization'
import { pauseDistributionWorkflow } from '@/lib/domain/distributions/distribution.service'

interface RouteParams {
  params: Promise<{ distributionId: string }>
}

/**
 * POST /api/distributions/[distributionId]/pause
 */
export async function POST(_request: Request, { params }: RouteParams) {
  try {
    const { distributionId } = await params
    const authContext = await getAuthorizationContext()
    if (!authContext) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 })
    }

    const updated = await pauseDistributionWorkflow(distributionId, authContext)
    const statusLabel = updated.status === 'paused' ? 'dijeda' : 'diaktifkan kembali'

    return NextResponse.json({
      success: true,
      message: `Status distribusi berhasil ${statusLabel}.`,
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
