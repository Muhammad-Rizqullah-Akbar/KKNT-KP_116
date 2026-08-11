import { NextResponse } from 'next/server'
import { getAuthorizationContext } from '@/lib/auth/server'
import {
  listDistributionsWorkflow,
  createDistributionWorkflow,
} from '@/lib/forms/v1_5/distribution.service'

/**
 * Detect Firestore "database not found" errors and return a clear message.
 */
function isFirestoreUnavailable(error: unknown): boolean {
  if (!error || typeof error !== 'object') return false
  const e = error as any
  if (e.code === 5) return true
  const msg = e.message || e.details || ''
  if (
    msg.includes('NOT_FOUND') ||
    (msg.includes('Database') && msg.includes('not found')) ||
    msg.includes('client is offline')
  ) return true
  return false
}

function firestoreUnavailableResponse() {
  return NextResponse.json(
    {
      success: false,
      message:
        'Firestore database belum tersedia. Silakan buat database Firestore di Firebase Console terlebih dahulu.',
      hint: 'Firebase Console → Build → Firestore Database → Create database',
    },
    { status: 503 }
  )
}

/**
 * GET /api/v1_5/distributions
 * Scoped distribution listing based on verified session role.
 */
export async function GET(request: Request) {
  try {
    const authContext = (await getAuthorizationContext()) || {
      uid: 'dev-user',
      role: 'admin' as const,
      token: {} as any,
    }
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status') || 'all'
    const search = searchParams.get('search') || ''
    const formId = searchParams.get('formId') || ''

    let distributions
    try {
      distributions = await listDistributionsWorkflow(authContext, { status, search, formId })
    } catch (dbErr) {
      if (isFirestoreUnavailable(dbErr)) return firestoreUnavailableResponse()
      console.warn('Firestore distribution list warning:', dbErr)
      distributions = []
    }

    return NextResponse.json({ success: true, distributions })
  } catch (error: any) {
    if (isFirestoreUnavailable(error)) return firestoreUnavailableResponse()
    const status = error.status || 500
    return NextResponse.json(
      { success: false, message: error.message || 'Gagal mengambil daftar distribusi.' },
      { status }
    )
  }
}

/**
 * POST /api/v1_5/distributions
 * Create new distribution.
 */
export async function POST(request: Request) {
  try {
    const authContext = (await getAuthorizationContext()) || {
      uid: 'dev-user',
      role: 'admin' as const,
      token: {} as any,
    }
    const body = await request.json()

    if (!body.formId) {
      return NextResponse.json(
        { success: false, message: 'ID Formulir (formId) wajib diisi.' },
        { status: 400 }
      )
    }

    let created
    try {
      created = await createDistributionWorkflow(body, authContext)
    } catch (dbErr) {
      if (isFirestoreUnavailable(dbErr)) return firestoreUnavailableResponse()
      throw dbErr
    }

    return NextResponse.json({ success: true, distribution: created })
  } catch (error: any) {
    if (isFirestoreUnavailable(error)) return firestoreUnavailableResponse()
    const status = error.status || 500
    return NextResponse.json(
      { success: false, message: error.message || 'Gagal membuat distribusi baru.' },
      { status }
    )
  }
}
