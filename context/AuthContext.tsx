// context/AuthContext.tsx
'use client'

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { onAuthStateChanged, type User } from 'firebase/auth'
import { auth } from '@/lib/firebaseClient'
import { 
  loginWithEmail, 
  logout, 
  getUserData, 
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
  refreshUserData: () => Promise<void>
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

  const validRoles = ['super_admin', 'admin', 'internal_bpom', 'partnership', 'cadre']

  // Listen to auth state changes & Sinkronisasi Session
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser)
      
      if (currentUser) {
        const data = await getUserData(currentUser.uid)
        
        // Cek jika user terdaftar memiliki role yang valid
        if (data && data.role && validRoles.includes(data.role)) {
          setUserData(data)
        } else {
          setUserData(null)
        }
      } else {
        setUserData(null)
      }
      
      setLoading(false)
    })

    return () => unsubscribe()
  }, [])

  // Login wrapper
  const handleLogin = async (email: string, pass: string): Promise<LoginResult> => {
    const result = await loginWithEmail(email, pass)
    setUser(result.user)
    setUserData(result.userData)
    return result
  }

  // Logout wrapper
  const handleLogout = async (): Promise<void> => {
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
        isAuthenticated: !!user && !!userRole && validRoles.includes(userRole),
        login: handleLogin,
        logout: handleLogout,
        refreshUser,
        refreshUserData: refreshUser,
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
