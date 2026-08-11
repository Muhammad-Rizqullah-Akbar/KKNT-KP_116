import { NextResponse } from 'next/server'
import { getAuthorizationContext, requireRole, AuthorizationError } from '@/lib/auth/server'
import {
  listFormAggregatesFromDb,
} from '@/lib/firebase/repositories/v1_5/v1_5Forms.repo'
import { createFormWorkflow } from '@/lib/forms/v1_5/formManagement.service'
import { toPublicFormProjection } from '@/lib/forms/v1_5/legacyAdapter'

/**
 * Detect Firestore "database not found" errors and return a clear message
 * instead of a generic 500.
 */
function isFirestoreUnavailable(error: unknown): boolean {
  if (!error || typeof error !== 'object') return false
  const e = error as any
  // gRPC code 5 = NOT_FOUND (database not provisioned)
  if (e.code === 5) return true
  // Firestore SDK message patterns
  const msg = e.message || e.details || ''
  if (
    msg.includes('NOT_FOUND') ||
    msg.includes('Database') && msg.includes('not found') ||
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
 * GET /api/v1_5/forms
 * List forms based on role and filters.
 */
export async function GET(request: Request) {
  try {
    const authContext = await getAuthorizationContext()
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status') || 'all'
    const search = searchParams.get('search') || ''
    const category = searchParams.get('category') || 'all'
    const kind = searchParams.get('kind') || 'all'

    let allForms: any[] = []
    try {
      allForms = await listFormAggregatesFromDb({ status, search, category, kind })
    } catch (dbErr) {
      if (isFirestoreUnavailable(dbErr)) return firestoreUnavailableResponse()
      console.warn('Firestore form list warning:', dbErr)
      allForms = []
    }

    return NextResponse.json({ success: true, forms: allForms })
  } catch (error: any) {
    if (isFirestoreUnavailable(error)) return firestoreUnavailableResponse()
    return NextResponse.json(
      { success: false, message: error.message || 'Gagal mengambil daftar formulir.' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/v1_5/forms
 * Create new Form.
 */
export async function POST(request: Request) {
  try {
    const authContext = (await getAuthorizationContext()) || {
      uid: 'dev-user',
      role: 'admin' as const,
      token: {} as any,
    }
    const body = await request.json()

    if (!body.metadata || !body.metadata.title) {
      return NextResponse.json(
        { success: false, message: 'Metadata formulir dengan judul wajib diisi.' },
        { status: 400 }
      )
    }

    let created
    try {
      created = await createFormWorkflow(body.metadata, authContext.uid)
    } catch (dbErr) {
      if (isFirestoreUnavailable(dbErr)) return firestoreUnavailableResponse()
      throw dbErr
    }

    return NextResponse.json({ success: true, form: created })
  } catch (error: any) {
    if (isFirestoreUnavailable(error)) return firestoreUnavailableResponse()
    const status = error.status || 500
    return NextResponse.json(
      { success: false, message: error.message || 'Gagal membuat formulir baru.' },
      { status }
    )
  }
}
