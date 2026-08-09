import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

/**
 * Middleware is deliberately not an authorization boundary: Edge middleware
 * does not verify Firebase Admin session cookies. Protected operations must
 * use the server-side RBAC helpers in lib/auth/server.ts.
 */
export function middleware(request: NextRequest) {
  if (request.nextUrl.pathname === '/dashboard') {
    return NextResponse.redirect(new URL('/dashboard/overview', request.url))
  }
  return NextResponse.next()
}

export const config = { matcher: ['/dashboard', '/dashboard/:path*'] }
