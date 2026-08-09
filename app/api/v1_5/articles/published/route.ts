import { NextResponse } from 'next/server'
import { adminFirestore } from '@/lib/firebaseAdmin'

/**
 * GET /api/v1_5/articles/published
 * Returns list of published articles for recommendation mapping selector.
 */
export async function GET() {
  try {
    const snapshot = await adminFirestore
      .collection('articles')
      .where('status', 'in', ['Published', 'published'])
      .get()

    const articles = snapshot.docs.map((doc) => {
      const data = doc.data()
      return {
        id: doc.id,
        title: data.title || 'Artikel Tanpa Judul',
        slug: data.slug || doc.id,
        category: data.category || 'Edukasi',
        status: 'published',
        date: data.date || data.createdAt || '',
      }
    })

    return NextResponse.json({ success: true, articles })
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || 'Gagal memuat artikel terpublikasi.' },
      { status: 500 }
    )
  }
}
