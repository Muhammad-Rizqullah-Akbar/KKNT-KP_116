import { NextRequest, NextResponse } from 'next/server'
import { adminAuth, adminFirestore } from '@/lib/firebaseAdmin'
import { AuthorizationError, requireRole } from '@/lib/auth/server'

const VALID_ROLES = ['super_admin', 'admin', 'internal_bpom', 'cadre', 'partnership']

export async function POST(request: NextRequest) {
  try {
    const authContext = await requireRole(['super_admin', 'partnership'])
    const {
      email,
      password,
      role,
      displayName,
      organization,
      phone,
      partnershipId,
      partnershipName,
    } = await request.json()

    if (!email || !password || !role) {
      return NextResponse.json({ success: false, message: 'Email, password, dan role wajib diisi' }, { status: 400 })
    }

    // Role Validation
    if (!VALID_ROLES.includes(role)) {
      return NextResponse.json(
        { success: false, message: `Role tidak valid. Pilihan role: ${VALID_ROLES.join(', ')}` },
        { status: 400 }
      )
    }

    // Authorization rule: Partnership users can only create 'cadre' role users
    if (authContext.role === 'partnership' && role !== 'cadre') {
      return NextResponse.json(
        { success: false, message: 'Akun Mitra / Partnership hanya dapat mendaftarkan Kader (cadre).' },
        { status: 403 }
      )
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || password.length < 6) {
      return NextResponse.json({ success: false, message: 'Format email atau password (min 6 karakter) tidak valid' }, { status: 400 })
    }

    const user = await adminAuth.createUser({
      email,
      password,
      displayName: displayName || email.split('@')[0],
      emailVerified: true,
    })

    const finalPartnershipId =
      authContext.role === 'partnership' ? authContext.uid : partnershipId || null

    try {
      await adminFirestore.collection('users').doc(user.uid).set({
        uid: user.uid,
        email,
        displayName: displayName || email.split('@')[0],
        role,
        organization: organization || '',
        phone: phone || '',
        partnershipId: finalPartnershipId,
        partnershipName: partnershipName || '',
        photoURL: '',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        createdBy: authContext.uid,
      })
    } catch (error) {
      await adminAuth.deleteUser(user.uid)
      throw error
    }

    return NextResponse.json({
      success: true,
      message: 'User berhasil didaftarkan',
      uid: user.uid,
      email,
      role,
    })
  } catch (error) {
    if (error instanceof AuthorizationError) {
      return NextResponse.json({ success: false, message: error.message }, { status: error.status })
    }
    console.error('Register API Error:', error)
    return NextResponse.json({ success: false, message: 'Terjadi kesalahan pada server' }, { status: 500 })
  }
}
