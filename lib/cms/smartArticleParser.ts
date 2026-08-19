/**
 * SMART ARTICLE PARSER & UTILITIES (100% DETERMINISTIC, ZERO-AI REQUIRED)
 * 
 * Modul ini mengubah draf teks bebas (dari Microsoft Word, Google Docs, WhatsApp,
 * atau Markdown) dan file JSON menjadi struktur artikel CMS yang terorganisir rapi.
 */

export interface ArticleBlock {
  id: string
  type: 'p' | 'h2' | 'quote' | 'list' | 'image'
  value: string
  quoteAuthor?: string
  imageUrl?: string
  imageCaption?: string
}

export interface ArticleGalleryItem {
  id: string
  url?: string
  caption: string
  gradient?: string
}

export interface ParsedArticle {
  title: string
  category: string
  author: string
  authorBio: string
  status: 'Draft' | 'Published'
  readTime: number
  excerpt: string
  tags: string[]
  embeddedDistributionCode: string
  featuredImage: string
  blocks: ArticleBlock[]
  gallery: ArticleGalleryItem[]
  detectedMarkers?: {
    key: string
    label: string
    targetType: 'featured' | 'block' | 'gallery'
    blockId?: string
    galleryId?: string
  }[]
  sourceType: 'raw_text' | 'markdown' | 'json'
  wordCount: number
}

const DEFAULT_GRADIENTS = [
  'from-amber-700/40 via-orange-800/30 to-rose-900/40',
  'from-violet-700/40 via-purple-800/30 to-indigo-900/40',
  'from-cyan-700/40 via-teal-800/30 to-emerald-900/40',
  'from-rose-700/40 via-pink-800/30 to-fuchsia-900/40',
  'from-lime-700/40 via-green-800/30 to-teal-900/40',
  'from-sky-700/40 via-blue-800/30 to-cyan-900/40',
]

/**
 * Auto-infer category based on text keywords
 */
export function inferCategoryFromContent(text: string): string {
  const lower = text.toLowerCase()
  if (/regulasi|undang-undang|peraturan|uu|hukum|legalitas|izin\s+edar|permenkes|perka\s+bpom/i.test(lower)) {
    return 'Regulasi'
  }
  if (/tips|trik|langkah\s+praktis|cara\s+mudah|panduan\s+memilih|kunci\s+sukses/i.test(lower)) {
    return 'Tips & Trik'
  }
  if (/teknologi|aplikasi|sistem|digital|iot|website|software|fitur|perangkat\s+lunak/i.test(lower)) {
    return 'Teknologi'
  }
  if (/pangan|keamanan\s+pangan|bpom|higien|sanitasi|kadaluarsa|bakteri|cemaran|boraks|formalin/i.test(lower)) {
    return 'Keamanan Pangan'
  }
  if (/berita|kegiatan|kkn|sosialisasi|pelatihan|workshop|laporan|kunjungan/i.test(lower)) {
    return 'Berita'
  }
  return 'Edukasi'
}

/**
 * Intelligent Rule-Based Auto-Repair for Malformed JSON Strings
 */
export function cleanAndRepairJson(raw: string): { success: boolean; data?: any; error?: string } {
  let cleaned = raw.trim()

  // 1. Strip Markdown Code Fences (```json ... ``` or ``` ...)
  cleaned = cleaned.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim()

  // 2. Try direct JSON parse
  try {
    const parsed = JSON.parse(cleaned)
    return { success: true, data: parsed }
  } catch (initialErr) {
    // Attempt auto-repair of common syntax mistakes
  }

  try {
    let repaired = cleaned
      // Remove trailing commas before closing braces/brackets
      .replace(/,\s*([\]}])/g, '$1')
      // Normalize single quotes around keys and string values
      .replace(/([{,]\s*)'([^']+)'\s*:/g, '$1"$2":')
      .replace(/:\s*'([^']*)'/g, ':"$1"')

    const parsed = JSON.parse(repaired)
    return { success: true, data: parsed }
  } catch (err: any) {
    return {
      success: false,
      error: `Format JSON tidak valid: ${err.message || 'Periksa tanda kurung kurawal atau koma.'}`,
    }
  }
}

