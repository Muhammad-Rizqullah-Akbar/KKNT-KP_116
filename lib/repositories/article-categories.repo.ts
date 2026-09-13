import { firestore as db } from '@/lib/infra/firebase-client'
import { collection, getDocs, addDoc, serverTimestamp } from 'firebase/firestore'
import type { ArticleCategory } from '@/lib/schemas'

/**
 * article-categories.repo.ts — akses koleksi `article_categories` (1 koleksi = 1 repo).
 */

const CATEGORY_COLLECTION = 'article_categories'

export type { ArticleCategory }

const DEFAULT_CATEGORIES = [
  { name: 'Keamanan Pangan', description: 'Edukasi standar higiene & sampel pangan' },
  { name: 'Edukasi', description: 'Materi sosialisasi & penyuluhan lapangan' },
  { name: 'Regulasi', description: 'Aturan & perundang-undangan kesehatan' },
  { name: 'Tips & Trik', description: 'Panduan praktis pengolahan pangan' },
]

/** List kategori artikel (fallback seed default bila kosong). */
export async function getArticleCategories(): Promise<ArticleCategory[]> {
  try {
    const snap = await getDocs(collection(db, CATEGORY_COLLECTION))
    const list: ArticleCategory[] = []
    snap.forEach((doc) => {
      list.push({ categoryId: doc.id, ...doc.data() } as ArticleCategory)
    })

    if (list.length === 0) {
      for (const d of DEFAULT_CATEGORIES) {
        const added = await addDoc(collection(db, CATEGORY_COLLECTION), {
          ...d,
          createdAt: serverTimestamp(),
        })
        list.push({ categoryId: added.id, ...d } as ArticleCategory)
      }
    }
    return list
  } catch (error) {
    console.error('Error fetching article categories from Firestore:', error)
    return DEFAULT_CATEGORIES.map((d) => ({ categoryId: '', ...d })) as ArticleCategory[]
  }
}

/** Tambah kategori artikel baru. */
export async function createArticleCategory(
  name: string,
  description: string = ''
): Promise<ArticleCategory> {
  const trimmedName = name.trim()
  if (!trimmedName) throw new Error('Nama kategori tidak boleh kosong')

  try {
    const docRef = await addDoc(collection(db, CATEGORY_COLLECTION), {
      name: trimmedName,
      description: description.trim(),
      createdAt: serverTimestamp(),
    })
    return { categoryId: docRef.id, name: trimmedName, description, createdAt: undefined as any }
  } catch (error) {
    console.error('Error creating article category:', error)
    throw new Error('Gagal menambahkan kategori baru')
  }
}
