import { NextResponse } from 'next/server'
import { startResponseWorkflow } from '@/lib/forms/v1_5/response.service'

/**
 * POST /api/v1_5/responses/start
 * Public unauthenticated endpoint to start a response session.
 * Resolves distribution code, captures effective active/pinned version, creates in_progress response session.
 * Returns PublicResponseSessionDTO with toPublicFormProjection().
 */
export async function POST(request: Request) {
  try {
    const body = await request.json()

    if (!body.distributionCode) {
      return NextResponse.json(
        { success: false, message: 'Kode distribusi (distributionCode) wajib diisi.' },
        { status: 400 }
      )
    }

    const sessionDTO = await startResponseWorkflow({
      distributionCode: body.distributionCode,
      respondent: body.respondent,
    })

    return NextResponse.json({ success: true, session: sessionDTO })
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || 'Gagal memulai sesi pengisian kuesioner.' },
      { status: 400 }
    )
  }
}
