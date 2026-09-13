import * as XLSX from 'xlsx'
import { getRespondentAspects } from './helpers'
import type { Respondent } from './types'
import type { FormData } from '@/lib/repositories/forms.repo'

export function exportRespondentsToExcel(
  filteredData: Respondent[],
  selectedForms: string[],
  forms: FormData[]
): void {
  const dataToExport = filteredData
  if (dataToExport.length === 0) return

  const wb = XLSX.utils.book_new()
  const formTitle = selectedForms.length === 1 ? selectedForms[0] : 'Semua Formulir'
  const exportDate = new Date().toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' })

  // Collect all aspect titles across exported dataset
  const aspectMap = new Map<string, { title: string; totalPct: number; count: number }>()
  dataToExport.forEach((r) => {
    const aspects = getRespondentAspects(r, forms)
    aspects.forEach((asp) => {
      const key = (asp.title || asp.aspectId).trim()
      if (!aspectMap.has(key)) {
        aspectMap.set(key, { title: asp.title, totalPct: asp.percentage, count: 1 })
      } else {
        const item = aspectMap.get(key)!
        item.totalPct += asp.percentage
        item.count += 1
      }
    })
  })

  // Sheet 1: Summary (STATISTIK TERMASUK RATA-RATA SKOR PER ASPEK)
  const total = dataToExport.length
  const avgScore = Math.round(dataToExport.reduce((sum, r) => sum + r.score, 0) / total)

  const summaryData: any[][] = [
    ['LAPORAN RESPONDEN'],
    [''],
    ['Formulir', formTitle],
    ['Tanggal Export', exportDate],
    [''],
    ['STATISTIK PENILAIAN'],
    ['Total Responden', total],
    ['Rata-rata Skor Overall', `${avgScore}%`],
  ]

  // Insert per-aspect average score rows directly into STATISTIK section as requested
  if (aspectMap.size > 0) {
    aspectMap.forEach((val) => {
      const avg = Math.round(val.totalPct / val.count)
      summaryData.push([`Rata-rata Skor (${val.title})`, `${avg}%`])
    })
  }

  summaryData.push(
    ['Terverifikasi', dataToExport.filter(r => r.status === 'Terverifikasi').length],
    ['Perlu Review', dataToExport.filter(r => r.status === 'Perlu Review').length],
    ['Perlu Tindak Lanjut', dataToExport.filter(r => r.status === 'Perlu Tindak Lanjut').length]
  )

  if (aspectMap.size > 0) {
    summaryData.push([''])
    summaryData.push(['RINGKASAN RATA-RATA PENILAIAN PER ASPEK'])
    summaryData.push(['Nama Aspek Penilaian', 'Rata-rata Skor (%)', 'Kategori Kelayakan'])
    aspectMap.forEach((val) => {
      const avg = Math.round(val.totalPct / val.count)
      const statusLbl = avg >= 80 ? 'Memenuhi Syarat (MS)' : avg >= 60 ? 'Binaan Lanjutan' : 'Perlu Perbaikan'
      summaryData.push([val.title, `${avg}%`, statusLbl])
    })
  }

  const ws1 = XLSX.utils.aoa_to_sheet(summaryData)
  ws1['!cols'] = [{ wch: 38 }, { wch: 22 }, { wch: 25 }]
  XLSX.utils.book_append_sheet(wb, ws1, 'Summary')

  // Sheet 2: Responden (Includes Per-Aspect Score Columns)
  const aspectTitles = Array.from(aspectMap.values()).map(aspect => aspect.title)

  const respData = dataToExport.map((r, i) => {
    const respAspects = getRespondentAspects(r, forms)
    const aspScoreObj: Record<string, string> = {}
    aspectTitles.forEach(t => {
      const found = respAspects.find(aspect => aspect.title === t)
      aspScoreObj[`[Aspek] ${t} (%)`] = found ? `${found.percentage}%` : '-'
    })

    return {
      'No': i + 1,
      'Nama Responden': r.respondentName || r.name,
      'Email': r.respondentEmail || '-',
      'Instansi / Sekolah': (r as any).institution || r.answers?.institution || r.answers?.instansi || '-',
      'Formulir': r.formTitle,
      'Group / Kode': r.groupName || '-',
      'Tanggal': r.date,
      'Skor Overall (%)': `${r.score}%`,
      'Metrik / Predikat': r.metric,
      ...aspScoreObj,
      'Status': r.status,
      'Total Soal': r.scoringDetails?.totalQuestions || 0,
    }
  })
  const ws2 = XLSX.utils.json_to_sheet(respData)
  const ws2Cols = [
    { wch: 5 }, { wch: 25 }, { wch: 25 }, { wch: 25 }, { wch: 30 }, { wch: 20 }, { wch: 12 },
    { wch: 16 }, { wch: 20 }
  ]
  aspectTitles.forEach(() => ws2Cols.push({ wch: 22 }))
  ws2Cols.push({ wch: 15 }, { wch: 10 })
  ws2['!cols'] = ws2Cols
  XLSX.utils.book_append_sheet(wb, ws2, 'Responden')

  // Sheet 3: Penilaian Per Aspek (Dedicated Breakdown Sheet)
  if (aspectMap.size > 0) {
    const aspectDetailRows: any[] = []
    dataToExport.forEach((r, i) => {
      const respAspects = getRespondentAspects(r, forms)
      respAspects.forEach((asp) => {
        aspectDetailRows.push({
          'No Responden': i + 1,
          'Nama Responden': r.respondentName || r.name,
          'Email': r.respondentEmail || '-',
          'Instansi / Sekolah': (r as any).institution || r.answers?.institution || r.answers?.instansi || '-',
          'Formulir': r.formTitle,
          'Skor Overall (%)': `${r.score}%`,
          'Nama Aspek Penilaian': asp.title,
          'Skor Aspek (%)': `${asp.percentage}%`,
          'Poin Terpenuhi': asp.rawScore,
          'Maksimum Poin': asp.maxScore,
          'Status Aspek': asp.percentage >= 80 ? 'Memenuhi Syarat (MS)' : asp.percentage >= 60 ? 'Binaan Lanjutan' : 'Perlu Perbaikan',
        })
      })
    })

    if (aspectDetailRows.length > 0) {
      const ws3 = XLSX.utils.json_to_sheet(aspectDetailRows)
      ws3['!cols'] = [
        { wch: 12 }, { wch: 25 }, { wch: 25 }, { wch: 25 }, { wch: 30 },
        { wch: 16 }, { wch: 30 }, { wch: 15 }, { wch: 14 }, { wch: 14 }, { wch: 22 }
      ]
      XLSX.utils.book_append_sheet(wb, ws3, 'Penilaian Per Aspek')
    }
  }

  // Sheet 4: Detail Jawaban
  const labelMap: Record<string, string> = {}
  forms.forEach(form => {
    form.questions?.forEach((q: any) => {
      labelMap[q.id] = q.question || q.label || q.id
    })
  })
  const allKeys = Array.from(new Set(dataToExport.flatMap(r => Object.keys(r.answers))))
    .filter(k => !['respondentName', 'respondentEmail', 'name', 'nama', 'email'].includes(k))
  if (allKeys.length > 0) {
    const detailData = dataToExport.map(r => {
      const row: Record<string, any> = { 'Nama Responden': r.respondentName || r.name }
      allKeys.forEach(key => {
        const label = labelMap[key] || key
        const val = r.answers[key]
        row[label] = val === null || val === undefined ? '-' :
          typeof val === 'object' ? JSON.stringify(val) : String(val)
      })
      return row
    })
    const ws4 = XLSX.utils.json_to_sheet(detailData)
    ws4['!cols'] = Object.keys(detailData[0]).map(k => ({ wch: Math.min(Math.max(k.length + 5, 20), 40) }))
    XLSX.utils.book_append_sheet(wb, ws4, 'Detail Jawaban')
  }

  const fileName = `Data_Responden_Penilaian_${formTitle.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.xlsx`
  XLSX.writeFile(wb, fileName)
}
