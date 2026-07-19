'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Icon } from '@/components/ui/Icons'
import { Button } from '@/components/shared/Button'
import { clsx } from 'clsx'
import { useAuth } from '@/context/AuthContext'

interface NavbarProps {
  transparent?: boolean
}

export function Navbar({ transparent = false }: NavbarProps) {
  const [isScrolled, setIsScrolled] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isVisible, setIsVisible] = useState(false)
  const { user, userRole, isAuthenticated } = useAuth()

  useEffect(() => {
    const handleScroll = () => {
      const hero = document.getElementById('hero')
      if (hero) {
        const heroBottom = hero.offsetTop + hero.offsetHeight
        const shouldShow = window.scrollY > heroBottom - 100
        setIsVisible(shouldShow)
      } else {
        setIsVisible(window.scrollY > 100)
      }
      setIsScrolled(window.scrollY > 20)
    }
    
    window.addEventListener('scroll', handleScroll)
    setTimeout(handleScroll, 100)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // ============ CODE MODAL ============
  const openCodeModal = () => {
    const modal = document.getElementById('codeModal')
    if (modal) {
      modal.classList.remove('hidden')
      modal.classList.add('flex')
      setTimeout(() => modal.classList.add('active'), 10)
    }
  }

  // Cek apakah user memiliki akses admin
  const hasAdminAccess = isAuthenticated && (userRole === 'admin' || userRole === 'super_admin')

  return (
    <nav
      className={clsx(
        'fixed top-0 left-0 right-0 z-50 px-3 sm:px-6 lg:px-8 py-3 sm:py-4 transition-all duration-700',
        !isVisible && 'opacity-0 pointer-events-none -translate-y-4',
        isVisible && 'opacity-100 pointer-events-auto translate-y-0',
        isScrolled || !transparent
          ? 'bg-[#0a0a16]/80 backdrop-blur-2xl border-b border-white/[0.06] shadow-2xl shadow-black/40'
          : 'bg-transparent border-b border-transparent'
      )}
    >
      <div className={clsx(
        'max-w-6xl mx-auto rounded-2xl px-4 sm:px-6 py-3 flex items-center justify-between transition-all duration-500',
        isScrolled || !transparent
          ? 'bg-[#0a0a16]/80 backdrop-blur-2xl border border-white/[0.06] shadow-2xl shadow-black/40 glass-edge-accent'
          : 'bg-transparent border border-transparent'
      )}>
        {/* Logo - lebih compact di mobile */}
        <Link href="/" className="flex items-center gap-2 sm:gap-3 group">
          <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-gradient-to-br from-cyan-500 to-violet-500 flex items-center justify-center shadow-lg shadow-cyan-500/20 transition-transform duration-300 group-hover:scale-105 flex-shrink-0">
            <Icon name="hexagon" className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
          </div>
          <div className="hidden xs:block">
            <span className="font-display font-bold text-sm sm:text-base block leading-tight text-white">
              KKNT-KP<span className="text-cyan-400"> UH</span>
            </span>
            <span className="text-[8px] sm:text-[10px] text-white/30 font-normal hidden sm:block">Desa Pangan Aman</span>
          </div>
        </Link>

        {/* Desktop Menu - Responsive */}
        <div className="hidden md:flex items-center gap-4 lg:gap-8">
          <Link href="#program" className="text-sm text-white/60 hover:text-white transition-colors duration-300 relative after:absolute after:bottom-0 after:left-0 after:h-px after:w-0 hover:after:w-full after:bg-cyan-400 after:transition-all">
            Program
          </Link>
          <Link href="#edukasi" className="text-sm text-white/60 hover:text-white transition-colors duration-300 relative after:absolute after:bottom-0 after:left-0 after:h-px after:w-0 hover:after:w-full after:bg-emerald-400 after:transition-all">
            Edukasi
          </Link>
          <Link href="#galeri" className="text-sm text-white/60 hover:text-white transition-colors duration-300 relative after:absolute after:bottom-0 after:left-0 after:h-px after:w-0 hover:after:w-full after:bg-amber-400 after:transition-all">
            Galeri
          </Link>
          
          {/* Dashboard Menu - Hanya muncul jika login & punya akses admin */}
          {hasAdminAccess && (
            <Link href="/dashboard/overview" className="text-sm text-cyan-400 hover:text-cyan-300 transition-colors duration-300">
              Dashboard
            </Link>
          )}
          
          <Button
            variant="primary"
            size="sm"
            icon="key"
            onClick={openCodeModal}
            className="text-xs sm:text-sm px-3 sm:px-4 py-1.5 sm:py-2"
          >
            Akses Form
          </Button>
        </div>

        {/* Mobile Toggle */}
        <button
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="md:hidden p-2 rounded-lg hover:bg-white/[0.05] transition-colors"
        >
          <Icon name="menu" className="w-6 h-6 text-white/70" />
        </button>
      </div>

      {/* Mobile Menu - Responsive */}
      {isMobileMenuOpen && (
        <div className="md:hidden mt-3 p-4 rounded-2xl bg-[#0a0a16]/95 backdrop-blur-2xl border border-white/[0.06] space-y-2 max-h-[80vh] overflow-y-auto">
          <Link href="#program" className="block px-3 py-2.5 text-sm text-white/60 hover:text-white hover:bg-white/[0.05] rounded-lg transition-colors">
            Program
          </Link>
          <Link href="#edukasi" className="block px-3 py-2.5 text-sm text-white/60 hover:text-white hover:bg-white/[0.05] rounded-lg transition-colors">
            Edukasi
          </Link>
          <Link href="#galeri" className="block px-3 py-2.5 text-sm text-white/60 hover:text-white hover:bg-white/[0.05] rounded-lg transition-colors">
            Galeri
          </Link>
          
          {/* Dashboard di mobile - Hanya jika login */}
          {hasAdminAccess && (
            <Link href="/dashboard/overview" className="block px-3 py-2.5 text-sm text-cyan-400 hover:text-cyan-300 hover:bg-white/[0.05] rounded-lg transition-colors">
              Dashboard
            </Link>
          )}
          
          <button
            onClick={openCodeModal}
            className="w-full mt-2 px-4 py-3 rounded-xl bg-gradient-to-r from-cyan-600 to-violet-600 hover:from-cyan-500 hover:to-violet-500 text-white text-sm font-medium transition-all flex items-center justify-center gap-2"
          >
            <Icon name="key" className="w-4 h-4" /> Akses Form
          </button>
          
          {/* Tampilkan info user di mobile jika login */}
          {isAuthenticated && (
            <div className="pt-3 mt-3 border-t border-white/[0.06] flex items-center gap-3 px-3 py-2">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-cyan-500 to-violet-500 flex items-center justify-center text-xs font-bold text-white">
                {user?.displayName?.charAt(0) || user?.email?.charAt(0) || 'U'}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-white truncate">{user?.displayName || user?.email || 'User'}</p>
                <p className="text-[10px] text-white/40 truncate">{userRole === 'super_admin' ? 'Super Admin' : userRole === 'admin' ? 'Admin' : 'User'}</p>
              </div>
            </div>
          )}
        </div>
      )}
    </nav>
  )
}