'use client'

import { useState } from 'react'
import { Icon } from '@/components/ui/Icons'
import { useAuth } from '@/context/AuthContext'
import { clsx } from 'clsx'

interface ProfileModalProps {
  isOpen: boolean
  onClose: () => void
  onLogout: () => void
}

export function ProfileModal({ isOpen, onClose, onLogout }: ProfileModalProps) {
  const { user, userData, userRole } = useAuth()
  const [isLoggingOut, setIsLoggingOut] = useState(false)

  if (!isOpen) return null

  const handleLogout = async () => {
    setIsLoggingOut(true)
    await onLogout()
    setIsLoggingOut(false)
    onClose()
  }

  const getInitials = () => {
    if (user?.displayName) {
      return user.displayName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    }
    return user?.email?.charAt(0).toUpperCase() || 'U'
  }

  const getRoleLabel = () => {
    if (userRole === 'super_admin') return 'Super Admin'
    if (userRole === 'admin') return 'Admin'
    return 'User'
  }

  const getRoleColor = () => {
    if (userRole === 'super_admin') return 'from-amber-500 to-orange-500'
    if (userRole === 'admin') return 'from-cyan-500 to-violet-500'
    return 'from-gray-500 to-gray-600'
  }

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(0, 0, 0, 0.7)' }}
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-md bg-[#0e0e1a] border border-white/[0.08] rounded-2xl shadow-2xl animate-slideUp"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 w-8 h-8 rounded-lg hover:bg-white/[0.05] flex items-center justify-center transition-colors"
        >
          <Icon name="x" className="w-4 h-4 text-white/50" />
        </button>

        {/* Avatar */}
        <div className="flex flex-col items-center pt-8 pb-6 px-6 border-b border-white/[0.06]">
          <div className={clsx(
            'w-24 h-24 rounded-full bg-gradient-to-br flex items-center justify-center text-4xl font-bold text-white shadow-lg',
            getRoleColor()
          )}>
            {getInitials()}
          </div>
          <h3 className="font-display text-xl font-semibold text-white mt-4">
            {user?.displayName || user?.email || 'User'}
          </h3>
          <div className="flex items-center gap-2 mt-1">
            <span className={clsx(
              'px-2.5 py-0.5 rounded-full text-[10px] font-medium border',
              userRole === 'super_admin' 
                ? 'text-amber-400 bg-amber-500/10 border-amber-500/20'
                : 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20'
            )}>
              {getRoleLabel()}
            </span>
          </div>
        </div>

        {/* Info */}
        <div className="p-6 space-y-4">
          <div className="space-y-3">
            <div className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.02] border border-white/[0.05]">
              <Icon name="mail" className="w-4 h-4 text-white/40 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-[10px] text-white/30 uppercase tracking-wider">Email</p>
                <p className="text-sm text-white/80 truncate">{user?.email || '-'}</p>
              </div>
            </div>

            {userData?.displayName && (
              <div className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.02] border border-white/[0.05]">
                <Icon name="user" className="w-4 h-4 text-white/40 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] text-white/30 uppercase tracking-wider">Nama</p>
                  <p className="text-sm text-white/80 truncate">{userData.displayName}</p>
                </div>
              </div>
            )}

            {userData?.createdAt && (
              <div className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.02] border border-white/[0.05]">
                <Icon name="calendar" className="w-4 h-4 text-white/40 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] text-white/30 uppercase tracking-wider">Bergabung Sejak</p>
                  <p className="text-sm text-white/80">
                    {new Date(userData.createdAt).toLocaleDateString('id-ID', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric'
                    })}
                  </p>
                </div>
              </div>
            )}

            {userData?.uid && (
              <div className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.02] border border-white/[0.05]">
                <Icon name="fingerprint" className="w-4 h-4 text-white/40 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] text-white/30 uppercase tracking-wider">User ID</p>
                  <p className="text-xs text-white/50 font-mono truncate">{userData.uid}</p>
                </div>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(userData.uid || '')
                    // Toast notifikasi bisa ditambahkan
                  }}
                  className="p-1.5 rounded-lg hover:bg-white/[0.05] transition-colors"
                  title="Copy ID"
                >
                  <Icon name="copy" className="w-3.5 h-3.5 text-white/30 hover:text-white/60" />
                </button>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="pt-4 border-t border-white/[0.06] space-y-2">
            <button
              onClick={() => {
                onClose()
                // Navigate ke halaman settings/profile
                window.location.href = '/dashboard/settings'
              }}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-white/[0.02] border border-white/[0.05] hover:bg-white/[0.05] transition-all text-left"
            >
              <Icon name="settings" className="w-4 h-4 text-white/40" />
              <span className="text-sm text-white/70 hover:text-white transition-colors">Pengaturan Akun</span>
              <Icon name="chevronRight" className="w-4 h-4 text-white/20 ml-auto" />
            </button>

            <button
              onClick={handleLogout}
              disabled={isLoggingOut}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-rose-500/5 border border-rose-500/10 hover:bg-rose-500/10 transition-all text-left group"
            >
              <Icon name="logOut" className="w-4 h-4 text-rose-400/60 group-hover:text-rose-400" />
              <span className="text-sm text-rose-400/70 group-hover:text-rose-400 transition-colors">
                {isLoggingOut ? 'Logging out...' : 'Keluar'}
              </span>
              {isLoggingOut && <Icon name="loader" className="w-4 h-4 text-rose-400 animate-spin ml-auto" />}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}