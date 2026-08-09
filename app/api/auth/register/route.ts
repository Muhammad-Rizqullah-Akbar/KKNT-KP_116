import { NextRequest, NextResponse } from 'next/server'
import { adminAuth, adminFirestore } from '@/lib/firebaseAdmin'
import { AuthorizationError, requireRole } from '@/lib/auth/server'

export async function POST(request: NextRequest) {
  try {
    await requireRole(['super_admin'])
    const { email, password, role, displayName } = await request.json()

    if (!email || !password || !role) {
      return NextResponse.json({ success: false, message: 'Email, password, dan role wajib diisi' }, { status: 400 })
    }
    if (role !== 'admin' && role !== 'super_admin') {
      return NextResponse.json({ success: false, message: 'Role harus "admin" atau "super_admin"' }, { status: 400 })
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || password.length < 6) {
      return NextResponse.json({ success: false, message: 'Email atau password tidak valid' }, { status: 400 })
    }

    const user = await adminAuth.createUser({
      email,
      password,
      displayName: displayName || email.split('@')[0],
      emailVerified: true,
    })

    try {
      await adminFirestore.collection('users').doc(user.uid).set({
        uid: user.uid,
        email,
        displayName: displayName || email.split('@')[0],
        role,
        photoURL: '',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      })
    } catch (error) {
      await adminAuth.deleteUser(user.uid)
      throw error
    }

    return NextResponse.json({ success: true, message: 'User berhasil didaftarkan', uid: user.uid, email, role })
  } catch (error) {
    if (error instanceof AuthorizationError) {
      return NextResponse.json({ success: false, message: error.message }, { status: error.status })
    }
    console.error('Register API Error:', error)
    return NextResponse.json({ success: false, message: 'Terjadi kesalahan pada server' }, { status: 500 })
  }
}
