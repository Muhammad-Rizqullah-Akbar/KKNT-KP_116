// lib/firebase/storage-utils.ts

/**
 * Mendekode URL Firebase Storage dan mengekstrak nama file asli
 * @param url - URL Firebase Storage
 * @returns Nama file yang sudah dibersihkan
 */
export function getFileNameFromFirebaseUrl(url: string): string {
  try {
    // Decode URL untuk menghilangkan karakter encoded seperti %2F
    const decodedUrl = decodeURIComponent(url)
    
    // Ambil bagian setelah '/o/' dan sebelum '?alt=media'
    const pathMatch = decodedUrl.match(/\/o\/(.+?)\?alt=media/)
    
    if (pathMatch && pathMatch[1]) {
      const fullPath = pathMatch[1]
      // Ambil hanya nama file (setelah '/' terakhir)
      const fileName = fullPath.split('/').pop() || fullPath
      return fileName
    }
    
    // Fallback: ambil dari akhir URL biasa
    const urlParts = decodedUrl.split('/')
    const lastPart = urlParts[urlParts.length - 1]
    // Hapus query params jika ada
    return lastPart.split('?')[0]
  } catch (error) {
    console.error('Error parsing file name:', error)
    return 'unknown-file'
  }
}

/**
 * Membersihkan nama file untuk ditampilkan
 * Menghapus prefix timestamp dan karakter underscore
 * @param fileName - Nama file mentah
 * @returns Nama file yang sudah dibersihkan
 */
export function cleanFileName(fileName: string): string {
  // Hapus prefix timestamp jika ada (contoh: img_1784430111375_)
  let cleaned = fileName.replace(/^(img|file|doc)_\d+_/, '')
  
  // Ganti underscore dengan spasi
  cleaned = cleaned.replace(/_/g, ' ')
  
  // Hapus ekstensi untuk judul, tapi simpan untuk info
  const nameWithoutExt = cleaned.replace(/\.[^/.]+$/, '')
  
  return nameWithoutExt || cleaned
}

/**
 * Mendapatkan ekstensi file dari URL atau nama file
 * @param url - URL atau nama file
 * @returns Ekstensi file (contoh: 'pdf', 'jpg', dll) atau 'unknown'
 */
export function getFileExtension(url: string): string {
  try {
    const decoded = decodeURIComponent(url)
    const match = decoded.match(/\.([^./?]+)(\?|$)/)
    return match ? match[1].toLowerCase() : 'unknown'
  } catch {
    return 'unknown'
  }
}

/**
 * Mendapatkan tipe file berdasarkan ekstensi
 * @param url - URL file
 * @returns Tipe file: 'image' | 'pdf' | 'video' | 'document' | 'unknown'
 */
export function getFileType(url: string): 'image' | 'pdf' | 'video' | 'document' | 'unknown' {
  const ext = getFileExtension(url)
  
  if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp'].includes(ext)) {
    return 'image'
  }
  if (ext === 'pdf') {
    return 'pdf'
  }
  if (['mp4', 'webm', 'ogg', 'mov', 'avi'].includes(ext)) {
    return 'video'
  }
  if (['doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'txt', 'csv'].includes(ext)) {
    return 'document'
  }
  return 'unknown'
}