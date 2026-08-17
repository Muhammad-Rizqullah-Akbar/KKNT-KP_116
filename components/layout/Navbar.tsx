// components/layout/Navbar.tsx
'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Icon } from '@/components/ui/Icons'
import { clsx } from 'clsx'
import { useAuth } from '@/context/AuthContext'

interface NavbarProps {
  transparent?: boolean
  onOpenCodeModal?: () => void
}

export function Navbar({ transparent = false, onOpenCodeModal }: NavbarProps) {
  const [isScrolled, setIsScrolled] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  // ✅ 1. UBAH DEFAULT STATE: Sembunyikan Navbar saat pertama kali dimuat di Hero
  const [isVisible, setIsVisible] = useState(false)
  const [activeSection, setActiveSection] = useState('')
  const { user, userRole, isAuthenticated } = useAuth()

  const LOGO_SRC = '/logo.png'

  // ========== DETEKSI SCROLL & VISIBILITAS NAVBAR ==========
  useEffect(() => {
    const handleScroll = () => {
      const scrollPos = window.scrollY
      const hero = document.getElementById('hero')

      // ✅ 2. LOGIKA KETAT: Navbar HANYA muncul jika sudah melewati Hero Section
      if (hero) {
        const heroBottom = hero.offsetTop + hero.offsetHeight
        // Tampilkan Navbar hanya jika scroll melebihi batas bawah Hero (dikurangi offset 100px)
        setIsVisible(scrollPos > heroBottom - 100)
      } else {
        // Fallback jika id="hero" tidak ditemukan
        setIsVisible(scrollPos > 150)
      }

      setIsScrolled(scrollPos > 20)

      // Deteksi seksi aktif untuk highlight tautan navigasi
      const sections = ['program', 'edukasi', 'galeri']
      for (const section of sections) {
        const el = document.getElementById(section)
        if (el) {
          const top = el.offsetTop - 120
          const height = el.offsetHeight
          if (scrollPos >= top && scrollPos < top + height) {
            setActiveSection(section)
            break
          }
        }
      }
      if (scrollPos < 300) {
        setActiveSection('')
      }
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    // Langsung jalankan sekali saat komponen di-mount
    handleScroll()
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // ========== PREVENT SCROLL BODY SAAT MOBILE MENU BUKA ==========
  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [isMobileMenuOpen])

  // ========== HANDLE SMOOTH SCROLLING ==========
  const handleNavClick = (e: React.MouseEvent<HTMLAnchorElement>, targetId: string) => {
    e.preventDefault()
    setIsMobileMenuOpen(false)
    const element = document.getElementById(targetId)
    if (element) {
      const yOffset = -80
      const y = element.getBoundingClientRect().top + window.pageYOffset + yOffset
      window.scrollTo({ top: y, behavior: 'smooth' })
    }
  }

  const hasAdminAccess = isAuthenticated && (userRole === 'admin' || userRole === 'super_admin')

  return (
    <nav
      className={clsx(
        'fixed top-0 left-0 right-0 z-50 px-3 sm:px-6 lg:px-8 py-3 transition-all duration-500',
        // ✅ 3. KONTROL EFEK TRANSISI: Sembunyikan dengan animasi transparan & pergeseran ke atas
        !isVisible && 'opacity-0 pointer-events-none -translate-y-6',
        isVisible && 'opacity-100 pointer-events-auto translate-y-0',
        isScrolled
          ? 'bg-[#06060E]/85 backdrop-blur-xl border-b border-white/[0.08] shadow-2xl shadow-cyan-950/20'
          : transparent
          ? 'bg-transparent'
          : 'bg-[#06060E]/60 backdrop-blur-md border-b border-white/[0.04]'
      )}
    >
      <div className="max-w-6xl mx-auto flex items-center justify-between">
        
        {/* ============ BRANDING / LOGO ============ */}
        <Link href="/" className="flex items-center gap-3 group focus:outline-none">
          <div className="relative w-9 h-9 rounded-xl bg-gradient-to-br from-cyan-500/20 via-violet-500/20 to-emerald-500/20 p-0.5 border border-white/10 group-hover:border-cyan-400/50 transition-all duration-300 shadow-md group-hover:shadow-cyan-500/20 flex-shrink-0">
            <div className="w-full h-full rounded-[10px] bg-[#080812] flex items-center justify-center overflow-hidden">
              <Image
                src={LOGO_SRC}
                alt="Logo KKNT-KP UH"
                width={36}
                height={36}
                className="w-full h-full object-contain p-1 group-hover:scale-110 transition-transform duration-300"
                onError={(e) => {
                  e.currentTarget.style.display = 'none'
                }}
              />
            </div>
          </div>
          
          <div className="flex flex-col">
            <span className="font-display font-bold text-base tracking-tight text-white group-hover:text-cyan-300 transition-colors">
              KKNT-KP<span className="text-cyan-400"> UH</span>
            </span>
            <span className="text-[9px] text-white/40 tracking-wider font-normal uppercase hidden sm:block">
              Desa Pangan Aman
            </span>
          </div>
        </Link>

        {/* ============ DESKTOP NAVIGATION LINKS ============ */}
        <div className="hidden md:flex items-center gap-1 bg-white/[0.03] border border-white/[0.06] rounded-full px-4 py-1.5 backdrop-blur-md">
          <a
            href="#program"
            onClick={(e) => handleNavClick(e, 'program')}
            className={clsx(
              'px-3.5 py-1.5 rounded-full text-xs font-medium transition-all duration-300 relative',
              activeSection === 'program'
                ? 'text-cyan-400 bg-cyan-500/10 border border-cyan-500/20'
                : 'text-white/60 hover:text-white hover:bg-white/[0.05]'
            )}
          >
            Program
          </a>
          <a
            href="#edukasi"
            onClick={(e) => handleNavClick(e, 'edukasi')}
            className={clsx(
              'px-3.5 py-1.5 rounded-full text-xs font-medium transition-all duration-300 relative',
              activeSection === 'edukasi'
                ? 'text-emerald-400 bg-emerald-500/10 border border-emerald-500/20'
                : 'text-white/60 hover:text-white hover:bg-white/[0.05]'
            )}
          >
            Edukasi
          </a>
          <a
            href="#galeri"
            onClick={(e) => handleNavClick(e, 'galeri')}
            className={clsx(
              'px-3.5 py-1.5 rounded-full text-xs font-medium transition-all duration-300 relative',
              activeSection === 'galeri'
                ? 'text-amber-400 bg-amber-500/10 border border-amber-500/20'
                : 'text-white/60 hover:text-white hover:bg-white/[0.05]'
            )}
          >
            Galeri
          </a>
        </div>

        {/* ============ ACTIONS BUTTONS (DESKTOP) ============ */}
        <div className="hidden md:flex items-center gap-3">
          {hasAdminAccess && (
            <Link
              href="/dashboard/overview"
              className="px-3.5 py-2 rounded-xl text-xs font-medium text-cyan-400 bg-cyan-500/10 border border-cyan-500/20 hover:bg-cyan-500/20 transition-all flex items-center gap-1.5"
            >
              <Icon name="layoutGrid" className="w-3.5 h-3.5" />
              <span>Dashboard</span>
            </Link>
          )}

          {/* TOMBOL BUKA FORMULIR MODAL */}
          <button
            onClick={onOpenCodeModal}
            className="group relative inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-semibold text-white bg-gradient-to-r from-cyan-600 via-teal-600 to-cyan-600 hover:from-cyan-500 hover:to-teal-500 shadow-lg shadow-cyan-600/20 hover:shadow-cyan-500/35 transition-all duration-300 hover:-translate-y-0.5 overflow-hidden cursor-pointer active:scale-95"
          >
            <span className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-in-out" />
            <Icon name="keyRound" className="w-4 h-4 text-cyan-200 group-hover:rotate-12 transition-transform duration-300" />
            <span>Buka Formulir</span>
          </button>
        </div>

        {/* ============ TOGGLE MOBILE MENU ============ */}
        <div className="flex items-center gap-2 md:hidden">
          <button
            onClick={onOpenCodeModal}
            className="px-3 py-2 rounded-xl bg-cyan-600/20 border border-cyan-500/30 text-cyan-400 text-xs font-medium flex items-center gap-1.5 active:scale-95 transition-transform"
          >
            <Icon name="keyRound" className="w-3.5 h-3.5" />
            <span>Form</span>
          </button>

          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="p-2.5 rounded-xl bg-white/[0.03] border border-white/[0.08] hover:bg-white/[0.08] text-white/80 transition-colors focus:outline-none"
            aria-label="Toggle Menu"
          >
            <Icon name={isMobileMenuOpen ? 'x' : 'menu'} className="w-5 h-5 text-white" />
          </button>
        </div>
      </div>

      {/* ============ MOBILE NAVIGATION DRAWER ============ */}
      {isMobileMenuOpen && (
        <div className="md:hidden fixed inset-x-0 top-[65px] bg-[#06060E]/95 backdrop-blur-2xl border-b border-white/[0.08] p-5 shadow-2xl animate-slideDown max-h-[85vh] overflow-y-auto space-y-4">
          <div className="space-y-1">
            <p className="text-[10px] text-white/30 uppercase tracking-widest px-3 mb-2 font-semibold">Navigasi Halaman</p>
            
            <a
              href="#program"
              onClick={(e) => handleNavClick(e, 'program')}
              className={clsx(
                'flex items-center justify-between px-4 py-3 text-sm font-medium rounded-xl transition-all',
                activeSection === 'program'
                  ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20'
                  : 'text-white/70 hover:text-white hover:bg-white/[0.03]'
              )}
            >
              <div className="flex items-center gap-3">
                <Icon name="rocket" className="w-4 h-4 text-cyan-400" />
                <span>Program & Partnership</span>
              </div>
              <Icon name="chevronRight" className="w-4 h-4 text-white/20" />
            </a>

            <a
              href="#edukasi"
              onClick={(e) => handleNavClick(e, 'edukasi')}
              className={clsx(
                'flex items-center justify-between px-4 py-3 text-sm font-medium rounded-xl transition-all',
                activeSection === 'edukasi'
                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                  : 'text-white/70 hover:text-white hover:bg-white/[0.03]'
              )}
            >
              <div className="flex items-center gap-3">
                <Icon name="bookOpen" className="w-4 h-4 text-emerald-400" />
                <span>Edukasi & Wawasan</span>
              </div>
              <Icon name="chevronRight" className="w-4 h-4 text-white/20" />
            </a>

            <a
              href="#galeri"
              onClick={(e) => handleNavClick(e, 'galeri')}
              className={clsx(
                'flex items-center justify-between px-4 py-3 text-sm font-medium rounded-xl transition-all',
                activeSection === 'galeri'
                  ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                  : 'text-white/70 hover:text-white hover:bg-white/[0.03]'
              )}
            >
              <div className="flex items-center gap-3">
                <Icon name="camera" className="w-4 h-4 text-amber-400" />
                <span>Galeri Dokumentasi</span>
              </div>
              <Icon name="chevronRight" className="w-4 h-4 text-white/20" />
            </a>
          </div>

          <div className="pt-2 border-t border-white/[0.06] space-y-2">
            {hasAdminAccess && (
              <Link
                href="/dashboard/overview"
                onClick={() => setIsMobileMenuOpen(false)}
                className="flex items-center gap-3 px-4 py-3 text-sm font-medium text-cyan-400 bg-cyan-500/10 border border-cyan-500/20 rounded-xl"
              >
                <Icon name="layoutGrid" className="w-4 h-4" />
                <span>Masuk ke Dashboard Admin</span>
              </Link>
            )}

            {/* TOMBOL BUKA FORMULIR DI MOBILE */}
            <button
              onClick={() => {
                setIsMobileMenuOpen(false)
                if (onOpenCodeModal) onOpenCodeModal()
              }}
              className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-cyan-600 via-teal-600 to-cyan-600 text-white text-sm font-semibold flex items-center justify-center gap-2 shadow-lg shadow-cyan-600/20 active:scale-95 transition-all"
            >
              <Icon name="keyRound" className="w-4 h-4" />
              <span>Buka Formulir Publik</span>
            </button>
          </div>

          {/* User Profile Info jika Login */}
          {isAuthenticated && (
            <div className="pt-3 border-t border-white/[0.06] flex items-center gap-3 px-3 py-2 bg-white/[0.01] rounded-xl">
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-cyan-500 to-violet-500 flex items-center justify-center text-xs font-bold text-white shadow-md">
                {user?.displayName?.charAt(0) || user?.email?.charAt(0) || 'A'}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">{user?.displayName || user?.email || 'Admin'}</p>
                <p className="text-[10px] text-cyan-400/80 uppercase font-mono">
                  {userRole === 'super_admin' ? 'Super Admin' : 'Admin'}
                </p>
              </div>
            </div>
          )}
        </div>
      )}
    </nav>
  )
}