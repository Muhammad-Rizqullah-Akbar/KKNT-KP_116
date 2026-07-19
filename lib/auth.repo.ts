// lib/auth.repo.ts

import { 
  auth, 
  firestore,
} from '@/lib/firebaseClient'
import {
  signInWithEmailAndPassword,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  GoogleAuthProvider,
  signOut,
  sendPasswordResetEmail,
  updateProfile,
  type User,
} from 'firebase/auth'
import {
  doc,
  getDoc,
  setDoc,
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

export const loginWithEmail = async (
  email: string,
  password: string
): Promise<LoginResult> => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password)
    const { user } = userCredential
    
    const userData = await getUserData(user.uid)
    const role = userData?.role || null
    
    return { user, role, userData }
  } catch (error: any) {
    console.error('Login error:', error)
    throw new Error(error.message || 'Login gagal. Silakan coba lagi.')
  }
}

/**
 * ✅ Login dengan Google (deteksi otomatis popup/redirect)
 * Di mobile/tunnel → pakai redirect
 * Di desktop local → pakai popup
 */
export const loginWithGoogle = async (): Promise<LoginResult> => {
  try {
    const provider = new GoogleAuthProvider()
    
    // Deteksi apakah ini mobile atau desktop
    const isMobile = typeof window !== 'undefined' && 
      (/Android|iPhone|iPad|iPod|webOS/i.test(navigator.userAgent) || 
       window.innerWidth < 768)
    
    // Deteksi apakah di localhost
    const isLocalhost = typeof window !== 'undefined' && 
      (window.location.hostname === 'localhost' || 
       window.location.hostname === '127.0.0.1')
    
    if (isMobile || !isLocalhost) {
      // ✅ Mobile / Tunnel → pakai Redirect (tidak kena popup blocker)
      await signInWithRedirect(auth, provider)
      // Redirect akan reload halaman, jadi return dummy
      return { user: {} as User, role: null, userData: null }
    } else {
      // ✅ Desktop Local → pakai Popup
      const userCredential = await signInWithPopup(auth, provider)
      const { user } = userCredential
      
      const userData = await getUserData(user.uid)
      
      if (!userData) {
        const newUserData: Omit<UserData, 'uid'> = {
          email: user.email || '',
          displayName: user.displayName || '',
          role: 'admin',
          photoURL: user.photoURL || '',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }
        
        await setDoc(doc(firestore, 'users', user.uid), newUserData)
        
        return {
          user,
          role: 'admin',
          userData: { uid: user.uid, ...newUserData },
        }
      }
      
      return { user, role: userData.role, userData }
    }
  } catch (error: any) {
    console.error('Google login error:', error)
    throw new Error(error.message || 'Login dengan Google gagal.')
  }
}

/**
 * ✅ Handle redirect result (dipanggil setelah halaman reload dari redirect)
 * Panggil ini di useEffect saat halaman login mount
 */
export const handleGoogleRedirectResult = async (): Promise<LoginResult | null> => {
  try {
    const result = await getRedirectResult(auth)
    if (!result) return null
    
    const { user } = result
    
    const userData = await getUserData(user.uid)
    
    if (!userData) {
      const newUserData: Omit<UserData, 'uid'> = {
        email: user.email || '',
        displayName: user.displayName || '',
        role: 'admin',
        photoURL: user.photoURL || '',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }
      
      await setDoc(doc(firestore, 'users', user.uid), newUserData)
      
      return {
        user,
        role: 'admin',
        userData: { uid: user.uid, ...newUserData },
      }
    }
    
    return { user, role: userData.role, userData }
  } catch (error: any) {
    console.error('Redirect result error:', error)
    throw new Error(error.message || 'Login dengan Google gagal.')
  }
}

/**
 * Logout
 */
export const logout = async (): Promise<void> => {
  try {
    await signOut(auth)
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