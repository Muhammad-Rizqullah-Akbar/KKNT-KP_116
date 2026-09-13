'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import { Sidebar } from './Sidebar'
import { Icon } from '@/components/ui/Icons'
import { clsx } from 'clsx'

const VALID_ROLES = ['super_admin', 'super_admin', 'super_admin', 'partnership', 'cadre']

export function DashboardAuthGuard({ children }: { children: React.ReactNode }) {
  const { user, userData, userRole, loading, isAuthenticated, logout } = useAuth()
  const router = useRouter()
  const [isCollapsed, setIsCollapsed] = useState(false)

  // Listen to sidebar collapse preference
  useEffect(() => {
    const checkCollapse = () => {
      if (typeof window !== 'undefined') {
        const saved = localStorage.getItem('sidebar_collapsed')
        setIsCollapsed(saved === 'true')
      }
    }
    checkCollapse()

    if (typeof window !== 'undefined') {
      window.addEventListener('sidebar_toggle', checkCollapse)
      window.addEventListener('storage', checkCollapse)
    }
    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('sidebar_toggle', checkCollapse)
        window.removeEventListener('storage', checkCollapse)
      }
    }
  }, [])

  // 1. Verification of Client Session & User Credentials
  useEffect(() => {
    if (!loading) {
      const isRoleValid = userRole && VALID_ROLES.includes(userRole)
      const hasValidUserData = !!userData && !!userData.role && VALID_ROLES.includes(userData.role)

      if (!user || !isAuthenticated || !isRoleValid || !hasValidUserData) {
        console.warn('[AuthGuard] Akses ditolak atau Sesi Kadaluwarsa. Mengarahkan ke /login...')
        logout().finally(() => {
          router.replace('/login?reason=expired')
        })
      }
    }
  }, [loading, user, userData, userRole, isAuthenticated, router, logout])

  // 2. Global Fetch Interceptor for 401 Unauthorized & 403 Forbidden API Responses
  useEffect(() => {
    if (typeof window === 'undefined') return

    const originalFetch = window.fetch

    window.fetch = async (...args) => {
      const response = await originalFetch(...args)
      
      // If any API call returns 401 (Unauthorized) or 403 (Forbidden), auto-redirect to login
      if (response.status === 401 || response.status === 403) {
        console.warn('[AuthGuard] Sesi API kadaluwarsa (HTTP 401/403). Mengarahkan otomatis ke /login...')
        logout().finally(() => {
          window.location.href = '/login?reason=expired'
        })
      }

      return response
    }

    return () => {
      window.fetch = originalFetch
    }
  }, [logout])

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#06060E] text-white">
        <div className="flex flex-col items-center gap-4 p-8 rounded-2xl bg-white/[0.03] border border-white/[0.06] backdrop-blur-xl">
          <Icon name="spinner" className="w-8 h-8 text-cyan-400 animate-spin" />
          <div className="text-center">
            <p className="text-sm font-semibold text-white/90">Memverifikasi Otorisasi Akun...</p>
            <p className="text-xs text-white/40 mt-1">Menghubungkan ke Layanan Autentikasi KKPD-KP V1.5</p>
          </div>
        </div>
      </div>
    )
  }

  const isRoleValid = userRole && VALID_ROLES.includes(userRole)
  const hasValidUserData = !!userData && !!userData.role && VALID_ROLES.includes(userData.role)

  if (!user || !isAuthenticated || !isRoleValid || !hasValidUserData) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#06060E] text-white">
        <div className="flex flex-col items-center gap-4 p-8 rounded-2xl bg-white/[0.03] border border-white/[0.06] backdrop-blur-xl">
          <Icon name="spinner" className="w-8 h-8 text-cyan-400 animate-spin" />
          <div className="text-center">
            <p className="text-sm font-semibold text-white/90">Sesi Kadaluwarsa. Mengarahkan ke Login...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#06060E]">
      <Sidebar />
      <main
        className={clsx(
          'flex-1 min-h-screen min-w-0 transition-all duration-300 ease-in-out',
          isCollapsed ? 'lg:pl-20' : 'lg:pl-64 md:lg:pl-72'
        )}
      >
        {children}
      </main>
    </div>
  )
}
