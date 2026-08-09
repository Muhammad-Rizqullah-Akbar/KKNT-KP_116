import { NextRequest, NextResponse } from 'next/server'
import { adminAuth, adminFirestore } from '@/lib/firebaseAdmin'
import { AuthorizationError, requireRole } from '@/lib/auth/server'

function authorizationResponse(error: unknown) {
  if (error instanceof AuthorizationError) {
    return NextResponse.json({ success: false, message: error.message }, { status: error.status })
  }
  return null
}

export async function GET() {
  try {
    await requireRole(['super_admin'])
    const result = await adminAuth.listUsers()
    const users = await Promise.all(result.users.map(async (user) => {
      const profile = (await adminFirestore.collection('users').doc(user.uid).get()).data() || {}
      return {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName || user.email?.split('@')[0] || '',
        role: profile.role || 'public',
        photoURL: user.photoURL || '',
        createdAt: profile.createdAt || user.metadata.creationTime,
        updatedAt: profile.updatedAt || user.metadata.lastSignInTime,
      }
    }))
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
    await requireRole(['super_admin'])
    const uid = new URL(request.url).searchParams.get('uid')
    if (!uid) return NextResponse.json({ success: false, message: 'UID user wajib diisi' }, { status: 400 })

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
    const { uid, role } = await request.json()
    if (!uid || !['admin', 'super_admin', null].includes(role)) {
      return NextResponse.json({ success: false, message: 'UID atau role tidak valid' }, { status: 400 })
    }
    await adminFirestore.collection('users').doc(uid).update({ role, updatedAt: new Date().toISOString() })
    return NextResponse.json({ success: true, message: 'Role user berhasil diperbarui', role })
  } catch (error) {
    const response = authorizationResponse(error)
    if (response) return response
    console.error('Update user role error:', error)
    return NextResponse.json({ success: false, message: 'Gagal update role user.' }, { status: 500 })
  }
}
