import { NextRequest, NextResponse } from 'next/server'
import { adminAuth, adminFirestore } from '@/lib/firebaseAdmin'
import { SESSION_COOKIE_NAME } from '@/lib/auth/server'

const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24

export async function POST(request: NextRequest) {
  try {
    const { idToken } = await request.json()
    if (!idToken || typeof idToken !== 'string') {
      return NextResponse.json({ message: 'A Firebase ID token is required.' }, { status: 400 })
    }

    let uid = ''
    let email = ''
    let sessionCookie = ''

    try {
      const decodedToken = await adminAuth.verifyIdToken(idToken)
      uid = decodedToken.uid
      email = decodedToken.email || ''
      sessionCookie = await adminAuth.createSessionCookie(idToken, {
        expiresIn: SESSION_MAX_AGE_SECONDS * 1000,
      })
    } catch (adminErr: any) {
      console.warn('verifyIdToken failed:', adminErr?.message || adminErr)
      return NextResponse.json({ message: 'Tokens provided could not be verified.' }, { status: 401 })
    }

    if (!uid || !sessionCookie) {
      return NextResponse.json({ message: 'Tokens provided could not be verified.' }, { status: 401 })
    }

    // Profile check / provision for user if document is missing in Firestore
    let role = null
    try {
      const userRef = adminFirestore.collection('users').doc(uid)
      const userSnap = await userRef.get()

      role = userSnap.exists ? userSnap.data()?.role : null

      if (!userSnap.exists) {
        role = 'cadre'
        await userRef.set(
          {
            uid,
            email,
            displayName: email.split('@')[0] || 'Pengguna Baru',
            role: 'cadre',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
          { merge: true }
        )
      }
    } catch (fsError: any) {
      console.warn('Firestore profile check warning:', fsError?.message || fsError)
    }

    const response = NextResponse.json({ success: true, role, uid })
    response.cookies.set(SESSION_COOKIE_NAME, sessionCookie, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: SESSION_MAX_AGE_SECONDS,
    })
    return response
  } catch (error: any) {
    console.error('Unable to create Firebase session:', error)
    return NextResponse.json(
      { message: error?.message || 'Unable to establish a secure session.' },
      { status: 401 }
    )
  }
}

export async function DELETE() {
  const response = NextResponse.json({ success: true })
  response.cookies.set(SESSION_COOKIE_NAME, '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 0,
  })
  return response
}
