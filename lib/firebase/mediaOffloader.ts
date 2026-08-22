import 'server-only'

import fs from 'fs'
import path from 'path'
import crypto from 'crypto'
import { getStorage } from 'firebase-admin/storage'
import { adminApp } from '@/lib/firebaseAdmin'

/**
 * Saves a base64 Data URL (data:image/...;base64,...) to Firebase Storage or local disk public/uploads.
 * Returns a clean, short web-accessible URL (e.g. /uploads/media_xxx.png or Firebase Storage URL).
 */
export async function saveBase64MediaToFileOrStorage(
  base64DataUrl: string,
  prefix: string = 'media'
): Promise<string> {
  if (!base64DataUrl || typeof base64DataUrl !== 'string' || !base64DataUrl.startsWith('data:')) {
    return base64DataUrl
  }

  const matches = base64DataUrl.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/)
  if (!matches || matches.length !== 3) {
    return base64DataUrl
  }

  const mimeType = matches[1]
  const base64Data = matches[2]
  const buffer = Buffer.from(base64Data, 'base64')

  // Generate clean filename
  let ext = mimeType.split('/')[1] || 'png'
  if (ext === 'jpeg') ext = 'jpg'
  if (ext.includes('+')) ext = ext.split('+')[0]
  const cleanPrefix = prefix.replace(/[^a-zA-Z0-9_]/g, '_').substring(0, 30)
  const hash = crypto.createHash('md5').update(buffer).digest('hex').substring(0, 8)
  const fileName = `${cleanPrefix}_${Date.now()}_${hash}.${ext}`

  // 1. Try Firebase Admin Storage if configured
  try {
    const bucket = getStorage(adminApp).bucket()
    if (bucket && bucket.name) {
      const storagePath = `forms/media/${fileName}`
      const fileRef = bucket.file(storagePath)
      await fileRef.save(buffer, {
        metadata: { contentType: mimeType },
        public: true,
      })
      try {
        await fileRef.makePublic()
      } catch (e) {
        // bucket might already have uniform access
      }
      return `https://storage.googleapis.com/${bucket.name}/${storagePath}`
    }
  } catch (storageErr) {
    // Firebase Storage unconfigured or not available, fallback to local public/uploads
  }

  // 2. On serverless hosting (e.g. Vercel) where local disk writes to public/uploads do not persist:
  // Return the base64 Data URL directly if Cloud Storage is unconfigured so image is 100% visible on Vercel
  if (process.env.VERCEL || process.env.NEXT_PUBLIC_VERCEL_ENV) {
    return base64DataUrl
  }

  // 3. Fallback: Save to public/uploads directory in Next.js (Local Development)
  try {
    const uploadsDir = path.join(process.cwd(), 'public', 'uploads')
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true })
    }
    const filePath = path.join(uploadsDir, fileName)
    fs.writeFileSync(filePath, buffer)
    return `/uploads/${fileName}`
  } catch (fsErr) {
    console.error('[mediaOffloader] Local file write failed:', fsErr)
    return base64DataUrl
  }
}

/**
 * Recursively scans any object or array, offloading all base64 data URLs to disk/storage.
 */
export async function recursivelyOffloadBase64Media<T>(data: T, prefix: string = 'media'): Promise<T> {
  if (data === null || data === undefined) return data

  if (typeof data === 'string') {
    if (data.startsWith('data:image/') || data.startsWith('data:application/')) {
      return (await saveBase64MediaToFileOrStorage(data, prefix)) as unknown as T
    }
    return data
  }

  if (Array.isArray(data)) {
    const processedArray = await Promise.all(
      data.map((item, idx) => recursivelyOffloadBase64Media(item, `${prefix}_${idx}`))
    )
    return processedArray as unknown as T
  }

  if (typeof data === 'object') {
    const obj = data as Record<string, any>
    const result: Record<string, any> = {}
    for (const [key, value] of Object.entries(obj)) {
      result[key] = await recursivelyOffloadBase64Media(value, `${prefix}_${key}`)
    }
    return result as T
  }

  return data
}
