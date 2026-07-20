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

// ============================================================
// FORM STAGE, VALIDATION, SCORING TYPES
// ============================================================

export interface FormStage {
  id: string
  name: string
  order: number
  questionIds: string[]
  includeInScoring: boolean
}

export interface FormValidation {
  mode: 'all_required' | 'all_required_except' | 'free'
  exceptions: string[]
  allowOverride: boolean
}

export interface ScoringOverride {
  points: number
  defaultPoints: number
  reason?: string
}

export interface FormScoring {
  totalPoints: number
  mode: 'auto' | 'hybrid' | 'manual'
  distribution: Record<string, number>
  overrides: Record<string, ScoringOverride>
  allowOverride: boolean
  autoBalance: boolean
  lastBalancedAt?: string
}

// ============================================================
// INDICATOR TYPES
// ============================================================

export interface IndicatorItem {
  id: string
  label: string
  weight?: number
  reverse?: boolean
}

export interface IndicatorScale {
  value: number
  label: string
}

// ============================================================
// FLEXIBLE QUESTION
// ============================================================

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
    // ===== SCORING CONFIG =====
    // Untuk single-choice
    correctAnswer?: string | string[]
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
  
  stageId: string | null
  overridePoints: number | null
}

// ============================================================
// DEFAULT CONFIG PER TIPE
// ============================================================

