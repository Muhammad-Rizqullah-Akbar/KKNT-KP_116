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

  test('Calculate V1.5 score for indicator-table with text label answers', () => {
    const { calculateQuestionScore } = require('../lib/forms/v1_5/scoring/scoringEngine')

    const question = {
      questionId: 'q_table_1',
      type: 'indicator-table',
      prompt: 'Evaluasi Penjamah Pangan',
      indicators: [
        { indicatorId: 'ind_1', label: 'Kebersihan Tangan' },
        { indicatorId: 'ind_2', label: 'Penggunaan Celemek' },
      ],
      presentation: {
        indicatorScales: [
          { value: 0, label: 'Tidak Memenuhi Syarat', score: 0 },
          { value: 5, label: 'Memenuhi Syarat', score: 5 },
        ],
      },
    }

    const answers = {
      ind_1: 'Memenuhi Syarat',
      ind_2: 'Memenuhi Syarat',
    }

    const scoreResult = calculateQuestionScore(question as any, answers)

    assert.equal(scoreResult.rawScore, 10, 'Raw score should be 10 (5 + 5)')
    assert.equal(scoreResult.maximumScore, 10, 'Maximum score should be 10')
    assert.equal(scoreResult.percentage, 100, 'Percentage should be 100%')
  })

  test('Calculate V1.5 aspect scores for Form Builder config indicator-table structure', () => {
    const { calculateAspectScores } = require('../lib/forms/v1_5/scoring/scoringEngine')

    const aspects = [
      { aspectId: 'asp_1', title: 'Aspek Hygiene', isScored: true },
    ]

    const questions = [
      {
        questionId: 'q_fb_table',
        type: 'indicator-table',
        prompt: 'Tabel Penilaian Sanitasi',
        aspectId: 'asp_1',
        config: {
          indicators: [
            { id: 'ind_1', label: 'Indikator Air Bersih', weight: 1 },
            { id: 'ind_2', label: 'Indikator Tempat Sampah', weight: 1 },
          ],
          indicatorScales: [
            { value: 0, label: 'Tidak Memenuhi' },
            { value: 5, label: 'Memenuhi' },
          ],
        },
      },
    ]

    const answers = {
      q_fb_table: {
        ind_1: 'Memenuhi',
        ind_2: 'Memenuhi',
      },
    }

    const aspectScores = calculateAspectScores(aspects as any, questions as any, answers)

    assert.equal(aspectScores.length, 1, 'Should return 1 aspect score result')
    assert.equal(aspectScores[0].rawScore, 10, 'Raw aspect score should be 10')
    assert.equal(aspectScores[0].maximumScore, 10, 'Max aspect score should be 10')
    assert.equal(aspectScores[0].percentage, 100, 'Aspect percentage should be 100%')
  })

  test('Calculate V1.5 score for indicator-table with numbered prefix scale labels', () => {
    const { calculateQuestionScore } = require('../lib/forms/v1_5/scoring/scoringEngine')

    const question = {
      questionId: 'q_table_prefix',
      type: 'indicator-table',
      prompt: 'Evaluasi Penjamah Pangan',
      config: {
        indicators: [
          { id: 'ind_1', label: 'Indikator Kebersihan' },
        ],
        indicatorScales: [
          { value: 0, label: '1. Tidak Memenuhi Syarat' },
          { value: 5, label: '2. Memenuhi Syarat' },
        ],
      },
    }

    const answers = {
      ind_1: 'Memenuhi Syarat',
    }

    const scoreResult = calculateQuestionScore(question as any, answers)

    assert.equal(scoreResult.rawScore, 5, 'Raw score should be 5')
    assert.equal(scoreResult.maximumScore, 5, 'Maximum score should be 5')
    assert.equal(scoreResult.percentage, 100, 'Percentage should be 100%')
  })
})
