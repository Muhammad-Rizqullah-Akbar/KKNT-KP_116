/**
 * SMART ARTICLE PARSER — shared types & constants.
 */

export interface ArticleBlock {
  id: string
  type: 'p' | 'h2' | 'quote' | 'list' | 'image'
  value: string
  quoteAuthor?: string
  imageUrl?: string
  imageCaption?: string
}

export interface ArticleGalleryItem {
  id: string
  url?: string
  caption: string
  gradient?: string
}

export interface ParsedArticle {
  title: string
  category: string
  author: string
  authorBio: string
  status: 'Draft' | 'Published'
  readTime: number
  excerpt: string
  tags: string[]
  embeddedDistributionCode: string
  featuredImage: string
  blocks: ArticleBlock[]
  gallery: ArticleGalleryItem[]
  detectedMarkers?: {
    key: string
    label: string
    targetType: 'featured' | 'block' | 'gallery'
    blockId?: string
    galleryId?: string
  }[]
  sourceType: 'raw_text' | 'markdown' | 'json'
  wordCount: number
}

export const DEFAULT_GRADIENTS = [
  'from-amber-700/40 via-orange-800/30 to-rose-900/40',
  'from-violet-700/40 via-purple-800/30 to-indigo-900/40',
  'from-cyan-700/40 via-teal-800/30 to-emerald-900/40',
  'from-rose-700/40 via-pink-800/30 to-fuchsia-900/40',
  'from-lime-700/40 via-green-800/30 to-teal-900/40',
  'from-sky-700/40 via-blue-800/30 to-cyan-900/40',
]
