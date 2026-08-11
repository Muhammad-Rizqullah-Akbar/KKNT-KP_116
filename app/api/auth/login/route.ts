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

    if (userDoc) {
      uid = userDoc.uid || userDoc.id
      userRole = userDoc.role || 'cadre'
      userDisplayName = userDoc.displayName || cleanEmail.split('@')[0]
    }

    // 2. Check/sync user in Firebase Auth via Admin SDK or REST API
    let authUser: any = null
    try {
      authUser = await adminAuth.getUserByEmail(cleanEmail)
      uid = authUser.uid
    } catch (e) {
      // User not in Firebase Auth yet; auto-create user in Firebase Auth
      try {
        authUser = await adminAuth.createUser({
          email: cleanEmail,
          password,
          displayName: userDisplayName,
          emailVerified: true,
        })
        uid = authUser.uid
      } catch (createErr: any) {
        console.warn('Failed to create Firebase Auth user via adminAuth, trying REST fallback:', createErr?.message || createErr)
      }
    }

    if (authUser) {
      // Sync password to ensure future client logins work
      try {
        await adminAuth.updateUser(authUser.uid, { password })
      } catch (e) {
        console.warn('Password sync warning:', e)
      }
    }

    // Fallback: If adminAuth failed, use REST API to authenticate/register in Firebase Auth
    if (!uid || !authUser) {
      const { restSignInWithEmail, restSignUpWithEmail } = await import('@/lib/firebaseRestAuth')
      const restSignIn = await restSignInWithEmail(cleanEmail, password)
      if (restSignIn?.uid) {
        uid = restSignIn.uid
      } else {
        const restSignUp = await restSignUpWithEmail(cleanEmail, password, userDisplayName)
        if (restSignUp?.uid) {
          uid = restSignUp.uid
        }
      }
    }

    if (!uid) {
      return NextResponse.json(
        { success: false, message: 'Akun belum terdaftar pada sistem.' },
        { status: 401 }
      )
    }

    // Ensure user document profile exists in Firestore
    if (!userDoc) {
      const newUserProfile = {
        uid,
        email: cleanEmail,
        displayName: userDisplayName,
        role: userRole,
        photoURL: '',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }
      try {
        await adminFirestore.collection('users').doc(uid).set(newUserProfile, { merge: true })
        userDoc = newUserProfile
      } catch (e) {
        console.warn('Failed to auto-create user profile in Firestore:', e)
      }
    }

    // 3. Generate custom token for client SDK authentication
    let customToken = ''
    try {
      customToken = await adminAuth.createCustomToken(uid, { role: userRole })
    } catch (tokenErr) {
      console.warn('createCustomToken failed:', tokenErr)
    }

    // 4. Return user credentials & role
    const response = NextResponse.json({
      success: true,
      customToken,
      uid,
      role: userRole,
      userData: userDoc || { uid, email: cleanEmail, displayName: userDisplayName, role: userRole },
    })

    return response
  } catch (error: any) {
    console.error('Server login route error:', error)
    return NextResponse.json(
      { success: false, message: error?.message || 'Login gagal pada server.' },
      { status: 401 }
    )
  }
}
