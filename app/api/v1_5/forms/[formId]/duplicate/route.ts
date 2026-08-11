import { NextResponse } from 'next/server'
import { getAuthorizationContext } from '@/lib/auth/server'
import { duplicateFormWorkflow } from '@/lib/forms/v1_5/formManagement.service'

/**
 * POST /api/v1_5/forms/[formId]/duplicate
 * Duplicate a V1.5 form aggregate.
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ formId: string }> }
) {
  try {
    const authContext = await getAuthorizationContext()
    if (!authContext) {
      return NextResponse.json({ success: false, message: 'Otentikasi diperlukan.' }, { status: 401 })
    }
    const { formId } = await params

    const duplicated = await duplicateFormWorkflow(formId, authContext.uid)
    return NextResponse.json({ success: true, form: duplicated })
  } catch (error: any) {
    const status = error.status || 500
    return NextResponse.json(
      { success: false, message: error.message || 'Gagal menduplikat formulir V1.5.' },
      { status }
    )
  }
}
