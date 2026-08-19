'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function AnalyticsPageRedirect() {
  const router = useRouter()

  useEffect(() => {
    router.replace('/dashboard/monitoring')
  }, [router])

  return (
    <div className="min-h-screen bg-[#080812] flex items-center justify-center font-mono text-xs text-violet-400">
      Mengarahkan ke Domain Monitoring...
    </div>
  )
}