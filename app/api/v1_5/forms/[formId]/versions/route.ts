import { NextResponse } from 'next/server'
import { getAuthorizationContext } from '@/lib/auth/server'
import { getFormVersionsWorkflow } from '@/lib/forms/v1_5/formManagement.service'

interface RouteParams {
  params: Promise<{ formId: string }>
}

/**
 * GET /api/v1_5/forms/[formId]/versions
 * Fetches subcollection version snapshots history.
 */
export async function GET(_request: Request, { params }: RouteParams) {
  try {
    const { formId } = await params
    const authContext = (await getAuthorizationContext()) || {
      uid: 'dev-user',
      role: 'super_admin' as const,
      token: {} as any,
    }

    const snapshots = await getFormVersionsWorkflow(formId)
    return NextResponse.json({
      success: true,
      versions: snapshots,
    })
  } catch (error: any) {
    const status = error.status || 500
    return NextResponse.json(
      { success: false, message: error.message || 'Gagal mengambil riwayat versi.' },
      { status }
    )
  }
}
