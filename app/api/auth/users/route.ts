import { NextRequest, NextResponse } from 'next/server'
import { adminAuth, adminFirestore } from '@/lib/firebaseAdmin'
import { AuthorizationError, requireRole } from '@/lib/auth/server'

const VALID_ROLES = ['super_admin', 'admin', 'internal_bpom', 'cadre', 'partnership', null]

function authorizationResponse(error: unknown) {
  if (error instanceof AuthorizationError) {
    return NextResponse.json({ success: false, message: error.message }, { status: error.status })
  }
  return null
}

export async function GET(request: NextRequest) {
  try {
    const authContext = await requireRole(['super_admin', 'admin', 'partnership'])
    const { searchParams } = new URL(request.url)
    const partnershipOnly = searchParams.get('partnershipOnly') === 'true'

    const result = await adminAuth.listUsers()
    let users = await Promise.all(
      result.users.map(async (user) => {
        const profile = (await adminFirestore.collection('users').doc(user.uid).get()).data() || {}
        return {
          uid: user.uid,
          email: user.email,
          displayName: user.displayName || user.email?.split('@')[0] || '',
          role: profile.role || 'cadre',
          organization: profile.organization || '',
          phone: profile.phone || '',
          partnershipId: profile.partnershipId || null,
          partnershipName: profile.partnershipName || '',
          photoURL: user.photoURL || '',
          createdAt: profile.createdAt || user.metadata.creationTime,
          updatedAt: profile.updatedAt || user.metadata.lastSignInTime,
        }
      })
    )

    // If caller is a Partnership account, only show cadres owned by this partnership UID
    if (authContext.role === 'partnership' || partnershipOnly) {
      users = users.filter((u) => u.partnershipId === authContext.uid || u.role === 'cadre')
    }

    return NextResponse.json({ success: true, users })
  } catch (error) {
    const response = authorizationResponse(error)
    if (response) return response
    console.error('Get users error:', error)
    return NextResponse.json({ success: false, message: 'Gagal mengambil data user.' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const authContext = await requireRole(['super_admin', 'partnership'])
    const uid = new URL(request.url).searchParams.get('uid')
    if (!uid) return NextResponse.json({ success: false, message: 'UID user wajib diisi' }, { status: 400 })

    if (authContext.role === 'partnership') {
      const profileDoc = await adminFirestore.collection('users').doc(uid).get()
      if (profileDoc.data()?.partnershipId !== authContext.uid) {
        return NextResponse.json({ success: false, message: 'Anda hanya dapat menghapus kader milik Anda.' }, { status: 403 })
      }
    }

    await adminAuth.deleteUser(uid)
    await adminFirestore.collection('users').doc(uid).delete()
    return NextResponse.json({ success: true, message: 'User berhasil dihapus' })
  } catch (error) {
    const response = authorizationResponse(error)
    if (response) return response
    console.error('Delete user error:', error)
    return NextResponse.json({ success: false, message: 'Gagal menghapus user.' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    await requireRole(['super_admin'])
    const { uid, role, organization, phone } = await request.json()
    if (!uid || !VALID_ROLES.includes(role)) {
      return NextResponse.json({ success: false, message: 'UID atau role tidak valid' }, { status: 400 })
    }
    const updatePayload: Record<string, any> = {
      role,
      updatedAt: new Date().toISOString(),
    }
    if (organization !== undefined) updatePayload.organization = organization
    if (phone !== undefined) updatePayload.phone = phone

    await adminFirestore.collection('users').doc(uid).update(updatePayload)
    return NextResponse.json({ success: true, message: 'Role user berhasil diperbarui', role })
  } catch (error) {
    const response = authorizationResponse(error)
    if (response) return response
    console.error('Update user role error:', error)
    return NextResponse.json({ success: false, message: 'Gagal update role user.' }, { status: 500 })
  }
}
