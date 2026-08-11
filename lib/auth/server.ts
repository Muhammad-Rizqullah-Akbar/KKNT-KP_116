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
  let token: DecodedIdToken

  try {
    token = await adminAuth.verifySessionCookie(session, true)
    uid = token.uid
    email = token.email || ''
  } catch {
    // Fail-closed: invalid, expired, or tampered session cookie MUST NOT yield an authenticated user.
    return null
  }

  if (!uid) return null

  let role: StoredRole | undefined

  // 1. Try reading role from trusted Firestore profile
  try {
    const { safeGetDoc } = await import('@/lib/firebase/repositories/v1_5/safeFirestore')
    const userDoc = await safeGetDoc('users', uid)
    if (userDoc?.data?.role && isStoredRole(userDoc.data.role)) {
      role = userDoc.data.role
    }
  } catch {
    // Ignore Firestore read failure
  }

  // 2. Fallback: Check verified Firebase Auth custom claims
  if (!isStoredRole(role)) {
    try {
      const userRecord = await adminAuth.getUser(uid)
      const customRole = userRecord.customClaims?.role as StoredRole
      if (isStoredRole(customRole)) {
        role = customRole
      }
    } catch {
      // Auth lookup failed
    }
  }

  if (!isStoredRole(role)) return null
  return { uid, role, token }
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
