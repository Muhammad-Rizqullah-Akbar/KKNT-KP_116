export function getFileNameFromFirebaseUrl(url: string): string {
  try {
    const decodedUrl = decodeURIComponent(url)
    const pathMatch = decodedUrl.match(/\/o\/(.+?)\?alt=media/)
    if (pathMatch && pathMatch[1]) {
      const fullPath = pathMatch[1]
      const fileName = fullPath.split('/').pop() || fullPath
      return fileName
    }
    const urlParts = decodedUrl.split('/')
    const lastPart = urlParts[urlParts.length - 1]
    return lastPart.split('?')[0]
  } catch {
    return 'unknown-file'
  }
}

export function cleanFileName(fileName: string): string {
  let cleaned = fileName.replace(/^(img|file|doc|video|audio)_\d+_/, '')
  cleaned = cleaned.replace(/_/g, ' ')
  const nameWithoutExt = cleaned.replace(/\.[^/.]+$/, '')
  return nameWithoutExt || cleaned
}

export function getFileExtension(url: string): string {
  try {
    const decoded = decodeURIComponent(url)
    const match = decoded.match(/\.([^./?]+)(\?|$)/)
    return match ? match[1].toLowerCase() : 'unknown'
  } catch {
    return 'unknown'
  }
}

export function getFileTypeFromUrl(url: string): 'image' | 'pdf' | 'video' | 'document' | 'spreadsheet' | 'presentation' | 'unknown' {
  const ext = getFileExtension(url)
  if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp', 'ico'].includes(ext)) return 'image'
  if (ext === 'pdf') return 'pdf'
  if (['mp4', 'webm', 'ogg', 'mov', 'avi', 'mkv', 'flv', 'wmv'].includes(ext)) return 'video'
  if (['doc', 'docx'].includes(ext)) return 'document'
  if (['xls', 'xlsx', 'csv'].includes(ext)) return 'spreadsheet'
  if (['ppt', 'pptx'].includes(ext)) return 'presentation'
  if (['txt', 'rtf', 'md'].includes(ext)) return 'document'
  return 'unknown'
}

export function formatFileSize(bytes: number): string {
  if (!bytes || bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

export function getFileIcon(fileType: string): string {
  switch (fileType) {
    case 'pdf': return 'fileText'
    case 'document': return 'fileText'
    case 'spreadsheet': return 'table'
    case 'presentation': return 'monitor'
    case 'video': return 'video'
    case 'image': return 'image'
    default: return 'fileText'
  }
}

export function getFileColor(fileType: string): string {
  switch (fileType) {
    case 'pdf': return 'text-red-400 bg-red-500/10'
    case 'document': return 'text-blue-400 bg-blue-500/10'
    case 'spreadsheet': return 'text-green-400 bg-green-500/10'
    case 'presentation': return 'text-orange-400 bg-orange-500/10'
    case 'video': return 'text-purple-400 bg-purple-500/10'
    case 'image': return 'text-pink-400 bg-pink-500/10'
    default: return 'text-cyan-400 bg-cyan-500/10'
  }
}
