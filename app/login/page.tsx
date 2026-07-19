// app/login/page.tsx

'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Icon } from '@/components/ui/Icons'
import { useAuth } from '@/context/AuthContext'
import { handleGoogleRedirectResult } from '@/lib/auth.repo'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const { login, loginWithGoogle, isAuthenticated, userRole } = useAuth()

  // ========== HANDLE GOOGLE REDIRECT RESULT ==========
  useEffect(() => {
    const handleRedirect = async () => {
      try {
        const result = await handleGoogleRedirectResult()
        if (result) {
          // Login via redirect berhasil, AuthContext akan mendeteksi user
          // Redirect akan dihandle oleh useEffect di bawah
        }
      } catch (err: any) {
        console.error('Redirect login error:', err)
        setError(err.message || 'Login dengan Google gagal.')
      }
    }
    handleRedirect()
  }, [])

  // ========== REDIRECT JIKA SUDAH LOGIN ==========
  useEffect(() => {
    if (isAuthenticated) {
      if (userRole === 'super_admin' || userRole === 'admin') {
        router.push('/dashboard/overview')
      } else {
        router.push('/')
      }
    }
  }, [isAuthenticated, userRole, router])

  // ========== HANDLE EMAIL LOGIN ==========
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      await login(email, password)
    } catch (err: any) {
      setError(err.message || 'Login gagal. Silakan coba lagi.')
    } finally {
      setLoading(false)
    }
  }

  // ========== HANDLE GOOGLE LOGIN ==========
  const handleGoogleLogin = async () => {
    setError('')
    setLoading(true)
    try {
      await loginWithGoogle()
      // Kalau mobile/tunnel → redirect akan reload halaman
      // Kalau desktop → popup, useEffect akan handle redirect
    } catch (err: any) {
      setError(err.message || 'Login dengan Google gagal.')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#06060E] flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-cyan-500 to-violet-500 flex items-center justify-center shadow-lg shadow-cyan-500/20">
            <Icon name="hexagon" className="w-8 h-8 text-white" />
          </div>
          <h1 className="font-display text-2xl font-bold text-white mt-4">KKNT-KP UH</h1>
          <p className="text-white/40 text-sm">Masuk ke Dashboard Admin</p>
        </div>

        {/* Form */}
        <div className="bg-[#080812] border border-white/[0.05] rounded-2xl p-6 sm:p-8">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-white/70 mb-1.5">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-4 py-3 rounded-xl bg-white/[0.03] border border-white/[0.06] text-white placeholder-white/20 focus:outline-none focus:border-cyan-400/40 transition-all"
                placeholder="admin@kkntkp.id"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-white/70 mb-1.5">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full px-4 py-3 rounded-xl bg-white/[0.03] border border-white/[0.06] text-white placeholder-white/20 focus:outline-none focus:border-cyan-400/40 transition-all"
                placeholder="••••••••"
              />
            </div>

            {error && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-cyan-600 to-teal-600 hover:from-cyan-500 hover:to-teal-500 text-white font-medium transition-all shadow-lg shadow-cyan-600/25 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <Icon name="loader" className="w-5 h-5 animate-spin" />
              ) : (
                <Icon name="logIn" className="w-5 h-5" />
              )}
              {loading ? 'Memproses...' : 'Masuk'}
            </button>
          </form>

          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-white/[0.06]" />
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="bg-[#080812] px-3 text-white/30">atau</span>
            </div>
          </div>

          {/* Google Login */}
          <button
            onClick={handleGoogleLogin}
            disabled={loading}
            className="w-full py-3 rounded-xl bg-white/[0.03] border border-white/[0.06] hover:bg-white/[0.06] text-white/70 hover:text-white transition-all flex items-center justify-center gap-3 disabled:opacity-50"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
              <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
              <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
            <span>Masuk dengan Google</span>
          </button>

          <p className="text-center text-xs text-white/25 mt-6">
            Hanya admin yang memiliki akses ke dashboard ini.
          </p>
        </div>
      </div>
    </div>
  )
}