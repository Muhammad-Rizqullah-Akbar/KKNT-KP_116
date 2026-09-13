import { NextResponse } from 'next/server'
import { getAuthorizationContext } from '@/lib/domain/auth/authorization'
import { publishFormWorkflow } from '@/lib/domain/forms/form-management.service'

interface RouteParams {
  params: Promise<{ formId: string }>
}

/**
 * POST /api/forms/[formId]/publish
 * Atomically publishes immutable version snapshot and updates active version on form aggregate.
 */
export async function POST(_request: Request, { params }: RouteParams) {
  try {
    const { formId } = await params
    const authContext = await getAuthorizationContext()
    if (!authContext) {
      return NextResponse.json({ success: false, message: 'Otentikasi diperlukan.' }, { status: 401 })
    }

    const result = await publishFormWorkflow(formId, authContext.uid)
    return NextResponse.json({
      success: true,
      message: `Versi ${result.snapshot.versionNumber} berhasil dipublikasikan secara atomis.`,
      aggregate: result.aggregate,
      snapshot: result.snapshot,
    })
  } catch (error: any) {
    const status = error.status || 500
    return NextResponse.json(
      { success: false, message: error.message || 'Gagal mempublikasikan versi formulir.' },
      { status }
    )
  }
}
