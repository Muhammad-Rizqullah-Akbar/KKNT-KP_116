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

// ============ HELPER COOKIE FUNCTIONS ============

/**
 * Sync cookie auth & role ke browser agar middleware server-side bisa membacanya
 */
export const setAuthCookies = (role: UserRole) => {
  if (typeof window === 'undefined') return

  if (role) {
    // Simpan role dan token indikator selama 24 jam (86400 detik)
    document.cookie = `user_role=${role}; path=/; max-age=86400; SameSite=Lax; Secure`
    document.cookie = `auth_token=true; path=/; max-age=86400; SameSite=Lax; Secure`
  } else {
    // Hapus cookies saat logout / unauthenticated
    document.cookie = `user_role=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT`
    document.cookie = `auth_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT`
  }
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
    return null
  } catch (error) {
    console.error('Error getting user data:', error)
    return null
  }
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
    
    const userData = await getUserData(user.uid)
    const role = userData?.role || null
    
    // Cek apakah user terdaftar sebagai admin/super_admin
    if (!role || (role !== 'admin' && role !== 'super_admin')) {
      await signOut(auth)
      setAuthCookies(null)
      throw new Error('Akun Anda tidak memiliki hak akses ke Dashboard Admin.')
    }
    
    // Set cookie untuk Next.js middleware
    setAuthCookies(role)
    
    return { user, role, userData }
  } catch (error: any) {
    console.error('Login error:', error)
    setAuthCookies(null)
    throw new Error(error.message || 'Login gagal. Silakan coba lagi.')
  }
}

/**
 * Logout
 */
export const logout = async (): Promise<void> => {
  try {
    await signOut(auth)
    // Hapus cookies saat logout
    setAuthCookies(null)
  } catch (error: any) {
    console.error('Logout error:', error)
    throw new Error(error.message || 'Logout gagal.')
  }
}

/**
 * Reset Password - Kirim email reset
 */
export const resetPassword = async (email: string): Promise<void> => {
  try {
    await sendPasswordResetEmail(auth, email)
  } catch (error: any) {
    console.error('Reset password error:', error)
    throw new Error(error.message || 'Gagal mengirim email reset password.')
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
  } catch (error: any) {
    console.error('Update profile error:', error)
    throw new Error(error.message || 'Gagal update profil.')
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
  } catch (error: any) {
    console.error('Register error:', error)
    throw new Error(error.message || 'Registrasi gagal.')
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
  } catch (error: any) {
    console.error('Update role error:', error)
    throw new Error(error.message || 'Gagal update role.')
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
  } catch (error: any) {
    console.error('Get all users error:', error)
    throw new Error(error.message || 'Gagal mengambil data user.')
  }
}