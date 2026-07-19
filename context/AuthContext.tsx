// contexts/AuthContext.tsx

'use client'

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { onAuthStateChanged, type User } from 'firebase/auth'
import { auth } from '@/lib/firebaseClient'
import { 
  loginWithEmail, 
  loginWithGoogle, 
  logout,
  getUserData,
  handleGoogleRedirectResult,
  type UserRole,
  type UserData,
  type LoginResult,
} from '@/lib/auth.repo'

// ============ TYPES ============
interface AuthContextType {
  user: User | null
  userData: UserData | null
  userRole: UserRole
  loading: boolean
  isAuthenticated: boolean
  login: (email: string, password: string) => Promise<LoginResult>
  loginWithGoogle: () => Promise<LoginResult>
  logout: () => Promise<void>
  refreshUser: () => Promise<void>
}

// ============ CONTEXT ============
const AuthContext = createContext<AuthContextType | undefined>(undefined)

// ============ PROVIDER ============
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [userData, setUserData] = useState<UserData | null>(null)
  const [loading, setLoading] = useState(true)

  // Fungsi untuk refresh data user
  const refreshUser = async () => {
    if (user) {
      const data = await getUserData(user.uid)
      setUserData(data)
    } else {
      setUserData(null)
    }
  }

  // ✅ Handle Google redirect result saat halaman dimuat
  useEffect(() => {
    const checkRedirectResult = async () => {
      try {
        await handleGoogleRedirectResult()
        // onAuthStateChanged akan otomatis trigger setelah ini
      } catch (error) {
        console.error('Redirect result error:', error)
      }
    }
    checkRedirectResult()
  }, [])

  // Listen to auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser)
      
      if (currentUser) {
        const data = await getUserData(currentUser.uid)
        setUserData(data)
      } else {
        setUserData(null)
      }
      
      setLoading(false)
    })

    return () => unsubscribe()
  }, [])

  // Login wrapper
  const login = async (email: string, password: string) => {
    const result = await loginWithEmail(email, password)
    setUser(result.user)
    setUserData(result.userData)
    return result
  }

  // Login with Google wrapper
  const handleLoginWithGoogle = async () => {
    const result = await loginWithGoogle()
    // Kalau redirect, result.user akan kosong (halaman reload)
    // Kalau popup, result.user ada
    if (result.user && result.user.uid) {
      setUser(result.user)
      setUserData(result.userData)
    }
    return result
  }

  // Logout wrapper
  const handleLogout = async () => {
    await logout()
    setUser(null)
    setUserData(null)
  }

  const userRole = userData?.role || null

  return (
    <AuthContext.Provider
      value={{
        user,
        userData,
        userRole,
        loading,
        isAuthenticated: !!user,
        login,
        loginWithGoogle: handleLoginWithGoogle,
        logout: handleLogout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

// ============ HOOK ============
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}