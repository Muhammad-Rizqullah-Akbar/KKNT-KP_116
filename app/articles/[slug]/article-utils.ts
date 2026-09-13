// ============ UTILITY ============

export const shuffleArray = <T,>(array: T[]): T[] => {
  const shuffled = [...array]
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }
  return shuffled
}

export type HeadingItem = {
  id: string
  text: string
}

export type LightboxImage = {
  id: string
  url?: string
  caption: string
  gradient?: string
}

export const formatDate = (dateStr: string) => dateStr ? new Date(dateStr).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }) : ''

export const formatViews = (views: number) => views >= 1000 ? `${(views / 1000).toFixed(1)}K` : (views || 0).toString()
