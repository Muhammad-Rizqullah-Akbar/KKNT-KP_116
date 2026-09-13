// ============ TYPES ============

export type GalleryItem = {
  id: number
  title: string
  location: string
  category: string
  gradient: string
  imageUrl?: string
}

export type HeroData = {
  badgeText: string
  titlePrefix: string
  titleGradient: string
  titleSuffix: string
  description: string
  bgImageUrl: string
  statParticipants: string
  statVillages: string
  statPartnerLabel: string
}

export type PartnershipData = {
  kkn: {
    title: string
    description: string
    participants: number
    villages: number
    highlights: string[]
  }
  bpom: {
    title: string
    description: string
    features: string[]
  }
}

// ============ DATA DEFAULT / FALLBACK ============

export const defaultHeroData: HeroData = {
  badgeText: 'Universitas Hasanuddin x BPOM RI',
  titlePrefix: 'Mencetak Kader',
  titleGradient: 'Keamanan Pangan',
  titleSuffix: 'Wilayah Indonesia',
  description: 'Ekosistem terpadu yang menciptakan masyarakat sadar akan keamanan pangan melalui kolaborasi mahasiswa, teknologi, dan mitra strategis.',
  bgImageUrl: '/background.jpg',
  statParticipants: '70+',
  statVillages: '10',
  statPartnerLabel: 'BPOM',
}

export const defaultPartnershipData: PartnershipData = {
  kkn: {
    title: 'Program Kuliah Kerja Nyata Tematik Keamanan Pangan Universitas Hasanuddin',
    description: 'Program Akselerator Terbaik Universitas Hasanuddin untuk Meningkatkan Wawasan dan Pengalaman Bekerja serta meningkatkan kualitas kinerja Mahasiswa',
    participants: 70,
    villages: 10,
    highlights: [
      'Bimbingan rencana program kerja',
      'Mentorship 1-on-1 dengan Dosen Pendamping',
      'Upgrading dengan Pembekalan Umum'
    ]
  },
  bpom: {
    title: 'Badan Pengawas Obat dan Makanan',
    description: 'BPOM Berkolaborasi dengan kampus-kampus pada program Kuliah Kerja Nyata dalam rangka Membangun Desa yang Sadar akan Keamanan Pangan',
    features: [
      'Mentorship 1-on-1 dengan Mentor dari BPOM',
      'Akses Modul Pembelajaran tentang Keamanan Pangan dan lainnya',
      'Sertifikat dari BPOM'
    ]
  }
}

export const defaultGalleryData: GalleryItem[] = [
  { id: 1, title: 'Sosialisasi Keamanan Pangan', location: 'Desa Bontoatu', category: 'Sosialisasi', gradient: 'from-amber-700/40 via-orange-800/30 to-rose-900/40', imageUrl: '' },
  { id: 2, title: 'Edukasi UMKM Olahan Pangan', location: 'Makassar', category: 'Workshop', gradient: 'from-violet-700/40 via-purple-800/30 to-indigo-900/40', imageUrl: '' },
]

export const gradientOptions = [
  'from-amber-700/40 via-orange-800/30 to-rose-900/40',
  'from-violet-700/40 via-purple-800/30 to-indigo-900/40',
  'from-cyan-700/40 via-teal-800/30 to-emerald-900/40',
  'from-rose-700/40 via-pink-800/30 to-fuchsia-900/40',
  'from-lime-700/40 via-green-800/30 to-teal-900/40',
  'from-sky-700/40 via-blue-800/30 to-cyan-900/40',
  'from-fuchsia-700/40 via-purple-800/30 to-violet-900/40',
  'from-orange-700/40 via-amber-800/30 to-yellow-900/40',
]
