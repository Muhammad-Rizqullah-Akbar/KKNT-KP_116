'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function PartnershipListPageRedirect() {
  const router = useRouter()

  useEffect(() => {
    router.replace('/dashboard/partnership?tab=mitra')
  }, [router])

  return (
    <div className="min-h-screen bg-[#080812] flex items-center justify-center font-mono text-xs text-cyan-400">
      Mengarahkan ke Domain Kemitraan...
    </div>
  )
}
