'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import { Icon } from '@/components/ui/Icons'

export default function DashboardPage() {
  const { userRole, userData, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading) {
      const effectiveRole = userRole || userData?.role
      if (effectiveRole === 'partnership') {
        router.replace('/dashboard/partnership')
      } else if (effectiveRole === 'cadre') {
        router.replace('/dashboard/monitoring')
      } else {
        router.replace('/dashboard/overview')
      }
    }
  }, [loading, userRole, userData, router])

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#06060E] text-white">
      <div className="flex flex-col items-center gap-3 p-6 rounded-2xl bg-white/[0.03] border border-white/[0.06]">
        <Icon name="spinner" className="w-8 h-8 text-cyan-400 animate-spin" />
        <p className="text-xs text-white/50">Mengarahkan ke dashboard Anda...</p>
      </div>
    </div>
  )
}