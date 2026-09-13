import { NextResponse } from 'next/server'
import { getAuthorizationContext } from '@/lib/domain/auth/authorization'
import { archiveFormWorkflow } from '@/lib/domain/forms/form-management.service'

interface RouteParams {
  params: Promise<{ formId: string }>
}

/**
 * POST /api/forms/[formId]/archive
 * Archive form version.
 */
export async function POST(_request: Request, { params }: RouteParams) {
  try {
    const { formId } = await params
    const authContext = await getAuthorizationContext()
    if (!authContext) {
      return NextResponse.json({ success: false, message: 'Otentikasi diperlukan.' }, { status: 401 })
    }

    const archived = await archiveFormWorkflow(formId, authContext.uid)
    return NextResponse.json({
      success: true,
      message: `Formulir "${formId}" berhasil diarsip.`,
      form: archived,
    })
  } catch (error: any) {
    const status = error.status || 500
    return NextResponse.json(
      { success: false, message: error.message || 'Gagal mengarsipkan formulir.' },
      { status }
    )
  }
}
