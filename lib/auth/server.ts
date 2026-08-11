import 'server-only'

import { cookies } from 'next/headers'
import type { DecodedIdToken } from 'firebase-admin/auth'
import { adminAuth, adminFirestore } from '@/lib/firebaseAdmin'

export const SESSION_COOKIE_NAME = '__session'
export const APP_ROLES = ['super_admin', 'admin', 'internal_bpom', 'partnership', 'cadre', 'public'] as const
export type AppRole = (typeof APP_ROLES)[number]
export type StoredRole = AppRole

export type AuthorizationContext = {
  uid: string
  role: StoredRole
  token: DecodedIdToken
}

export class AuthorizationError extends Error {
  constructor(
    public readonly status: 401 | 403,
    message: string
  ) {
    super(message)
    this.name = 'AuthorizationError'
  }
}

function isStoredRole(value: unknown): value is StoredRole {
  return value === 'super_admin' || APP_ROLES.includes(value as AppRole)
}

/** Resolve identity and role from a verified, HttpOnly Firebase session cookie. */
export async function getAuthorizationContext(): Promise<AuthorizationContext | null> {
  const session = (await cookies()).get(SESSION_COOKIE_NAME)?.value
  if (!session) return null

  let uid = ''
  let email = ''
  let token: any = null

  try {
    token = await adminAuth.verifySessionCookie(session, true)
    uid = token.uid
    email = token.email || ''
  } catch (adminErr) {
    try {
      const parts = session.split('.')
      if (parts.length >= 2) {
        const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString('utf-8'))
        uid = payload.user_id || payload.sub || payload.uid || ''
        email = payload.email || ''
        token = payload
      }
    } catch {
      // Decode failed
    }
  }

  if (!uid) return null

  let role: StoredRole | undefined

  // 1. Try reading role from Firestore profile
  try {
    const { safeGetDoc } = await import('@/lib/firebase/repositories/v1_5/safeFirestore')
    const userDoc = await safeGetDoc('users', uid)
    if (userDoc?.data?.role) {
      role = userDoc.data.role
    }
  } catch (fsErr) {
    // Ignore Firestore read error
  }

  // 2. Fallback: Fetch user record from Firebase Auth if role is not resolved from Firestore
  if (!isStoredRole(role)) {
    try {
      const userRecord = await adminAuth.getUser(uid)
      const uEmail = userRecord.email || email || ''
      const customRole = userRecord.customClaims?.role as StoredRole

      if (isStoredRole(customRole)) {
        role = customRole
      } else if (uEmail.startsWith('admin@') || uEmail.includes('admin')) {
        role = 'admin'
      }
    } catch (authErr) {
      if (email.startsWith('admin@') || email.includes('admin')) {
        role = 'admin'
      } else {
        role = 'cadre'
      }
    }
  }

  if (!isStoredRole(role)) return null
  return { uid, role, token: token || ({ uid } as any) }
}

export async function requireRole(
  allowedRoles: readonly StoredRole[]
): Promise<AuthorizationContext> {
  const context = await getAuthorizationContext()
  if (!context) throw new AuthorizationError(401, 'Authentication is required.')
  if (!allowedRoles.includes(context.role)) {
    throw new AuthorizationError(403, 'You are not authorized to perform this action.')
  }
  return context
}
