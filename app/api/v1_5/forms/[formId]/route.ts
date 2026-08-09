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
    const authContext = await getAuthorizationContext()
    const formDoc = await getFormAggregateFromDb(formId)

    if (!formDoc) {
      return NextResponse.json(
        { success: false, message: `Formulir "${formId}" tidak ditemukan.` },
        { status: 404 }
      )
    }

    // Admin / Super Admin gets full aggregate document including answer keys
    if (authContext?.role === 'admin' || authContext?.role === 'super_admin') {
      return NextResponse.json({ success: true, form: formDoc })
    }

    // Cadre, Partnership, or Public users get public projection without answer keys or scoring internals
    const canonical = {
      form: {
        formId: formDoc.formId,
        metadata: formDoc.metadata,
        activeVersionId: formDoc.activeVersionId,
        createdAt: formDoc.createdAt,
        updatedAt: formDoc.updatedAt,
      },
      version: {
        versionId: formDoc.activeVersionId,
        formId: formDoc.formId,
        versionNumber: formDoc.activeVersionNumber,
        status: formDoc.status,
        questions: formDoc.questions,
        scoring: formDoc.scoring,
        validation: formDoc.validation,
        createdAt: formDoc.createdAt,
      },
    }

    const publicProjection = toPublicFormProjection(canonical)
    return NextResponse.json({
      success: true,
      formId: formDoc.formId,
      metadata: formDoc.metadata,
      activeVersionId: formDoc.activeVersionId,
      activeVersionNumber: formDoc.activeVersionNumber,
      status: formDoc.status,
      updatedAt: formDoc.updatedAt,
      publicForm: publicProjection,
    })
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || 'Gagal memuat formulir.' },
      { status: 500 }
    )
  }
}

/**
 * PUT /api/v1_5/forms/[formId]
 * Save draft form aggregate (Admin only).
 */
export async function PUT(request: Request, { params }: RouteParams) {
  try {
    const { formId } = await params
    const authContext = await requireRole(['admin', 'super_admin'])
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
