// app/api/auth/register/route.ts

import { NextRequest, NextResponse } from 'next/server'

// ============ DETECT ENVIRONMENT ============
const isEmulator = process.env.NEXT_PUBLIC_USE_EMULATOR === 'true'
const isProduction = process.env.NODE_ENV === 'production'

// ============ ADMIN SDK (Production) ============
let adminAuth: any = null
let adminDb: any = null
let useAdminSDK = false

// Coba inisialisasi Admin SDK jika ada credentials
try {
  const hasAdminCredentials = !!(
    process.env.FIREBASE_PROJECT_ID &&
    process.env.FIREBASE_CLIENT_EMAIL &&
    process.env.FIREBASE_PRIVATE_KEY
  )

  if (hasAdminCredentials) {
    // Import dinamis untuk Admin SDK
    const { initializeApp, getApps, cert } = await import('firebase-admin/app')
    const { getAuth } = await import('firebase-admin/auth')
    const { getFirestore } = await import('firebase-admin/firestore')

    if (!getApps().length) {
      initializeApp({
        credential: cert({
          projectId: process.env.FIREBASE_PROJECT_ID,
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
          privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
        }),
      })
    }

    adminAuth = getAuth()
    adminDb = getFirestore()
    useAdminSDK = true
    console.log('✅ Firebase Admin SDK initialized')
  } else {
    console.log('⚠️ No Admin credentials, using Client SDK fallback')
  }
} catch (error) {
  console.warn('⚠️ Admin SDK init failed, using Client SDK fallback:', error)
}

// ============ CLIENT SDK FALLBACK ============
let clientAuth: any = null
let clientDb: any = null

if (!useAdminSDK) {
  try {
    const { auth, firestore } = await import('@/lib/firebaseClient')
    clientAuth = auth
    clientDb = firestore
  } catch (error) {
    console.error('❌ Client SDK import failed:', error)
  }
}

// ============ API HANDLER ============
export async function POST(request: NextRequest) {
  try {
    const { email, password, role, displayName } = await request.json()

    // ============ VALIDASI ============
    if (!email || !password || !role) {
      return NextResponse.json(
        { success: false, message: 'Email, password, dan role wajib diisi' },
        { status: 400 }
      )
    }

    if (role !== 'admin' && role !== 'super_admin') {
      return NextResponse.json(
        { success: false, message: 'Role harus "admin" atau "super_admin"' },
        { status: 400 }
      )
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { success: false, message: 'Format email tidak valid' },
        { status: 400 }
      )
    }

    if (password.length < 6) {
      return NextResponse.json(
        { success: false, message: 'Password minimal 6 karakter' },
        { status: 400 }
      )
    }

    // ============ REGISTER USER ============
    let userRecord
    let uid

    if (useAdminSDK) {
      // ===== PRODUCTION: Admin SDK =====
      try {
        userRecord = await adminAuth.createUser({
          email,
          password,
          displayName: displayName || email.split('@')[0],
          emailVerified: true,
        })
        uid = userRecord.uid
      } catch (authError: any) {
        console.error('Admin SDK auth error:', authError)
        let errorMessage = 'Gagal membuat akun'
        if (authError.code === 'auth/email-already-exists') errorMessage = 'Email sudah terdaftar'
        else if (authError.code === 'auth/invalid-email') errorMessage = 'Email tidak valid'
        else if (authError.code === 'auth/weak-password') errorMessage = 'Password terlalu lemah'
        
        return NextResponse.json(
          { success: false, message: errorMessage },
          { status: 400 }
        )
      }

      // Save ke Firestore (Admin SDK)
      try {
        await adminDb.collection('users').doc(uid).set({
          uid,
          email,
          displayName: displayName || email.split('@')[0],
          role,
          photoURL: '',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        })
      } catch (dbError) {
        console.error('Admin SDK Firestore error:', dbError)
        // Rollback: hapus user dari Auth
        await adminAuth.deleteUser(uid)
        return NextResponse.json(
          { success: false, message: 'Gagal menyimpan data user' },
          { status: 500 }
        )
      }

    } else if (clientAuth && clientDb) {
      // ===== DEVELOPMENT / EMULATOR: Client SDK =====
      try {
        const { createUserWithEmailAndPassword } = await import('firebase/auth')
        const userCredential = await createUserWithEmailAndPassword(
          clientAuth,
          email,
          password
        )
        uid = userCredential.user.uid

        // Save ke Firestore (Client SDK)
        const { doc, setDoc } = await import('firebase/firestore')
        await setDoc(doc(clientDb, 'users', uid), {
          uid,
          email,
          displayName: displayName || email.split('@')[0],
          role,
          photoURL: '',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        })
      } catch (authError: any) {
        console.error('Client SDK auth error:', authError)
        let errorMessage = 'Gagal membuat akun'
        if (authError.code === 'auth/email-already-in-use') errorMessage = 'Email sudah terdaftar'
        else if (authError.code === 'auth/invalid-email') errorMessage = 'Email tidak valid'
        else if (authError.code === 'auth/weak-password') errorMessage = 'Password terlalu lemah'
        
        return NextResponse.json(
          { success: false, message: errorMessage },
          { status: 400 }
        )
      }

    } else {
      return NextResponse.json(
        { success: false, message: 'Tidak ada metode autentikasi yang tersedia' },
        { status: 500 }
      )
    }

    // ============ SUCCESS ============
    return NextResponse.json({
      success: true,
      message: 'User berhasil didaftarkan',
      uid,
      email,
      role,
      environment: useAdminSDK ? 'Admin SDK (Production)' : 'Client SDK (Emulator)',
    })

  } catch (error: any) {
    console.error('Register API Error:', error)
    return NextResponse.json(
      { success: false, message: error.message || 'Terjadi kesalahan pada server' },
      { status: 500 }
    )
  }
}