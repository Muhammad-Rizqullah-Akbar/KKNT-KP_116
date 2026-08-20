import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname

  // 1. Enforce session cookie check for all /dashboard routes
  if (path.startsWith('/dashboard')) {
    const sessionCookie = request.cookies.get('__session')?.value || request.cookies.get('session')?.value

    if (!sessionCookie) {
      const loginUrl = new URL('/login', request.url)
      loginUrl.searchParams.set('reason', 'expired')
      return NextResponse.redirect(loginUrl)
    }

    if (path === '/dashboard') {
      return NextResponse.redirect(new URL('/dashboard/overview', request.url))
    }
  }

  return NextResponse.next()
}

export const config = { matcher: ['/dashboard', '/dashboard/:path*'] }
