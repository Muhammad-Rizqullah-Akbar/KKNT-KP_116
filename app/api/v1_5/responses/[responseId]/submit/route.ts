import { NextResponse } from 'next/server'
import { submitResponseWorkflow } from '@/lib/forms/v1_5/response.service'

interface RouteParams {
  params: Promise<{ responseId: string }>
}

/**
 * POST /api/v1_5/responses/[responseId]/submit
 * Public unauthenticated endpoint to submit completed answers for an active session.
 * Enforces atomic double-submission protection and version snapshot validation.
 */
export async function POST(request: Request, { params }: RouteParams) {
  try {
    const { responseId } = await params
    const body = await request.json()

    if (!body.submissionToken || !body.answers) {
      return NextResponse.json(
        { success: false, message: 'Parameter submissionToken dan answers wajib diisi.' },
        { status: 400 }
      )
    }

    const receipt = await submitResponseWorkflow(responseId, {
      submissionToken: body.submissionToken,
      answers: body.answers,
    })

    return NextResponse.json({ success: true, receipt })
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || 'Gagal mengirimkan kuesioner.' },
      { status: 400 }
    )
  }
}
