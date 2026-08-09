import { NextResponse } from 'next/server'
import { requireRole } from '@/lib/auth/server'
import { getDistributionDoc } from '@/lib/firebase/repositories/v1_5/distributions.repo'
import { updateDistributionWorkflow } from '@/lib/forms/v1_5/distribution.service'

interface RouteParams {
  params: Promise<{ distributionId: string }>
}

/**
 * GET /api/v1_5/distributions/[distributionId]
 */
export async function GET(_request: Request, { params }: RouteParams) {
  try {
    const { distributionId } = await params
    const authContext = await requireRole(['admin', 'super_admin', 'cadre', 'partnership'])

    const dist = await getDistributionDoc(distributionId)
    if (!dist) {
      return NextResponse.json(
        { success: false, message: `Distribusi dengan ID "${distributionId}" tidak ditemukan.` },
        { status: 404 }
      )
    }

    const isAdmin = authContext.role === 'admin' || authContext.role === 'super_admin'
    if (!isAdmin && dist.ownerId !== authContext.uid) {
      return NextResponse.json(
        { success: false, message: 'Anda tidak memiliki hak untuk melihat detail distribusi ini.' },
        { status: 403 }
      )
    }

    return NextResponse.json({ success: true, distribution: dist })
  } catch (error: any) {
    const status = error.status || 500
    return NextResponse.json(
      { success: false, message: error.message || 'Gagal memuat detail distribusi.' },
      { status }
    )
  }
}

/**
 * PUT /api/v1_5/distributions/[distributionId]
 */
export async function PUT(request: Request, { params }: RouteParams) {
  try {
    const { distributionId } = await params
    const authContext = await requireRole(['admin', 'super_admin', 'cadre', 'partnership'])
    const body = await request.json()

    const updated = await updateDistributionWorkflow(distributionId, body, authContext)
    return NextResponse.json({ success: true, distribution: updated })
  } catch (error: any) {
    const status = error.status || 500
    return NextResponse.json(
      { success: false, message: error.message || 'Gagal memperbarui distribusi.' },
      { status }
    )
  }
}
