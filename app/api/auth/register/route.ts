import { NextRequest, NextResponse } from 'next/server'
import { adminAuth, adminFirestore } from '@/lib/firebaseAdmin'
import { getAuthorizationContext } from '@/lib/auth/server'
import { safeSetDoc } from '@/lib/firebase/repositories/v1_5/safeFirestore'

const VALID_ROLES = ['super_admin', 'admin', 'internal_bpom', 'cadre', 'partnership']

export async function POST(request: NextRequest) {
  try {
    const authContext = await getAuthorizationContext()
    if (!authContext) {
      return NextResponse.json({ success: false, message: 'Otentikasi diperlukan untuk mendaftarkan akun.' }, { status: 401 })
    }

    const {
      email,
      password,
      role,
      displayName,
      organization,
      partnershipType,
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

    // Authorization Matrix:
    // 1. Cadre / Public roles cannot create any accounts
    if (authContext.role === 'cadre' || authContext.role === 'public') {
      return NextResponse.json(
        { success: false, message: 'Anda tidak memiliki hak untuk mendaftarkan akun pengguna baru.' },
        { status: 403 }
      )
    }

    // 2. Partnership users can ONLY create 'cadre' role users
    if (authContext.role === 'partnership' && role !== 'cadre') {
      return NextResponse.json(
        { success: false, message: 'Akun Mitra / Partnership hanya dapat mendaftarkan Kader (cadre).' },
        { status: 403 }
      )
    }

    // 3. Non-super_admin users cannot create privileged admin or super_admin roles
    if ((role === 'super_admin' || role === 'admin' || role === 'internal_bpom') && authContext.role !== 'super_admin') {
      return NextResponse.json(
        { success: false, message: 'Hanya Super Admin yang diizinkan untuk membuat akun administratif.' },
        { status: 403 }
      )
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || password.length < 6) {
      return NextResponse.json({ success: false, message: 'Format email atau password (min 6 karakter) tidak valid' }, { status: 400 })
    }

    let createdUid = 'usr_' + Date.now().toString(36) + Math.random().toString(36).substring(2, 6)

    try {
      const user = await adminAuth.createUser({
        email,
        password,
        displayName: displayName || email.split('@')[0],
        emailVerified: true,
      })
      createdUid = user.uid
    } catch (adminErr: any) {
      if (adminErr?.code === 'auth/email-already-exists') {
        try {
          const existingUser = await adminAuth.getUserByEmail(email)
          createdUid = existingUser.uid
          await adminAuth.updateUser(createdUid, {
            password,
            displayName: displayName || email.split('@')[0],
          })
        } catch (e) {
          console.warn('Failed to update existing auth user:', e)
        }
      } else {
        console.warn('adminAuth createUser failed, trying REST API fallback:', adminErr?.message || adminErr)
        const { restSignUpWithEmail } = await import('@/lib/firebaseRestAuth')
        const restResult = await restSignUpWithEmail(email, password, displayName || email.split('@')[0])
        if (restResult?.uid) {
          createdUid = restResult.uid
        }
      }
    }

    const finalPartnershipId =
      authContext.role === 'partnership' ? authContext.uid : partnershipId || null

    const userProfile = {
      uid: createdUid,
      email,
      displayName: displayName || email.split('@')[0],
      role,
      organization: organization || partnershipName || '',
      partnershipType: partnershipType || 'Sekolah',
      phone: phone || '',
      partnershipId: finalPartnershipId,
      partnershipName: partnershipName || organization || '',
      photoURL: '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      createdBy: authContext.uid,
    }

    await safeSetDoc('users', createdUid, userProfile)

    return NextResponse.json({
      success: true,
      message: 'User berhasil didaftarkan',
      uid: createdUid,
      email,
      role,
    })
  } catch (error: any) {
    console.error('Register API Error:', error)
    return NextResponse.json({ success: false, message: error.message || 'Terjadi kesalahan pada server' }, { status: 500 })
  }
}
