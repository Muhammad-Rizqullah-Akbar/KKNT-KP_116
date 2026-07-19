// app/api/auth/users/route.ts

import { NextRequest, NextResponse } from 'next/server'

// ============ DETECT ENVIRONMENT ============
const isEmulator = process.env.NEXT_PUBLIC_USE_EMULATOR === 'true'

// ============ ADMIN SDK (Production) ============
let adminAuth: any = null
let adminDb: any = null
let useAdminSDK = false

try {
  const hasAdminCredentials = !!(
    process.env.FIREBASE_PROJECT_ID &&
    process.env.FIREBASE_CLIENT_EMAIL &&
    process.env.FIREBASE_PRIVATE_KEY
  )

  if (hasAdminCredentials) {
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
  }
} catch (error) {
  console.warn('⚠️ Admin SDK init failed:', error)
}

// ============ CLIENT SDK FALLBACK ============
let clientDb: any = null

if (!useAdminSDK) {
  try {
    const { firestore } = await import('@/lib/firebaseClient')
    clientDb = firestore
  } catch (error) {
    console.error('❌ Client SDK import failed:', error)
  }
}

// ============ GET ALL USERS ============
export async function GET(request: NextRequest) {
  try {
    let users = []

    if (useAdminSDK) {
      // ===== ADMIN SDK =====
      const listUsersResult = await adminAuth.listUsers()
      users = await Promise.all(
        listUsersResult.users.map(async (userRecord: any) => {
          // Ambil data dari Firestore
          let userData = {}
          try {
            const doc = await adminDb.collection('users').doc(userRecord.uid).get()
            if (doc.exists) {
              userData = doc.data()
            }
          } catch (dbError) {
            console.error('Error getting user data:', dbError)
          }

          return {
            uid: userRecord.uid,
            email: userRecord.email,
            displayName: userRecord.displayName || userRecord.email?.split('@')[0] || '',
            role: (userData as any).role || 'user',
            photoURL: userRecord.photoURL || '',
            createdAt: (userData as any).createdAt || userRecord.metadata?.creationTime || new Date().toISOString(),
            updatedAt: (userData as any).updatedAt || userRecord.metadata?.lastSignInTime || new Date().toISOString(),
          }
        })
      )
    } else if (clientDb) {
      // ===== CLIENT SDK (Emulator) =====
      const { collection, getDocs } = await import('firebase/firestore')
      const snapshot = await getDocs(collection(clientDb, 'users'))
      users = snapshot.docs.map((doc) => ({
        uid: doc.id,
        ...doc.data(),
      }))
    } else {
      return NextResponse.json(
        { success: false, message: 'Tidak ada koneksi database' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      users,
    })
  } catch (error: any) {
    console.error('Get users error:', error)
    return NextResponse.json(
      { success: false, message: error.message || 'Gagal mengambil data user' },
      { status: 500 }
    )
  }
}

// ============ DELETE USER ============
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const uid = searchParams.get('uid')

    if (!uid) {
      return NextResponse.json(
        { success: false, message: 'UID user wajib diisi' },
        { status: 400 }
      )
    }

    if (useAdminSDK) {
      // ===== ADMIN SDK =====
      // Hapus dari Auth
      await adminAuth.deleteUser(uid)
      // Hapus dari Firestore
      await adminDb.collection('users').doc(uid).delete()
    } else if (clientDb) {
      // ===== CLIENT SDK (Emulator) =====
      const { doc, deleteDoc } = await import('firebase/firestore')
      await deleteDoc(doc(clientDb, 'users', uid))
      // Note: Client SDK tidak bisa hapus user dari Auth
      // Untuk emulator, user tetap ada di Auth tapi tanpa data Firestore
      // Bisa dihapus manual di Emulator UI
    } else {
      return NextResponse.json(
        { success: false, message: 'Tidak ada koneksi database' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'User berhasil dihapus',
    })
  } catch (error: any) {
    console.error('Delete user error:', error)
    return NextResponse.json(
      { success: false, message: error.message || 'Gagal menghapus user' },
      { status: 500 }
    )
  }
}

// ============ UPDATE USER ROLE ============
export async function PUT(request: NextRequest) {
  try {
    const { uid, role } = await request.json()

    if (!uid || !role) {
      return NextResponse.json(
        { success: false, message: 'UID dan role wajib diisi' },
        { status: 400 }
      )
    }

    if (role !== 'admin' && role !== 'super_admin' && role !== null) {
      return NextResponse.json(
        { success: false, message: 'Role harus "admin", "super_admin", atau null' },
        { status: 400 }
      )
    }

    if (useAdminSDK) {
      // ===== ADMIN SDK =====
      await adminDb.collection('users').doc(uid).update({
        role: role,
        updatedAt: new Date().toISOString(),
      })
    } else if (clientDb) {
      // ===== CLIENT SDK (Emulator) =====
      const { doc, updateDoc } = await import('firebase/firestore')
      await updateDoc(doc(clientDb, 'users', uid), {
        role: role,
        updatedAt: new Date().toISOString(),
      })
    } else {
      return NextResponse.json(
        { success: false, message: 'Tidak ada koneksi database' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Role user berhasil diperbarui',
      role,
    })
  } catch (error: any) {
    console.error('Update user role error:', error)
    return NextResponse.json(
      { success: false, message: error.message || 'Gagal update role user' },
      { status: 500 }
    )
  }
}