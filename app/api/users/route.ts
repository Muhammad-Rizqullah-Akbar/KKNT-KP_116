import { NextRequest, NextResponse } from 'next/server'
import { requireRole } from '@/lib/domain/auth/authorization'
import { safeGetCollectionDocs } from '@/lib/repositories/safe-firestore'

export async function GET(request: NextRequest) {
  try {
    const authContext = await requireRole(['super_admin', 'super_admin', 'super_admin', 'partnership'])

    const usersDocs = await safeGetCollectionDocs('users')
    let users = usersDocs.map((d) => ({
      uid: d.id,
      ...(d.data || {}),
    }))

    // If request is from partnership role, only return own profile and cadres created by/linked to this partnership
    if (authContext.role === 'partnership') {
      const currentUser = users.find((u: any) => u.uid === authContext.uid)
      const userOrg = (currentUser?.organization || currentUser?.partnershipName || currentUser?.displayName || '').toLowerCase().trim()

      users = users.filter(
        (u: any) =>
          u.uid === authContext.uid ||
          u.createdBy === authContext.uid ||
          u.partnershipId === authContext.uid ||
          (userOrg && u.organization && u.organization.toLowerCase().trim() === userOrg)
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
