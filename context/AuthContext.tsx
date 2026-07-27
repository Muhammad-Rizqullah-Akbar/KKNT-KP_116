// context/AuthContext.tsx
'use client'

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { onAuthStateChanged, type User } from 'firebase/auth'
import { auth } from '@/lib/firebaseClient'
import { 
  loginWithEmail, 
  logout, 
  getUserData, 
  setAuthCookies,
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
      setAuthCookies(data?.role || null)
    } else {
      setUserData(null)
      setAuthCookies(null)
    }
  }

  // Listen to auth state changes & Sinkronisasi Cookie untuk Middleware
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser)
      
      if (currentUser) {
        const data = await getUserData(currentUser.uid)
        
        // Cek jika user terdaftar sebagai admin/super_admin
        if (data && (data.role === 'admin' || data.role === 'super_admin')) {
          setUserData(data)
          setAuthCookies(data.role)
        } else {
          // Jika bukan admin/super_admin, bersihkan session
          setUserData(null)
          setAuthCookies(null)
        }
      } else {
        setUserData(null)
        setAuthCookies(null)
      }
      
      setLoading(false)
    })

    return () => unsubscribe()
  }, [])

  // Login Email & Password wrapper
  const login = async (email: string, password: string) => {
    const result = await loginWithEmail(email, password)
    setUser(result.user)
    setUserData(result.userData)
    setAuthCookies(result.role)
    return result
  }

  // Logout wrapper
  const handleLogout = async () => {
    await logout()
    setUser(null)
    setUserData(null)
    setAuthCookies(null)
  }

  const userRole = userData?.role || null

  return (
    <AuthContext.Provider
      value={{
        user,
        userData,
        userRole,
        loading,
        isAuthenticated: !!user && (userRole === 'admin' || userRole === 'super_admin'),
        login,
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