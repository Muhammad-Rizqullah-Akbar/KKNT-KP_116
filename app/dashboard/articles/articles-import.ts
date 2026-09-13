// ============ UTIL IMPORT JSON & AUTO-UPLOAD BASE64 ============
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage'
import type { FirebaseStorage } from 'firebase/storage'
import {
  galleryGradients,
  type ContentBlock,
  type DetectedMarker,
  type GalleryImage,
} from './articles-types'

// Unggah data:image base64 ke Firebase Storage, kembali ke URL publik
export async function autoUploadBase64ToStorage(
  storage: FirebaseStorage,
  urlStr: string,
  namePrefix: string
): Promise<string> {
  if (!urlStr || !urlStr.startsWith('data:image')) return urlStr
  try {
    const storageRef = ref(storage, `articles/${Date.now()}_${namePrefix}.png`)
    const res = await fetch(urlStr)
    const blob = await res.blob()
    const snapshot = await uploadBytes(storageRef, blob)
    return await getDownloadURL(snapshot.ref)
  } catch (err) {
    console.warn('Auto upload base64 failed:', err)
    return urlStr
  }
}

export type JsonImportResult = {
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
  detectedMarkers: DetectedMarker[]
}

type ImportContext = {
  storage: FirebaseStorage
  attachedLocalFiles: File[]
  userDisplayName?: string | null
  userEmail?: string | null
}

// Parse string JSON + unggah gambar terkait menjadi struktur formData + marker terdeteksi
export async function parseJsonToFormData(
  jsonString: string,
  attachedImages: File[] | undefined,
  ctx: ImportContext
): Promise<JsonImportResult> {
  const { storage, attachedLocalFiles, userDisplayName, userEmail } = ctx
  const parsed = JSON.parse(jsonString)
  if (!parsed.title || typeof parsed.title !== 'string') {
    throw new Error('Properti "title" wajib ada dan berupa string.')
  }

  // Process batch local image files if uploaded alongside JSON
  const uploadedAttachedUrls: string[] = []
  const filesToProcess = attachedImages || attachedLocalFiles
  if (filesToProcess && filesToProcess.length > 0) {
    for (let i = 0; i < filesToProcess.length; i++) {
      const file = filesToProcess[i]
      try {
        const storageRef = ref(storage, `articles/${Date.now()}_${file.name}`)
        const snapshot = await uploadBytes(storageRef, file)
        const downloadUrl = await getDownloadURL(snapshot.ref)
        uploadedAttachedUrls.push(downloadUrl)
      } catch (e) {
        console.warn('Batch image upload failed:', e)
      }
    }
  }

  let featuredImage = parsed.featuredImage || ''
  if (featuredImage.startsWith('data:image')) {
    featuredImage = await autoUploadBase64ToStorage(storage, featuredImage, 'featured')
  } else if (!featuredImage && uploadedAttachedUrls.length > 0) {
    featuredImage = uploadedAttachedUrls.shift() || ''
  }

  const blocks: ContentBlock[] = []
  if (Array.isArray(parsed.blocks)) {
    for (let idx = 0; idx < parsed.blocks.length; idx++) {
      const block = parsed.blocks[idx]
      let imageUrl = block.imageUrl || ''
      if (imageUrl.startsWith('data:image')) {
        imageUrl = await autoUploadBase64ToStorage(storage, imageUrl, `block_${idx}`)
      }
      blocks.push({
        id: block.id || `b_${Date.now()}_${idx}`,
        type: ['p', 'h2', 'quote', 'list', 'image'].includes(block.type) ? block.type : 'p',
        value: block.value || '',
        quoteAuthor: block.quoteAuthor || '',
        imageUrl,
        imageCaption: block.imageCaption || '',
      })
    }
  } else {
    blocks.push(
      { id: 'b1', type: 'h2', value: '1. Pendahuluan' },
      { id: 'b2', type: 'p', value: parsed.content || 'Isi artikel...' }
    )
  }

  const gallery: GalleryImage[] = []
  if (Array.isArray(parsed.gallery)) {
    for (let idx = 0; idx < parsed.gallery.length; idx++) {
      const image = parsed.gallery[idx]
      let url = image.url || ''
      if (url.startsWith('data:image')) {
        url = await autoUploadBase64ToStorage(storage, url, `gallery_${idx}`)
      }
      gallery.push({
        id: image.id || `g_${Date.now()}_${idx}`,
        url,
        caption: image.caption || 'Foto dokumentasi',
        gradient: galleryGradients[idx % galleryGradients.length],
      })
    }
  }

  // Attach any remaining uploaded batch images to gallery slots
  if (uploadedAttachedUrls.length > 0) {
    uploadedAttachedUrls.forEach((imgUrl, idx) => {
      if (!featuredImage) {
        featuredImage = imgUrl
      } else {
        gallery.push({
          id: `g_batch_${Date.now()}_${idx}`,
          url: imgUrl,
          caption: `Dokumentasi Foto ${gallery.length + 1}`,
          gradient: galleryGradients[gallery.length % galleryGradients.length],
        })
      }
    })
  }

  // Scan for MARK:xxx tags in JSON
  const foundMarkers: DetectedMarker[] = []

  if (featuredImage && (featuredImage.startsWith('MARK:') || featuredImage === 'MARK')) {
    foundMarkers.push({
      key: featuredImage,
      label: `Foto Utama Banner (${featuredImage})`,
      targetType: 'featured',
    })
  }

  blocks.forEach((block, idx) => {
    if (block.imageUrl && (block.imageUrl.startsWith('MARK:') || block.imageUrl === 'MARK')) {
      foundMarkers.push({
        key: block.imageUrl,
        label: `Gambar/Infografis Blok #${idx + 1} (${block.imageCaption || block.imageUrl})`,
        targetType: 'block',
        blockId: block.id,
      })
    }
  })

  gallery.forEach((image, idx) => {
    if (image.url && (image.url.startsWith('MARK:') || image.url === 'MARK')) {
      foundMarkers.push({
        key: image.url,
        label: `Foto Galeri Dokumentasi #${idx + 1} (${image.caption || image.url})`,
        targetType: 'gallery',
        galleryId: image.id,
      })
    }
  })

  return {
    title: parsed.title,
    category: parsed.category || 'Teknologi',
    author: parsed.author || userDisplayName || userEmail || 'Penulis KKPD-KP',
    authorBio: parsed.authorBio || 'BPOM / Cadre Edukator',
    status: parsed.status === 'Published' ? 'Published' : 'Draft',
    readTime: Number(parsed.readTime) || 5,
    featuredImage,
    excerpt: parsed.excerpt || '',
    tags: Array.isArray(parsed.tags) ? parsed.tags.join(', ') : parsed.tags || '',
    embeddedDistributionCode: (parsed.embeddedDistributionCode || '').trim().toUpperCase(),
    pretestCode: (parsed.pretestCode || '').trim().toUpperCase(),
    posttestCode: (parsed.posttestCode || parsed.embeddedDistributionCode || '').trim().toUpperCase(),
    gallery,
    blocks,
    detectedMarkers: foundMarkers,
  }
}
