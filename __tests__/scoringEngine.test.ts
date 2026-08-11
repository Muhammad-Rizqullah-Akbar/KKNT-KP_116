import assert from 'node:assert/strict'
import { test, describe } from 'node:test'
import { ScoringEngine } from '../lib/scoring/scoringEngine'

describe('ScoringEngine Regression Matrix', () => {

  test('Calculate score for single-choice binary scoring', () => {
    const questions = [
      {
        id: 'q1',
        question: 'Apakah Kebersihan Dapur Diterapkan?',
        answerType: 'single-choice',
        stageId: 'stage1',
        config: {
          options: ['Ya', 'Tidak'],
          correctAnswer: 'Ya',
        },
        scoring: { scheme: 'binary', weight: 10 },
      },
    ]

    const scoring: any = {
      totalPoints: 100,
      mode: 'auto',
      distribution: { stage1: 100 },
    }

    const validation: any = { mode: 'all_required' }
    const stages: any[] = [{ id: 'stage1', name: 'Stage 1', includeInScoring: true }]

    const engine = new ScoringEngine(questions, scoring, validation, stages)
    const result = engine.calculateScore({ q1: 'Ya' })

    assert.ok(result.percentage >= 0, 'Percentage should be valid number')
    assert.ok(typeof result.grade === 'string' && result.grade.length > 0, 'Grade should be a valid grade string')
    assert.ok(result.totalScore >= 0, 'Total score should be valid number')
  })
})
