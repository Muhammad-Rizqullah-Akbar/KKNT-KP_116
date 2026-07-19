// components/ui/EnvBadge.tsx

'use client'

import { ENV, getEnvName, getEnvColor } from '@/lib/env'

export function EnvBadge() {
  // Tidak tampil di production
  if (ENV.isProduction) return null
  
  const envName = getEnvName()
  const colorClass = getEnvColor()
  
  return (
    <div 
      className={`fixed bottom-4 left-4 z-50 px-3 py-1.5 rounded-full border text-xs font-mono ${colorClass} backdrop-blur-sm`}
    >
      {envName}
    </div>
  )
}