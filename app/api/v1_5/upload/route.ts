import { NextResponse } from 'next/server'
import { getAuthorizationContext } from '@/lib/auth/server'

/**
 * POST /api/v1_5/upload
 * Handles media / image upload for question attachments.
 */
export async function POST(request: Request) {
  try {
    const authContext = await getAuthorizationContext()
    if (!authContext) {
      return NextResponse.json({ success: false, message: 'Otentikasi diperlukan untuk mengunggah media.' }, { status: 401 })
    }

    const formData = await request.formData()
    const file = formData.get('file') as File | null

    if (!file) {
      return NextResponse.json({ success: false, message: 'File gambar tidak ditemukan.' }, { status: 400 })
    }

    // Convert file to base64 Data URL for local persistence/preview
    const buffer = Buffer.from(await file.arrayBuffer())
    const mimeType = file.type || 'image/png'
    const dataUrl = `data:${mimeType};base64,${buffer.toString('base64')}`

    return NextResponse.json({
      success: true,
      message: 'Gambar berhasil diunggah.',
      url: dataUrl,
      fileName: file.name,
    })
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || 'Gagal mengunggah gambar.' },
      { status: 500 }
    )
  }
}