/**
 * PARSER UTAMA: Mengubah Teks Bebas, Markdown, atau Dokumen Draf menjadi Objek Artikel
 */
export function parseRawTextToArticle(
  input: string,
  defaults?: { defaultAuthor?: string; defaultBio?: string }
): ParsedArticle {
  const trimmedInput = (input || '').trim()

  // If input is already valid JSON, parse and normalize it
  if (trimmedInput.startsWith('{') && trimmedInput.endsWith('}')) {
    const jsonResult = cleanAndRepairJson(trimmedInput)
    if (jsonResult.success && jsonResult.data && typeof jsonResult.data === 'object') {
      return normalizeJsonToArticle(jsonResult.data, defaults)
    }
  }

  // Text / Markdown Parser State
  const lines = trimmedInput.split(/\r?\n/)
  const wordCount = trimmedInput.split(/\s+/).filter(Boolean).length

  let title = ''
  let category = ''
  let author = defaults?.defaultAuthor || 'Penulis KKPD-KP'
  let authorBio = defaults?.defaultBio || 'Kader Edukator Keamanan Pangan'
  let status: 'Draft' | 'Published' = 'Draft'
  let excerpt = ''
  let tags: string[] = []
  let embeddedDistributionCode = ''
  let featuredImage = ''
  let customReadTime: number | null = null

  const bodyLines: string[] = []
  const galleryItems: ArticleGalleryItem[] = []
  let isHeaderZone = true

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim()
    if (!line) {
      if (isHeaderZone && (title || author !== (defaults?.defaultAuthor || 'Penulis KKPD-KP'))) {
        isHeaderZone = false
      }
      bodyLines.push('')
      continue
    }

    // Explicit Metadata Key-Value Pattern (e.g., "Judul: ...", "Kategori: ...")
    const kvMatch = line.match(/^([A-Za-z0-9\s_]{2,25})\s*:\s*(.+)$/i)
    if (kvMatch && isHeaderZone) {
      const key = kvMatch[1].toLowerCase().trim()
      const val = kvMatch[2].trim()

      if (key === 'judul' || key === 'title' || key === 'nama artikel') {
        title = val
        continue
      }
      if (key === 'kategori' || key === 'category' || key === 'topik') {
        category = val
        continue
      }
      if (key === 'penulis' || key === 'author' || key === 'oleh' || key === 'writer') {
        author = val
        continue
      }
      if (key === 'bio' || key === 'author bio' || key === 'jabatan' || key === 'instansi') {
        authorBio = val
        continue
      }
      if (key === 'status') {
        status = /publish/i.test(val) ? 'Published' : 'Draft'
        continue
      }
      if (key === 'ringkasan' || key === 'excerpt' || key === 'deskripsi' || key === 'abstrak') {
        excerpt = val
        continue
      }
      if (key === 'tag' || key === 'tags' || key === 'kata kunci' || key === 'keywords') {
        tags = val.split(/[,;#]+/).map((t: string) => t.trim().replace(/^#/, '')).filter(Boolean)
        continue
      }
      if (key === 'kode distribusi' || key === 'kode kuesioner' || key === 'distribusi' || key === 'kode' || key === 'code') {
        embeddedDistributionCode = val.toUpperCase().replace(/[^A-Z0-9]/g, '')
        continue
      }
      if (key === 'banner' || key === 'featured image' || key === 'gambar utama' || key === 'cover') {
        featuredImage = val
        continue
      }
      if (key === 'waktu baca' || key === 'read time' || key === 'durasi') {
        const parsedTime = parseInt(val, 10)
        if (!isNaN(parsedTime)) customReadTime = parsedTime
        continue
      }
    }

    // Markdown Title Line (e.g. "# Judul Artikel")
    if (!title && /^#\s+(.+)$/.test(line)) {
      title = line.replace(/^#\s+/, '').trim()
      continue
    }

    // If title not yet found and line is the very first substantial text
    if (!title && isHeaderZone) {
      // If line is not a metadata key and looks like a headline (no period at end, short)
      if (line.length < 150 && !line.endsWith('.') && !line.startsWith('-') && !line.startsWith('>')) {
        title = line.replace(/^#+\s*/, '').replace(/^\*\*|\*\*$/g, '').trim()
        continue
      }
    }

    // Check for inline hashtag lines (e.g. "#KeamananPangan #BPOM #Higienis")
    const hashtagMatches = line.match(/#[A-Za-z0-9_]+/g)
    if (hashtagMatches && hashtagMatches.length >= 2 && line.replace(/#[A-Za-z0-9_]+/g, '').trim().length === 0) {
      hashtagMatches.forEach((h) => tags.push(h.replace(/^#/, '')))
      continue
    }

    // Check for explicit Distribution Code in text (e.g. "[DISTRIBUSI: KKPDQ6M]" or "Kode Akses: KKPDQ6M")
    const distMatch = line.match(/(?:kode|distribusi|kuesioner)\s*[:=\[]\s*([A-Z0-9]{5,10})\]?/i)
    if (distMatch && !embeddedDistributionCode) {
      embeddedDistributionCode = distMatch[1].toUpperCase()
      continue
    }

    // Check for gallery marker in text (e.g. "[GALERI: Foto Kegiatan | url]" or "![Galeri](url)")
    const galMatch = line.match(/^\[GALERI\s*:\s*([^|\]]+)(?:\|\s*([^\]]+))?\]/i)
    if (galMatch) {
      galleryItems.push({
        id: `g_${Date.now()}_${galleryItems.length}`,
        caption: galMatch[1].trim(),
        url: galMatch[2]?.trim() || '',
        gradient: DEFAULT_GRADIENTS[galleryItems.length % DEFAULT_GRADIENTS.length],
      })
      continue
    }

    // Body content line
    bodyLines.push(line)
  }

  // Fallback defaults
  if (!title) {
    title = bodyLines.find((l) => l.trim().length > 0)?.substring(0, 80) || 'Artikel Edukasi Baru'
  }

  if (!category) {
    category = inferCategoryFromContent(trimmedInput)
  }

  // Calculate Read Time: approx 180 words per minute
  const readTime = customReadTime || Math.max(1, Math.ceil(wordCount / 180))

  // Structure Body Lines into Blocks
  const blocks: ArticleBlock[] = []
  let currentParagraphLines: string[] = []

  const flushParagraph = () => {
    if (currentParagraphLines.length > 0) {
      const paragraphText = currentParagraphLines.join(' ').trim()
      if (paragraphText) {
        blocks.push({
          id: `b_${Date.now()}_${blocks.length}`,
          type: 'p',
          value: paragraphText,
        })
        if (!excerpt) {
          excerpt = paragraphText.substring(0, 160) + (paragraphText.length > 160 ? '...' : '')
        }
      }
      currentParagraphLines = []
    }
  }

  for (let i = 0; i < bodyLines.length; i++) {
    const line = bodyLines[i].trim()

    if (!line) {
      flushParagraph()
      continue
    }

    // 1. Sub-Heading (## Subjudul, ### Subjudul, 1. Subjudul, A. Subjudul, BAB I, or short ALL-CAPS)
    const isMarkdownHeading = /^#{2,4}\s+(.+)$/.test(line)
    const isNumberedHeading = /^(?:[0-9]{1,2}\.|[A-Z]\.|BAB\s+[IVXLCDM]+|[0-9]{1,2}\))\s+[A-Z\d][^\n]{3,80}$/.test(line)
    const isShortHeading = line.length <= 60 && line.endsWith(':') && !line.startsWith('-')

    if (isMarkdownHeading || isNumberedHeading || isShortHeading) {
      flushParagraph()
      const headingText = line
        .replace(/^#{2,4}\s+/, '')
        .replace(/^\*\*|\*\*$/g, '')
        .replace(/:$/, '')
        .trim()
      blocks.push({
        id: `b_${Date.now()}_${blocks.length}`,
        type: 'h2',
        value: headingText,
      })
      continue
    }

    // 2. Blockquote (> Kutipan - Penulis or "Kutipan" — Penulis)
    if (line.startsWith('>')) {
      flushParagraph()
      const quoteRaw = line.replace(/^>\s*/, '').trim()
      const quoteParts = quoteRaw.split(/\s*[-—–]\s*/)
      const quoteText = quoteParts[0].replace(/^["']|["']$/g, '').trim()
      const quoteAuthor = quoteParts[1] || 'Panduan Keamanan Pangan BPOM'

      blocks.push({
        id: `b_${Date.now()}_${blocks.length}`,
        type: 'quote',
        value: quoteText,
        quoteAuthor,
      })
      continue
    }

    // 3. Bullet / Numbered List (- item, * item, • item, 1) item)
    if (/^[-*•]\s+(.+)$/.test(line) || /^[0-9]+[.)]\s+(.+)$/.test(line)) {
      flushParagraph()
      const listText = line.replace(/^[-*•]\s+/, '').replace(/^[0-9]+[.)]\s+/, '').trim()
      blocks.push({
        id: `b_${Date.now()}_${blocks.length}`,
        type: 'list',
        value: listText,
      })
      continue
    }

    // 4. Image Block (![Caption](url) or [GAMBAR: Caption | url] or MARK:xxx)
    const mdImgMatch = line.match(/^!\[([^\]]*)\]\(([^)]+)\)$/)
    const customImgMatch = line.match(/^\[(?:GAMBAR|FOTO|IMAGE)\s*:\s*([^|\]]+)(?:\|\s*([^\]]+))?\]/i)
    const markerMatch = line.match(/^(?:MARK:[A-Za-z0-9_]+|MARK)$/i)

    if (mdImgMatch) {
      flushParagraph()
      blocks.push({
        id: `b_${Date.now()}_${blocks.length}`,
        type: 'image',
        value: '',
        imageUrl: mdImgMatch[2].trim(),
        imageCaption: mdImgMatch[1].trim() || 'Ilustrasi Edukasi',
      })
      continue
    } else if (customImgMatch) {
      flushParagraph()
      blocks.push({
        id: `b_${Date.now()}_${blocks.length}`,
        type: 'image',
        value: '',
        imageUrl: customImgMatch[2]?.trim() || '',
        imageCaption: customImgMatch[1].trim(),
      })
      continue
    } else if (markerMatch) {
      flushParagraph()
      blocks.push({
        id: `b_${Date.now()}_${blocks.length}`,
        type: 'image',
        value: '',
        imageUrl: markerMatch[0].trim(),
        imageCaption: 'Placeholder Foto Dokumentasi',
      })
      continue
    }

    // Normal paragraph line
    currentParagraphLines.push(line)
  }

  flushParagraph()

  // If no blocks parsed, ensure at least one paragraph exists
  if (blocks.length === 0) {
    blocks.push({
      id: `b_${Date.now()}_0`,
      type: 'p',
      value: trimmedInput || 'Isi artikel edukasi...',
    })
  }

  if (!excerpt) {
    excerpt = 'Materi edukasi keamanan pangan dan panduan higiene sanitasi masyarakat.'
  }

  // Scan markers (MARK:xxx)
  const detectedMarkers: ParsedArticle['detectedMarkers'] = []
  if (featuredImage && (featuredImage.startsWith('MARK:') || featuredImage === 'MARK')) {
    detectedMarkers.push({
      key: featuredImage,
      label: `Foto Utama Banner (${featuredImage})`,
      targetType: 'featured',
    })
  }
  blocks.forEach((b, idx) => {
    if (b.imageUrl && (b.imageUrl.startsWith('MARK:') || b.imageUrl === 'MARK')) {
      detectedMarkers.push({
        key: b.imageUrl,
        label: `Gambar Blok #${idx + 1} (${b.imageCaption || b.imageUrl})`,
        targetType: 'block',
        blockId: b.id,
      })
    }
  })
  galleryItems.forEach((g, idx) => {
    if (g.url && (g.url.startsWith('MARK:') || g.url === 'MARK')) {
      detectedMarkers.push({
        key: g.url,
        label: `Foto Galeri #${idx + 1} (${g.caption || g.url})`,
        targetType: 'gallery',
        galleryId: g.id,
      })
    }
  })

  return {
    title,
    category,
    author,
    authorBio,
    status,
    readTime,
    excerpt,
    tags,
    embeddedDistributionCode,
    featuredImage,
    blocks,
    gallery: galleryItems,
    detectedMarkers,
    sourceType: 'raw_text',
    wordCount,
  }
}

/**
 * Normalizes existing JSON structure into clean ParsedArticle format
 */
export function normalizeJsonToArticle(
  json: any,
  defaults?: { defaultAuthor?: string; defaultBio?: string }
): ParsedArticle {
  const title = String(json.title || 'Artikel Edukasi').trim()
  const category = String(json.category || inferCategoryFromContent(title + ' ' + (json.content || ''))).trim()
  const author = String(json.author || defaults?.defaultAuthor || 'Penulis KKPD-KP').trim()
  const authorBio = String(json.authorBio || defaults?.defaultBio || 'Kader Edukator Keamanan Pangan').trim()
  const status = json.status === 'Published' ? 'Published' : 'Draft'
  const readTime = Number(json.readTime) || 5
  const excerpt = String(json.excerpt || '').trim()
  const embeddedDistributionCode = String(json.embeddedDistributionCode || '').trim().toUpperCase()
  const featuredImage = String(json.featuredImage || '').trim()

  let tags: string[] = []
  if (Array.isArray(json.tags)) {
    tags = json.tags.map((t: any) => String(t).replace(/^#/, '').trim()).filter(Boolean)
  } else if (typeof json.tags === 'string') {
    tags = json.tags.split(/[,;#]+/).map((t: string) => t.trim().replace(/^#/, '')).filter(Boolean)
  }

  const blocks: ArticleBlock[] = []
  if (Array.isArray(json.blocks)) {
    json.blocks.forEach((b: any, idx: number) => {
      const validTypes = ['p', 'h2', 'quote', 'list', 'image']
      blocks.push({
        id: b.id || `b_${Date.now()}_${idx}`,
        type: validTypes.includes(b.type) ? b.type : 'p',
        value: String(b.value || ''),
        quoteAuthor: b.quoteAuthor ? String(b.quoteAuthor) : undefined,
        imageUrl: b.imageUrl ? String(b.imageUrl) : undefined,
        imageCaption: b.imageCaption ? String(b.imageCaption) : undefined,
      })
    })
  } else if (json.content && typeof json.content === 'string') {
    // If legacy HTML content provided
    blocks.push(
      { id: 'b1', type: 'h2', value: '1. Pendahuluan' },
      { id: 'b2', type: 'p', value: json.content.replace(/<[^>]*>?/gm, '') }
    )
  } else {
    blocks.push({ id: 'b1', type: 'p', value: 'Isi materi edukasi...' })
  }

  const gallery: ArticleGalleryItem[] = []
  if (Array.isArray(json.gallery)) {
    json.gallery.forEach((g: any, idx: number) => {
      gallery.push({
        id: g.id || `g_${Date.now()}_${idx}`,
        url: g.url ? String(g.url) : '',
        caption: String(g.caption || `Dokumentasi Foto ${idx + 1}`),
        gradient: g.gradient || DEFAULT_GRADIENTS[idx % DEFAULT_GRADIENTS.length],
      })
    })
  }

  // Scan markers
  const detectedMarkers: ParsedArticle['detectedMarkers'] = []
  if (featuredImage && (featuredImage.startsWith('MARK:') || featuredImage === 'MARK')) {
    detectedMarkers.push({
      key: featuredImage,
      label: `Foto Utama Banner (${featuredImage})`,
      targetType: 'featured',
    })
  }
  blocks.forEach((b, idx) => {
    if (b.imageUrl && (b.imageUrl.startsWith('MARK:') || b.imageUrl === 'MARK')) {
      detectedMarkers.push({
        key: b.imageUrl,
        label: `Gambar Blok #${idx + 1} (${b.imageCaption || b.imageUrl})`,
        targetType: 'block',
        blockId: b.id,
      })
    }
  })
  gallery.forEach((g, idx) => {
    if (g.url && (g.url.startsWith('MARK:') || g.url === 'MARK')) {
      detectedMarkers.push({
        key: g.url,
        label: `Foto Galeri #${idx + 1} (${g.caption || g.url})`,
        targetType: 'gallery',
        galleryId: g.id,
      })
    }
  })

  return {
    title,
    category,
    author,
    authorBio,
    status,
    readTime,
    excerpt,
    tags,
    embeddedDistributionCode,
    featuredImage,
    blocks,
    gallery,
    detectedMarkers,
    sourceType: 'json',
    wordCount: blocks.reduce((sum, b) => sum + b.value.split(/\s+/).filter(Boolean).length, 0),
  }
}

/**
 * Format article into a clean, standard JSON export string
 */
export function exportArticleToJson(article: any): string {
  const exportPayload = {
    title: article.title || 'Artikel Edukasi',
    category: article.category || 'Keamanan Pangan',
    author: article.author || 'Penulis KKPD-KP',
    authorBio: article.authorBio || 'Kader Edukator',
    status: article.status || 'Draft',
    readTime: Number(article.readTime) || 5,
    excerpt: article.excerpt || '',
    tags: Array.isArray(article.tags) ? article.tags : (article.tags || '').split(',').map((t: string) => t.trim()).filter(Boolean),
    embeddedDistributionCode: article.embeddedDistributionCode || '',
    featuredImage: article.featuredImage || '',
    blocks: Array.isArray(article.blocks) ? article.blocks : [],
    gallery: Array.isArray(article.gallery) ? article.gallery : [],
  }

  return JSON.stringify(exportPayload, null, 2)
}

/**
 * Provides a ready-to-use sample draft for users to try instant parsing
 */
export function getSampleDraftText(): string {
  return `Judul: Panduan Praktis 5 Kunci Keamanan Pangan Keluarga Sehat
Kategori: Keamanan Pangan
Penulis: Dr. Ahmad Hidayat, M.Si
Bio: Tim Pendamping Kader BPOM RI
Kode Distribusi: KKPDR48
Tags: #KeamananPangan, #KaderBPOM, #DapurSehat

Pangan yang aman dan bermutu adalah hak setiap anggota keluarga. Penanganan makanan yang higienis dapat mencegah risiko penyakit bawaan makanan (foodborne diseases) hingga lebih dari 80%.

1. Pentingnya Kebersihan Diri dan Peralatan
Menjaga kebersihan tangan dan alat masak merupakan benteng pertama pencegahan kuman patogen. Selalu cuci tangan menggunakan sabun dan air mengalir selama minimal 20 detik sebelum mengolah bahan pangan.

> "Pencegahan kontaminasi silang pada tahap persiapan jauh lebih mudah daripada menangani wabah keracunan makanan." - Petunjuk Teknis BPOM RI

2. Lima Langkah Kunci Keamanan Pangan
- Selalu jaga kebersihan area dapur dan tempat penyimpanan bahan makanan
- Pisahkan secara tegas bahan pangan mentah dari makanan yang siap saji
- Masak makanan hingga matang sempurna, terutama daging unggas dan seafood
- Simpan makanan pada suhu aman (di bawah 5°C untuk dingin atau di atas 60°C untuk panas)
- Gunakan air bersih terverifikasi dan bahan baku yang segar serta memiliki izin edar resmi

3. Mengenal Tanda Bahaya Pangan Tercemar
Perhatikan selalu tanggal kedaluwarsa, bentuk kemasan (tidak kembung, penyok, atau berkarat), serta aroma dan warna bahan makanan sebelum dikonsumsi.`
}
