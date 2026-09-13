// ============ TIPE DATA & KONSTANTA (dibagi antar sub-komponen articles) ============

export type GalleryImage = { id: string; url?: string; caption: string; gradient: string }

export type ContentBlock = {
  id: string
  type: 'p' | 'h2' | 'quote' | 'list' | 'image'
  value: string
  quoteAuthor?: string
  imageUrl?: string
  imageCaption?: string
}

export type Article = {
  id?: string
  title: string
  slug: string
  author: string
  authorBio: string
  category: string
  status: 'Draft' | 'Published'
  views: number
  date: string
  readTime: number
  excerpt: string
  content: string
  featuredImage: string
  tags: string[]
  gallery: GalleryImage[]
  embeddedDistributionCode?: string
  pretestCode?: string
  posttestCode?: string
}

export type MediaItem = { name: string; url: string }

export type AvailableForm = { id: string; code: string; title: string }

export type DetectedMarker = {
  key: string
  label: string
  targetType: 'featured' | 'block' | 'gallery'
  blockId?: string
  galleryId?: string
  file?: File | null
  uploadedUrl?: string
}

export type ArticleFormData = {
  title: string
  category: string
  author: string
  authorBio: string
  status: 'Draft' | 'Published'
  readTime: number
  featuredImage: string
  excerpt: string
  tags: string
  embeddedDistributionCode: string
  pretestCode: string
  posttestCode: string
  gallery: GalleryImage[]
  blocks: ContentBlock[]
}

export const categoryColors: Record<string, string> = {
  Teknologi: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
  Bisnis: 'text-rose-400 bg-rose-500/10 border-rose-500/20',
  Karir: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
  Data: 'text-sky-400 bg-sky-500/10 border-sky-500/20',
}

export const categoryGradients: Record<string, string> = {
  Teknologi: 'from-emerald-700/40 to-cyan-800/40',
  Bisnis: 'from-rose-700/40 to-pink-800/40',
  Karir: 'from-amber-700/40 to-orange-800/40',
  Data: 'from-sky-700/40 to-blue-800/40',
}

export const statusColors: Record<string, string> = {
  Published: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
  Draft: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
}

export const categoryOptions = ['Semua Kategori', 'Teknologi', 'Bisnis', 'Karir', 'Data']
export const statusOptions = ['Semua Status', 'Published', 'Draft']

export const galleryGradients = [
  'from-cyan-700/50 to-emerald-800/50',
  'from-violet-700/50 to-purple-800/50',
  'from-amber-700/50 to-orange-800/50',
  'from-rose-700/50 to-pink-800/50',
]

export const formatViews = (views: number) =>
  views >= 1000 ? `${(views / 1000).toFixed(1)}K` : views.toString()

export const formatDate = (dateStr: string) =>
  dateStr
    ? new Date(dateStr).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })
    : ''
