// lib/auth.repo.ts

import { 
  auth, 
  firestore,
} from '@/lib/firebaseClient'
import {
  signInWithEmailAndPassword,
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
export type UserRole = 'super_admin' | 'admin' | null

export interface UserData {
  uid: string
  email: string
  displayName: string
  role: UserRole
  photoURL?: string
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
    const errorData = await response.json().catch(() => ({}))
    throw new Error(errorData.message || 'Gagal membuat sesi aman. Silakan coba lagi.')
  }
}

const getErrorMessage = (error: unknown, fallback: string): string =>
  error instanceof Error ? error.message : fallback

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
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password)
    const { user } = userCredential
    
    // 1. Establish server session FIRST to set HttpOnly cookie and provision profile if missing
    await establishServerSession(user)

    // 2. Fetch user profile data
    const userData = await getUserData(user.uid)
    const role = userData?.role || null
    
    // 3. Verify user is authorized as admin or super_admin
    if (!role || (role !== 'admin' && role !== 'super_admin')) {
      await signOut(auth)
      await clearServerSession()
      throw new Error('Akun Anda tidak memiliki hak akses ke Dashboard Admin.')
    }
    
    return { user, role, userData }
  } catch (error: unknown) {
    console.error('Login error:', error)
    await clearServerSession()
    throw new Error(getErrorMessage(error, 'Login gagal. Silakan coba lagi.'))
  }
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
