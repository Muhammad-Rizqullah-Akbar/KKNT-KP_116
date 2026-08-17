import { NextResponse } from 'next/server'
import { getAuthorizationContext } from '@/lib/auth/server'
import { restoreFormWorkflow } from '@/lib/forms/v1_5/formManagement.service'

interface RouteParams {
  params: Promise<{ formId: string }>
}

/**
 * POST /api/v1_5/forms/[formId]/restore
 * Restore archived form version.
 */
export async function POST(_request: Request, { params }: RouteParams) {
  try {
    const { formId } = await params
    const authContext = await getAuthorizationContext()
    if (!authContext) {
      return NextResponse.json({ success: false, message: 'Otentikasi diperlukan.' }, { status: 401 })
    }

    const restored = await restoreFormWorkflow(formId, authContext.uid)
    return NextResponse.json({
      success: true,
      message: `Formulir "${formId}" berhasil dipulihkan.`,
      form: restored,
    })
  } catch (error: any) {
    const status = error.status || 500
    return NextResponse.json(
      { success: false, message: error.message || 'Gagal memulihkan formulir.' },
      { status }
    )
  }
}
