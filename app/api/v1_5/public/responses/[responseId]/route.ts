import { NextResponse } from 'next/server'
import { getPublicResponseResultWorkflow } from '@/lib/forms/v1_5/response.service'

interface RouteParams {
  params: Promise<{ responseId: string }>
}

/**
 * GET /api/v1_5/public/responses/[responseId]
 * Public read-only evaluation receipt for respondent.
 */
export async function GET(_request: Request, { params }: RouteParams) {
  try {
    const { responseId } = await params
    const receipt = await getPublicResponseResultWorkflow(responseId)
    return NextResponse.json({ success: true, receipt })
  } catch (error: any) {
    const status = error.status || 404
    return NextResponse.json(
      { success: false, message: error.message || 'Gagal memuat hasil evaluasi.' },
      { status }
    )
  }
}
