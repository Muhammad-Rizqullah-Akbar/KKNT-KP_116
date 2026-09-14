import { NextRequest, NextResponse } from 'next/server'
import { getDistributionByCodeDoc } from '@/lib/repositories/distributions.repo'

/**
 * GET /api/public/check-availability?code=XXXXX
 *
 * Server-side validation untuk artikel → form access.
 * Mengecek apakah kode distribusi/form:
 *   1. ADA (exist)
 *   2. DIBUKA (status active, tidak paused/expired/archived)
 *
 * Return ringan (boolean + status), TANPA resolve full form projection.
 * Dipakai oleh halaman artikel untuk memutuskan apakah banner pretest/posttest
 * ditampilkan atau disembunyikan SEBELUM user menekan tombol.
 */
export async function GET(request: NextRequest) {
  try {
    const code = request.nextUrl.searchParams.get('code')?.trim().toUpperCase()
    if (!code) {
      return NextResponse.json({ success: false, available: false, message: 'Kode wajib diisi' }, { status: 400 })
    }

    const dist = await getDistributionByCodeDoc(code)

    if (!dist) {
      return NextResponse.json({
        success: true,
        available: false,
        reason: 'not_found',
        message: 'Formulir tidak ditemukan.',
      })
    }

    // Dynamic expiration check
    let status = dist.status
    if (dist.expiresAt && new Date() > new Date(dist.expiresAt)) {
      status = 'expired'
    }

    const available = status === 'active'

    return NextResponse.json({
      success: true,
      available,
      reason: available ? 'open' : status,
      message: available
        ? 'Formulir tersedia.'
        : status === 'expired'
        ? 'Masa berlaku formulir telah berakhir.'
        : status === 'paused'
        ? 'Formulir sedang dijeda.'
        : 'Formulir tidak tersedia untuk diakses.',
    })
  } catch (error: any) {
    return NextResponse.json(
      { success: false, available: false, reason: 'error', message: error.message || 'Gagal memvalidasi kode.' },
      { status: 500 }
    )
  }
}
