/**
 * Helper REST API Boundary untuk Firebase Auth
 * Digunakan sebagai fallback saat Service Account Admin SDK mengalami masalah JWT / clock skew.
 */

export async function restSignUpWithEmail(email: string, password: string, displayName?: string) {
  const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY || process.env.FIREBASE_API_KEY
  if (!apiKey) return null

  try {
    const res = await fetch(
      `https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, displayName, returnSecureToken: true }),
      }
    )
    const data = await res.json()
    if (res.ok && data.localId) {
      return {
        uid: data.localId as string,
        idToken: data.idToken as string,
        refreshToken: data.refreshToken as string,
      }
    } else {
      console.warn('restSignUpWithEmail response warning:', data?.error?.message || data)
    }
  } catch (err) {
    console.warn('restSignUpWithEmail fallback warning:', err)
  }
  return null
}

export async function restSignInWithEmail(email: string, password: string) {
  const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY || process.env.FIREBASE_API_KEY
  if (!apiKey) return null

  try {
    const res = await fetch(
      `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, returnSecureToken: true }),
      }
    )
    const data = await res.json()
    if (res.ok && data.localId) {
      return {
        uid: data.localId as string,
        idToken: data.idToken as string,
        refreshToken: data.refreshToken as string,
      }
    } else {
      console.warn('restSignInWithEmail response warning:', data?.error?.message || data)
    }
  } catch (err) {
    console.warn('restSignInWithEmail fallback warning:', err)
  }
  return null
}
