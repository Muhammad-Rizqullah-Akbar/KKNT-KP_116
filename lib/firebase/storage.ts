// lib/firebase/storage.ts

import {
  ref,
  uploadBytes,
  uploadBytesResumable,
  getDownloadURL,
  deleteObject,
  listAll,
  getMetadata,
  type UploadResult,
  type StorageReference,
  type UploadTaskSnapshot,
} from 'firebase/storage'
import { storage } from '@/lib/firebaseClient'

// ============ TYPES ============
export interface UploadProgress {
  progress: number
  bytesTransferred: number
  totalBytes: number
  status: 'idle' | 'running' | 'paused' | 'success' | 'error'
}

export type UploadCallback = (progress: UploadProgress) => void

// ============ GENERATE FILE PATH ============
export const generateFilePath = (
  folder: 'forms' | 'responses' | 'articles' | 'gallery' | 'profiles' | 'settings',
  subFolder: string,
  fileName: string,
  prefix?: string
): string => {
  const timestamp = Date.now()
  const random = Math.random().toString(36).substring(2, 8)
  const cleanFileName = fileName.replace(/[^a-zA-Z0-9.]/g, '_')
  const finalName = prefix 
    ? `${prefix}_${timestamp}_${random}_${cleanFileName}`
    : `${timestamp}_${random}_${cleanFileName}`
  
  return `${folder}/${subFolder}/${finalName}`
}

// ============ UPLOAD FILE ============

/**
 * Upload file ke Firebase Storage
 */
export const uploadFile = async (
  file: File,
  path: string,
  onProgress?: UploadCallback
): Promise<{ url: string; path: string; metadata: any }> => {
  return new Promise((resolve, reject) => {
    const storageRef = ref(storage, path)
    const uploadTask = uploadBytesResumable(storageRef, file)

    // Progress tracking
    if (onProgress) {
      uploadTask.on('state_changed', (snapshot: UploadTaskSnapshot) => {
        const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100
        onProgress({
          progress,
          bytesTransferred: snapshot.bytesTransferred,
          totalBytes: snapshot.totalBytes,
          status: 'running',
        })
      })
    }

    // Complete
    uploadTask.then(async (snapshot: UploadResult) => {
      const url = await getDownloadURL(snapshot.ref)
      
      if (onProgress) {
        onProgress({
          progress: 100,
          bytesTransferred: snapshot.ref.totalBytes || 0,
          totalBytes: snapshot.ref.totalBytes || 0,
          status: 'success',
        })
      }
      
      resolve({
        url,
        path: snapshot.ref.fullPath,
        metadata: snapshot.metadata,
      })
    }).catch((error) => {
      if (onProgress) {
        onProgress({
          progress: 0,
          bytesTransferred: 0,
          totalBytes: 0,
          status: 'error',
        })
      }
      reject(error)
    })
  })
}

/**
 * Upload gambar (dengan optimasi path)
 */
export const uploadImage = async (
  file: File,
  folder: 'forms' | 'responses' | 'articles' | 'gallery' | 'profiles' | 'settings',
  subFolder: string,
  onProgress?: UploadCallback
): Promise<string> => {
  const path = generateFilePath(folder, subFolder, file.name, 'img')
  const result = await uploadFile(file, path, onProgress)
  return result.url
}

/**
 * Upload file responden
 */
export const uploadResponseFile = async (
  file: File,
  formId: string,
  questionId: string,
  onProgress?: UploadCallback
): Promise<string> => {
  const path = `responses/${formId}/${questionId}/${Date.now()}_${file.name.replace(/[^a-zA-Z0-9.]/g, '_')}`
  const result = await uploadFile(file, path, onProgress)
  return result.url
}

/**
 * Upload artikel thumbnail
 */
export const uploadArticleImage = async (
  file: File,
  articleId: string,
  onProgress?: UploadCallback
): Promise<string> => {
  const path = `articles/${articleId}/thumbnail_${Date.now()}_${file.name.replace(/[^a-zA-Z0-9.]/g, '_')}`
  const result = await uploadFile(file, path, onProgress)
  return result.url
}

/**
 * Upload galeri gambar
 */
