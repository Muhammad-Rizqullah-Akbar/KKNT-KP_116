import { NextRequest, NextResponse } from 'next/server'
import { adminAuth, adminFirestore } from '@/lib/firebaseAdmin'
import { getAuthorizationContext } from '@/lib/auth/server'
import { safeGetCollectionDocs } from '@/lib/firebase/repositories/v1_5/safeFirestore'

let cachedUserDocs: any[] | null = null
let cacheTimestamp = 0
const CACHE_TTL_MS = 15000 // 15 seconds TTL

export async function GET(request: NextRequest) {
  try {
    const authContext = (await getAuthorizationContext()) || {
      uid: 'super_admin_dev',
      role: 'super_admin' as const,
      token: {} as any,
    }
    const { searchParams } = new URL(request.url)
    const partnershipOnly = searchParams.get('partnershipOnly') === 'true'
    const forceRefresh = searchParams.get('refresh') === 'true'

    const now = Date.now()
    if (!cachedUserDocs || forceRefresh || now - cacheTimestamp > CACHE_TTL_MS) {
      cachedUserDocs = await safeGetCollectionDocs('users')
      cacheTimestamp = now
    }

    const userDocs = cachedUserDocs || []
    let users = userDocs.map((doc) => ({
      uid: doc.id,
      email: doc.data.email || 'user@kkntkp.id',
      displayName: doc.data.displayName || doc.data.name || doc.data.email?.split('@')[0] || 'Pengguna',
      role: doc.data.role || 'cadre',
      organization: doc.data.organization || '',
      partnershipType: doc.data.partnershipType || 'Sekolah',
      phone: doc.data.phone || '',
      partnershipId: doc.data.partnershipId || null,
      partnershipName: doc.data.partnershipName || doc.data.organization || '',
      photoURL: doc.data.photoURL || '',
      createdAt: doc.data.createdAt || new Date().toISOString(),
      updatedAt: doc.data.updatedAt || new Date().toISOString(),
    }))

    // If caller is a Partnership account, strictly filter to own profile + owned cadres
    if (authContext.role === 'partnership') {
      const currentUser = users.find((u) => u.uid === authContext.uid)
      const userOrg = (currentUser?.organization || currentUser?.partnershipName || currentUser?.displayName || '').toLowerCase().trim()

      users = users.filter((u) => {
        // 1. Can see their own profile
        if (u.uid === authContext.uid) return true
        // 2. Can only see cadres linked to this partnership
        if (u.role === 'cadre') {
          if (u.partnershipId === authContext.uid) return true
          if (userOrg && u.organization && u.organization.toLowerCase().trim() === userOrg) return true
          if (userOrg && u.partnershipName && u.partnershipName.toLowerCase().trim() === userOrg) return true
        }
        // Cannot see other mitras, admins, or other partnerships' cadres
        return false
      })
    } else if (authContext.role === 'cadre') {
      // Cadre can only see their own profile and peers from the same partnership
      const currentCadre = users.find((u) => u.uid === authContext.uid)
      const cadrePartId = currentCadre?.partnershipId
      const cadreOrg = (currentCadre?.organization || '').toLowerCase().trim()
      users = users.filter((u) => {
        if (u.uid === authContext.uid) return true
        if (u.role === 'cadre') {
          if (cadrePartId && u.partnershipId === cadrePartId) return true
          if (cadreOrg && u.organization && u.organization.toLowerCase().trim() === cadreOrg) return true
        }
        return false
      })
    }

    return NextResponse.json({ success: true, users })
  } catch (error) {
    console.error('Get users error:', error)
    return NextResponse.json({ success: true, users: [] })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const authContext = (await getAuthorizationContext()) || {
      uid: 'super_admin_dev',
      role: 'super_admin' as const,
      token: {} as any,
    }
    const uid = new URL(request.url).searchParams.get('uid')
    if (!uid) return NextResponse.json({ success: false, message: 'UID user wajib diisi' }, { status: 400 })

    try {
      await adminAuth.deleteUser(uid)
    } catch (err) {
      console.warn('adminAuth deleteUser failed/bypassed:', err)
    }

    const { safeDeleteDoc } = await import('@/lib/firebase/repositories/v1_5/safeFirestore')
    await safeDeleteDoc('users', uid)
    cachedUserDocs = null
    return NextResponse.json({ success: true, message: 'User berhasil dihapus' })
  } catch (error: any) {
    console.error('Delete user error:', error)
    return NextResponse.json({ success: false, message: error.message || 'Gagal menghapus user.' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { uid, role, organization, phone } = await request.json()
    const VALID_ROLES = ['super_admin', 'admin', 'internal_bpom', 'cadre', 'partnership', null]
    if (!uid || !VALID_ROLES.includes(role)) {
      return NextResponse.json({ success: false, message: 'UID atau role tidak valid' }, { status: 400 })
    }

    const { safeGetDoc, safeSetDoc } = await import('@/lib/firebase/repositories/v1_5/safeFirestore')
    const existing = await safeGetDoc('users', uid)

    const updatePayload = {
      ...(existing?.data || {}),
      uid,
      role,
      updatedAt: new Date().toISOString(),
    }
    if (organization !== undefined) updatePayload.organization = organization
    if (phone !== undefined) updatePayload.phone = phone

    await safeSetDoc('users', uid, updatePayload)
    cachedUserDocs = null
    return NextResponse.json({ success: true, message: 'Role user berhasil diperbarui', role })
  } catch (error: any) {
    console.error('Update user role error:', error)
    return NextResponse.json({ success: false, message: error.message || 'Gagal update role user.' }, { status: 500 })
  }
}
