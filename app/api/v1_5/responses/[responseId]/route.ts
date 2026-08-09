import { NextResponse } from 'next/server'
import { requireRole } from '@/lib/auth/server'
import { getResponseDetailWorkflow } from '@/lib/forms/v1_5/response.service'

interface RouteParams {
  params: Promise<{ responseId: string }>
}

/**
 * GET /api/v1_5/responses/[responseId]
 * Role-scoped single response detail inspection.
 */
export async function GET(_request: Request, { params }: RouteParams) {
  try {
    const { responseId } = await params
    const authContext = await requireRole(['admin', 'super_admin', 'cadre', 'partnership'])

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
