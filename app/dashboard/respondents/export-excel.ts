import ExcelJS from 'exceljs'
import { getRespondentAspects } from './helpers'
import {
  createSheet,
  createSheetFromObjects,
  downloadWorkbook,
  summarizeAspects,
  aspectStatusLabel,
} from '@/lib/domain/export/excel-builder'
import type { Respondent } from './types'
import type { FormData } from '@/lib/repositories/forms.repo'

export async function exportRespondentsToExcel(
  filteredData: Respondent[],
  selectedForms: string[],
  forms: FormData[],
): Promise<void> {
  if (filteredData.length === 0) return

  const wb = new ExcelJS.Workbook()
  const formTitle = selectedForms.length === 1 ? selectedForms[0] : 'Semua Formulir'
  const exportDate = new Date().toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' })

  // Aspect summaries (single pass, reused across sheets)
  const aspectSummaries = summarizeAspects(
    filteredData.map((r) => getRespondentAspects(r, forms)),
  )

  // Sheet 1: Summary
  const total = filteredData.length
  const avgScore = Math.round(filteredData.reduce((sum, r) => sum + r.score, 0) / total)

  const summaryRows: (string | number)[][] = [
    ['LAPORAN RESPONDEN'],
    [''],
    ['Formulir', formTitle],
    ['Tanggal Export', exportDate],
    [''],
    ['STATISTIK PENILAIAN'],
    ['Total Responden', total],
    ['Rata-rata Skor Overall', `${avgScore}%`],
  ]
  aspectSummaries.forEach((a) => summaryRows.push([`Rata-rata Skor (${a.title})`, `${a.averagePct}%`]))
  summaryRows.push(
    ['Terverifikasi', filteredData.filter((r) => r.status === 'Terverifikasi').length],
    ['Perlu Review', filteredData.filter((r) => r.status === 'Perlu Review').length],
    ['Perlu Tindak Lanjut', filteredData.filter((r) => r.status === 'Perlu Tindak Lanjut').length],
  )
  if (aspectSummaries.length > 0) {
    summaryRows.push([''], ['RINGKASAN RATA-RATA PENILAIAN PER ASPEK'], ['Nama Aspek Penilaian', 'Rata-rata Skor (%)', 'Kategori Kelayakan'])
    aspectSummaries.forEach((a) => summaryRows.push([a.title, `${a.averagePct}%`, aspectStatusLabel(a.averagePct)]))
  }
  createSheet(wb, 'Summary', summaryRows, [38, 22, 25])

  // Sheet 2: Responden (dengan kolom per-aspek)
  const aspectTitles = aspectSummaries.map((a) => a.title)
  const respData = filteredData.map((r, i) => {
    const respAspects = getRespondentAspects(r, forms)
    const aspScoreObj: Record<string, string> = {}
    aspectTitles.forEach((t) => {
      const found = respAspects.find((aspect) => aspect.title === t)
      aspScoreObj[`[Aspek] ${t} (%)`] = found ? `${found.percentage}%` : '-'
    })
    return {
      'No': i + 1,
      'Nama Responden': r.respondentName || r.name,
      'Email': r.respondentEmail || '-',
      'Instansi / Sekolah': (r as any).institution || r.answers?.institution || r.answers?.instansi || '-',
      'Formulir': r.formTitle,
      'Tanggal': r.date,
      'Skor Overall (%)': `${r.score}%`,
      'Metrik / Predikat': r.metric,
      ...aspScoreObj,
      'Status': r.status,
      'Total Soal': (r as any).result?.questions?.length || 0,
    }
  })
  createSheetFromObjects(wb, 'Responden', respData)

  // Sheet 3: Penilaian Per Aspek (breakdown)
  if (aspectSummaries.length > 0) {
    const aspectDetailRows: Record<string, any>[] = []
    filteredData.forEach((r, i) => {
      getRespondentAspects(r, forms).forEach((asp) => {
        aspectDetailRows.push({
          'No Responden': i + 1,
          'Nama Responden': r.respondentName || r.name,
          'Formulir': r.formTitle,
          'Skor Overall (%)': `${r.score}%`,
          'Nama Aspek Penilaian': asp.title,
          'Skor Aspek (%)': `${asp.percentage}%`,
          'Status Aspek': aspectStatusLabel(asp.percentage),
        })
      })
    })
    if (aspectDetailRows.length > 0) createSheetFromObjects(wb, 'Penilaian Per Aspek', aspectDetailRows)
  }

  // Sheet 4: Detail Jawaban
  const labelMap: Record<string, string> = {}
  forms.forEach((form) => {
    form.questions?.forEach((q: any) => {
      labelMap[q.id] = q.question || q.label || q.id
    })
  })
  const allKeys = Array.from(new Set(filteredData.flatMap((r) => Object.keys(r.answers))))
    .filter((k) => !['respondentName', 'respondentEmail', 'name', 'nama', 'email'].includes(k))
  if (allKeys.length > 0) {
    const detailData = filteredData.map((r) => {
      const row: Record<string, any> = { 'Nama Responden': r.respondentName || r.name }
      allKeys.forEach((key) => {
        const label = labelMap[key] || key
        const val = r.answers[key]
        row[label] = val === null || val === undefined ? '-' : typeof val === 'object' ? JSON.stringify(val) : String(val)
      })
      return row
    })
    createSheetFromObjects(wb, 'Detail Jawaban', detailData)
  }

  const fileName = `Data_Responden_Penilaian_${formTitle.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.xlsx`
  await downloadWorkbook(wb, fileName)
}
