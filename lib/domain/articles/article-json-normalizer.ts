import type { ParsedArticle, ArticleBlock, ArticleGalleryItem } from './article-types'
import { DEFAULT_GRADIENTS } from './article-types'
import { inferCategoryFromContent } from './article-category'

/**
 * Normalizes existing JSON structure into clean ParsedArticle format
 */
export function normalizeJsonToArticle(
  json: any,
  defaults?: { defaultAuthor?: string; defaultBio?: string }
): ParsedArticle {
  const title = String(json.title || 'Artikel Edukasi').trim()
  const category = String(json.category || inferCategoryFromContent(title + ' ' + (json.content || ''))).trim()
  const author = String(json.author || defaults?.defaultAuthor || 'Penulis KKPD-KP').trim()
  const authorBio = String(json.authorBio || defaults?.defaultBio || 'Kader Edukator Keamanan Pangan').trim()
  const status = json.status === 'Published' ? 'Published' : 'Draft'
  const readTime = Number(json.readTime) || 5
  const excerpt = String(json.excerpt || '').trim()
  const embeddedDistributionCode = String(json.embeddedDistributionCode || '').trim().toUpperCase()
  const featuredImage = String(json.featuredImage || '').trim()

  let tags: string[] = []
  if (Array.isArray(json.tags)) {
    tags = json.tags.map((t: any) => String(t).replace(/^#/, '').trim()).filter(Boolean)
  } else if (typeof json.tags === 'string') {
    tags = json.tags.split(/[,;#]+/).map((t: string) => t.trim().replace(/^#/, '')).filter(Boolean)
  }

  const blocks: ArticleBlock[] = []
  if (Array.isArray(json.blocks)) {
    json.blocks.forEach((b: any, idx: number) => {
      const validTypes = ['p', 'h2', 'quote', 'list', 'image']
      blocks.push({
        id: b.id || `b_${Date.now()}_${idx}`,
        type: validTypes.includes(b.type) ? b.type : 'p',
        value: String(b.value || ''),
        quoteAuthor: b.quoteAuthor ? String(b.quoteAuthor) : undefined,
        imageUrl: b.imageUrl ? String(b.imageUrl) : undefined,
        imageCaption: b.imageCaption ? String(b.imageCaption) : undefined,
      })
    })
  } else if (json.content && typeof json.content === 'string') {
    // If raw HTML content provided
    blocks.push(
      { id: 'b1', type: 'h2', value: '1. Pendahuluan' },
      { id: 'b2', type: 'p', value: json.content.replace(/<[^>]*>?/gm, '') }
    )
  } else {
    blocks.push({ id: 'b1', type: 'p', value: 'Isi materi edukasi...' })
  }

  const gallery: ArticleGalleryItem[] = []
  if (Array.isArray(json.gallery)) {
    json.gallery.forEach((g: any, idx: number) => {
      gallery.push({
        id: g.id || `g_${Date.now()}_${idx}`,
        url: g.url ? String(g.url) : '',
        caption: String(g.caption || `Dokumentasi Foto ${idx + 1}`),
        gradient: g.gradient || DEFAULT_GRADIENTS[idx % DEFAULT_GRADIENTS.length],
      })
    })
  }

  // Scan markers
  const detectedMarkers: ParsedArticle['detectedMarkers'] = []
  if (featuredImage && (featuredImage.startsWith('MARK:') || featuredImage === 'MARK')) {
    detectedMarkers.push({
      key: featuredImage,
      label: `Foto Utama Banner (${featuredImage})`,
      targetType: 'featured',
    })
  }
  blocks.forEach((b, idx) => {
    if (b.imageUrl && (b.imageUrl.startsWith('MARK:') || b.imageUrl === 'MARK')) {
      detectedMarkers.push({
        key: b.imageUrl,
        label: `Gambar Blok #${idx + 1} (${b.imageCaption || b.imageUrl})`,
        targetType: 'block',
        blockId: b.id,
      })
    }
  })
  gallery.forEach((g, idx) => {
    if (g.url && (g.url.startsWith('MARK:') || g.url === 'MARK')) {
      detectedMarkers.push({
        key: g.url,
        label: `Foto Galeri #${idx + 1} (${g.caption || g.url})`,
        targetType: 'gallery',
        galleryId: g.id,
      })
    }
  })

  return {
    title,
    category,
    author,
    authorBio,
    status,
    readTime,
    excerpt,
    tags,
    embeddedDistributionCode,
    featuredImage,
    blocks,
    gallery,
    detectedMarkers,
    sourceType: 'json',
    wordCount: blocks.reduce((sum, b) => sum + b.value.split(/\s+/).filter(Boolean).length, 0),
  }
}
