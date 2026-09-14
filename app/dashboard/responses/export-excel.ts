import ExcelJS from 'exceljs'
import type { ResponseDoc } from '@/lib/domain/responses/response-types'
import { getRespondentAspects } from './helpers'
import {
  createSheet,
  createSheetFromObjects,
  downloadWorkbook,
  summarizeAspects,
  aspectStatusLabel,
} from '@/lib/domain/export/excel-builder'

export async function exportResponsesToExcel(
  filteredResponses: ResponseDoc[],
  selectedFormId: string,
): Promise<void> {
  if (filteredResponses.length === 0) return

  const wb = new ExcelJS.Workbook()
  const formTitle = selectedFormId === 'all' ? 'Semua Formulir' : selectedFormId
  const exportDate = new Date().toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' })

  const aspectSummaries = summarizeAspects(
    filteredResponses.map((r) => getRespondentAspects(r)),
  )

  // Sheet 1: Summary
  const total = filteredResponses.length
  const scores = filteredResponses.map((r) => r.result?.percentage ?? 0)
  const avgScore = scores.length > 0 ? Math.round(scores.reduce((acc, s) => acc + s, 0) / total) : 0

  const summaryRows: (string | number)[][] = [
    ['LAPORAN HASIL EVALUASI & PENILAIAN RESPONDEN'],
    [''],
    ['Formulir', formTitle],
    ['Tanggal Export', exportDate],
    [''],
    ['STATISTIK OVERALL'],
    ['Total Responden Terverifikasi', total],
    ['Rata-rata Skor Overall', `${avgScore}%`],
    ['Memenuhi Syarat (MS >= 75%)', filteredResponses.filter((r) => (r.result?.percentage ?? 0) >= 75).length],
  ]
  if (aspectSummaries.length > 0) {
    summaryRows.push([''], ['RINGKASAN RATA-RATA PENILAIAN PER ASPEK'], ['Nama Aspek Penilaian', 'Rata-rata Skor (%)', 'Status Kelayakan'])
    aspectSummaries.forEach((a) => summaryRows.push([a.title, `${a.averagePct}%`, aspectStatusLabel(a.averagePct)]))
  }
  createSheet(wb, 'Summary', summaryRows, [35, 20, 25])

  // Sheet 2: Daftar Responden
  const aspectTitles = aspectSummaries.map((a) => a.title)
  const respData = filteredResponses.map((r, i) => {
    const respAspects = getRespondentAspects(r)
    const aspScoreObj: Record<string, string> = {}
    aspectTitles.forEach((t) => {
      const found = respAspects.find((aspect) => aspect.title === t)
      aspScoreObj[`[Aspek] ${t} (%)`] = found ? `${found.percentage}%` : '-'
    })
    return {
      'No': i + 1,
      'ID Respon': r.responseId,
      'Nama Responden': r.respondent?.name || 'Anonim',
      'Email': r.respondent?.email || '-',
      'No HP': r.respondent?.phone || '-',
      'Instansi / Sekolah': r.respondent?.institution || '-',
      'Formulir': r.formTitle || r.formId,
      'Kode Akses': r.distributionCode || '-',
      'Waktu Selesai': new Date(r.submittedAt || r.updatedAt || Date.now()).toLocaleString('id-ID'),
      'Skor Overall (%)': `${r.result?.percentage ?? 0}%`,
      'Grade': r.result?.grade || '-',
      ...aspScoreObj,
      'Status': r.status,
    }
  })
  createSheetFromObjects(wb, 'Daftar Responden', respData)

  // Sheet 3: Penilaian Per Aspek
  if (aspectSummaries.length > 0) {
    const aspectDetailRows: Record<string, any>[] = []
    filteredResponses.forEach((r, i) => {
      getRespondentAspects(r).forEach((asp) => {
        aspectDetailRows.push({
          'No Responden': i + 1,
          'ID Respon': r.responseId,
          'Nama Responden': r.respondent?.name || 'Anonim',
          'Instansi / Sekolah': r.respondent?.institution || '-',
          'Formulir': r.formTitle || r.formId,
          'Skor Overall (%)': `${r.result?.percentage ?? 0}%`,
          'Nama Aspek Penilaian': asp.title,
          'Skor Aspek (%)': `${asp.percentage}%`,
          'Status Aspek': aspectStatusLabel(asp.percentage),
        })
      })
    })
    if (aspectDetailRows.length > 0) createSheetFromObjects(wb, 'Penilaian Per Aspek', aspectDetailRows)
  }

  const fileName = `Laporan_Hasil_Evaluasi_${new Date().toISOString().split('T')[0]}.xlsx`
  await downloadWorkbook(wb, fileName)
}
