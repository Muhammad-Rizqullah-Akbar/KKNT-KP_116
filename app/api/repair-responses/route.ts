// app/api/repair-responses/route.ts

import { NextResponse } from 'next/server'
import { firestore } from '@/lib/firebaseAdmin'
import type { QueryDocumentSnapshot } from 'firebase-admin/firestore'

// ---------- HELPER PEMBERSIH STRING ----------
function cleanString(str: string) {
  return str
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

// ---------- MAPPING JAWABAN (SALIN DARI DASHBOARD) ----------
function mapAnswersToQuestionIds(
  rawAnswers: Record<string, any>,
  form: any
): Record<string, any> {
  if (!form || !form.questions) return rawAnswers

  const mapped: Record<string, any> = {}
  const questionById: Record<string, any> = {}
  const questionByLabel: Record<string, any> = {}
  const questionByCleanLabel: Record<string, any> = {}

  form.questions.forEach((q: any) => {
    questionById[q.id] = q
    const label = (q.question || q.label || '').trim()
    if (label) {
      questionByLabel[label] = q
      questionByCleanLabel[cleanString(label)] = q
    }
    if (q.config?.indicators) {
      q.config.indicators.forEach((ind: any, idx: number) => {
        const indLabel = (ind.label || '').trim()
        if (indLabel) {
          const indKey = `${q.id}-${idx}`
          questionByLabel[indLabel] = { ...q, _indicatorKey: indKey }
          questionByCleanLabel[cleanString(indLabel)] = { ...q, _indicatorKey: indKey }
        }
      })
    }
  })

  for (const [key, value] of Object.entries(rawAnswers)) {
    // 1. ID langsung
    if (questionById[key]) {
      mapped[key] = value
      continue
    }

    // 2. Label persis
    if (questionByLabel[key]) {
      const q = questionByLabel[key]
      mapped[q._indicatorKey || q.id] = value
      continue
    }

    // 3. Clean label
    const cleanKey = cleanString(key)
    if (questionByCleanLabel[cleanKey]) {
      const q = questionByCleanLabel[cleanKey]
      mapped[q._indicatorKey || q.id] = value
      continue
    }

    // 4. Substring match
    let found = false
    for (const [lbl, q] of Object.entries(questionByLabel)) {
      if (key.includes(lbl) || cleanKey.includes(cleanString(lbl))) {
        mapped[q._indicatorKey || q.id] = value
        found = true
        break
      }
    }
    if (found) continue

    // 5. Parsing "label-index"
    const lastDash = key.lastIndexOf('-')
    if (lastDash > 0) {
      const maybeIdOrLabel = key.substring(0, lastDash)
      const suffix = key.substring(lastDash)
      if (questionById[maybeIdOrLabel]) {
        mapped[key] = value
        continue
      }
      if (questionByLabel[maybeIdOrLabel]) {
        mapped[questionByLabel[maybeIdOrLabel].id + suffix] = value
        continue
      }
      const cleanFront = cleanString(maybeIdOrLabel)
      if (questionByCleanLabel[cleanFront]) {
        mapped[questionByCleanLabel[cleanFront].id + suffix] = value
        continue
      }
    }

    // Fallback
    mapped[key] = value
  }

  return mapped
}

// ---------- POST HANDLER ----------
export async function POST() {
  try {
    const formsSnap = await firestore.collection('forms').get()
    const formsMap: Record<string, any> = {}
    formsSnap.forEach((doc: QueryDocumentSnapshot) => {
      formsMap[doc.id] = doc.data()
    })

    const responsesSnap = await firestore.collection('responses').get()
    let repaired = 0
    
    // Gunakan let karena batch akan di-reassign
    let batch = firestore.batch()
    let batchCount = 0

    for (const doc of responsesSnap.docs) {
      const data = doc.data()
      const form = formsMap[data.formId]
      if (!form || !form.questions) continue

      const mappedAnswers = mapAnswersToQuestionIds(data.answers, form)

      if (JSON.stringify(mappedAnswers) !== JSON.stringify(data.answers)) {
        batch.update(doc.ref, { answers: mappedAnswers })
        batchCount++
        repaired++
      }

      if (batchCount >= 500) {
        await batch.commit()
        batch = firestore.batch() // reassign dengan batch baru
        batchCount = 0
      }
    }

    if (batchCount > 0) {
      await batch.commit()
    }

    return NextResponse.json({ success: true, repaired })
  } catch (error) {
    console.error('Repair error:', error)
    return NextResponse.json(
      { success: false, error: String(error) },
      { status: 500 }
    )
  }
}