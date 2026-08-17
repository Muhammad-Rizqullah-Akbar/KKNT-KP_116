import { NextRequest, NextResponse } from 'next/server'
import { requireRole } from '@/lib/auth/server'
import { safeGetCollectionDocs } from '@/lib/firebase/repositories/v1_5/safeFirestore'

export async function GET(request: NextRequest) {
  try {
    const authContext = await requireRole(['super_admin', 'admin', 'internal_bpom', 'partnership'])

    const usersDocs = await safeGetCollectionDocs('users')
    let users = usersDocs.map((d) => ({
      uid: d.id,
      ...(d.data || {}),
    }))

    // If request is from partnership role, only return cadres created by this partnership
    if (authContext.role === 'partnership') {
      users = users.filter(
        (u: any) => u.createdBy === authContext.uid || u.partnershipId === authContext.uid
      )
    }

    return NextResponse.json({
      success: true,
      users,
      count: users.length,
    })
  } catch (error: any) {
    const status = error.status || 500
    return NextResponse.json(
      { success: false, message: error.message || 'Gagal memuat data pengguna.' },
      { status }
    )
  }
}
