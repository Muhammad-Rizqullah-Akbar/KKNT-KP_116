import type { ParsedArticle, ArticleBlock, ArticleGalleryItem } from './article-types'
import { DEFAULT_GRADIENTS } from './article-types'
import { inferCategoryFromContent, cleanAndRepairJson } from './article-category'
import { normalizeJsonToArticle } from './article-json-normalizer'

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
