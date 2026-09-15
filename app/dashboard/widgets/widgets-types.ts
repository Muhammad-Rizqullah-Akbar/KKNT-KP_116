import type { FormResponse, FormData as FormRecord } from '@/lib/repositories/forms.repo'
import type { IconName } from '@/components/ui/Icons'

// ============================================================================
// CONSTANTS & COLOR PALETTES
// ============================================================================

export const CHART_TYPES: { id: string; name: string; icon: IconName; desc: string }[] = [
  { id: 'bar', name: 'Bar Chart', icon: 'barChart', desc: 'Grafik batang vertikal per perbandingan opsional' },
  { id: 'pie', name: 'Pie / Donut', icon: 'pieChart', desc: 'Grafik lingkaran proporsi distribusi jawaban' },
  { id: 'line', name: 'Line Chart', icon: 'trendingUp', desc: 'Grafik tren kecenderungan dan garis pergerakan' },
  { id: 'number', name: 'Stat Score', icon: 'hash', desc: 'Kartu ringkasan angka & persentase akumulasi' },
  { id: 'matrix', name: 'Matrix Progress', icon: 'table', desc: 'Baris distribusi persen per opsi matriks/likert' },
]

export const COLOR_SCHEMES: { id: string; name: string; colors: string[] }[] = [
  { id: 'cyan', name: 'Ocean Cyan', colors: ['#06b6d4', '#22d3ee', '#38bdf8', '#60a5fa', '#a5f3fc'] },
  { id: 'violet', name: 'Deep Violet', colors: ['#8b5cf6', '#a78bfa', '#c4b5fd', '#d8b4fe', '#f3e8ff'] },
  { id: 'emerald', name: 'Mint Emerald', colors: ['#10b981', '#34d399', '#6ee7b7', '#a7f3d0', '#ecfdf5'] },
  { id: 'amber', name: 'Sunset Amber', colors: ['#f59e0b', '#fbbf24', '#fcd34d', '#fde68a', '#fef3c7'] },
  { id: 'rose', name: 'Neon Rose', colors: ['#f43f5e', '#fb7185', '#fda4af', '#fecdd3', '#ffe4e6'] },
  { id: 'blue', name: 'Electric Blue', colors: ['#3b82f6', '#60a5fa', '#93c5fd', '#bfdbfe', '#dbeafe'] },
]

export interface WidgetItem {
  id: string
  name: string
  formId: string
  formTitle: string
  questionId: string
  questionText: string
  chartType: 'bar' | 'pie' | 'line' | 'number' | 'matrix'
  enabled: boolean
  position: number
  config: {
    title: string
    colorScheme: string
    showLegend: boolean
    xLabel?: string
    yLabel?: string
  }
}

export interface StackedAccountingItem {
  id: string
  title: string
  mode: 'single' | 'dual'
  pretestFormId: string
  posttestFormId: string
  enabled: boolean
}

export type WidgetCmsData = {
  responses: FormResponse[]
  forms: FormRecord[]
  v15Forms: any[]
  users: any[]
  dynamicWidgets: WidgetItem[]
}

export interface MitraBreakdownItem {
  id: string
  name: string
  category: string
  pretestAvg: number
  posttestAvg: number
  delta: number
  passRate: number
  respondents: number
  hasData: boolean
}

export interface AccountingResult {
  avgPretest: number
  avgPosttest: number
  delta: number
  passRate: number
  totalRespondents: number
  preCount: number
  postCount: number
  hasData: boolean
  mitraBreakdown: MitraBreakdownItem[]
  preResponses: any[]
  postResponses: any[]
  matchedResponses: any[]
}

export interface ChartData {
  labels: string[]
  values: number[]
  isMock: boolean
}

export interface WidgetEditorConfig {
  title: string
  chartType: 'bar' | 'pie' | 'line' | 'number' | 'matrix'
  colorScheme: string
  showLegend: boolean
}
