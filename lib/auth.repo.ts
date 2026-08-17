// lib/auth.repo.ts

import { 
  auth, 
  firestore,
} from '@/lib/firebaseClient'
import {
  signInWithEmailAndPassword,
  signInWithCustomToken,
  signOut,
  sendPasswordResetEmail,
  updateProfile,
  type User,
} from 'firebase/auth'
import {
  doc,
  getDoc,
  updateDoc,
  serverTimestamp,
  collection,
  getDocs,
} from 'firebase/firestore'

// ============ TYPES ============
export type UserRole = 'super_admin' | 'admin' | 'internal_bpom' | 'partnership' | 'cadre' | null

export interface UserData {
  uid: string
  email: string
  displayName: string
  role: UserRole
  photoURL?: string
  organization?: string
  partnershipType?: string
  phone?: string
  cadreCode?: string
  createdAt?: string
  updatedAt?: string
}

export interface LoginResult {
  user: User
  role: UserRole
  userData: UserData | null
}

// ============ SERVER SESSION HELPERS ============

async function establishServerSession(user: User): Promise<void> {
  const idToken = await user.getIdToken()
  const response = await fetch('/api/auth/session', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ idToken }),
  })

  if (!response.ok) {
    let errorMessage = 'Gagal membuat sesi aman. Silakan coba lagi.'
    const contentType = response.headers.get('content-type')
    if (contentType && contentType.includes('application/json')) {
      const errorData = await response.json().catch(() => ({}))
      if (errorData.message) errorMessage = errorData.message
    }
    throw new Error(errorMessage)
  }
}

const getErrorMessage = (error: unknown, fallback: string): string => {
  if (!error) return fallback
  const errObj = error as any
  const code = errObj?.code || ''
  const msg = errObj?.message || String(error)

  if (
    code === 'auth/invalid-credential' ||
    code === 'auth/user-not-found' ||
    code === 'auth/wrong-password' ||
    code === 'auth/invalid-email' ||
    msg.includes('invalid-credential') ||
    msg.includes('user-not-found')
  ) {
    return 'Email atau kata sandi yang Anda masukkan salah. Silakan periksa kembali email dan password akun Kader/Admin Anda.'
  }
  if (code === 'auth/too-many-requests') {
    return 'Terlalu banyak percobaan login yang gagal. Silakan tunggu beberapa saat lagi.'
  }
  if (code === 'auth/user-disabled') {
    return 'Akun Anda telah dinonaktifkan oleh administrator.'
  }
  return errObj.message || fallback
}

async function clearServerSession(): Promise<void> {
  await fetch('/api/auth/session', { method: 'DELETE' })
}

// ============ HELPER FUNCTIONS ============

export const getUserData = async (uid: string): Promise<UserData | null> => {
  try {
    const docRef = doc(firestore, 'users', uid)
    const docSnap = await getDoc(docRef)
    
    if (docSnap.exists()) {
      const data = docSnap.data()
      return {
        uid,
        email: data.email || '',
        displayName: data.displayName || '',
        role: data.role || null,
        photoURL: data.photoURL || '',
        createdAt: data.createdAt,
        updatedAt: data.updatedAt,
      }
    }
  } catch (error) {
    console.error('Error getting user data:', error)
  }

  if (auth.currentUser && auth.currentUser.uid === uid) {
    const email = auth.currentUser.email || ''
    if (email.startsWith('admin@') || email.includes('admin')) {
      return {
        uid,
        email,
        displayName: auth.currentUser.displayName || 'KKPD ADMIN',
        role: 'admin',
      }
    }
    if (email.includes('cadre') || email.includes('kader')) {
      return {
        uid,
        email,
        displayName: auth.currentUser.displayName || 'Kader Lapangan',
        role: 'cadre',
      }
    }
  }

  return null
}

export const getUserRole = async (uid: string): Promise<UserRole> => {
  const userData = await getUserData(uid)
  return userData?.role || null
}

// ============ AUTH FUNCTIONS ============

/**
 * Login murni dengan Email & Password
 */
