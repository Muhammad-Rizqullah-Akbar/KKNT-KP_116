import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Ambil token indikator dan role dari cookie
  const authToken = request.cookies.get('auth_token')?.value
  const userRole = request.cookies.get('user_role')?.value

  // Check apakah user memiliki akses level admin
  const isAdmin = userRole === 'admin' || userRole === 'super_admin'
  const isSuperAdmin = userRole === 'super_admin'

  // ---------------------------------------------------------------------------
  // 1. REDIRECT DIRECT: /dashboard -> /dashboard/overview
  // ---------------------------------------------------------------------------
  if (pathname === '/dashboard') {
    return NextResponse.redirect(new URL('/dashboard/overview', request.url))
  }

  // ---------------------------------------------------------------------------
  // 2. PROTEKSI KHUSUS ROUTE SUPER ADMIN
  // ---------------------------------------------------------------------------
  if (pathname.startsWith('/dashboard/settings/users')) {
    if (!authToken || !isSuperAdmin) {
      // Jika bukan Super Admin, kembalikan ke overview dashboard
      return NextResponse.redirect(new URL('/dashboard/overview', request.url))
    }
  }

  // ---------------------------------------------------------------------------
  // 3. PROTEKSI AREA DASHBOARD UTAMA
  // ---------------------------------------------------------------------------
  if (pathname.startsWith('/dashboard')) {
    if (!authToken || !isAdmin) {
      // Jika bukan admin/super_admin atau belum login, lempar ke /login
      const loginUrl = new URL('/login', request.url)
      loginUrl.searchParams.set('error', 'unauthorized')
      return NextResponse.redirect(loginUrl)
    }
  }

  // ---------------------------------------------------------------------------
  // 4. PREVENT LOGIN ACCESS: Jika sudah admin, tidak perlu ke /login
  // ---------------------------------------------------------------------------
  if (pathname === '/login' && authToken && isAdmin) {
    return NextResponse.redirect(new URL('/dashboard/overview', request.url))
  }

  return NextResponse.next()
}

// -----------------------------------------------------------------------------
// MATCHER CONFIGURATION
// Hanya jalankan middleware untuk route yang relevan agar efisien
// -----------------------------------------------------------------------------
export const config = {
  matcher: [
    '/dashboard',
    '/dashboard/:path*',
    '/login',
  ],
}