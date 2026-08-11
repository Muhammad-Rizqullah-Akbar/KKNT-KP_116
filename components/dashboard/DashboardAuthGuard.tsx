'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import { Sidebar } from './Sidebar'
import { Icon } from '@/components/ui/Icons'

const VALID_ROLES = ['super_admin', 'admin', 'internal_bpom', 'partnership', 'cadre']

export function DashboardAuthGuard({ children }: { children: React.ReactNode }) {
  const { user, userData, userRole, loading, isAuthenticated, logout } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading) {
      const isRoleValid = userRole && VALID_ROLES.includes(userRole)
      const hasValidUserData = !!userData && !!userData.role && VALID_ROLES.includes(userData.role)

      if (!user || !isAuthenticated || !isRoleValid || !hasValidUserData) {
        console.warn('[AuthGuard] Akses ditolak: Pengguna tidak terautentikasi atau role tidak terdaftar. Mengarahkan ke /login...')
        logout().finally(() => {
          router.replace('/login')
        })
      }
    }
  }, [loading, user, userData, userRole, isAuthenticated, router, logout])

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
    return null
  }

  return (
    <div className="flex min-h-screen bg-[#06060E]">
      <Sidebar />
      <main className="flex-1 min-h-screen">{children}</main>
    </div>
  )
}