export const uploadGalleryImage = async (
  file: File,
  onProgress?: UploadCallback
): Promise<string> => {
  const path = `gallery/${Date.now()}_${file.name.replace(/[^a-zA-Z0-9.]/g, '_')}`
  const result = await uploadFile(file, path, onProgress)
  return result.url
}

/**
 * Upload settings logo/image
 */
export const uploadSettingsImage = async (
  file: File,
  key: string,
  onProgress?: UploadCallback
): Promise<string> => {
  const path = `settings/${key}_${Date.now()}_${file.name.replace(/[^a-zA-Z0-9.]/g, '_')}`
  const result = await uploadFile(file, path, onProgress)
  return result.url
}

// ============ DELETE FILE ============

/**
 * Hapus file dari Firebase Storage
 */
export const deleteFile = async (path: string): Promise<void> => {
  const storageRef = ref(storage, path)
  await deleteObject(storageRef)
}

/**
 * Hapus file berdasarkan URL
 */
export const deleteFileByUrl = async (url: string): Promise<void> => {
  try {
    const decodedUrl = decodeURIComponent(url)
    const match = decodedUrl.match(/\/o\/(.+?)(\?|$)/)
    if (match && match[1]) {
      const path = match[1]
      const storageRef = ref(storage, path)
      await deleteObject(storageRef)
    }
  } catch (error) {
    console.error('Error deleting file by URL:', error)
    throw error
  }
}

// ============ GET FILE URL ============

/**
 * Get download URL from path
 */
export const getFileUrl = async (path: string): Promise<string> => {
  const storageRef = ref(storage, path)
  return await getDownloadURL(storageRef)
}

/**
 * Get file metadata
 */
export const getFileMetadata = async (path: string): Promise<any> => {
  const storageRef = ref(storage, path)
  return await getMetadata(storageRef)
}

// ============ LIST FILES ============

/**
 * List semua file dalam folder
 */
export const listFiles = async (folder: string): Promise<StorageReference[]> => {
  const folderRef = ref(storage, folder)
  const result = await listAll(folderRef)
  return result.items
}

/**
 * Get all images from a form
 */
export const getFormImages = async (formId: string): Promise<string[]> => {
  const folder = `forms/${formId}`
  const items = await listFiles(folder)
  const urls = await Promise.all(
    items.map(async (item) => {
      try {
        return await getDownloadURL(item)
      } catch {
        return null
      }
    })
  )
  return urls.filter((url): url is string => url !== null)
}

// ============ VALIDATION ============

/**
 * Check if file type is allowed
 */
export const isFileTypeAllowed = (
  file: File,
  allowedTypes: string[]
): boolean => {
  if (allowedTypes.length === 0) return true
  return allowedTypes.some((type) => {
    if (type.endsWith('/*')) {
      const baseType = type.replace('/*', '')
      return file.type.startsWith(baseType)
    }
    return file.type === type
  })
}

/**
 * Check if file size is within limit (in MB)
 */
export const isFileSizeValid = (file: File, maxSizeMB: number): boolean => {
  return file.size <= maxSizeMB * 1024 * 1024
}

// ============ COMPRESS IMAGE ============

/**
 * Compress image before upload
 */
export const compressImage = async (
  file: File,
  maxWidth: number = 1200,
  maxHeight: number = 1200,
  quality: number = 0.8
): Promise<File> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.readAsDataURL(file)
    reader.onload = (event) => {
      const img = new Image()
      img.src = event.target?.result as string
      img.onload = () => {
        const canvas = document.createElement('canvas')
        let width = img.width
        let height = img.height

        if (width > maxWidth) {
          height = (height * maxWidth) / width
          width = maxWidth
        }
        if (height > maxHeight) {
          width = (width * maxHeight) / height
          height = maxHeight
        }

        canvas.width = width
        canvas.height = height
        const ctx = canvas.getContext('2d')
        ctx?.drawImage(img, 0, 0, width, height)

        canvas.toBlob(
          (blob) => {
            if (blob) {
              const compressedFile = new File([blob], file.name, {
                type: 'image/jpeg',
                lastModified: Date.now(),
              })
              resolve(compressedFile)
            } else {
              reject(new Error('Failed to compress image'))
            }
          },
          'image/jpeg',
          quality
        )
      }
      img.onerror = reject
    }
    reader.onerror = reject
  })
}

// ============ EXPORT ============
export default storage