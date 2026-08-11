'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { Icon, type IconName } from '@/components/ui/Icons'
import { SidebarItem } from './SidebarItem'
import { clsx } from 'clsx'
import { useAuth } from '@/context/AuthContext'
import { ProfileProgressModal } from './ProfileProgressModal'

interface SidebarProps {
  userRole?: 'super_admin' | 'admin' | null
}

interface MenuItem {
  href: string
  icon: IconName
  label: string
  badge?: string
}

interface MenuSection {
  section: string
  description?: string
  items: MenuItem[]
}

export function Sidebar({ userRole }: SidebarProps) {
  const [isMobileOpen, setIsMobileOpen] = useState(false)
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false)
  const [isCollapsed, setIsCollapsed] = useState(false)
  const pathname = usePathname()
  const { user, userData, logout } = useAuth()

  // Load saved sidebar collapse preference
  useEffect(() => {
    const saved = localStorage.getItem('sidebar_collapsed')
    if (saved === 'true') setIsCollapsed(true)
  }, [])

  const toggleCollapse = () => {
    setIsCollapsed((prev) => {
      const next = !prev
      localStorage.setItem('sidebar_collapsed', String(next))
      return next
    })
  }

  const LOGO_SRC = '/logo.png'
  const isSuperAdmin = userRole === 'super_admin' || userData?.role === 'super_admin'
  const isCadre = userData?.role === 'cadre'

  const menuSections: MenuSection[] = isCadre
    ? [
        {
          section: 'Utama',
          items: [
            { href: '/dashboard/overview', icon: 'dashboard', label: 'Dashboard Saya' },
            { href: '/dashboard/analytics', icon: 'barChart', label: 'Laporan & Analytics Saya', badge: 'Pribadi' },
          ],
        },
        {
          section: 'Aktivitas Lapangan',
          items: [
            { href: '/dashboard/distributions', icon: 'send', label: 'Distribusi Kode Saya', badge: 'Kode' },
            { href: '/dashboard/responses', icon: 'checkCircle', label: 'Hasil Penilaian Saya', badge: 'Evaluasi' },
            { href: '/dashboard/articles', icon: 'bookOpen', label: 'Materi Edukasi', badge: 'CMS' },
          ],
        },
      ]
    : [
        {
          section: 'Utama',
          items: [
            { href: '/dashboard/overview', icon: 'dashboard', label: 'Dashboard' },
            { href: '/dashboard/analytics', icon: 'barChart', label: 'Laporan & Analisis' },
          ],
        },
        {
          section: 'Versi 1.5 (Terbaru)',
          items: [
            { href: '/dashboard/forms/v1-5-builder', icon: 'sparkles', label: 'Form Builder V1.5', badge: 'V1.5' },
            { href: '/dashboard/forms/v1-5-list', icon: 'clipboardList', label: 'Daftar Formulir V1.5', badge: 'V1.5' },
            { href: '/dashboard/distributions', icon: 'send', label: 'Distribusi & Kode', badge: 'V1.5' },
            { href: '/dashboard/partnership/list', icon: 'building', label: 'Kelola Mitra & Instansi', badge: 'Mitra' },
            { href: '/dashboard/partnership/monitoring', icon: 'trendingUp', label: 'Monitoring Progress Kader', badge: 'Mitra' },
            { href: '/dashboard/partnership/cadres', icon: 'users', label: 'Kelola Kader Lapangan', badge: 'Kader' },
            { href: '/dashboard/responses', icon: 'checkCircle', label: 'Hasil Penilaian', badge: 'V1.5' },
          ],
        },
        {
          section: 'Versi 1.0 (Lama)',
          items: [
            { href: '/dashboard/form-builder', icon: 'filePlus', label: 'Form Builder V1.0', badge: 'V1.0' },
            { href: '/dashboard/forms', icon: 'clipboardList', label: 'Daftar Formulir V1.0', badge: 'V1.0' },
            { href: '/dashboard/respondents', icon: 'users', label: 'Data Responden', badge: 'V1.0' },
          ],
        },
        {
          section: 'CMS & Edukasi',
          items: [
            { href: '/dashboard/articles', icon: 'bookOpen', label: 'Materi Edukasi', badge: 'CMS' },
            { href: '/dashboard/widgets', icon: 'pieChart', label: 'Widget Grafik', badge: 'CMS' },
          ],
        },
        {
          section: 'Sistem',
          items: [
            { href: '/dashboard/settings', icon: 'settings', label: 'Pengaturan' },
            ...(isSuperAdmin
              ? [
                  {
                    href: '/dashboard/settings/users',
                    icon: 'userCog' as IconName,
                    label: 'Manajemen User',
                    badge: 'Admin',
                  },
                ]
              : []),
          ],
        },
      ]

  return (
    <>
      {/* Mobile Overlay */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden transition-opacity"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={clsx(
          'fixed lg:sticky top-0 z-50 lg:z-0',
          'flex flex-col bg-[#080812] border-r border-white/[0.06]',
          'h-screen transition-all duration-300 ease-in-out',
          'lg:translate-x-0',
          isCollapsed ? 'lg:w-20' : 'w-64 md:w-72',
          isMobileOpen ? 'translate-x-0 w-64' : '-translate-x-full lg:translate-x-0'
        )}
      >
        {/* ============ LOGO UTAMA SIDEBAR ============ */}
        <div className="p-3.5 border-b border-white/[0.06] flex-shrink-0 bg-white/[0.01] flex items-center justify-between gap-2">
          <Link href="/dashboard/overview" className="flex items-center gap-3 group min-w-0">
            <div className="relative w-9 h-9 rounded-xl overflow-hidden flex items-center justify-center flex-shrink-0 bg-cyan-500/10 border border-cyan-500/20 group-hover:border-cyan-500/40 transition-colors">
              <Image
                src={LOGO_SRC}
                alt="Logo KKNT-KP UH"
                width={36}
                height={36}
                className="w-full h-full object-contain p-1"
                onError={(e) => {
                  e.currentTarget.style.display = 'none'
                }}
              />
            </div>
            {!isCollapsed && (
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="font-display font-bold text-sm block leading-tight text-white group-hover:text-cyan-400 transition-colors truncate">
                    KKNT-KP<span className="text-cyan-400"> UH</span>
                  </span>
                  <span className="text-[9px] font-extrabold px-1.5 py-0.2 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 shrink-0">
                    V1.5
                  </span>
                </div>
                <span className="text-[10px] text-white/40 font-medium block truncate">Desa Pangan Aman</span>
              </div>
            )}
          </Link>

          {/* Desktop Collapse Toggle Button */}
          <button
            type="button"
            onClick={toggleCollapse}
            className="hidden lg:flex p-1.5 rounded-xl bg-white/[0.03] hover:bg-white/[0.08] text-white/60 hover:text-white border border-white/[0.06] transition-all shrink-0"
            title={isCollapsed ? 'Perluas Sidebar (Expanded Mode)' : 'Tutup Sidebar (Icon-Only Compact Mode)'}
          >
            <Icon name={isCollapsed ? 'chevronRight' : 'chevronLeft'} className="w-4 h-4" />
          </button>
        </div>

        {/* Navigation - Scrollable with Custom Styling */}
        <nav className="flex-1 p-3 space-y-4 overflow-y-auto custom-scrollbar">
          {menuSections.map((section, idx) => (
            <div key={section.section} className="space-y-1">
              {!isCollapsed ? (
                <div className="flex items-center justify-between px-3 py-1">
                  <p className="text-[11px] font-bold text-white/35 uppercase tracking-wider">
                    {section.section}
                  </p>
                  {section.section.includes('1.5') && (
                    <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
                  )}
                </div>
              ) : (
                <div className="my-2 border-t border-white/[0.06]" />
              )}
              <div className="space-y-1">
                {section.items.map((item) => (
                  <SidebarItem
                    key={item.href}
                    href={item.href}
                    icon={item.icon}
                    label={item.label}
                    badge={item.badge}
                    isCollapsed={isCollapsed}
                    onClick={() => setIsMobileOpen(false)}
                  />
                ))}
              </div>
              {!isCollapsed && idx < menuSections.length - 1 && (
                <div className="pt-2 border-b border-white/[0.04]" />
              )}
            </div>
          ))}
        </nav>

        {/* User Info - Fixed at Bottom */}
        <div className="p-3 border-t border-white/[0.06] flex-shrink-0 bg-white/[0.01]">
          <button
            onClick={() => setIsProfileModalOpen(true)}
            className={clsx(
              'w-full flex items-center gap-3 p-2 rounded-xl hover:bg-white/[0.04] transition-colors group text-left border border-transparent hover:border-white/[0.05]',
              isCollapsed && 'justify-center p-1.5'
            )}
            title={`Profil & Progress Akun: ${user?.displayName || user?.email || 'User'}`}
          >
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-cyan-500 to-violet-600 flex items-center justify-center text-xs font-bold text-white flex-shrink-0 shadow-lg shadow-cyan-500/20 group-hover:scale-105 transition-transform">
              {user?.displayName?.charAt(0) || user?.email?.charAt(0) || 'U'}
            </div>
            {!isCollapsed && (
              <>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate group-hover:text-cyan-400 transition-colors">
                    {user?.displayName || user?.email || 'User'}
                  </p>
                  <p className="text-[10px] text-white/40 truncate flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                    {userRole === 'super_admin' || userData?.role === 'super_admin' ? 'Super Admin' : userRole === 'admin' || userData?.role === 'admin' ? 'Admin' : 'User'}
                  </p>
                </div>
                <Icon name="chevronRight" className="w-4 h-4 text-white/20 group-hover:text-white/60 transition-colors" />
              </>
            )}
          </button>
        </div>
      </aside>

      {/* Mobile Toggle Button */}
      <button
        onClick={() => setIsMobileOpen(true)}
        className="lg:hidden fixed bottom-6 right-6 z-50 p-3.5 rounded-full bg-gradient-to-r from-cyan-600 to-violet-600 shadow-xl shadow-cyan-600/30 hover:shadow-cyan-500/50 transition-all active:scale-95"
        aria-label="Buka Menu Sidebar"
      >
        <Icon name="menu" className="w-5 h-5 text-white" />
      </button>

      {/* Profile & Progress Modal */}
      {isProfileModalOpen && (
        <ProfileProgressModal
          isOpen={isProfileModalOpen}
          onClose={() => setIsProfileModalOpen(false)}
        />
      )}
    </>
  )
}