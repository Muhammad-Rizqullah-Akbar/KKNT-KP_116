import 'server-only'

import { cookies } from 'next/headers'
import type { DecodedIdToken } from 'firebase-admin/auth'
import { adminAuth, adminFirestore } from '@/lib/firebaseAdmin'

export const SESSION_COOKIE_NAME = '__session'
export const APP_ROLES = ['admin', 'partnership', 'cadre', 'public'] as const
export type AppRole = (typeof APP_ROLES)[number]
export type StoredRole = AppRole | 'super_admin'

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

  try {
    const token = await adminAuth.verifySessionCookie(session, true)
    let role: StoredRole | undefined

    // 1. Try reading role from Firestore profile
    try {
      const userSnapshot = await adminFirestore.collection('users').doc(token.uid).get()
      if (userSnapshot.exists) {
        role = userSnapshot.data()?.role
      }
    } catch (fsErr) {
      // Ignore Firestore 5 NOT_FOUND / read error, proceed to Admin Auth fallback
    }

    // 2. Fallback: Fetch user record from Firebase Auth if role is not resolved from Firestore
    if (!isStoredRole(role)) {
      try {
        const userRecord = await adminAuth.getUser(token.uid)
        const email = userRecord.email || token.email || ''
        const customRole = userRecord.customClaims?.role as StoredRole

        if (isStoredRole(customRole)) {
          role = customRole
        } else if (email.startsWith('admin@') || email.includes('admin')) {
          role = 'admin'
        }
      } catch (authErr) {
        console.warn('Firebase Auth getUser fallback warning:', authErr)
      }
    }

    if (!isStoredRole(role)) return null
    return { uid: token.uid, role, token }
  } catch {
    return null
  }
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
