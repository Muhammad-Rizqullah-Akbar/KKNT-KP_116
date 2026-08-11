import type { BuilderQuestion, ValidationConfig } from '@/lib/forms/v1_5/builderState'

export interface ValidationErrorItem {
  questionId: string
  message: string
}

/**
 * Server-side validation of submitted answers against authoritative version snapshot.
 */
export function validateResponseAnswers(
  answers: Record<string, any>,
  questions: BuilderQuestion[],
  validation: ValidationConfig
): ValidationErrorItem[] {
  const errors: ValidationErrorItem[] = []
  const questionMap = new Map<string, BuilderQuestion>()

  questions.forEach((q) => {
    questionMap.set(q.questionId, q)
  })

  // 1. Validate that no unknown question IDs are submitted
  for (const qId of Object.keys(answers)) {
    if (!questionMap.has(qId)) {
      errors.push({
        questionId: qId,
        message: `ID Pertanyaan "${qId}" tidak ditemukan pada versi instrumen ini.`,
      })
    }
  }

  // 2. Validate each question definition and value
  for (const q of questions) {
    const val = answers[q.questionId]
    const isAnswered = val !== undefined && val !== null && val !== ''

    // Mandatory Question Evaluation
    let isRequired = q.required
    if (validation.mode === 'all_required') {
      isRequired = true
    } else if (validation.mode === 'all_required_except') {
      const exceptions = validation.exceptionQuestionIds || []
      isRequired = !exceptions.includes(q.questionId)
    } else if (validation.mode === 'free') {
      isRequired = false
    }

    if (isRequired && !isAnswered) {
      // Check if indicator-table has all indicators answered
      const type = q.answerType || (q as any).type
      if (type === 'indicator-table' || type === 'likert') {
        const indicators = q.config?.indicators || []
        const hasAllIndicators =
          indicators.length > 0 &&
          typeof val === 'object' &&
          val !== null &&
          indicators.every((ind: any) => val[ind.indicatorId || ind.id || ind] !== undefined)

        if (!hasAllIndicators) {
          errors.push({
            questionId: q.questionId,
            message: `Pertanyaan "${q.prompt || q.questionId}" wajib diisi untuk semua indikator.`,
          })
          continue
        }
      } else {
        errors.push({
          questionId: q.questionId,
          message: `Pertanyaan "${q.prompt || q.questionId}" wajib diisi.`,
        })
        continue
      }
    }

    // Skip detailed value checks if not answered and not required
    if (!isAnswered) continue

    const type = q.answerType || (q as any).type

    switch (type) {
      case 'single-choice':
      case 'binary':
      case 'dropdown': {
        const rawOpts = q.options || (q as any).config?.options || []
        const validValues = rawOpts.flatMap((opt: any, idx: number) => {
          if (typeof opt === 'string') return [opt, `opt_${q.questionId}_${idx}`]
          if (opt && typeof opt === 'object') {
            return [opt.optionId, opt.id, opt.label, opt.text, `opt_${q.questionId}_${idx}`].filter(Boolean)
          }
          return [String(opt), `opt_${q.questionId}_${idx}`]
        })

        if (validValues.length > 0 && !validValues.includes(val)) {
          errors.push({
            questionId: q.questionId,
            message: `Pilihan opsi "${val}" tidak valid untuk pertanyaan "${q.prompt || (q as any).title || q.questionId}".`,
          })
        }
        break
      }

      case 'multiple-choice': {
        if (!Array.isArray(val)) {
          errors.push({
            questionId: q.questionId,
            message: `Jawaban untuk pertanyaan pilihan ganda "${q.prompt || (q as any).title || q.questionId}" harus berupa daftar pilihan.`,
          })
        } else {
          const rawOpts = q.options || (q as any).config?.options || []
          const validValues = rawOpts.flatMap((opt: any, idx: number) => {
            if (typeof opt === 'string') return [opt, `opt_${q.questionId}_${idx}`]
            if (opt && typeof opt === 'object') {
              return [opt.optionId, opt.id, opt.label, opt.text, `opt_${q.questionId}_${idx}`].filter(Boolean)
            }
            return [String(opt), `opt_${q.questionId}_${idx}`]
          })

          if (validValues.length > 0) {
            const invalidOpts = val.filter((optId) => !validValues.includes(optId))
            if (invalidOpts.length > 0) {
              errors.push({
                questionId: q.questionId,
                message: `Pilihan opsi [${invalidOpts.join(', ')}] tidak valid.`,
              })
            }
          }
        }
        break
      }

      case 'indicator-table':
      case 'likert': {
        if (typeof val !== 'object' || val === null) {
          errors.push({
            questionId: q.questionId,
            message: `Format jawaban tabel indikator untuk "${q.prompt || q.questionId}" tidak valid.`,
          })
        } else {
          const indicators = q.config?.indicators || []
          const scales = q.config?.indicatorScales || [
            { value: 1 }, { value: 2 }, { value: 3 }, { value: 4 }, { value: 5 }
          ]
          const validScaleValues = scales.map((s: any) => Number(s.value ?? s))

          for (const ind of indicators) {
            const indId = ind.indicatorId || ind.id || ind
            const indVal = val[indId]
            if (indVal !== undefined && indVal !== null && indVal !== '') {
              const numVal = Number(indVal)
              if (isNaN(numVal) || !validScaleValues.includes(numVal)) {
                errors.push({
                  questionId: q.questionId,
                  message: `Skala nilai (${indVal}) untuk indikator "${ind.label || indId}" tidak valid.`,
                })
              }
            }
          }
        }
        break
      }

      case 'rating': {
        const num = Number(val)
        const ratingMax = q.config?.ratingMax || 5
        if (isNaN(num) || num < 1 || num > ratingMax) {
          errors.push({
            questionId: q.questionId,
            message: `Nilai rating (${val}) harus di antara 1 dan ${ratingMax}.`,
          })
        }
        break
      }

      case 'number': {
        const num = Number(val)
        if (isNaN(num)) {
          errors.push({
            questionId: q.questionId,
            message: `Jawaban harus berupa angka valid.`,
          })
        } else {
          if (q.config?.min !== undefined && num < q.config.min) {
            errors.push({
              questionId: q.questionId,
              message: `Nilai angka tidak boleh kurang dari ${q.config.min}.`,
            })
          }
          if (q.config?.max !== undefined && num > q.config.max) {
            errors.push({
              questionId: q.questionId,
              message: `Nilai angka tidak boleh lebih dari ${q.config.max}.`,
            })
          }
        }
        break
      }
    }
  }

  return errors
}
