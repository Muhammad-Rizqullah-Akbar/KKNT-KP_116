// components/form-builder/ElementTypes.ts

export type MediaType = 'none' | 'image' | 'video' | 'file'

export type AnswerType = 
  | 'single-choice'
  | 'multiple-choice'
  | 'dropdown'
  | 'short-text'
  | 'long-text'
  | 'indicator-table'
  | 'rating'
  | 'date'
  | 'number'
  | 'file-upload'
  | 'signature'

export type IdentifierType = 'none' | 'name' | 'location' | 'email' | 'phone' | 'custom'

export type ScoringScheme = 'none' | 'binary' | 'likert' | 'rating' | 'indicator'

export interface IndicatorItem {
  id: string
  label: string
  weight?: number
}

export interface IndicatorScale {
  value: number
  label: string
}

export interface FlexibleQuestion {
  id: string
  question: string
  description?: string
  required: boolean
  order: number
  
  media: {
    type: MediaType
    url?: string
    caption?: string
  }
  
  answerType: AnswerType
  
  config: {
    // Untuk pilihan (single-choice, multiple-choice, dropdown)
    options?: string[]
    // Untuk text (short-text, long-text)
    placeholder?: string
    minLength?: number
    maxLength?: number
    // Untuk number
    min?: number
    max?: number
    step?: number
    // Untuk indicator-table
    indicators?: IndicatorItem[]
    indicatorScales?: IndicatorScale[]
    indicatorColumns?: number
    showTotalScore?: boolean
    showWeightedScore?: boolean
    indicatorTitle?: string
    // Untuk rating
    ratingMin?: number
    ratingMax?: number
    // Untuk date
    dateFormat?: string
    // Untuk file-upload
    fileTypes?: string[]
    maxFileSize?: number
    // Untuk single-choice (scoring)
    correctAnswer?: string
    scoreCorrect?: number
    scoreIncorrect?: number
    // Untuk signature
    signatureWidth?: number
    signatureHeight?: number
    signaturePenColor?: string
    signatureBgColor?: string
    signatureLabel?: string
  }
  
  isIdentifier: boolean
  identifierType: IdentifierType
  
  scoring: {
    scheme: ScoringScheme
    weight: number
  }
}

// ============ DEFAULT CONFIG PER TIPE ============
export const getDefaultConfig = (answerType: AnswerType): FlexibleQuestion['config'] => {
  switch (answerType) {
    case 'single-choice':
    case 'multiple-choice':
    case 'dropdown':
      return { options: ['Opsi 1', 'Opsi 2', 'Opsi 3'] }
    case 'short-text':
      return { placeholder: 'Tulis jawaban...', minLength: 0, maxLength: 200 }
    case 'long-text':
      return { placeholder: 'Tulis jawaban panjang...', minLength: 0, maxLength: 1000 }
    case 'number':
      return { min: 0, max: 100, step: 1 }
    case 'indicator-table':
      return {
        indicators: [
          { id: 'ind-1', label: 'Pertanyaan 1', weight: 1 },
          { id: 'ind-2', label: 'Pertanyaan 2', weight: 1 },
          { id: 'ind-3', label: 'Pertanyaan 3', weight: 1 },
        ],
        indicatorScales: [
          { value: 1, label: 'STS' },
          { value: 2, label: 'TS' },
          { value: 3, label: 'N' },
          { value: 4, label: 'S' },
          { value: 5, label: 'SS' },
        ],
        indicatorColumns: 5,
        showTotalScore: false,
        showWeightedScore: false,
        indicatorTitle: 'Pertanyaan',
      }
    case 'signature':
      return {
        signatureWidth: 400,
        signatureHeight: 200,
        signaturePenColor: '#000000',
        signatureBgColor: '#ffffff',
        signatureLabel: 'Tanda Tangan',
      }
    case 'rating':
      return { ratingMin: 1, ratingMax: 5 }
    case 'date':
      return { dateFormat: 'DD/MM/YYYY' }
    case 'file-upload':
      return { fileTypes: ['image/*', 'application/pdf'], maxFileSize: 5 }
    default:
      return {}
  }
}

// ============ CREATE FLEXIBLE QUESTION ============
export const createFlexibleQuestion = (
  answerType: AnswerType,
  question?: string
): FlexibleQuestion => {
  return {
    id: `q-${Date.now()}`,
    question: question || (
      answerType === 'indicator-table' ? 'Tabel Pertanyaan' :
      answerType === 'signature' ? 'Tanda Tangan' :
      'Pertanyaan baru'
    ),
    description: '',
    required: false,
    order: 0,
    media: { type: 'none' },
    answerType,
    config: getDefaultConfig(answerType),
    isIdentifier: false,
    identifierType: 'none',
    scoring: { 
      scheme: answerType === 'indicator-table' ? 'indicator' : 
              answerType === 'single-choice' ? 'binary' : 'none', 
      weight: 1 
    },
  }
}

