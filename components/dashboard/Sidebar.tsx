'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image' // 🔥 Import Image Next.js
import { usePathname } from 'next/navigation'
import { Icon } from '@/components/ui/Icons'
import { SidebarItem } from './SidebarItem'
import { clsx } from 'clsx'
import { useAuth } from '@/context/AuthContext'
import { ProfileModal } from './ProfileModal'

interface SidebarProps {
  userRole?: 'super_admin' | 'admin' | null
}

export function Sidebar({ userRole }: SidebarProps) {
  const [isMobileOpen, setIsMobileOpen] = useState(false)
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false)
  const pathname = usePathname()
  const { user, userData, logout } = useAuth()

  // 🔴 LOGO PATH: Ganti path gambar di sini sesuai file di public/
  const LOGO_SRC = '/logo.png'

  const isSuperAdmin = userRole === 'super_admin'

  const mainMenuItems = [
    { href: '/dashboard/overview', icon: 'dashboard' as const, label: 'Dashboard' },
    { href: '/dashboard/form-builder', icon: 'filePlus' as const, label: 'Form Builder' },
    { href: '/dashboard/forms', icon: 'clipboardList' as const, label: 'Daftar Formulir' },
    { href: '/dashboard/respondents', icon: 'users' as const, label: 'Data Responden' },
    { href: '/dashboard/articles', icon: 'bookOpen' as const, label: 'Materi Edukasi' },
    { href: '/dashboard/widgets', icon: 'barChart' as const, label: 'Widget Grafik' },
    { href: '/dashboard/analytics', icon: 'barChart' as const, label: 'Laporan & Analisis' },
  ]

  const settingsItems = [
    { href: '/dashboard/settings', icon: 'settings' as const, label: 'Pengaturan' },
  ]

  if (isSuperAdmin) {
    settingsItems.push({
      href: '/dashboard/settings/users',
      icon: 'userCog' as const,
      label: 'Manajemen User',
      badge: 'Admin' as const,
    })
  }

  const menuItems = [
    {
      section: 'Menu Utama',
      items: mainMenuItems,
    },
    {
      section: 'Pengaturan',
      items: settingsItems,
    },
  ]

  const handleLogout = async () => {
    await logout()
    window.location.href = '/'
  }

  return (
    <>
      {/* Mobile Overlay */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={clsx(
          'fixed lg:sticky top-0 z-50 lg:z-0',
          'flex flex-col w-64 md:w-72 bg-[#080812] border-r border-white/[0.05]',
          'h-screen transition-transform duration-300',
          'lg:translate-x-0',
          isMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        )}
      >
        {/* ============ LOGO UTAMA SIDEBAR ============ */}
        <div className="p-4 md:p-6 border-b border-white/[0.05] flex-shrink-0">
          <Link href="/dashboard/overview" className="flex items-center gap-3">
            <div className="relative w-9 h-9 rounded-xl overflow-hidden flex items-center justify-center flex-shrink-0">
              {/* 🔴 IMPLEMENTASI LOGO GAMBAR DENGAN FALLBACK */}
              <Image
                src={LOGO_SRC}
                alt="Logo KKNT-KP UH"
                width={36}
                height={36}
                className="w-full h-full object-contain"
                onError={(e) => {
                  e.currentTarget.style.display = 'none'
                }}
              />
            </div>
            <div>
              <span className="font-display font-bold text-sm block leading-tight text-white">
                KKNT-KP<span className="text-cyan-400"> UH</span>
              </span>
              <span className="text-[10px] text-white/30 font-normal">Desa Pangan Aman</span>
            </div>
          </Link>
        </div>

        {/* Navigation - Scrollable */}
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto custom-scrollbar">
          {menuItems.map((section) => (
            <div key={section.section}>
              <p className="text-xs text-white/25 uppercase tracking-wider px-3 mb-3 mt-2">
                {section.section}
              </p>
              {section.items.map((item) => (
                <SidebarItem
                  key={item.href}
                  href={item.href}
                  icon={item.icon}
                  label={item.label}
                  badge={item.badge}
                  isActive={pathname === item.href}
                />
              ))}
            </div>
          ))}
        </nav>

        {/* User Info - Fixed di bawah */}
        <div className="p-4 border-t border-white/[0.05] flex-shrink-0">
          <button
            onClick={() => setIsProfileModalOpen(true)}
            className="w-full flex items-center gap-3 p-2 rounded-xl hover:bg-white/[0.03] transition-colors group"
          >
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-cyan-500 to-violet-500 flex items-center justify-center text-xs font-bold text-white flex-shrink-0 shadow-lg shadow-cyan-500/20">
              {user?.displayName?.charAt(0) || user?.email?.charAt(0) || 'U'}
            </div>
            <div className="flex-1 min-w-0 text-left">
              <p className="text-sm text-white truncate group-hover:text-cyan-400 transition-colors">
                {user?.displayName || user?.email || 'User'}
              </p>
              <p className="text-[10px] text-white/35 truncate">
                {userRole === 'super_admin' ? 'Super Admin' : userRole === 'admin' ? 'Admin' : 'User'}
              </p>
            </div>
            <Icon name="chevronRight" className="w-4 h-4 text-white/20 group-hover:text-white/50 transition-colors" />
          </button>
        </div>
      </aside>

      {/* Mobile Toggle Button */}
      <button
        onClick={() => setIsMobileOpen(true)}
        className="lg:hidden fixed bottom-6 right-6 z-50 p-3.5 rounded-full bg-gradient-to-r from-cyan-600 to-violet-600 shadow-lg shadow-cyan-600/25 hover:shadow-cyan-500/40 transition-all"
      >
        <Icon name="menu" className="w-5 h-5 text-white" />
      </button>

      {/* Profile Modal */}
      <ProfileModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
        onLogout={handleLogout}
      />
    </>
  )
}