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
    const repaired = cleaned
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
