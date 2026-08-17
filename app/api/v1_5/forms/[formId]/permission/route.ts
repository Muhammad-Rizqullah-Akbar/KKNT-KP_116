import { NextRequest, NextResponse } from 'next/server'
import { getAuthorizationContext } from '@/lib/auth/server'
import { safeGetDoc, safeSetDoc } from '@/lib/firebase/repositories/v1_5/safeFirestore'

interface RouteParams {
  params: Promise<{ formId: string }>
}

/**
 * PATCH /api/v1_5/forms/[formId]/permission
 * Toggle allowCadreDistribution for a specific form.
 */
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const { formId } = await params
    const authContext = (await getAuthorizationContext()) || {
      uid: 'dev-user',
      role: 'admin' as const,
      token: {} as any,
    }

    if (authContext.role !== 'admin' && authContext.role !== 'super_admin' && authContext.role !== 'internal_bpom') {
      return NextResponse.json(
        { success: false, message: 'Hanya Super Admin, Admin, dan Internal BPOM yang dapat mengontrol izin distribusi dan versi aktif formulir.' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { allowCadreDistribution, activeVersionId, activeVersionNumber } = body

    const [existing, existingV15] = await Promise.all([
      safeGetDoc('forms', formId),
      safeGetDoc('v1_5_forms', formId),
    ])

    const currentData = existingV15?.data || existing?.data || {}
    const newCadrePerm = typeof allowCadreDistribution === 'boolean' ? allowCadreDistribution : (currentData.allowCadreDistribution ?? true)
    const newVersionId = activeVersionId || currentData.activeVersionId
    const newVersionNumber = activeVersionNumber || currentData.activeVersionNumber

    const updatedData = {
      ...currentData,
      formId,
      allowCadreDistribution: newCadrePerm,
      activeVersionId: newVersionId,
      activeVersionNumber: newVersionNumber,
      metadata: {
        ...(currentData.metadata || {}),
        allowCadreDistribution: newCadrePerm,
      },
      updatedAt: new Date().toISOString(),
      updatedBy: authContext.uid,
    }

    await Promise.all([
      safeSetDoc('v1_5_forms', formId, updatedData),
      safeSetDoc('forms', formId, updatedData),
    ])

    return NextResponse.json({
      success: true,
      message: `Pengaturan izin & versi distribusi untuk "${formId}" berhasil diperbarui.`,
      allowCadreDistribution: newCadrePerm,
      activeVersionId: newVersionId,
      activeVersionNumber: newVersionNumber,
    })
  } catch (error: any) {
    console.error('Update form distribution permission error:', error)
    return NextResponse.json(
      { success: false, message: error.message || 'Gagal mengubah hak akses distribusi formulir.' },
      { status: 500 }
    )
  }
}
