import { NextResponse } from 'next/server'
import { requireRole } from '@/lib/auth/server'
import { createNewVersionWorkflow } from '@/lib/forms/v1_5/formManagement.service'

interface RouteParams {
  params: Promise<{ formId: string }>
}

/**
 * POST /api/v1_5/forms/[formId]/new-version
 * Creates a new draft version snapshot (e.g. Version 2 Draft) from active version.
 */
export async function POST(_request: Request, { params }: RouteParams) {
  try {
    const { formId } = await params
    const authContext = await requireRole(['admin', 'super_admin'])

    const updated = await createNewVersionWorkflow(formId, authContext.uid)
    return NextResponse.json({
      success: true,
      message: `Draft versi baru (${updated.activeVersionNumber}) berhasil dibuat.`,
      form: updated,
    })
  } catch (error: any) {
    const status = error.status || 500
    return NextResponse.json(
      { success: false, message: error.message || 'Gagal membuat versi draft baru.' },
      { status }
    )
  }
}
