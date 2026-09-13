// ============ UTIL MURNI (tanpa React state) untuk artikel ============
import type { ContentBlock } from './articles-types'

// PARSE HTML STRING MENJADI BLOK KONTEN TERSTRUKTUR
export function htmlToBlocks(html: string): ContentBlock[] {
  if (!html) return [{ id: 'b1', type: 'p', value: '' }]
  const blocks: ContentBlock[] = []
  const div = document.createElement('div')
  div.innerHTML = html

  Array.from(div.children).forEach((child, index) => {
    if (child.tagName === 'H2') {
      blocks.push({ id: `b-${index}`, type: 'h2', value: child.textContent || '' })
    } else if (child.tagName === 'BLOCKQUOTE') {
      const text = child.firstChild?.textContent?.replace(/^[\"']|[\"']$/g, '') || ''
      const cite = child.querySelector('cite')?.textContent?.replace('— ', '') || ''
      blocks.push({ id: `b-${index}`, type: 'quote', value: text, quoteAuthor: cite })
    } else if (child.tagName === 'UL') {
      Array.from(child.children).forEach((li, liIdx) => {
        blocks.push({ id: `b-${index}-${liIdx}`, type: 'list', value: li.textContent || '' })
      })
    } else if (child.tagName === 'FIGURE' || child.tagName === 'IMG') {
      const img = child.tagName === 'FIGURE' ? child.querySelector('img') : child
      const caption = child.querySelector('figcaption')?.textContent || ''
      blocks.push({ id: `b-${index}`, type: 'image', value: '', imageUrl: img?.getAttribute('src') || '', imageCaption: caption })
    } else {
      blocks.push({ id: `b-${index}`, type: 'p', value: child.textContent || '' })
    }
  })

  return blocks.length > 0 ? blocks : [{ id: 'b1', type: 'p', value: html.replace(/<[^>]*>?/gm, '') }]
}

// COMPILE BLOK KONTEN MENJADI STRING HTML
export function compileBlocksToHtml(blocks: ContentBlock[]): string {
  return blocks.map(block => {
    if (block.type === 'h2') return `<h2>${block.value}</h2>`
    if (block.type === 'quote') return `<blockquote>\"${block.value}\"<cite class=\"block text-xs text-white/40 mt-2 not-italic\">— ${block.quoteAuthor || 'Anonim'}</cite></blockquote>`
    if (block.type === 'list') return `<ul><li>${block.value}</li></ul>`
    if (block.type === 'image') return `<figure class=\"my-6\"><img src=\"${block.imageUrl}\" alt=\"${block.imageCaption || 'Media'}\" class=\"w-full rounded-2xl border border-white/[0.08]\" />${block.imageCaption ? `<figcaption class=\"text-center text-xs text-white/40 mt-2 italic\">${block.imageCaption}</figcaption>` : ''}</figure>`
    return `<p>${block.value}</p>`
  }).join('\n')
}

// TEMPLATE JSON CONTOH (diunduh sebagai starter kit impor)
export const sampleJsonTemplate = {
  title: 'Edukasi Keamanan Pangan & Tata Cara Evaluasi Mandiri',
  category: 'Teknologi',
  author: 'Dr. Ahmad Hidayat',
  authorBio: 'Kader Utama BPOM Pendamping Lapangan',
  readTime: 5,
  excerpt: 'Panduan praktis bagi masyarakat dan kader dalam menjaga kebersihan serta higiene sanitasi pangan.',
  tags: '#KeamananPangan, #EdukasiBPOM, #KaderSehat',
  embeddedDistributionCode: 'KKPDR48',
  featuredImage: 'https://images.unsplash.com/photo-1576867757603-05b134ebc379?auto=format&fit=crop&w=1200&q=80',
  blocks: [
    {
      id: 'b1',
      type: 'h2',
      value: '1. Pentingnya Keamanan Pangan di Lingkungan Masyarakat'
    },
    {
      id: 'b2',
      type: 'p',
      value: 'Pangan yang aman merupakan fondasi utama dalam menjaga kesehatan masyarakat. Penanganan yang buruk dapat memicu terjadinya penyakit akibat kontaminasi bakteri.'
    },
    {
      id: 'b3',
      type: 'quote',
      value: 'Mencegah kontaminasi pangan jauh lebih efisien daripada mengobati dampak penyakit yang ditimbulkannya.',
      quoteAuthor: 'Panduan Keamanan Pangan BPOM'
    },
    {
      id: 'b4',
      type: 'h2',
      value: '2. Lima Kunci Keamanan Pangan yang Wajib Diterapkan'
    },
    {
      id: 'b5',
      type: 'p',
      value: '1) Jagalah kebersihan. 2) Pisahkan bahan mentah dan matang. 3) Masaklah dengan benar. 4) Jaga pangan pada suhu aman. 5) Gunakan air dan bahan baku yang aman.'
    }
  ],
  gallery: [
    {
      id: 'g1',
      caption: 'Kegiatan Pendampingan Kader di Lapangan',
      url: 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=800&q=80'
    }
  ]
}

// Unduh blob sebagai file JSON di browser
export function downloadJsonFile(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = filename
  document.body.appendChild(anchor)
  anchor.click()
  document.body.removeChild(anchor)
  URL.revokeObjectURL(url)
}

export function downloadJsonTemplate() {
  const blob = new Blob([JSON.stringify(sampleJsonTemplate, null, 2)], { type: 'application/json' })
  downloadJsonFile(blob, 'template_artikel_edukasi.json')
}
