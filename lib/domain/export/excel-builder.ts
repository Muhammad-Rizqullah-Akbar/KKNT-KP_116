/**
 * Excel builder — single source of truth untuk export .xlsx (via exceljs).
 *
 * Alasan pakai exceljs (bukan xlsx/SheetJS): xlsx punya 12 known vulnerabilities
 * (ReDoS, prototype pollution) tanpa fix resmi. exceljs lebih aman & maintained.
 *
 * Helper ini menyediakan primitives agar sheet Summary / Responden / Per-Aspek
 * dibangun konsisten tanpa duplikasi antar halaman.
 */

import ExcelJS from 'exceljs'

export type AspectSummary = {
  title: string
  averagePct: number
}

export type CellRow = (string | number)[]

/** Status kelayakan berdasarkan persentase (konsisten di seluruh laporan). */
export function aspectStatusLabel(pct: number): string {
  if (pct >= 80) return 'Memenuhi Syarat (MS)'
  if (pct >= 60) return 'Binaan Lanjutan'
  return 'Perlu Perbaikan'
}

/** Hitung rata-rata per-aspek dari daftar {title, percentage}. */
export function summarizeAspects(
  rows: Array<{ title: string; percentage: number }[]>,
): AspectSummary[] {
  const map = new Map<string, { total: number; count: number }>()
  rows.forEach((aspects) => {
    aspects.forEach((asp) => {
      const key = (asp.title || '').trim()
      if (!key) return
      const entry = map.get(key) ?? { total: 0, count: 0 }
      entry.total += asp.percentage
      entry.count += 1
      map.set(key, entry)
    })
  })
  return Array.from(map.entries()).map(([title, v]) => ({
    title,
    averagePct: Math.round(v.total / v.count),
  }))
}

/** Buat workbook + worksheet dari array of rows. */
export function createSheet(
  wb: ExcelJS.Workbook,
  name: string,
  rows: CellRow[],
  colWidths: number[],
): ExcelJS.Worksheet {
  const ws = wb.addWorksheet(name)
  rows.forEach((row, ri) => {
    const wsRow = ws.addRow(row)
    // Bold + styling untuk baris judul (baris pertama / baris section header)
    if (ri === 0) {
      wsRow.eachCell((cell) => {
        cell.font = { bold: true, size: 13 }
      })
    }
  })
  ws.columns = colWidths.map((width) => ({ width }))
  return ws
}

/** Buat worksheet dari array of object (header otomatis dari key). */
export function createSheetFromObjects<T extends Record<string, any>>(
  wb: ExcelJS.Workbook,
  name: string,
  rows: T[],
): ExcelJS.Worksheet {
  if (rows.length === 0) return wb.addWorksheet(name)
  const headers = Object.keys(rows[0])
  const ws = wb.addWorksheet(name)
  const headerRow = ws.addRow(headers)
  headerRow.font = { bold: true }
  rows.forEach((row) => {
    ws.addRow(headers.map((h) => row[h]))
  })
  ws.columns = headers.map((h) => ({ width: Math.min(Math.max(String(h).length + 4, 14), 40) }))
  return ws
}

/** Trigger download file .xlsx dari workbook. */
export async function downloadWorkbook(wb: ExcelJS.Workbook, fileName: string): Promise<void> {
  const buffer = await wb.xlsx.writeBuffer()
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = fileName
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}
