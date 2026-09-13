/**
 * Safe fetch wrapper that handles non-JSON / HTML error responses gracefully,
 * preventing 'Unexpected token <, <!DOCTYPE ... is not valid JSON' exceptions.
 */
export interface SafeFetchResult<T = any> {
  ok: boolean
  status: number
  data: T | null
  error?: string
}

export async function safeFetchJson<T = any>(
  input: RequestInfo | URL,
  init?: RequestInit
): Promise<SafeFetchResult<T>> {
  try {
    const res = await fetch(input, init)
    const contentType = res.headers.get('content-type') || ''

    if (contentType.includes('application/json')) {
      const data = await res.json().catch(() => null)
      if (data !== null) {
        return {
          ok: res.ok && data?.success !== false,
          status: res.status,
          data,
          error: data?.message,
        }
      }
    }

    const text = await res.text().catch(() => '')
    const isHtml = contentType.includes('text/html') || text.trim().startsWith('<')
    const errorMsg = isHtml
      ? `Server mengembalikan respon HTML (${res.status}). Mohon periksa log server.`
      : text.slice(0, 150) || `HTTP Error ${res.status}`

    return {
      ok: false,
      status: res.status,
      data: null,
      error: errorMsg,
    }
  } catch (err: any) {
    return {
      ok: false,
      status: 0,
      data: null,
      error: err?.message || 'Gagal terhubung ke server.',
    }
  }
}
