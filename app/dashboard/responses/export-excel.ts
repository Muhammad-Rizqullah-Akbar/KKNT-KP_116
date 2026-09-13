import * as XLSX from 'xlsx'
import type { ResponseDoc } from '@/lib/domain/responses/response-types'
import { getRespondentAspects } from './helpers'

export function exportResponsesToExcel(filteredResponses: ResponseDoc[], selectedFormId: string): void {
  const dataToExport = filteredResponses
  if (dataToExport.length === 0) return

  const wb = XLSX.utils.book_new()
  const formTitle = selectedFormId === 'all' ? 'Semua Formulir' : selectedFormId
  const exportDate = new Date().toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' })

  // Collect all aspect titles
  const aspectMap = new Map<string, { title: string; totalPct: number; count: number }>()
  dataToExport.forEach((r) => {
    const aspects = getRespondentAspects(r)
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

  // Sheet 1: Summary
  const total = dataToExport.length
  const scores = dataToExport.map(r => r.result?.percentage ?? 0)
  const avgScore = scores.length > 0 ? Math.round(scores.reduce((acc, scoreVal) => acc + scoreVal, 0) / total) : 0

  const summaryData: any[][] = [
    ['LAPORAN HASIL EVALUASI & PENILAIAN RESPONDEN'],
    [''],
    ['Formulir', formTitle],
    ['Tanggal Export', exportDate],
    [''],
    ['STATISTIK OVERALL'],
    ['Total Responden Terverifikasi', total],
    ['Rata-rata Skor Overall', `${avgScore}%`],
    ['Memenuhi Syarat (MS >= 75%)', dataToExport.filter(r => (r.result?.percentage ?? 0) >= 75).length],
  ]

  if (aspectMap.size > 0) {
    summaryData.push([''])
    summaryData.push(['RINGKASAN RATA-RATA PENILAIAN PER ASPEK'])
    summaryData.push(['Nama Aspek Penilaian', 'Rata-rata Skor (%)', 'Status Kelayakan'])
    aspectMap.forEach((val) => {
      const avg = Math.round(val.totalPct / val.count)
      const statusLbl = avg >= 80 ? 'Memenuhi Syarat (MS)' : avg >= 60 ? 'Binaan Lanjutan' : 'Perlu Perbaikan'
      summaryData.push([val.title, `${avg}%`, statusLbl])
    })
  }

  const ws1 = XLSX.utils.aoa_to_sheet(summaryData)
  ws1['!cols'] = [{ wch: 35 }, { wch: 20 }, { wch: 25 }]
  XLSX.utils.book_append_sheet(wb, ws1, 'Summary')

  // Sheet 2: Responden (With Per-Aspect Columns)
  const aspectTitles = Array.from(aspectMap.values()).map(aspect => aspect.title)

  const respData = dataToExport.map((r, i) => {
    const respAspects = getRespondentAspects(r)
    const aspScoreObj: Record<string, string> = {}
    aspectTitles.forEach(t => {
      const found = respAspects.find(aspect => aspect.title === t)
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
      'Predikat / Threshold': r.result?.thresholdTitle || '-',
      ...aspScoreObj,
      'Status': r.status,
    }
  })

  const ws2 = XLSX.utils.json_to_sheet(respData)
  const ws2Cols = [
    { wch: 5 }, { wch: 20 }, { wch: 25 }, { wch: 25 }, { wch: 15 }, { wch: 25 },
    { wch: 30 }, { wch: 15 }, { wch: 20 }, { wch: 16 }, { wch: 10 }, { wch: 25 }
  ]
  aspectTitles.forEach(() => ws2Cols.push({ wch: 22 }))
  ws2Cols.push({ wch: 12 })
  ws2['!cols'] = ws2Cols
  XLSX.utils.book_append_sheet(wb, ws2, 'Daftar Responden')

  // Sheet 3: Penilaian Per Aspek
  if (aspectMap.size > 0) {
    const aspectDetailRows: any[] = []
    dataToExport.forEach((r, i) => {
      const respAspects = getRespondentAspects(r)
      respAspects.forEach((asp) => {
        aspectDetailRows.push({
          'No Responden': i + 1,
          'ID Respon': r.responseId,
          'Nama Responden': r.respondent?.name || 'Anonim',
          'Instansi / Sekolah': r.respondent?.institution || '-',
          'Formulir': r.formTitle || r.formId,
          'Skor Overall (%)': `${r.result?.percentage ?? 0}%`,
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
        { wch: 12 }, { wch: 20 }, { wch: 25 }, { wch: 25 }, { wch: 30 },
        { wch: 16 }, { wch: 30 }, { wch: 15 }, { wch: 14 }, { wch: 14 }, { wch: 22 }
      ]
      XLSX.utils.book_append_sheet(wb, ws3, 'Penilaian Per Aspek')
    }
  }

  const fileName = `Laporan_Hasil_Evaluasi_${new Date().toISOString().split('T')[0]}.xlsx`
  XLSX.writeFile(wb, fileName)
}
