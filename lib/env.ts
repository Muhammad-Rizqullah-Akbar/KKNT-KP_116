// lib/firebase/env.ts

/**
 * Environment detection utility
 * Digunakan untuk mengetahui apakah aplikasi berjalan di emulator,
 * development, staging, atau production
 */

export const ENV = {
  // Apakah menggunakan emulator?
  isEmulator: process.env.NEXT_PUBLIC_USE_EMULATOR === 'true',
  
  // Apakah di development (next dev)?
  isDevelopment: process.env.NODE_ENV === 'development',
  
  // Apakah di production (next build + start)?
  isProduction: process.env.NODE_ENV === 'production',
  
  // Apakah di Vercel Preview (staging)?
  isPreview: process.env.NEXT_PUBLIC_VERCEL_ENV === 'preview',
  
  // Apakah di Vercel (production atau preview)?
  isDeployed: !!process.env.NEXT_PUBLIC_VERCEL_ENV,
}

/**
 * Mendapatkan nama environment yang readable
 * @returns {string} Nama environment dengan emoji
 */
export const getEnvName = (): string => {
  if (ENV.isEmulator) return '🔧 Emulator'
  if (ENV.isDeployed && ENV.isProduction) return '🚀 Production'
  if (ENV.isDeployed) return '📦 Preview / Staging'
  return '💻 Local Development'
}

/**
 * Mendapatkan warna untuk badge environment
 * @returns {string} Tailwind color class
 */
export const getEnvColor = (): string => {
  if (ENV.isEmulator) return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/20'
  if (ENV.isDeployed && ENV.isProduction) return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/20'
  if (ENV.isDeployed) return 'bg-blue-500/20 text-blue-400 border-blue-500/20'
  return 'bg-gray-500/20 text-gray-400 border-gray-500/20'
}

/**
 * Log environment info ke console (hanya di development)
 */
export const logEnvInfo = (): void => {
  if (!ENV.isProduction) {
    console.log('📦 ===== ENVIRONMENT INFO =====')
    console.log(`📦 Environment: ${getEnvName()}`)
    console.log(`📦 isEmulator: ${ENV.isEmulator}`)
    console.log(`📦 isDevelopment: ${ENV.isDevelopment}`)
    console.log(`📦 isProduction: ${ENV.isProduction}`)
    console.log(`📦 isDeployed: ${ENV.isDeployed}`)
    console.log('📦 ============================')
  }
}