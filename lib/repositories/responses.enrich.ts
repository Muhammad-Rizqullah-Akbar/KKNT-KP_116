import { safeGetCollectionDocs } from './safe-firestore'
import type { ResponseDoc } from '@/lib/domain/responses/response-types'
import { calculateResponseScore } from '@/lib/domain/scoring/scoring-engine'
import { adaptFormRecord } from '@/lib/domain/forms/form-adapter'
import { cleanString, calculateScoreWithV1Engine, mapAnswersToHumanReadable } from './responses.normalize'
import { ENGINE_VERSION_CURRENT, ENGINE_VERSION_ARCHIVED } from '@/lib/domain/scoring/scoring-versions'

/**
 * Enriches responses with exact form-based ScoringEngine calculation and full  Distribution Engine metadata.
 */
export async function enrichResponsesWithFormScoring(docs: ResponseDoc[]): Promise<ResponseDoc[]> {
  try {
    const [rawForms, rawDistributions, rawUsers] =
      await Promise.all([
        safeGetCollectionDocs('forms'),
        safeGetCollectionDocs('distributions'),
        safeGetCollectionDocs('users'),
      ])

    const userMap: Record<string, string> = {}
    rawUsers.forEach((u) => {
      const name = u.data.displayName || u.data.name || (u.data.email ? u.data.email.split('@')[0] : '')
      if (name) {
        userMap[u.id] = name
        if (u.data.email) userMap[u.data.email] = name
      }
    })

    const formMap: Record<string, any> = {}
    const distMap: Record<string, any> = {}

    rawForms.forEach((d) => {
      const item = { id: d.id, isFormRecordSource: true, ...d.data }
      formMap[d.id] = item
      if (d.data.code) formMap[d.data.code] = item
      if (d.data.title) {
        formMap[d.data.title] = item
        formMap[cleanString(d.data.title)] = item
      }
    })

    const mapDistDoc = (d: { id: string; data: any }) => {
      distMap[d.id] = { id: d.id, ...d.data }
      if (d.data.code) distMap[d.data.code] = { id: d.id, ...d.data }
      if (d.data.distributionCode) distMap[d.data.distributionCode] = { id: d.id, ...d.data }
    }

    rawDistributions.forEach(mapDistDoc)

    return docs.map((doc) => {
      const form =
        formMap[doc.formId] ||
        ((doc as any).formCode ? formMap[(doc as any).formCode] : undefined) ||
        ((doc as any).formTitle ? formMap[(doc as any).formTitle] : undefined) ||
        ((doc as any).formTitle ? formMap[cleanString((doc as any).formTitle)] : undefined)

      const dist = distMap[doc.distributionId || doc.distributionCode] || {}

      const rawTitle = form?.metadata?.title || form?.title || form?.name || (doc as any).formTitle || 'Formulir Evaluasi Pangan'
      const formTitle = typeof rawTitle === 'string' ? rawTitle.replace(/^form_[\w\-]+/g, 'Formulir Evaluasi Pangan') : 'Formulir Evaluasi Pangan'

      const distributionCode = doc.distributionCode || dist.code || 'V1-DIST'
      let rawDistTitle = dist.title || dist.targetGroup
      if (!rawDistTitle) {
        rawDistTitle = 'Pendampingan Kader Lapangan'
      }

      const distributionTitle = typeof rawDistTitle === 'string' ? rawDistTitle.replace(/^dist_[\w\-]+/g, 'Pendampingan Kader Lapangan') : 'Pendampingan Kader Lapangan'
      const groupName = distributionTitle

      const rawOwnerName = dist.ownerName || (doc as any).ownerName
      const ownerId = dist.ownerId || dist.createdBy || doc.createdBy

      let resolvedOwnerName = 'Administrator BPOM'
      if (ownerId && userMap[ownerId]) {
        resolvedOwnerName = userMap[ownerId]
      } else if (rawOwnerName && !['Penerbit Kode', 'Admin System'].includes(rawOwnerName)) {
        resolvedOwnerName = rawOwnerName
      }

      const versionNumber = doc.versionNumber || form?.activeVersionNumber || (doc.distributionCode ? 1.5 : 1.0)
      const ownerName = resolvedOwnerName
      const ownerType = dist.ownerType || 'cadre'

      try {
        const humanReadableAnswers = mapAnswersToHumanReadable(doc.answers || {}, form || {})

        let resultData = doc.result

        const storedScore =
          (doc as any).score ??
          (doc as any).totalScore ??
          (doc as any).finalScore ??
          (doc.result && typeof doc.result.percentage === 'number' ? doc.result.percentage : undefined)

        const hasStoredScore = typeof storedScore === 'number' && !isNaN(storedScore)

        const hasValidResult =
          resultData &&
          typeof resultData.percentage === 'number' &&
          resultData.percentage > 0 &&
          Array.isArray(resultData.aspects) &&
          resultData.aspects.length > 0 &&
          Array.isArray(resultData.questions) &&
          resultData.questions.length > 0

        const isFormRecord = Boolean(form?.isFormRecordSource || (form && form.questions && !form.metadata))

        if (hasStoredScore) {
          // PRESERVE EXISTING STORED RESPONDENT SCORE STRICTLY AS IS! (e.g. Najib = 89%)
          const finalScore = Number(storedScore) || 0
          const gradeStr = doc.result?.grade || (finalScore >= 80 ? 'Grade A' : finalScore >= 60 ? 'Grade B' : 'Grade C')
          const thresholdTitle = doc.result?.thresholdTitle || (finalScore >= 80 ? 'Memenuhi Syarat (MS)' : finalScore >= 60 ? 'Binaan Lanjutan' : 'Perlu Perbaikan')

          resultData = {
            scoringEngineVersion: doc.result?.scoringEngineVersion || ENGINE_VERSION_ARCHIVED,
            calculatedAt: doc.submittedAt || doc.updatedAt || new Date().toISOString(),
            rawScore: doc.result?.rawScore ?? finalScore,
            maximumScore: doc.result?.maximumScore ?? 100,
            percentage: finalScore,
            grade: gradeStr,
            thresholdId: doc.result?.thresholdId || 'default-threshold',
            thresholdTitle,
            thresholdDescription: doc.result?.thresholdDescription || '',
            aspects: doc.result?.aspects || [],
            questions: doc.result?.questions || [],
            recommendations: doc.result?.recommendations || [],
          }
        } else if (isFormRecord) {
          // 🔥 USE EXACT V1 SCORING ENGINE FOR LEGACY  FORMS (Produces 89% for Najib)
          const v1Calc = calculateScoreWithV1Engine(doc.answers || {}, form)
          if (v1Calc) {
            const { computedResult } = v1Calc
            const scorePct = computedResult.percentage ?? 0
            const gradeStr = computedResult.grade || (scorePct >= 80 ? 'Grade A' : scorePct >= 60 ? 'Grade B' : 'Grade C')
            const thresholdTitle = scorePct >= 80 ? 'Memenuhi Syarat (MS)' : scorePct >= 60 ? 'Binaan Lanjutan' : 'Perlu Perbaikan'

            const aspectResults: any[] = Object.entries(computedResult.perStage || {}).map(([sId, sData]: [string, any]) => ({
              aspectId: sId,
              title: sData.name || 'Aspek Penilaian',
              rawScore: sData.rawEarned ?? sData.earned ?? 0,
              maximumScore: sData.rawPossible ?? sData.possible ?? 100,
              percentage: sData.percentage ?? 0,
              weightPercentage: 100,
              weightedContribution: sData.percentage ?? 0,
              questions: [],
            }))

            const questionResults: any[] = Object.entries(computedResult.perQuestion || {}).map(([qId, qData]: [string, any]) => ({
              questionId: qId,
              aspectId: 'default',
              questionType: 'stored',
              prompt: qData.label || 'Pertanyaan',
              rawScore: qData.earned ?? 0,
              maximumScore: qData.possible ?? 0,
              percentage: qData.percentage ?? 0,
              includedInTotal: qData.possible > 0,
              selectedValue: doc.answers?.[qId] ?? doc.answers?.[qData.label] ?? '-',
            }))

            resultData = {
              scoringEngineVersion: ENGINE_VERSION_ARCHIVED,
              calculatedAt: doc.submittedAt || doc.updatedAt || new Date().toISOString(),
              rawScore: computedResult.totalScore ?? scorePct,
              maximumScore: computedResult.maxScore ?? 100,
              percentage: scorePct,
              grade: gradeStr,
              thresholdId: 'default-threshold',
              thresholdTitle,
              thresholdDescription: '',
              aspects: aspectResults,
              questions: questionResults,
              recommendations: computedResult.recommendations || [],
            }
          }
        } else if (!hasValidResult && form && (form.questions || form.aspects)) {
          try {
            let aspects = form.aspects || []
            let questions = form.questions || []
            let scoring = form.scoring || { totalPoints: 100, mode: 'auto', stagePointDistribution: {} }
            const thresholds = form.thresholds || []

            if (!form.aspects || form.aspects.length === 0) {
              const adapted = adaptFormRecord(form)
              questions = adapted.formDocument.version.questions || []
              aspects = [
                {
                  aspectId: 'default',
                  title: 'Evaluasi Kuesioner',
                  weightPercentage: 100,
                  isScored: true,
                },
              ]
              if (adapted.formDocument.version.scoring) {
                scoring = adapted.formDocument.version.scoring
              }
            }

            const scoreOutput = calculateResponseScore(
              {
                aspects,
                questions,
                scoring,
                thresholds,
                recommendations: form.recommendations || { mode: 'manual' },
              },
              doc.answers || {}
            )

            resultData = {
              scoringEngineVersion: ENGINE_VERSION_CURRENT,
              calculatedAt: doc.submittedAt || doc.updatedAt || new Date().toISOString(),
              rawScore: scoreOutput.rawScore,
              maximumScore: scoreOutput.maximumScore,
              percentage: scoreOutput.percentage,
              grade: scoreOutput.gradeResult.grade,
              thresholdId: scoreOutput.gradeResult.thresholdId,
              thresholdTitle: scoreOutput.gradeResult.title,
              thresholdDescription: scoreOutput.gradeResult.description,
              aspects: scoreOutput.aspectResults,
              questions: scoreOutput.questionResults,
              recommendations: [],
            }
          } catch (e) {
            console.warn(' response scoring fallback warning:', e)
          }
        }

        if (!resultData) {
          const finalScore = (doc as any).score ?? (doc as any).totalScore ?? (doc as any).finalScore ?? 0
          const gradeStr = doc.result?.grade || (finalScore >= 80 ? 'Grade A' : finalScore >= 60 ? 'Grade B' : 'Grade C')
          resultData = {
            scoringEngineVersion: ENGINE_VERSION_ARCHIVED,
            calculatedAt: doc.submittedAt || doc.updatedAt || new Date().toISOString(),
            rawScore: finalScore,
            maximumScore: 100,
            percentage: finalScore,
            grade: gradeStr,
            thresholdId: 'default-threshold',
            thresholdTitle: finalScore >= 80 ? 'Memenuhi Syarat (MS)' : finalScore >= 60 ? 'Binaan Lanjutan' : 'Perlu Perbaikan',
            aspects: doc.result?.aspects || [],
            questions: doc.result?.questions || [],
            recommendations: [],
          }
        }

        if ((!resultData.questions || resultData.questions.length === 0) && doc.answers && typeof doc.answers === 'object') {
          const generatedQuestions: any[] = []
          Object.entries(humanReadableAnswers).forEach(([promptKey, answerVal], idx) => {
            const isTable = typeof answerVal === 'object' && answerVal !== null && !Array.isArray(answerVal)
            const isArray = Array.isArray(answerVal)
            const qType = isTable ? 'indicator-table' : isArray ? 'multiple-choice' : 'short-text'

            let indicators: any[] = []
            if (isTable) {
              indicators = Object.entries(answerVal).map(([indKey, indVal], iIdx) => ({
                indicatorId: `ind_${idx}_${iIdx}`,
                label: indKey,
                selectedValue: indVal,
                score: 5,
                maximumScore: 5,
              }))
            }

            generatedQuestions.push({
              questionId: `q_${idx}`,
              aspectId: 'default',
              questionType: qType,
              prompt: promptKey,
              rawScore: 0,
              maximumScore: 0,
              percentage: 0,
              includedInTotal: false,
              selectedValue: answerVal,
              details: isTable ? { indicators } : undefined,
            })
          })
          if (generatedQuestions.length > 0) {
            resultData.questions = generatedQuestions
          }
        }

        return {
          ...doc,
          answers: humanReadableAnswers,
          formTitle,
          groupName,
          distributionCode,
          distributionTitle,
          versionNumber,
          ownerName,
          ownerType,
          result: resultData,
        }
      } catch (err) {
        return {
          ...doc,
          formTitle,
          groupName,
          distributionCode,
          distributionTitle,
          versionNumber,
          ownerName,
          ownerType,
        }
      }
    })
  } catch (err) {
    return docs
  }
}
