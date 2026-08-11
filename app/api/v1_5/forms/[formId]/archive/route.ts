import { NextResponse } from 'next/server'
import { getAuthorizationContext } from '@/lib/auth/server'
import { archiveFormWorkflow } from '@/lib/forms/v1_5/formManagement.service'

interface RouteParams {
  params: Promise<{ formId: string }>
}

/**
 * POST /api/v1_5/forms/[formId]/archive
 * Archive form version.
 */
export async function POST(_request: Request, { params }: RouteParams) {
  try {
    const { formId } = await params
    const authContext = (await getAuthorizationContext()) || {
      uid: 'dev-user',
      role: 'admin' as const,
      token: {} as any,
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
