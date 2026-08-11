import { NextResponse } from 'next/server'
import { getAuthorizationContext, requireRole } from '@/lib/auth/server'
import { getFormAggregateFromDb } from '@/lib/firebase/repositories/v1_5/v1_5Forms.repo'
import { saveDraftWorkflow } from '@/lib/forms/v1_5/formManagement.service'
import { toPublicFormProjection } from '@/lib/forms/v1_5/legacyAdapter'

interface RouteParams {
  params: Promise<{ formId: string }>
}

/**
 * GET /api/v1_5/forms/[formId]
 * 1 FIRESTORE READ: Loads current form aggregate document.
 */
export async function GET(_request: Request, { params }: RouteParams) {
  try {
    const { formId } = await params
    const formDoc = await getFormAggregateFromDb(formId)

    if (!formDoc) {
      return NextResponse.json(
        { success: false, message: `Formulir "${formId}" tidak ditemukan.` },
        { status: 404 }
      )
    }

    return NextResponse.json({ success: true, form: formDoc })
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || 'Gagal memuat formulir.' },
      { status: 500 }
    )
  }
}

/**
 * PUT /api/v1_5/forms/[formId]
 * Save draft form aggregate.
 */
export async function PUT(request: Request, { params }: RouteParams) {
  try {
    const { formId } = await params
    const authContext = (await getAuthorizationContext()) || {
      uid: 'dev-user',
      role: 'admin' as const,
      token: {} as any,
    }
    const body = await request.json()

    if (!body.state) {
      return NextResponse.json(
        { success: false, message: 'Data builder state formulir wajib disertakan.' },
        { status: 400 }
      )
    }

    const updated = await saveDraftWorkflow(formId, body.state, authContext.uid)
    return NextResponse.json({ success: true, form: updated })
  } catch (error: any) {
    const status = error.status || 500
    return NextResponse.json(
      { success: false, message: error.message || 'Gagal menyimpan draft formulir.' },
      { status }
    )
  }
}
