'use client'

import { useState } from 'react'
import { Icon } from '@/components/ui/Icons'
import { useAuth } from '@/context/AuthContext'
import { ProfileProgressModal } from './ProfileProgressModal'

interface TopbarProps {
  title: string
  subtitle?: string
}

export function Topbar({ title, subtitle }: TopbarProps) {
  const { user, userData } = useAuth()
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false)

  return (
    <>
      <header className="sticky top-0 z-30 bg-[#06060E]/80 backdrop-blur-xl border-b border-white/[0.04] px-6 py-4 flex items-center justify-between">
        <div>
          <h1 className="font-display text-lg font-semibold">{title}</h1>
          {subtitle && <p className="text-sm text-white/40">{subtitle}</p>}
        </div>
        <div className="flex items-center gap-3">
          <button className="relative p-2 rounded-lg hover:bg-white/[0.05] transition-colors" title="Notifikasi">
            <Icon name="bell" className="w-5 h-5 text-white/50" />
            <span className="absolute top-1 right-1 w-2 h-2 bg-rose-500 rounded-full" />
          </button>
          <button
            onClick={() => setIsProfileModalOpen(true)}
            className="flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-xl bg-white/[0.03] hover:bg-white/[0.08] border border-white/[0.06] transition-all cursor-pointer"
            title="Buka Profil & Progress Akun"
          >
            <div className="w-6 h-6 rounded-full bg-gradient-to-br from-purple-500 to-cyan-500 flex items-center justify-center text-[10px] font-extrabold text-white">
              {userData?.displayName?.charAt(0) || user?.email?.charAt(0) || 'U'}
            </div>
            <span className="text-xs font-semibold text-white/80 max-w-[120px] truncate hidden sm:inline">
              {userData?.displayName || user?.email?.split('@')[0] || 'Profil'}
            </span>
          </button>
        </div>
      </header>

      {isProfileModalOpen && (
        <ProfileProgressModal
          isOpen={isProfileModalOpen}
          onClose={() => setIsProfileModalOpen(false)}
        />
      )}
    </>
  )
}