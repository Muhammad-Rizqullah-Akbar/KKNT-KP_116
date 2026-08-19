import assert from 'node:assert/strict'
import { test, describe } from 'node:test'
import {
  parseRawTextToArticle,
  cleanAndRepairJson,
  exportArticleToJson,
  inferCategoryFromContent,
  getSampleDraftText,
} from '../lib/cms/smartArticleParser'

describe('Smart Article Parser (Zero-AI Deterministic Engine)', () => {

  test('parseRawTextToArticle correctly parses unstructured raw text draft', () => {
    const rawDraft = getSampleDraftText()
    const parsed = parseRawTextToArticle(rawDraft)

    // Verify Title & Metadata
    assert.equal(parsed.title, 'Panduan Praktis 5 Kunci Keamanan Pangan Keluarga Sehat')
    assert.equal(parsed.category, 'Keamanan Pangan')
    assert.equal(parsed.author, 'Dr. Ahmad Hidayat, M.Si')
    assert.equal(parsed.authorBio, 'Tim Pendamping Kader BPOM RI')
    assert.equal(parsed.embeddedDistributionCode, 'KKPDR48')
    assert.ok(parsed.tags.includes('KeamananPangan'))
    assert.ok(parsed.tags.includes('KaderBPOM'))

    // Verify Blocks extraction
    assert.ok(parsed.blocks.length >= 5)

    // Sub-headings (h2)
    const h2Blocks = parsed.blocks.filter((b) => b.type === 'h2')
    assert.ok(h2Blocks.length >= 2, 'Should detect sub-headings')
    assert.ok(h2Blocks[0].value.includes('Pentingnya Kebersihan Diri'))
    assert.ok(h2Blocks[1].value.includes('Lima Langkah Kunci Keamanan Pangan'))

    // Quotes (quote)
    const quoteBlocks = parsed.blocks.filter((b) => b.type === 'quote')
    assert.equal(quoteBlocks.length, 1)
    assert.ok(quoteBlocks[0].value.includes('Pencegahan kontaminasi silang'))
    assert.equal(quoteBlocks[0].quoteAuthor, 'Petunjuk Teknis BPOM RI')

    // Lists (list)
    const listBlocks = parsed.blocks.filter((b) => b.type === 'list')
    assert.ok(listBlocks.length >= 4, 'Should detect bullet list items')
    assert.ok(listBlocks[0].value.includes('Selalu jaga kebersihan area dapur'))

    // Paragraphs (p)
    const pBlocks = parsed.blocks.filter((b) => b.type === 'p')
    assert.ok(pBlocks.length >= 2)
  })

  test('inferCategoryFromContent accurately predicts category from keywords', () => {
    assert.equal(inferCategoryFromContent('Edukasi Bahaya Boraks dan Formalin BPOM'), 'Keamanan Pangan')
    assert.equal(inferCategoryFromContent('Integrasi Aplikasi dan Sistem Website Digital'), 'Teknologi')
    assert.equal(inferCategoryFromContent('Peraturan dan Izin Edar Standar BPOM RI'), 'Regulasi')
    assert.equal(inferCategoryFromContent('10 Tips & Trik Memilih Ikan Segar di Pasar'), 'Tips & Trik')
    assert.equal(inferCategoryFromContent('Laporan Kegiatan KKN Sosialisasi di Desa'), 'Berita')
  })

  test('cleanAndRepairJson safely repairs common JSON formatting issues', () => {
    // Trailing comma test
    const brokenJson = `{
      "title": "Materi Uji",
      "category": "Edukasi",
      "blocks": [
        { "type": "p", "value": "Isi..." },
      ],
    }`
    const result = cleanAndRepairJson(brokenJson)
    assert.equal(result.success, true)
    assert.equal(result.data.title, 'Materi Uji')

    // Markdown fence test
    const markdownFencedJson = `\`\`\`json
    {
      "title": "Artikel Markdown",
      "category": "Teknologi"
    }
    \`\`\``
    const result2 = cleanAndRepairJson(markdownFencedJson)
    assert.equal(result2.success, true)
    assert.equal(result2.data.title, 'Artikel Markdown')
  })

  test('exportArticleToJson produces valid pretty-printed JSON schema', () => {
    const sampleArticle = {
      title: 'Artikel Ekspor',
      category: 'Teknologi',
      author: 'Admin',
      authorBio: 'Editor',
      status: 'Published',
      readTime: 4,
      excerpt: 'Ringkasan singkat artikel',
      tags: ['Pangan', 'Edukasi'],
      embeddedDistributionCode: 'KKPDXYZ',
      featuredImage: 'https://example.com/image.jpg',
      blocks: [
        { id: 'b1', type: 'h2', value: '1. Subjudul' },
        { id: 'b2', type: 'p', value: 'Paragraf isi...' },
      ],
      gallery: [],
    }

    const exportedString = exportArticleToJson(sampleArticle)
    assert.ok(typeof exportedString === 'string')

    const reParsed = JSON.parse(exportedString)
    assert.equal(reParsed.title, 'Artikel Ekspor')
    assert.equal(reParsed.embeddedDistributionCode, 'KKPDXYZ')
    assert.equal(reParsed.blocks.length, 2)
  })
})
