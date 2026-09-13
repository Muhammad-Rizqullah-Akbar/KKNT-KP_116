import { firestore as db } from '@/lib/infra/firebase-client'
import { 
  collection, 
  getDocs, 
  doc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  orderBy, 
  serverTimestamp,
  increment
} from 'firebase/firestore'

// Nama koleksi di Firestore
const COLLECTION_NAME = 'articles'

// Tipe data artikel untuk Repository & UI
export interface ArticleData {
  id?: string
  title: string
  slug: string
  author: string
  authorUid?: string
  authorId?: string
  createdBy?: string
  authorRole?: string
  authorOrganization?: string
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
  gallery: { id: string; url?: string; caption: string; gradient: string }[]
  embeddedDistributionCode?: string
  pretestCode?: string   // Kode / Form Pretest (Diletakkan di ATAS artikel)
  posttestCode?: string  // Kode / Form Posttest (Diletakkan di PALING BAWAH artikel)
  createdAt?: any
  updatedAt?: any
}

/**
 * Mengambil semua artikel dari Firestore
 * Diurutkan berdasarkan waktu pembuatan (terbaru di atas)
 */
export const getArticles = async (): Promise<ArticleData[]> => {
  try {
    const q = query(
      collection(db, COLLECTION_NAME),
      orderBy('createdAt', 'desc')
    )
    
    const querySnapshot = await getDocs(q)
    const articles: ArticleData[] = []
    
    querySnapshot.forEach((doc) => {
      articles.push({ id: doc.id, ...doc.data() } as ArticleData)
    })
    
    return articles
  } catch (error) {
    console.error('Error fetching articles from Firestore:', error)
    throw new Error('Gagal mengambil data artikel')
  }
}

const CATEGORY_PALETTES = [
  { badge: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20', gradient: 'from-emerald-700/40 to-cyan-800/40', icon: 'shieldCheck' },
  { badge: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20', gradient: 'from-cyan-700/40 to-blue-800/40', icon: 'cpu' },
  { badge: 'text-purple-400 bg-purple-500/10 border-purple-500/20', gradient: 'from-purple-700/40 to-indigo-800/40', icon: 'bookOpen' },
  { badge: 'text-amber-400 bg-amber-500/10 border-amber-500/20', gradient: 'from-amber-700/40 to-orange-800/40', icon: 'sparkles' },
  { badge: 'text-rose-400 bg-rose-500/10 border-rose-500/20', gradient: 'from-rose-700/40 to-pink-800/40', icon: 'bell' },
  { badge: 'text-sky-400 bg-sky-500/10 border-sky-500/20', gradient: 'from-sky-700/40 to-teal-800/40', icon: 'barChart' },
]

export const getCategoryStyle = (categoryName: string) => {
  if (!categoryName) return CATEGORY_PALETTES[0]
  let hash = 0
  for (let i = 0; i < categoryName.length; i++) {
    hash = categoryName.charCodeAt(i) + ((hash << 5) - hash)
  }
  const index = Math.abs(hash) % CATEGORY_PALETTES.length
  return CATEGORY_PALETTES[index]
}

const sanitizeArticleData = (data: Record<string, any>): Record<string, any> => {
  const sanitized: Record<string, any> = {}
  Object.keys(data).forEach((key) => {
    if (data[key] !== undefined) {
      sanitized[key] = data[key]
    } else {
      sanitized[key] = ''
    }
  })
  return sanitized
}

/**
 * Menyimpan artikel baru ke Firestore
 */
export const createArticle = async (data: Omit<ArticleData, 'id'>): Promise<string> => {
  try {
    const sanitizedPayload = sanitizeArticleData(data)
    const docRef = await addDoc(collection(db, COLLECTION_NAME), {
      ...sanitizedPayload,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    })
    
    return docRef.id
  } catch (error) {
    console.error('Error creating article in Firestore:', error)
    throw new Error('Gagal menyimpan artikel baru')
  }
}

/**
 * Memperbarui artikel yang sudah ada di Firestore berdasarkan ID
 */
export const updateArticle = async (id: string, data: Partial<ArticleData>): Promise<void> => {
  try {
    const docRef = doc(db, COLLECTION_NAME, id)
    const sanitizedPayload = sanitizeArticleData(data)
    await updateDoc(docRef, {
      ...sanitizedPayload,
      updatedAt: serverTimestamp()
    })
  } catch (error) {
    console.error(`Error updating article ${id} in Firestore:`, error)
    throw new Error('Gagal memperbarui artikel')
  }
}

/**
 * Menghapus artikel secara permanen dari Firestore berdasarkan ID
 */
export const deleteArticle = async (id: string): Promise<void> => {
  try {
    const docRef = doc(db, COLLECTION_NAME, id)
    await deleteDoc(docRef)
  } catch (error) {
    console.error(`Error deleting article ${id} from Firestore:`, error)
    throw new Error('Gagal menghapus artikel')
  }
}

/**
 * Menambahkan +1 jumlah views artikel di Firestore saat dibaca pengunjung
 */
export const incrementArticleViews = async (id: string): Promise<void> => {
  try {
    const docRef = doc(db, COLLECTION_NAME, id)
    await updateDoc(docRef, {
      views: increment(1)
    })
  } catch (error) {
    console.error(`Error incrementing views for article ${id}:`, error)
  }
}