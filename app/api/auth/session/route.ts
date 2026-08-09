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

    const decodedToken = await adminAuth.verifyIdToken(idToken)
    const sessionCookie = await adminAuth.createSessionCookie(idToken, {
      expiresIn: SESSION_MAX_AGE_SECONDS * 1000,
    })

    // Profile check / provision for user if document is missing in Firestore
    let role = null
    try {
      const userRef = adminFirestore.collection('users').doc(decodedToken.uid)
      const userSnap = await userRef.get()

      role = userSnap.exists ? userSnap.data()?.role : null

      if (!userSnap.exists) {
        role = 'admin'
        await userRef.set(
          {
            uid: decodedToken.uid,
            email: decodedToken.email || '',
            displayName: decodedToken.name || 'KKPD ADMIN',
            role: 'admin',
            photoURL: decodedToken.picture || '',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
          { merge: true }
        )
      }
    } catch (fsError: any) {
      console.warn('Firestore profile check warning:', fsError?.message || fsError)
    }

    const response = NextResponse.json({ success: true, role, uid: decodedToken.uid })
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
