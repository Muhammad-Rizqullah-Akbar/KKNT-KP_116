// lib/repositories/forms.serialize.ts
import type { FormData } from './forms.types'

const generateId = () => Math.random().toString(36).substring(2, 9)

export const serializeQuestion = (q: any): any => {
  const config = q.config || {}

  return {
    id: q.id || generateId(),
    question: q.question || '',
    description: q.description || '',
    required: q.required || false,
    order: q.order ?? 0,
    media: {
      type: q.media?.type || 'none',
      url: q.media?.url || '',
      caption: q.media?.caption || '',
    },
    answerType: q.answerType || 'short-text',
    config: {
      options: config.options || [],
      correctAnswer: config.correctAnswer || '',
      placeholder: config.placeholder || '',
      minLength: config.minLength || 0,
      maxLength: config.maxLength || 200,
      min: config.min ?? 0,
      max: config.max ?? 100,
      step: config.step ?? 1,
      indicators: config.indicators || [],
      indicatorScales: config.indicatorScales || [],
      indicatorColumns: config.indicatorColumns || 5,
      showTotalScore: config.showTotalScore || false,
      showWeightedScore: config.showWeightedScore || false,
      indicatorTitle: config.indicatorTitle || 'Pertanyaan',
      ratingMin: config.ratingMin || 1,
      ratingMax: config.ratingMax || 5,
      dateFormat: config.dateFormat || 'DD/MM/YYYY',
      fileTypes: config.fileTypes || ['image/*', 'application/pdf'],
      maxFileSize: config.maxFileSize || 5,
      signatureWidth: config.signatureWidth || 400,
      signatureHeight: config.signatureHeight || 200,
      signaturePenColor: config.signaturePenColor || '#000000',
      signatureBgColor: config.signatureBgColor || '#ffffff',
      signatureLabel: config.signatureLabel || 'Tanda Tangan',
    },
    isIdentifier: q.isIdentifier || false,
    identifierType: q.identifierType || 'none',
    scoring: {
      scheme: q.scoring?.scheme || 'none',
      weight: q.scoring?.weight || 1,
    },
    stageId: q.stageId || null,
    overridePoints: q.overridePoints || null,
  }
}

export const deserializeQuestion = (q: any): any => {
  const config = q.config || {}
  const answerType = q.answerType || q.type || 'short-text'

  return {
    id: q.id || generateId(),
    question: q.question || q.label || '',
    description: q.description || '',
    required: q.required || false,
    order: q.order ?? q.rowIndex ?? 0,
    media: {
      type: q.media?.type || 'none',
      url: q.media?.url || q.imageUrl || '',
      caption: q.media?.caption || '',
    },
    answerType: answerType,
    config: {
      options: config.options || q.options || [],
      correctAnswer: config.correctAnswer || '',
      placeholder: config.placeholder || '',
      minLength: config.minLength || 0,
      maxLength: config.maxLength || 200,
      min: config.min ?? 0,
      max: config.max ?? 100,
      step: config.step ?? 1,
      indicators: config.indicators || [],
      indicatorScales: config.indicatorScales || [],
      indicatorColumns: config.indicatorColumns || 5,
      showTotalScore: config.showTotalScore || false,
      showWeightedScore: config.showWeightedScore || false,
      indicatorTitle: config.indicatorTitle || 'Pertanyaan',
      ratingMin: config.ratingMin || 1,
      ratingMax: config.ratingMax || 5,
      dateFormat: config.dateFormat || 'DD/MM/YYYY',
      fileTypes: config.fileTypes || ['image/*', 'application/pdf'],
      maxFileSize: config.maxFileSize || 5,
      signatureWidth: config.signatureWidth || 400,
      signatureHeight: config.signatureHeight || 200,
      signaturePenColor: config.signaturePenColor || '#000000',
      signatureBgColor: config.signatureBgColor || '#ffffff',
      signatureLabel: config.signatureLabel || 'Tanda Tangan',
      statements: config.statements || q.statements || [],
      scale: config.scale || q.scale || 5,
    },
    isIdentifier: q.isIdentifier || false,
    identifierType: q.identifierType || 'none',
    scoring: {
      scheme: q.scoring?.scheme || 'none',
      weight: q.scoring?.weight || 1,
    },
    stageId: q.stageId || null,
    overridePoints: q.overridePoints || null,
  }
}

export const cleanFormData = (data: any): any => {
  const clean: any = {}

  clean.title = data.title || ''
  clean.code = data.code || ''
  clean.status = data.status || 'draft'

  if (data.questions) {
    clean.questions = data.questions.map((q: any) => serializeQuestion(q))
  } else {
    clean.questions = []
  }

  clean.description = data.description || ''
  clean.target = data.target || ''
  clean.category = data.category || ''
  clean.groupId = data.groupId || null
  clean.groupCode = data.groupCode || null
  clean.createdBy = data.createdBy || ''
  clean.filledCount = data.filledCount || 0

  if (data.validation) {
    clean.validation = data.validation
  }
  if (data.stages) {
    clean.stages = data.stages.map((s: any) => ({
      ...s,
      includeInScoring: s.includeInScoring ?? true,
    }))
  }
  if (data.scoring) {
    clean.scoring = data.scoring
  }

  return clean
}

export const deserializeFormData = (doc: any): FormData => {
  const data = doc.data ? doc.data() : doc
  const docId = doc.id || data.id || data.formId

  let rawTitle = data.title || data.metadata?.title || data.formTitle || data.name || (docId ? `Formulir ${docId}` : 'Formulir Tanpa Judul')
  if (rawTitle.startsWith('[Salinan') || rawTitle.startsWith('Salinan')) {
    rawTitle = rawTitle.replace(/^\[Salinan[^\]]*\]\s*/i, '').replace(/^Salinan\s*(?:V1\.5)?\s*[-–:]\s*/i, '').trim()
  }

  return {
    id: docId,
    title: rawTitle,
    code: data.code || data.formCode || data.metadata?.code || '',
    description: data.description || data.metadata?.description || '',
    target: data.target || data.metadata?.target || '',
    category: data.category || data.metadata?.category || '',
    status: data.status || data.metadata?.status || 'draft',
    groupId: data.groupId || null,
    groupCode: data.groupCode || null,
    questions: (data.questions || []).map((q: any) => deserializeQuestion(q)),
    createdAt: data.createdAt?.toDate?.()?.toISOString() || data.createdAt || '',
    updatedAt: data.updatedAt?.toDate?.()?.toISOString() || data.updatedAt || '',
    createdBy: data.createdBy || '',
    filledCount: data.filledCount || 0,
    validation: data.validation || { mode: 'all_required', exceptions: [], allowOverride: true },
    stages: (data.stages || []).map((s: any) => ({
      ...s,
      includeInScoring: s.includeInScoring ?? true,
    })),
    scoring: data.scoring || { totalPoints: 100, mode: 'auto', distribution: {}, overrides: {}, allowOverride: true, autoBalance: true },
  }
}
