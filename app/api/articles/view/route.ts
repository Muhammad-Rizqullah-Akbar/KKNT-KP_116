import { NextResponse } from 'next/server'
import { firestore as db } from '@/lib/firebaseClient'
import { 
  doc, 
  getDoc, 
  runTransaction, 
  serverTimestamp 
} from 'firebase/firestore'
import { createHash } from 'crypto'

/**
 * Helper untuk mengambil IP asli pengunjung di lingkungan Production
 */
function getClientIp(request: Request): string {
  // Check header proxy Vercel / Cloudflare / Nginx
  const cfIp = request.headers.get('cf-connecting-ip')
  const realIp = request.headers.get('x-real-ip')
  const forwardedFor = request.headers.get('x-forwarded-for')

  if (cfIp) return cfIp
  if (realIp) return realIp
  if (forwardedFor) {
    // x-forwarded-for bisa berisi multiple IP "client, proxy1, proxy2"
    return forwardedFor.split(',')[0].trim()
  }

  return '127.0.0.1' // Fallback untuk local development
}

/**
 * Helper untuk membuat Hashed Fingerprint IP yang aman (Privacy Friendly)
 */
function generateIpHash(ip: string, dateStr: string): string {
  // Menggunakan tanggal sebagai salt harian agar hash berubah tiap hari
  return createHash('sha256')
    .update(`${ip}_${dateStr}_aether_secret_salt`)
    .digest('hex')
}

export async function POST(request: Request) {
  try {
    // 1. Parsing Body Request
    const body = await request.json().catch(() => null)
    if (!body || !body.articleId || typeof body.articleId !== 'string') {
      return NextResponse.json(
        { error: 'Valid articleId is required' }, 
        { status: 400 }
      )
    }

    const { articleId } = body
    const clientIp = getClientIp(request)
    const todayStr = new Date().toISOString().split('T')[0] // Format: YYYY-MM-DD
    
    // 2. Buat Hash ID Log unik untuk IP + Artikel + Hari Ini
    const ipHash = generateIpHash(clientIp, todayStr)
    const logId = `${articleId}_${ipHash.substring(0, 24)}_${todayStr}`
    
    const logRef = doc(db, 'view_logs', logId)
    const articleRef = doc(db, 'articles', articleId)

    // 3. Jalankan Firestore Atomic Transaction
    const result = await runTransaction(db, async (transaction) => {
      // Cek apakah log untuk IP ini hari ini sudah ada
      const logDoc = await transaction.get(logRef)
      if (logDoc.exists()) {
        return { recorded: false, reason: 'Already viewed today' }
      }

      // Cek apakah artikel yang dituju benar-benar ada
      const articleDoc = await transaction.get(articleRef)
      if (!articleDoc.exists()) {
        throw new Error('ARTICLE_NOT_FOUND')
      }

      // Catat log view baru
      transaction.set(logRef, {
        articleId,
        ipHash: ipHash.substring(0, 16), // Simpan porsi hash untuk keperluan audit
        userAgent: request.headers.get('user-agent') || 'Unknown',
        createdAt: serverTimestamp(),
        date: todayStr
      })

      // Tambahkan +1 pada total views artikel secara atomic
      const currentViews = articleDoc.data()?.views || 0
      transaction.update(articleRef, {
        views: currentViews + 1,
        updatedAt: serverTimestamp()
      })

      return { recorded: true, newViews: currentViews + 1 }
    })

    if (!result.recorded) {
      return NextResponse.json(
        { success: true, message: result.reason, counted: false }, 
        { status: 200 }
      )
    }

    return NextResponse.json(
      { 
        success: true, 
        message: 'View successfully recorded', 
        counted: true, 
        views: result.newViews 
      }, 
      { status: 200 }
    )

  } catch (error: any) {
    if (error.message === 'ARTICLE_NOT_FOUND') {
      return NextResponse.json(
        { error: 'Article not found' }, 
        { status: 404 }
      )
    }

    console.error('[API /api/articles/view Error]:', error)
    return NextResponse.json(
      { error: 'Internal Server Error' }, 
      { status: 500 }
    )
  }
}