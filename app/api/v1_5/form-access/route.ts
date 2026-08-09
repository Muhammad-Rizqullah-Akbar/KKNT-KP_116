import { NextResponse } from 'next/server'
import { requireRole } from '@/lib/auth/server'
import {
  grantFormAccessDoc,
  listFormAccessDoc,
  revokeFormAccessDoc,
} from '@/lib/firebase/repositories/v1_5/formAccess.repo'

/**
 * GET /api/v1_5/form-access
 * List active form access grants for a form or subject.
 */
export async function GET(request: Request) {
  try {
    await requireRole(['admin', 'super_admin', 'cadre', 'partnership'])
    const { searchParams } = new URL(request.url)
    const formId = searchParams.get('formId') || undefined
    const subjectId = searchParams.get('subjectId') || undefined

    const grants = await listFormAccessDoc({ formId, subjectId })
    return NextResponse.json({ success: true, grants })
  } catch (error: any) {
    const status = error.status || 500
    return NextResponse.json(
      { success: false, message: error.message || 'Gagal mengambil hak akses formulir.' },
      { status }
    )
  }
}

/**
 * POST /api/v1_5/form-access
 * Admin grants or revokes form access to a Cadre or Partnership.
 */
export async function POST(request: Request) {
  try {
    const authContext = await requireRole(['admin', 'super_admin'])
    const body = await request.json()

    if (body.action === 'revoke' && body.accessId) {
      await revokeFormAccessDoc(body.accessId)
      return NextResponse.json({ success: true, message: 'Hak akses formulir berhasil dicabut.' })
    }

    if (!body.formId || !body.subjectType || !body.subjectId) {
      return NextResponse.json(
        { success: false, message: 'Parameter formId, subjectType, dan subjectId wajib diisi.' },
        { status: 400 }
      )
    }

    const grant = await grantFormAccessDoc(
      body.formId,
      body.subjectType,
      body.subjectId,
      body.subjectName || 'Subjek Terdaftar',
      authContext.uid
    )

    return NextResponse.json({ success: true, grant })
  } catch (error: any) {
    const status = error.status || 500
    return NextResponse.json(
      { success: false, message: error.message || 'Gagal mengatur hak akses formulir.' },
      { status }
    )
  }
}