// ============ GET ANSWER TYPE LABEL ============
export const getAnswerTypeLabel = (type: AnswerType): string => {
  const labels: Record<AnswerType, string> = {
    'single-choice': 'Pilihan Ganda (Single)',
    'multiple-choice': 'Pilihan Ganda (Multi)',
    'dropdown': 'Dropdown',
    'short-text': 'Jawaban Singkat',
    'long-text': 'Jawaban Panjang',
    'indicator-table': 'Tabel Pertanyaan',
    'signature': 'Tanda Tangan',
    'rating': 'Rating',
    'date': 'Tanggal',
    'number': 'Angka',
    'file-upload': 'Upload File',
  }
  return labels[type] || type
}

// ============ ANSWER TYPES LIST ============
export const ANSWER_TYPES: { value: AnswerType; label: string; icon: string }[] = [
  { value: 'single-choice', label: 'Pilihan Ganda (Single)', icon: 'circleDot' },
  { value: 'multiple-choice', label: 'Pilihan Ganda (Multi)', icon: 'squareCheck' },
  { value: 'dropdown', label: 'Dropdown', icon: 'chevronDown' },
  { value: 'short-text', label: 'Jawaban Singkat', icon: 'type' },
  { value: 'long-text', label: 'Jawaban Panjang', icon: 'alignLeft' },
  { value: 'indicator-table', label: 'Tabel Pertanyaan', icon: 'table' },
  { value: 'signature', label: 'Tanda Tangan', icon: 'edit' },
  { value: 'rating', label: 'Rating', icon: 'star' },
  { value: 'date', label: 'Tanggal', icon: 'calendar' },
  { value: 'number', label: 'Angka', icon: 'hash' },
  { value: 'file-upload', label: 'Upload File', icon: 'upload' },
]

// ============ MEDIA TYPES ============
export const MEDIA_TYPES: { value: MediaType; label: string; icon: string }[] = [
  { value: 'none', label: 'Tanpa Media', icon: 'x' },
  { value: 'image', label: 'Gambar', icon: 'image' },
  { value: 'video', label: 'Video', icon: 'image' },
  { value: 'file', label: 'File', icon: 'fileText' },
]

// ============ IDENTIFIER TYPES ============
export const IDENTIFIER_TYPES: { value: IdentifierType; label: string }[] = [
  { value: 'none', label: 'Tidak' },
  { value: 'name', label: '🏷️ Nama Responden' },
  { value: 'location', label: '📍 Lokasi / Asal' },
  { value: 'email', label: '📧 Email' },
  { value: 'phone', label: '📞 Telepon' },
  { value: 'custom', label: '🔖 Custom' },
]

// ============ SCORING SCHEMES ============
export const SCORING_SCHEMES: { value: ScoringScheme; label: string }[] = [
  { value: 'none', label: 'Tidak Dinilai' },
  { value: 'binary', label: '✅ Benar/Salah' },
  { value: 'likert', label: '📊 Skala' },
  { value: 'rating', label: '⭐ Rating' },
  { value: 'indicator', label: '📋 Indikator' },
]

// ============ CATEGORIES ============
export const CATEGORIES = [
  { id: 'all', label: 'Semua', icon: 'grid' },
  { id: 'Input', label: 'Input', icon: 'type' },
  { id: 'Pilihan', label: 'Pilihan', icon: 'circleDot' },
  { id: 'Skala', label: 'Skala', icon: 'barChart' },
  { id: 'Tabel', label: 'Tabel', icon: 'table' },
  { id: 'Media', label: 'Media', icon: 'image' },
  { id: 'Layout', label: 'Layout', icon: 'layout' },
]

// ============ ELEMENTS ============
export const ELEMENTS = ANSWER_TYPES.map((type) => ({
  id: type.value,
  type: type.value as AnswerType,
  label: type.label,
  icon: type.icon,
  category: getCategoryForAnswerType(type.value),
  description: getDescriptionForAnswerType(type.value),
  defaultProps: getDefaultConfig(type.value),
}))

function getCategoryForAnswerType(type: AnswerType): 'Input' | 'Pilihan' | 'Skala' | 'Tabel' | 'Media' | 'Layout' {
  if (['short-text', 'long-text', 'number', 'date'].includes(type)) return 'Input'
  if (['single-choice', 'multiple-choice', 'dropdown'].includes(type)) return 'Pilihan'
  if (['rating'].includes(type)) return 'Skala'
  if (['indicator-table'].includes(type)) return 'Tabel'
  if (['file-upload', 'signature'].includes(type)) return 'Media'
  return 'Input'
}

function getDescriptionForAnswerType(type: AnswerType): string {
  const descriptions: Record<AnswerType, string> = {
    'single-choice': 'Pilih satu dari beberapa opsi',
    'multiple-choice': 'Pilih beberapa opsi',
    'dropdown': 'Pilih dari dropdown',
    'short-text': 'Input teks satu baris',
    'long-text': 'Input teks multi-baris',
    'indicator-table': 'Tabel pertanyaan dengan skala (STS-SS, Ya/Tidak, dll)',
    'signature': 'Canvas tanda tangan digital',
    'rating': 'Rating 1-5 / 1-10',
    'date': 'Pilih tanggal',
    'number': 'Input angka',
    'file-upload': 'Upload file',
  }
  return descriptions[type] || ''
}