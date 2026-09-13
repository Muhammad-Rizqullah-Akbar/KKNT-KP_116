import { adminFirestore } from '@/lib/infra/firebase-admin'
import { registryCache, cachedGetDoc } from '@/lib/infra/cache'

const REGISTRY_COLLECTION = 'form_registry'

/**
 * Fetch dynamic form categories strictly from Firestore database.
 * Singleton config — dibaca 1× + cache (registryCache, TTL 1 jam) untuk tekan cost.
 */
export async function getFormCategoriesFromDb(): Promise<string[]> {
  return cachedGetDoc(registryCache, 'form_registry:categories', async () => {
    try {
      const docSnap = await adminFirestore.collection(REGISTRY_COLLECTION).doc('categories').get()
      if (docSnap.exists) {
        const data = docSnap.data()
        if (Array.isArray(data?.list) && data.list.length > 0) {
          return Array.from(new Set(data.list.map((s: string) => String(s).trim()))).filter(Boolean)
        }
      }
    } catch (e) {
      // Non-blocking catch
    }
    return []
  })
}

/**
 * Fetch dynamic respondent targets strictly from Firestore database.
 * Singleton config — dibaca 1× + cache (registryCache, TTL 1 jam).
 */
export async function getRespondentTargetsFromDb(): Promise<string[]> {
  return cachedGetDoc(registryCache, 'form_registry:targets', async () => {
    try {
      const docSnap = await adminFirestore.collection(REGISTRY_COLLECTION).doc('targets').get()
      if (docSnap.exists) {
        const data = docSnap.data()
        if (Array.isArray(data?.list) && data.list.length > 0) {
          return Array.from(new Set(data.list.map((s: string) => String(s).trim()))).filter(Boolean)
        }
      }
    } catch (e) {
      // Non-blocking catch
    }
    return []
  })
}

/**
 * Automatically register new category or target into Firestore baseline database registry.
 */
export async function registerNewMetadataEntry(category?: string, target?: string): Promise<void> {
  const cleanCat = category?.trim()
  const cleanTgt = target?.trim()

  if (cleanCat) {
    try {
      const catRef = adminFirestore.collection(REGISTRY_COLLECTION).doc('categories')
      const docSnap = await catRef.get()
      let list: string[] = []
      if (docSnap.exists && Array.isArray(docSnap.data()?.list)) {
        list = docSnap.data()!.list
      }
      if (!list.includes(cleanCat)) {
        const nextList = [...list, cleanCat]
        await catRef.set({ list: nextList, updatedAt: new Date().toISOString() }, { merge: true })
        registryCache.delete('form_registry:categories') // invalidate cache
      }
    } catch (e) {
      // Non-blocking
    }
  }

  if (cleanTgt) {
    try {
      const tgtRef = adminFirestore.collection(REGISTRY_COLLECTION).doc('targets')
      const docSnap = await tgtRef.get()
      let list: string[] = []
      if (docSnap.exists && Array.isArray(docSnap.data()?.list)) {
        list = docSnap.data()!.list
      }
      if (!list.includes(cleanTgt)) {
        const nextList = [...list, cleanTgt]
        await tgtRef.set({ list: nextList, updatedAt: new Date().toISOString() }, { merge: true })
        registryCache.delete('form_registry:targets') // invalidate cache
      }
    } catch (e) {
      // Non-blocking
    }
  }
}
