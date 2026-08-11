import { NextResponse } from 'next/server'
import { safeGetDoc, safeSetDoc } from '@/lib/firebase/repositories/v1_5/safeFirestore'

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => null)
    if (!body || !body.articleId || typeof body.articleId !== 'string') {
      return NextResponse.json({ error: 'Valid articleId is required' }, { status: 400 })
    }

    const { articleId } = body
    const articleDoc = await safeGetDoc('articles', articleId)
    if (!articleDoc) {
      return NextResponse.json({ success: true, counted: false, message: 'Article doc not found' }, { status: 200 })
    }

    const currentViews = Number(articleDoc.data.views || 0)
    await safeSetDoc('articles', articleId, {
      ...articleDoc.data,
      views: currentViews + 1,
      updatedAt: new Date().toISOString()
    })

    return NextResponse.json({ success: true, counted: true, views: currentViews + 1 }, { status: 200 })
  } catch (error) {
    console.warn('[API /api/articles/view Graceful Handled]:', error)
    return NextResponse.json({ success: true, counted: false }, { status: 200 })
  }
}
