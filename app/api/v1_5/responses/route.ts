import { NextResponse } from 'next/server'
import { requireRole } from '@/lib/auth/server'
import { listResponsesWorkflow } from '@/lib/forms/v1_5/response.service'

/**
 * GET /api/v1_5/responses
 * Scoped response list for Admin / Cadre / Partnership dashboard.
 */
export async function GET(request: Request) {
  try {
    const authContext = await requireRole(['admin', 'super_admin', 'cadre', 'partnership'])
    const { searchParams } = new URL(request.url)

    const distributionId = searchParams.get('distributionId') || undefined
    const formId = searchParams.get('formId') || undefined
    const versionId = searchParams.get('versionId') || undefined
    const status = searchParams.get('status') || 'all'
    const search = searchParams.get('search') || undefined

    const responses = await listResponsesWorkflow(authContext, {
      distributionId,
      formId,
      versionId,
      status,
      search,
    })

    return NextResponse.json({ success: true, responses })
  } catch (error: any) {
    const status = error.status || 500
    return NextResponse.json(
      { success: false, message: error.message || 'Gagal mengambil daftar respon.' },
      { status }
    )
  }
}
