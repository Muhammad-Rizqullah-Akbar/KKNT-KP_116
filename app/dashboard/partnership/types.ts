// ============ TIPE DATA & KONSTANTA (dibagi antar sub-komponen partnership) ============

export type UserProfile = {
  uid: string
  email: string
  displayName: string
  role: string
  organization?: string
  partnershipType?: string
  phone?: string
  partnershipId?: string
  partnershipName?: string
  createdAt?: string
}

export const PARTNERSHIP_TYPES = [
  { id: 'all', label: 'Semua Jenis Instansi / Mitra' },
  { id: 'Sekolah', label: 'Sekolah / Kampus' },
  { id: 'Kelurahan / Desa', label: 'Kelurahan / Kantor Desa' },
  { id: 'Pasar', label: 'Pasar Tradisional / Modern' },
  { id: 'Puskesmas / Posyandu', label: 'Puskesmas / Posyandu' },
  { id: 'Komunitas / Ormas', label: 'Komunitas / Ormas / PKK' },
  { id: 'Instansi Pemerintah', label: 'Instansi Pemerintah / BPOM' },
  { id: 'Lainnya', label: 'Lainnya' },
]

export type CadreProgressSummary = {
  distCount: number
  respCount: number
  articleCount: number
  articleViews: number
  hasWrittenArticle: boolean
  avgScore: number
  passCount: number
  passRate: number
}

export type MitraProgressSummary = {
  cadreCount: number
  totalDists: number
  totalResponses: number
  totalArticles: number
  totalArticleViews: number
  avgScore: number
  passRate: number
}

export type MitraGroup = {
  mitra: UserProfile
  cadres: UserProfile[]
}

export type CadresByMitraGroup = {
  mitraGroups: MitraGroup[]
  unattachedCadres: UserProfile[]
}
