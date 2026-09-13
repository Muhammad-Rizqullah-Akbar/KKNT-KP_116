import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// ============ RATE LIMITING CONFIGURATION ============
const RATE_LIMIT_WINDOW_MS = 60 * 1000 // 1 minute window
const RATE_LIMIT_MAX_REQUESTS = 100 // Max requests per window

// In-memory store for rate limiting (use Redis in production)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>()

/**
 * Clean up expired rate limit entries
 */
function cleanupRateLimitStore() {
  const now = Date.now()
  for (const [key, value] of rateLimitStore.entries()) {
    if (now > value.resetTime) {
      rateLimitStore.delete(key)
    }
  }
}

/**
 * Check rate limit for an IP address
 */
function checkRateLimit(ip: string): { allowed: boolean; remaining: number; resetIn: number } {
  const now = Date.now()
  const record = rateLimitStore.get(ip)

  if (!record || now > record.resetTime) {
    // New window
    rateLimitStore.set(ip, { count: 1, resetTime: now + RATE_LIMIT_WINDOW_MS })
    cleanupRateLimitStore()
    return { allowed: true, remaining: RATE_LIMIT_MAX_REQUESTS - 1, resetIn: RATE_LIMIT_WINDOW_MS }
  }

  if (record.count >= RATE_LIMIT_MAX_REQUESTS) {
    return { 
      allowed: false, 
      remaining: 0, 
      resetIn: record.resetTime - now 
    }
  }

  record.count++
  return { 
    allowed: true, 
    remaining: RATE_LIMIT_MAX_REQUESTS - record.count, 
    resetIn: record.resetTime - now 
  }
}

/**
 * Get client IP from request
 */
function getClientIP(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for')
  if (forwarded) {
    return forwarded.split(',')[0].trim()
  }
  const realIP = request.headers.get('x-real-ip')
  if (realIP) {
    return realIP
  }
  return '127.0.0.1'
}

// ============ CORS CONFIGURATION ============
const CORS_ORIGINS = process.env.ALLOWED_ORIGINS 
  ? process.env.ALLOWED_ORIGINS.split(',') 
  : ['http://localhost:3000']

function isOriginAllowed(origin: string | null): boolean {
  if (!origin) return true // Allow same-origin requests
  if (CORS_ORIGINS.includes('*')) return true
  return CORS_ORIGINS.some(allowed => 
    allowed.trim() === origin || 
    allowed.trim().endsWith('.vercel.app') // Allow all Vercel preview deployments
  )
}

// ============ SECURITY HEADERS ============
const SECURITY_HEADERS = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'SAMEORIGIN',
  'X-XSS-Protection': '1; mode=block',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'X-DNS-Prefetch-Control': 'on',
  'X-Download-Options': 'noopen',
  'X-Permitted-Cross-Domain-Policies': 'none',
}

// ============ PATHS REQUIRING STRICT RATE LIMITING ============
const SENSITIVE_PATHS = [
  '/api/auth/login',
  '/api/auth/register',
  '/api/v1_5/responses/start',
]

/**
 * Check if path is sensitive (requires stricter rate limiting)
 */
function isSensitivePath(path: string): boolean {
  return SENSITIVE_PATHS.some(p => path.startsWith(p))
}

// ============ PROXY EXPORT (renamed from middleware in Next.js 16+) ============
export function proxy(request: NextRequest) {
  const path = request.nextUrl.pathname
  const ip = getClientIP(request)

  // ============ 1. RATE LIMITING ============
  // Stricter limit for sensitive paths
  const maxRequests = isSensitivePath(path) ? 20 : RATE_LIMIT_MAX_REQUESTS
  const windowMs = isSensitivePath(path) ? 60 * 1000 : RATE_LIMIT_WINDOW_MS
  
  const rateLimitKey = `${ip}:${isSensitivePath(path) ? 'sensitive' : 'normal'}`
  const now = Date.now()
  const record = rateLimitStore.get(rateLimitKey)

  if (!record || now > record.resetTime) {
    rateLimitStore.set(rateLimitKey, { count: 1, resetTime: now + windowMs })
  } else if (record.count >= maxRequests) {
    return NextResponse.json(
      { 
        error: 'Too Many Requests',
        message: 'Rate limit exceeded. Please try again later.',
        retryAfter: Math.ceil((record.resetTime - now) / 1000)
      },
      { 
        status: 429,
        headers: {
          'Retry-After': String(Math.ceil((record.resetTime - now) / 1000)),
          'X-RateLimit-Limit': String(maxRequests),
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': String(record.resetTime),
        }
      }
    )
  } else {
    record.count++
  }

  // ============ 2. CORS CHECK ============
  const origin = request.headers.get('origin')
  if (!isOriginAllowed(origin)) {
    return NextResponse.json(
      { error: 'Forbidden', message: 'Origin not allowed' },
      { status: 403 }
    )
  }

  // ============ 3. AUTHENTICATION FOR DASHBOARD ============
  if (path.startsWith('/dashboard')) {
    const sessionCookie = request.cookies.get('__session')?.value || 
                          request.cookies.get('session')?.value

    if (!sessionCookie) {
      const loginUrl = new URL('/login', request.url)
      loginUrl.searchParams.set('reason', 'expired')
      return NextResponse.redirect(loginUrl)
    }

    if (path === '/dashboard') {
      return NextResponse.redirect(new URL('/dashboard/overview', request.url))
    }
  }

  // ============ 4. SECURITY HEADERS ============
  const response = path.startsWith('/api/') 
    ? NextResponse.next()
    : NextResponse.next()

  // Add security headers to all responses
  Object.entries(SECURITY_HEADERS).forEach(([key, value]) => {
    response.headers.set(key, value)
  })

  // Add rate limit headers
  const currentRecord = rateLimitStore.get(rateLimitKey)
  if (currentRecord) {
    response.headers.set('X-RateLimit-Limit', String(maxRequests))
    response.headers.set('X-RateLimit-Remaining', String(Math.max(0, maxRequests - currentRecord.count)))
    response.headers.set('X-RateLimit-Reset', String(currentRecord.resetTime))
  }

  // Add CSP header for production
  if (process.env.NODE_ENV === 'production') {
    response.headers.set(
      'Content-Security-Policy',
      "default-src 'self'; " +
      "script-src 'self' 'unsafe-inline' 'unsafe-eval'; " +
      "style-src 'self' 'unsafe-inline'; " +
      "img-src 'self' data: https://firebasestorage.googleapis.com https://storage.googleapis.com https://images.unsplash.com https://lh3.googleusercontent.com; " +
      "connect-src 'self' https://*.firebaseio.com https://*.googleapis.com; " +
      "font-src 'self';"
    )
  }

  return response
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/api/:path*',
  ],
}
