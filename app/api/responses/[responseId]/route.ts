import { NextResponse } from 'next/server'
import { requireRole } from '@/lib/domain/auth/authorization'
import { getResponseDetailWorkflow } from '@/lib/domain/responses/response.service'

interface RouteParams {
  params: Promise<{ responseId: string }>
}

/**
 * GET /api/responses/[responseId]
 * Role-scoped single response detail inspection.
 */
export async function GET(_request: Request, { params }: RouteParams) {
  try {
    const { responseId } = await params
    const authContext = await requireRole(['super_admin', 'super_admin', 'cadre', 'partnership'])

    const responseDoc = await getResponseDetailWorkflow(responseId, authContext)
    return NextResponse.json({ success: true, response: responseDoc })
  } catch (error: any) {
    const status = error.status || 500
    return NextResponse.json(
      { success: false, message: error.message || 'Gagal memuat detail respon.' },
      { status }
    )
  }
}