export const getDefaultConfig = (answerType: AnswerType): FlexibleQuestion['config'] => {
  switch (answerType) {
    case 'single-choice':
      return { 
        options: ['Opsi 1', 'Opsi 2', 'Opsi 3'],
        correctAnswer: 'Opsi 1',
        scoreCorrect: 1,
        scoreIncorrect: 0,
      }
    case 'multiple-choice':
      return { 
        options: ['Opsi 1', 'Opsi 2', 'Opsi 3', 'Opsi 4'],
        correctAnswer: ['Opsi 1', 'Opsi 2'],
        scoreCorrect: 1,
        scoreIncorrect: 0,
      }
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
          { id: 'ind-1', label: 'Pertanyaan 1', weight: 1, reverse: false },
          { id: 'ind-2', label: 'Pertanyaan 2', weight: 1, reverse: false },
          { id: 'ind-3', label: 'Pertanyaan 3', weight: 1, reverse: false },
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

// ============================================================
// CREATE FLEXIBLE QUESTION
// ============================================================

export const createFlexibleQuestion = (
  answerType: AnswerType,
  question?: string
): FlexibleQuestion => {
  const defaultConfig = getDefaultConfig(answerType)
  
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
    config: defaultConfig,
    isIdentifier: false,
    identifierType: 'none',
    scoring: { 
      scheme: answerType === 'indicator-table' ? 'indicator' : 
              answerType === 'single-choice' || answerType === 'multiple-choice' ? 'binary' : 'none', 
      weight: 1 
    },
    stageId: null,
    overridePoints: null,
  }
}

// ============================================================
// GET LABELS
// ============================================================

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

// ============================================================
// ANSWER TYPES LIST
// ============================================================

export const ANSWER_TYPES: { value: AnswerType; label: string; icon: string }[] = [
  { value: 'single-choice', label: 'Pilihan Ganda (Single)', icon: 'circleDot' },
  { value: 'multiple-choice', label: 'Pilihan Ganda (Multi)', icon: 'checkSquare' },
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

// ============================================================
// MEDIA TYPES
// ============================================================

export const MEDIA_TYPES: { value: MediaType; label: string; icon: string }[] = [
  { value: 'none', label: 'Tanpa Media', icon: 'x' },
  { value: 'image', label: 'Gambar', icon: 'image' },
  { value: 'video', label: 'Video', icon: 'video' },
  { value: 'file', label: 'File', icon: 'fileText' },
]

// ============================================================
// IDENTIFIER TYPES
// ============================================================

export const IDENTIFIER_TYPES: { value: IdentifierType; label: string }[] = [
  { value: 'none', label: 'Tidak' },
  { value: 'name', label: '🏷️ Nama Responden' },
  { value: 'location', label: '📍 Lokasi / Asal' },
  { value: 'email', label: '📧 Email' },
  { value: 'phone', label: '📞 Telepon' },
  { value: 'custom', label: '🔖 Custom' },
]

// ============================================================
// SCORING SCHEMES
// ============================================================

export const SCORING_SCHEMES: { value: ScoringScheme; label: string }[] = [
  { value: 'none', label: 'Tidak Dinilai' },
  { value: 'binary', label: '✅ Benar/Salah' },
  { value: 'likert', label: '📊 Skala' },
  { value: 'rating', label: '⭐ Rating' },
  { value: 'indicator', label: '📋 Indikator' },
]

// ============================================================
// CATEGORIES
// ============================================================

export const CATEGORIES = [
  { id: 'all', label: 'Semua', icon: 'grid' },
  { id: 'Input', label: 'Input', icon: 'type' },
  { id: 'Pilihan', label: 'Pilihan', icon: 'circleDot' },
  { id: 'Skala', label: 'Skala', icon: 'barChart' },
  { id: 'Tabel', label: 'Tabel', icon: 'table' },
  { id: 'Media', label: 'Media', icon: 'image' },
  { id: 'Layout', label: 'Layout', icon: 'layout' },
]

// ============================================================
// ELEMENTS
// ============================================================

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

// ============================================================
// HELPER FUNCTIONS
// ============================================================

/**
 * Menghitung total bobot dari semua pertanyaan
 */
export const calculateTotalWeight = (questions: FlexibleQuestion[]): number => {
  let total = 0
  questions.forEach(q => {
    if (q.answerType === 'indicator-table' && q.config?.indicators) {
      q.config.indicators.forEach(ind => {
        total += ind.weight || 1
      })
    } else {
      total += q.scoring?.weight || 1
    }
  })
  return total
}

/**
 * Menghitung bobot per stage
 */
export const calculateStageWeights = (
  questions: FlexibleQuestion[],
  stages: FormStage[]
): Record<string, number> => {
  const weights: Record<string, number> = {}
  
  stages.forEach(stage => {
    weights[stage.id] = 0
  })
  
  questions.forEach(q => {
    const stageId = q.stageId || stages[0]?.id
    if (stageId && weights[stageId] !== undefined) {
      let weight = q.scoring?.weight || 1
      if (q.answerType === 'indicator-table' && q.config?.indicators) {
        weight = q.config.indicators.reduce((sum, ind) => sum + (ind.weight || 1), 0)
      }
      weights[stageId] += weight
    }
  })
  
  return weights
}

/**
 * Mendapatkan daftar stage yang dinilai
 */
export const getScoredStages = (stages: FormStage[]): FormStage[] => {
  return stages.filter(s => s.includeInScoring !== false)
}

/**
 * Mendapatkan daftar stage yang TIDAK dinilai
 */
export const getUnscoredStages = (stages: FormStage[]): FormStage[] => {
  return stages.filter(s => s.includeInScoring === false)
}

/**
 * Mendapatkan daftar pertanyaan untuk stage tertentu
 */
export const getQuestionsByStage = (
  questions: FlexibleQuestion[],
  stageId: string
): FlexibleQuestion[] => {
  return questions.filter(q => q.stageId === stageId)
}

/**
 * Mendapatkan daftar pertanyaan yang dinilai (hanya dari scored stages)
 */
export const getScoredQuestions = (
  questions: FlexibleQuestion[],
  stages: FormStage[]
): FlexibleQuestion[] => {
  const scoredStageIds = getScoredStages(stages).map(s => s.id)
  return questions.filter(q => 
    q.stageId && scoredStageIds.includes(q.stageId) &&
    q.answerType !== 'image' && 
    q.answerType !== 'file-upload' &&
    q.answerType !== 'signature'
  )
}

/**
 * Menghitung skor maksimal per pertanyaan
 */
export const calculateQuestionMaxScore = (question: FlexibleQuestion): number => {
  const weight = question.scoring?.weight || 1
  
  switch (question.answerType) {
    case 'single-choice':
    case 'dropdown':
    case 'rating':
    case 'number':
      return weight
      
    case 'multiple-choice': {
      const correctAnswers = question.config?.correctAnswer
      if (Array.isArray(correctAnswers)) {
        return weight
      }
      return weight
    }
      
    case 'indicator-table': {
      const indicators = question.config?.indicators || []
      let max = 0
      indicators.forEach(ind => {
        const w = ind.weight || 1
        max += 5 * w
      })
      return max || 1
    }
      
    default:
      return 0
  }
}

/**
 * Validasi apakah total distribusi sesuai dengan total points
 */
export const validateDistribution = (
  distribution: Record<string, number>,
  totalPoints: number
): { valid: boolean; total: number; diff: number } => {
  const total = Object.values(distribution).reduce((sum, val) => sum + val, 0)
  return {
    valid: Math.abs(total - totalPoints) < 0.01,
    total,
    diff: totalPoints - total,
  }
}

/**
 * Generate scoring distribution untuk manual mode
 */
export const generateManualDistribution = (
  questions: FlexibleQuestion[],
  totalPoints: number
): Record<string, number> => {
  const distribution: Record<string, number> = {}
  const count = questions.length || 1
  const perQuestion = Math.floor(totalPoints / count)
  let remainder = totalPoints - (perQuestion * count)
  
  questions.forEach((q, index) => {
    let points = perQuestion
    if (remainder > 0) {
      points += 1
      remainder -= 1
    }
    distribution[q.id] = points
  })
  
  return distribution
}

/**
 * Generate scoring distribution berdasarkan bobot per stage (Auto-Balance)
 */
export const generateAutoDistribution = (
  questions: FlexibleQuestion[],
  stages: FormStage[],
  totalPoints: number
): Record<string, number> => {
  const distribution: Record<string, number> = {}
  const scoredStages = getScoredStages(stages)
  const stageWeights = calculateStageWeights(questions, scoredStages)
  const totalWeight = Object.values(stageWeights).reduce((sum, w) => sum + w, 0)
  
  if (totalWeight === 0) {
    const perStage = totalPoints / scoredStages.length
    scoredStages.forEach(stage => {
      distribution[stage.id] = Math.round(perStage * 100) / 100
    })
    return distribution
  }
  
  scoredStages.forEach(stage => {
    const weight = stageWeights[stage.id] || 0
    const points = (weight / totalWeight) * totalPoints
    distribution[stage.id] = Math.round(points * 100) / 100
  })
  
  return distribution
}

/**
 * Get default validation config
 */
export const getDefaultValidation = (): FormValidation => ({
  mode: 'all_required',
  exceptions: [],
  allowOverride: true,
})

/**
 * Get default scoring config
 */
export const getDefaultScoring = (): FormScoring => ({
  totalPoints: 100,
  mode: 'auto',
  distribution: {},
  overrides: {},
  allowOverride: true,
  autoBalance: true,
})

/**
 * Get default stage config
 */
export const getDefaultStage = (name: string = 'Tahap 1'): FormStage => ({
  id: `stage-${Date.now()}`,
  name,
  order: 0,
  questionIds: [],
  includeInScoring: true,
})

/**
 * Helper: Reset scoring distribution
 */
export const resetScoringDistribution = (
  questions: FlexibleQuestion[],
  stages: FormStage[],
  totalPoints: number,
  mode: 'auto' | 'manual'
): Record<string, number> => {
  if (mode === 'auto') {
    return generateAutoDistribution(questions, stages, totalPoints)
  } else {
    return generateManualDistribution(questions, totalPoints)
  }
}

// ============================================================
// SCORING INFO HELPERS (Untuk Display di Card)
// ============================================================

/**
 * Mendapatkan informasi scoring untuk single choice
 */
export const getSingleChoiceScoringInfo = (question: FlexibleQuestion) => {
  const config = question.config
  const correctAnswer = config?.correctAnswer as string | undefined
  const scoreCorrect = config?.scoreCorrect ?? 1
  const scoreIncorrect = config?.scoreIncorrect ?? 0
  
  return {
    correctAnswer,
    scoreCorrect,
    scoreIncorrect,
    isCorrect: (option: string) => option === correctAnswer,
    getScore: (option: string) => option === correctAnswer ? scoreCorrect : scoreIncorrect,
  }
}

/**
 * Mendapatkan informasi scoring untuk multiple choice
 */
export const getMultipleChoiceScoringInfo = (question: FlexibleQuestion) => {
  const config = question.config
  const correctAnswers = Array.isArray(config?.correctAnswer) 
    ? config.correctAnswer 
    : []
  const scoreCorrect = config?.scoreCorrect ?? 1
  
  return {
    correctAnswers,
    scoreCorrect,
    totalCorrect: correctAnswers.length,
    isCorrect: (option: string) => correctAnswers.includes(option),
    getScore: (option: string) => correctAnswers.includes(option) ? scoreCorrect : 0,
  }
}

/**
 * Mendapatkan informasi scoring untuk indicator table
 */
export const getIndicatorScoringInfo = (question: FlexibleQuestion) => {
  const config = question.config
  const indicators = config?.indicators || []
  const scales = config?.indicatorScales || []
  const showWeighted = config?.showWeightedScore || false
  
  return {
    indicators,
    scales,
    showWeighted,
    getScaleValue: (label: string) => {
      const scale = scales.find(s => s.label === label)
      return scale?.value || 0
    },
    getMaxScore: () => {
      let max = 0
      indicators.forEach(ind => {
        const w = ind.weight || 1
        max += showWeighted ? 5 * w : 5
      })
      return max
    },
  }
}

/**
 * Mendapatkan informasi scoring untuk rating
 */
export const getRatingScoringInfo = (question: FlexibleQuestion) => {
  const config = question.config
  const maxRating = config?.ratingMax || 5
  const weight = question.scoring?.weight || 1
  
  return {
    maxRating,
    weight,
    getScore: (rating: number) => (rating / maxRating) * weight,
  }
}