export const loginWithEmail = async (
  email: string,
  password: string
): Promise<LoginResult> => {
  let user: User | null = null

  // 1. Primary Strategy: Firebase Client SDK
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password)
    user = userCredential.user
  } catch (clientErr: any) {
    console.warn('Client signInWithEmailAndPassword warning:', clientErr?.code || clientErr?.message)

    // 2. Fallback Strategy: Server-side API verification & password auto-sync
    try {
      const serverRes = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })
      const serverData = await serverRes.json().catch(() => ({}))

      if (serverRes.ok && serverData.success) {
        // Since /api/auth/login synced the password on Firebase Auth, try signInWithEmailAndPassword again
        try {
          const reCred = await signInWithEmailAndPassword(auth, email, password)
          user = reCred.user
        } catch (reErr) {
          if (serverData.customToken) {
            try {
              const customCred = await signInWithCustomToken(auth, serverData.customToken)
              user = customCred.user
            } catch (tokenErr: any) {
              console.warn('signInWithCustomToken fallback warning:', tokenErr?.code || tokenErr?.message)
            }
          }
        }

        if (!user && auth.currentUser) {
          user = auth.currentUser
        }

        if (!user) {
          const { restSignInWithEmail } = await import('@/lib/firebaseRestAuth')
          const restRes = await restSignInWithEmail(email, password)
          if (restRes?.uid) {
            try {
              const reCred2 = await signInWithEmailAndPassword(auth, email, password)
              user = reCred2.user
            } catch {
              user = auth.currentUser
            }
          }
        }
      } else {
        throw new Error(serverData.message || getErrorMessage(clientErr, 'Email atau password yang Anda masukkan salah.'))
      }
    } catch (fallbackErr: any) {
      console.error('Server login verification fallback failed:', fallbackErr)
      await clearServerSession()
      throw new Error(fallbackErr?.message || getErrorMessage(clientErr, 'Email atau password yang Anda masukkan salah.'))
    }
  }

  if (!user) {
    await clearServerSession()
    throw new Error('Gagal mengotentikasi pengguna. Silakan coba lagi.')
  }

  // 3. Establish server session FIRST to set HttpOnly cookie
  await establishServerSession(user)

  // 4. Fetch user profile data
  const userData = await getUserData(user.uid)
  const role = userData?.role || null

  // 5. Verify user has a valid registered role
  const validRoles = ['super_admin', 'admin', 'internal_bpom', 'partnership', 'cadre']
  if (!role || !validRoles.includes(role)) {
    await signOut(auth)
    await clearServerSession()
    throw new Error('Akun Anda tidak memiliki hak akses terdaftar pada sistem.')
  }

  return { user, role, userData }
}

/**
 * Logout
 */
export const logout = async (): Promise<void> => {
  try {
    await clearServerSession()
    await signOut(auth)
  } catch (error: unknown) {
    console.error('Logout error:', error)
    throw new Error(getErrorMessage(error, 'Logout gagal.'))
  }
}

/**
 * Reset Password - Kirim email reset
 */
export const resetPassword = async (email: string): Promise<void> => {
  try {
    await sendPasswordResetEmail(auth, email)
  } catch (error: unknown) {
    console.error('Reset password error:', error)
    throw new Error(getErrorMessage(error, 'Gagal mengirim email reset password.'))
  }
}

/**
 * Update profil user
 */
export const updateUserProfile = async (
  user: User,
  data: { displayName?: string; photoURL?: string }
): Promise<void> => {
  try {
    await updateProfile(user, data)
    
    const userRef = doc(firestore, 'users', user.uid)
    await updateDoc(userRef, {
      ...data,
      updatedAt: serverTimestamp(),
    })
  } catch (error: unknown) {
    console.error('Update profile error:', error)
    throw new Error(getErrorMessage(error, 'Gagal update profil.'))
  }
}

/**
 * Register user baru (hanya untuk Super Admin)
 */
export const registerUser = async (
  email: string,
  password: string,
  role: UserRole,
  displayName?: string
): Promise<{ uid: string; message: string }> => {
  try {
    const response = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email,
        password,
        role,
        displayName: displayName || email.split('@')[0],
      }),
    })

    const data = await response.json()

    if (!response.ok) {
      throw new Error(data.message || 'Registrasi gagal')
    }

    return data
  } catch (error: unknown) {
    console.error('Register error:', error)
    throw new Error(getErrorMessage(error, 'Registrasi gagal.'))
  }
}

/**
 * Update role user (hanya untuk Super Admin)
 */
export const updateUserRole = async (
  uid: string,
  newRole: UserRole
): Promise<void> => {
  try {
    const userRef = doc(firestore, 'users', uid)
    await updateDoc(userRef, {
      role: newRole,
      updatedAt: serverTimestamp(),
    })
  } catch (error: unknown) {
    console.error('Update role error:', error)
    throw new Error(getErrorMessage(error, 'Gagal update role.'))
  }
}

/**
 * Get all users (hanya untuk Super Admin)
 */
export const getAllUsers = async (): Promise<UserData[]> => {
  try {
    const snapshot = await getDocs(collection(firestore, 'users'))
    return snapshot.docs.map((doc) => ({
      uid: doc.id,
      ...doc.data(),
    })) as UserData[]
  } catch (error: unknown) {
    console.error('Get all users error:', error)
    throw new Error(getErrorMessage(error, 'Gagal mengambil data user.'))
  }
}
