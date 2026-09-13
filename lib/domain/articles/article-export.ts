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
