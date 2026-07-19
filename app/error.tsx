'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { Button } from '@/components/shared/Button'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('Error:', error)
  }, [error])

  return (
    <div className="min-h-screen bg-[#06060E] flex items-center justify-center px-6">
      <div className="max-w-md text-center">
        <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-rose-500/20 border border-rose-500/20 flex items-center justify-center">
          <span className="text-4xl">⚠️</span>
        </div>
        <h1 className="font-display text-2xl font-bold text-white mb-2">
          Terjadi Kesalahan
        </h1>
        <p className="text-white/50 text-sm mb-6">
          Maaf, terjadi kesalahan pada sistem. Silakan coba lagi.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button variant="primary" onClick={() => reset()}>
            Coba Lagi
          </Button>
          <Link href="/">
            <Button variant="outline">Kembali ke Beranda</Button>
          </Link>
        </div>
        <p className="text-xs text-white/20 mt-6">
          Error: {error.message || 'Unknown error'}
        </p>
      </div>
    </div>
  )
}