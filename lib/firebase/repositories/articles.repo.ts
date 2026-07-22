import { firestore as db } from '@/lib/firebaseClient'
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

/**
 * Menyimpan artikel baru ke Firestore
 */
export const createArticle = async (data: Omit<ArticleData, 'id'>): Promise<string> => {
  try {
    const docRef = await addDoc(collection(db, COLLECTION_NAME), {
      ...data,
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
    await updateDoc(docRef, {
      ...data,
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