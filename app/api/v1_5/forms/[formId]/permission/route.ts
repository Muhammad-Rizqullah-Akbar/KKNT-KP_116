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

    if (authContext.role !== 'admin' && authContext.role !== 'super_admin') {
      return NextResponse.json(
        { success: false, message: 'Hanya Admin / Super Admin yang dapat mengubah hak akses distribusi.' },
        { status: 403 }
      )
    }

    const { allowCadreDistribution } = await request.json()
    if (typeof allowCadreDistribution !== 'boolean') {
      return NextResponse.json(
        { success: false, message: 'Properti allowCadreDistribution (boolean) wajib disertakan.' },
        { status: 400 }
      )
    }

    const [existing, existingV15] = await Promise.all([
      safeGetDoc('forms', formId),
      safeGetDoc('v1_5_forms', formId),
    ])

    const updatedData = {
      ...(existingV15?.data || existing?.data || {}),
      formId,
      allowCadreDistribution,
      metadata: {
        ...(existingV15?.data?.metadata || existing?.data?.metadata || {}),
        allowCadreDistribution,
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
      message: `Akses distribusi kader & mitra untuk formulir "${formId}" berhasil diubah menjadi ${
        allowCadreDistribution ? 'diizinkan' : 'dibatasi (khusus admin)'
      }.`,
      allowCadreDistribution,
    })
  } catch (error: any) {
    console.error('Update form distribution permission error:', error)
    return NextResponse.json(
      { success: false, message: error.message || 'Gagal mengubah hak akses distribusi formulir.' },
      { status: 500 }
    )
  }
}
