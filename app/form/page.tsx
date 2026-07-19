// app/form/page.tsx
'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function FormRedirectPage() {
  const router = useRouter()

  useEffect(() => {
    // Cek apakah ada kode di localStorage (fallback)
    const code = localStorage.getItem('aether_access_code')
    if (code) {
      router.push(`/form/${code}`)
    } else {
      router.push('/')
    }
  }, [router])

  return (
    <div className="min-h-screen bg-[#06060E] flex items-center justify-center">
      <div className="text-center">
        <div className="w-10 h-10 border-4 border-cyan-500/30 border-t-cyan-500 rounded-full animate-spin mx-auto mb-4" />
        <p className="text-white/40">Mengarahkan...</p>
      </div>
    </div>
  )
}