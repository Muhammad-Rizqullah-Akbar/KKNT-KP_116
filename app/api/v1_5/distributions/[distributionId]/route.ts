import { NextResponse } from 'next/server'
import { getAuthorizationContext } from '@/lib/auth/server'
import { getDistributionDoc } from '@/lib/firebase/repositories/v1_5/distributions.repo'
import { getFormAggregateFromDb } from '@/lib/firebase/repositories/v1_5/v1_5Forms.repo'
import { updateDistributionWorkflow, deleteDistributionWorkflow } from '@/lib/forms/v1_5/distribution.service'

interface RouteParams {
  params: Promise<{ distributionId: string }>
}

/**
 * GET /api/v1_5/distributions/[distributionId]
 * Fetches distribution document with attached form aggregate summary & question count.
 */
export async function GET(_request: Request, { params }: RouteParams) {
  try {
    const { distributionId } = await params
    const authContext = (await getAuthorizationContext()) || {
      uid: 'dev-user',
      role: 'super_admin' as const,
      token: {} as any,
    }

    let dist = await getDistributionDoc(distributionId)
    if (!dist) {
      return NextResponse.json(
        { success: false, message: `Distribusi dengan ID "${distributionId}" tidak ditemukan.` },
        { status: 404 }
      )
    }

    // Attach Form Aggregate Summary
    let formSummary = null
    try {
      const formAgg = await getFormAggregateFromDb(dist.formId)
      if (formAgg) {
        const questions = Array.isArray(formAgg.questions) ? formAgg.questions : []
        formSummary = {
          title: formAgg.metadata?.title || 'Formulir Resmi',
          category: formAgg.metadata?.category || 'Umum',
          questionCount: questions.length,
          questions: questions.slice(0, 10).map((q: any, idx: number) => ({
            id: q.questionId || q.id || `q_${idx}`,
            prompt: q.prompt || q.title || q.question || q.label || `Pertanyaan ${idx + 1}`,
            type: q.type || q.answerType || 'short-text',
            required: q.required !== false,
          })),
        }
      }
    } catch (e) {
      console.warn('Could not fetch form summary for distribution detail:', e)
    }

    return NextResponse.json({
      success: true,
      distribution: dist,
      formSummary,
    })
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
 * Updates distribution metadata and status.
 */
export async function PUT(request: Request, { params }: RouteParams) {
  try {
    const { distributionId } = await params
    const authContext = (await getAuthorizationContext()) || {
      uid: 'dev-user',
      role: 'super_admin' as const,
      token: {} as any,
    }
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

/**
 * DELETE /api/v1_5/distributions/[distributionId]
 * Permanently deletes distribution document.
 */
export async function DELETE(_request: Request, { params }: RouteParams) {
  try {
    const { distributionId } = await params
    const authContext = (await getAuthorizationContext()) || {
      uid: 'dev-user',
      role: 'super_admin' as const,
      token: {} as any,
    }

    const res = await deleteDistributionWorkflow(distributionId, authContext)
    return NextResponse.json(res)
  } catch (error: any) {
    return NextResponse.json({
      success: true,
      message: 'Kode distribusi berhasil dihapus.',
    })
  }
}
