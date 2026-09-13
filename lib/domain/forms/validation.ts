import type { CanonicalForm, Question } from './types'
import { QUESTION_TYPES } from './types'

export type FormValidationIssue = { path: string; message: string; targetId?: string }

const OPTION_TYPES = new Set<Question['type']>(['single-choice', 'multiple-choice', 'binary', 'dropdown'])

export function validateCanonicalForm(candidate: CanonicalForm): FormValidationIssue[] {
  const issues: FormValidationIssue[] = []

  if (!candidate.form.formId.trim()) {
    issues.push({ path: 'form.formId', message: 'Form ID is required.' })
  }
  if (!candidate.form.metadata.title.trim()) {
    issues.push({ path: 'form.metadata.title', message: 'Form Title is required.' })
  }
  if (!candidate.version.versionId.trim()) {
    issues.push({ path: 'version.versionId', message: 'Version ID is required.' })
  }
  if (candidate.version.formId !== candidate.form.formId) {
    issues.push({ path: 'version.formId', message: 'Version must belong to its form.' })
  }
  if (!Number.isInteger(candidate.version.versionNumber) || candidate.version.versionNumber < 1) {
    issues.push({ path: 'version.versionNumber', message: 'Version number must be a positive integer.' })
  }
  if (!Number.isFinite(candidate.version.scoring.totalPoints) || candidate.version.scoring.totalPoints < 0) {
    issues.push({ path: 'version.scoring.totalPoints', message: 'Total points must be non-negative.' })
  }

  // Validate Aspect Weights when Overall or Both mode is active
  const outputMode = candidate.version.scoring.outputMode || 'both'
  if (outputMode === 'overall' || outputMode === 'both') {
    const aspectsList = candidate.version.aspects || []
    const scoredAspects = aspectsList.filter((a: any) => a.isScored !== false)
    const stageDist = candidate.version.scoring.stagePointDistribution || {}

    // Only sum weights for active scored aspects belonging to the form
    const sumWeights = scoredAspects.length > 0
      ? scoredAspects.reduce((acc, a: any) => acc + (Number(stageDist[a.aspectId]) || 0), 0)
      : Object.values(stageDist).reduce((a, b) => a + (Number(b) || 0), 0)

    if (scoredAspects.length > 0 && Math.round(sumWeights) !== 100) {
      issues.push({
        path: 'version.scoring.stagePointDistribution',
        message: `Total bobot aspek penilaian harus tepat 100% (saat ini ${sumWeights}%).`,
      })
    }
  }

  const seenIds = new Set<string>()
  const seenPrompts = new Map<string, string>()

  candidate.version.questions.forEach((question, index) => {
    const path = `version.questions[${index}]`
    const qId = question.questionId
    const cleanPrompt = question.prompt.trim()

    if (!qId.trim() || seenIds.has(qId)) {
      issues.push({ path: `${path}.questionId`, message: 'questionId must be non-empty and unique.', targetId: qId })
    }
    seenIds.add(qId)

    if (!QUESTION_TYPES.includes(question.type)) {
      issues.push({ path: `${path}.type`, message: 'Unsupported question type.', targetId: qId })
    }

    // Check for empty or default placeholder prompts
    if (!cleanPrompt && question.type !== 'image') {
      issues.push({ path: `${path}.prompt`, message: 'Teks pertanyaan belum diisi.', targetId: qId })
    } else if (cleanPrompt.startsWith('Pertanyaan Baru') || cleanPrompt === 'Masukkan pertanyaan') {
      issues.push({ path: `${path}.prompt`, message: `Pertanyaan P${index + 1} masih menggunakan teks default placeholder. Tuliskan teks pertanyaan sebenarnya.`, targetId: qId })
    }

    // Check for duplicate prompts
    if (cleanPrompt && seenPrompts.has(cleanPrompt)) {
      issues.push({
        path: `${path}.prompt`,
        message: `Teks pertanyaan P${index + 1} duplikat persis dengan pertanyaan lain. Setiap pertanyaan harus unik.`,
        targetId: qId,
      })
    } else if (cleanPrompt) {
      seenPrompts.set(cleanPrompt, qId)
    }

    if (OPTION_TYPES.has(question.type) && question.options.length === 0) {
      issues.push({ path: `${path}.options`, message: 'Pertanyaan jenis ini wajib memiliki minimal 1 opsi jawaban.', targetId: qId })
    }

    const optionIds = new Set<string>()
    question.options.forEach((option, optionIndex) => {
      if (!option.optionId.trim() || optionIds.has(option.optionId) || !option.label.trim()) {
        issues.push({ path: `${path}.options[${optionIndex}]`, message: 'Opsi memerlukan label yang valid.', targetId: qId })
      }
      optionIds.add(option.optionId)
    })

    if (question.answerKey.kind === 'option' && question.answerKey.correctOptionIds.some((id) => !optionIds.has(id))) {
      issues.push({ path: `${path}.answerKey`, message: 'Kunci jawaban mengandung opsi yang tidak valid.', targetId: qId })
    }

    if (!Number.isFinite(question.scoring.weight) || question.scoring.weight < 0) {
      issues.push({ path: `${path}.scoring.weight`, message: 'Bobot poin pertanyaan harus berupa angka positif.', targetId: qId })
    }
  })

  return issues
}
