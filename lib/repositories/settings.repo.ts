// lib/firebase/repositories/settings.repo.ts

import { firestore as db } from '@/lib/firebaseClient'
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore'

const COLLECTION_NAME = 'settings'
const DOC_ID = 'landing_page'

export interface LandingPageSettings {
  hero?: {
    badgeText?: string
    titlePrefix?: string
    titleGradient?: string
    titleSuffix?: string
    description?: string
    bgImageUrl?: string
    statParticipants?: string
    statVillages?: string
    statPartnerLabel?: string
  }
  partnership?: {
    kkn?: {
      title: string
      description: string
      participants: number
      villages: number
      highlights: string[]
    }
    bpom?: {
      title: string
      description: string
      features: string[]
    }
  }
  gallery?: Array<{
    id: number
    title: string
    location: string
    category: string
    gradient: string
    imageUrl?: string
  }>
  branding?: {
    siteName?: string
    subtitle?: string
    copyright?: string
    contactEmail?: string
    contactPhone?: string
  }
  updatedAt?: any
}

/**
 * Mengambil data pengaturan Landing Page dari Firestore (1 Read)
 */
export const getLandingPageSettings = async (): Promise<LandingPageSettings | null> => {
  try {
    const docRef = doc(db, COLLECTION_NAME, DOC_ID)
    const docSnap = await getDoc(docRef)

    if (docSnap.exists()) {
      return docSnap.data() as LandingPageSettings
    }
    return null
  } catch (error) {
    console.error('Error fetching landing page settings from Firestore:', error)
    return null
  }
}

/**
 * Menyimpan/Memperbarui pengaturan Landing Page ke Firestore (1 Write)
 */
export const updateLandingPageSettings = async (data: Partial<LandingPageSettings>): Promise<void> => {
  try {
    const docRef = doc(db, COLLECTION_NAME, DOC_ID)
    await setDoc(docRef, {
      ...data,
      updatedAt: serverTimestamp(),
    }, { merge: true })
  } catch (error) {
    console.error('Error updating landing page settings in Firestore:', error)
    throw new Error('Gagal menyimpan pengaturan ke database')
  }
}