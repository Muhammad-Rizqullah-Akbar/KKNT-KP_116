import { NextRequest, NextResponse } from 'next/server'
import { adminAuth, adminFirestore } from '@/lib/firebaseAdmin'
import { SESSION_COOKIE_NAME } from '@/lib/auth/server'
import { safeGetCollectionDocs } from '@/lib/firebase/repositories/v1_5/safeFirestore'

const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()
    if (!email || !password) {
      return NextResponse.json({ success: false, message: 'Email dan password wajib diisi.' }, { status: 400 })
    }

    const cleanEmail = String(email).trim().toLowerCase()
    let uid = ''
    let userRole = 'cadre'
    let userDisplayName = cleanEmail.split('@')[0]

    // 1. Check if user document exists in Firestore 'users'
    let userDoc: any = null
    try {
      const usersList = await safeGetCollectionDocs('users')
      userDoc = usersList.find((u) => u.data?.email?.toLowerCase() === cleanEmail)?.data || null
    } catch (fsErr) {
      console.warn('Firestore user fetch warning:', fsErr)
    }

    // Authentication Boundary: Login ≠ Registration.
    // Non-registered users MUST NOT be automatically created via login.
    if (!userDoc) {
      return NextResponse.json(
        { success: false, message: 'Akun belum terdaftar pada sistem. Hubungi administrator.' },
        { status: 401 }
      )
    }

    uid = userDoc.uid || userDoc.id
    userRole = userDoc.role || 'cadre'
    userDisplayName = userDoc.displayName || cleanEmail.split('@')[0]

    // 2. Resolve Auth user in Firebase Auth via Admin SDK or REST API
    let authUser: any = null
    try {
      authUser = await adminAuth.getUserByEmail(cleanEmail)
      uid = authUser.uid
    } catch (e) {
      // If user exists in Firestore but Auth user is missing, sync Auth account for this registered user
      try {
        authUser = await adminAuth.createUser({
          uid,
          email: cleanEmail,
          password,
          displayName: userDisplayName,
          emailVerified: true,
        })
      } catch (createErr: any) {
        console.warn('Failed to sync Auth user for registered profile:', createErr?.message || createErr)
      }
    }

    if (authUser) {
      // Sync password to ensure client logins work
      try {
        await adminAuth.updateUser(authUser.uid, { password })
      } catch (e) {
        console.warn('Password sync warning:', e)
      }
    } else {
      const { restSignInWithEmail } = await import('@/lib/firebaseRestAuth')
      const restSignIn = await restSignInWithEmail(cleanEmail, password)
      if (restSignIn?.uid) {
        uid = restSignIn.uid
      }
    }

    if (!uid) {
      return NextResponse.json(
        { success: false, message: 'Gagal memverifikasi identitas akun yang terdaftar.' },
        { status: 401 }
      )
    }

    // 3. Generate custom token for client SDK authentication
    let customToken = ''
    try {
      customToken = await adminAuth.createCustomToken(uid, { role: userRole })
    } catch (tokenErr) {
      console.warn('createCustomToken failed:', tokenErr)
    }

    // 4. Return user credentials & role
    return NextResponse.json({
      success: true,
      customToken,
      uid,
      role: userRole,
      userData: userDoc,
    })
  } catch (error: any) {
    console.error('Server login route error:', error)
    return NextResponse.json(
      { success: false, message: error?.message || 'Login gagal pada server.' },
      { status: 401 }
    )
  }
}
