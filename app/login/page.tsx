// app/login/page.tsx
'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Icon } from '@/components/ui/Icons'
import { useAuth } from '@/context/AuthContext'

function LoginFormContent() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [infoMessage, setInfoMessage] = useState('')
  const [loading, setLoading] = useState(false)

  const router = useRouter()
  const searchParams = useSearchParams()
  const { login, isAuthenticated, userRole } = useAuth()

  useEffect(() => {
    const reason = searchParams.get('reason')
    if (reason === 'expired') {
      setInfoMessage('Sesi autentikasi Anda telah berakhir atau tidak valid. Silakan login kembali untuk mengakses Dashboard.')
    } else if (reason === 'unauthorized') {
      setInfoMessage('Akses ditolak: Anda tidak memiliki hak akses untuk halaman tersebut.')
    }
  }, [searchParams])

  // ========== REDIRECT JIKA SUDAH LOGIN ==========
  useEffect(() => {
    if (isAuthenticated) {
      if (userRole === 'partnership') {
        router.push('/dashboard/partnership')
      } else if (userRole === 'cadre') {
        router.push('/dashboard/monitoring')
      } else {
        router.push('/dashboard/overview')
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
      setError(err.message || 'Login gagal. Silakan periksa kembali email dan password Anda.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="w-full max-w-md">
      {/* Logo Header */}
      <div className="text-center mb-8">
        <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-cyan-500 to-violet-500 flex items-center justify-center shadow-lg shadow-cyan-500/20">
          <Icon name="hexagon" className="w-8 h-8 text-white" />
        </div>
        <h1 className="font-display text-2xl font-bold text-white mt-4">KKNT-KP UH</h1>
        <p className="text-white/40 text-sm">Masuk ke Dashboard Admin / Mitra / Kader</p>
      </div>

      {/* Card Form Login */}
      <div className="bg-[#080812] border border-white/[0.05] rounded-2xl p-6 sm:p-8 shadow-2xl">
        {infoMessage && (
          <div className="mb-5 p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs flex items-center gap-2.5 leading-relaxed animate-fadeIn font-sans">
            <Icon name="alertTriangle" className="w-4 h-4 text-amber-400 shrink-0" />
            <span>{infoMessage}</span>
          </div>
        )}

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
              className="w-full px-4 py-3 rounded-xl bg-white/[0.03] border border-white/[0.06] text-white placeholder-white/20 focus:outline-none focus:border-cyan-400/40 transition-all text-sm"
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
              className="w-full px-4 py-3 rounded-xl bg-white/[0.03] border border-white/[0.06] text-white placeholder-white/20 focus:outline-none focus:border-cyan-400/40 transition-all text-sm"
              placeholder="••••••••"
            />
          </div>

          {error && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm flex items-center gap-2 animate-fadeIn">
              <Icon name="alertCircle" className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-cyan-600 to-teal-600 hover:from-cyan-500 hover:to-teal-500 text-white font-medium transition-all shadow-lg shadow-cyan-600/25 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm mt-2"
          >
            {loading ? (
              <>
                <Icon name="spinner" className="w-4 h-4 animate-spin text-white" />
                <span>Memverifikasi...</span>
              </>
            ) : (
              <span>Masuk Ke Dashboard</span>
            )}
          </button>
        </form>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-[#06060E] flex items-center justify-center px-4">
      <Suspense fallback={
        <div className="flex flex-col items-center gap-3 text-white">
          <Icon name="spinner" className="w-8 h-8 text-cyan-400 animate-spin" />
          <p className="text-xs text-white/50">Memuat Halaman Login...</p>
        </div>
      }>
        <LoginFormContent />
      </Suspense>
    </div>
  )
}