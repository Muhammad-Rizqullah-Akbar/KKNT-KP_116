import { NextResponse } from 'next/server'
import { getAuthorizationContext } from '@/lib/domain/auth/authorization'
import { duplicateFormWorkflow } from '@/lib/domain/forms/form-management.service'

/**
 * POST /api/forms/[formId]/duplicate
 * Duplicate a  form aggregate.
 */
export async function POST(
  _request: Request,
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
      { success: false, message: error.message || 'Gagal menduplikat formulir .' },
      { status }
    )
  }
}
