import assert from 'node:assert/strict'
import { test, describe } from 'node:test'
import { toPublicFormProjection } from '../lib/forms/v1_5/legacyAdapter'

describe('Security & Public Projection Boundaries', () => {

  test('toPublicFormProjection MUST NOT expose answerKey, scoring, or validation internals', () => {
    const canonicalForm: any = {
      form: {
        formId: 'form_test_01',
        metadata: { title: 'Uji Kebersihan Pangan', status: 'published', category: 'Umum' },
        activeVersionId: 'v1_test',
        createdAt: '2026-01-01T00:00:00Z',
      },
      version: {
        versionId: 'v1_test',
        formId: 'form_test_01',
        versionNumber: 1,
        status: 'published',
        questions: [
          {
            id: 'q1',
            question: 'Apakah kompor bersih?',
            answerType: 'single-choice',
            answerKey: { kind: 'option', correctOptionIds: ['opt_q1_0'] },
            scoring: { scheme: 'binary', weight: 10 },
            config: { correctAnswer: 'Ya', options: ['Ya', 'Tidak'] },
          },
        ],
        scoring: { totalPoints: 100, mode: 'auto', stagePointDistribution: {} },
        validation: { mode: 'all_required', exceptions: [] },
      },
    }

    const publicProjection = toPublicFormProjection(canonicalForm)

    // Verify version object has NO scoring or validation properties
    assert.equal((publicProjection.version as any).scoring, undefined, 'Public version MUST NOT contain scoring object')
    assert.equal((publicProjection.version as any).validation, undefined, 'Public version MUST NOT contain validation object')

    // Verify question object has NO answerKey or scoring properties
    const firstQuestion = publicProjection.version.questions[0] as any
    assert.equal(firstQuestion.answerKey, undefined, 'Public question MUST NOT contain answerKey')
    assert.equal(firstQuestion.scoring, undefined, 'Public question MUST NOT contain scoring')
  })
})
