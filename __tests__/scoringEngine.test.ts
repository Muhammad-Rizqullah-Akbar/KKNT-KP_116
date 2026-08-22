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

  test('Calculate V1.5 score for legacy Pengetahuan (Knowledge) single-choice with config.correctAnswer label', () => {
    const { calculateQuestionScore } = require('../lib/forms/v1_5/scoring/scoringEngine')

    const question = {
      questionId: 'q_peng_1',
      id: 'q_peng_1',
      type: 'single-choice',
      prompt: 'Berapakah suhu aman penyimpanan pangan matang?',
      config: {
        options: ['A. < 5°C atau > 60°C', 'B. 20°C - 40°C', 'C. 100°C', 'D. Semua salah'],
        correctAnswer: 'A. < 5°C atau > 60°C',
      },
    }

    // Respondent selects optionId generated from string option
    const answers1 = { q_peng_1: 'opt_q_peng_1_0' }
    const res1 = calculateQuestionScore(question as any, answers1.q_peng_1)
    assert.equal(res1.percentage, 100, 'Should score 100% when option ID matches correct label')

    // Respondent selects option label string directly
    const answers2 = { q_peng_1: 'A. < 5°C atau > 60°C' }
    const res2 = calculateQuestionScore(question as any, answers2.q_peng_1)
    assert.equal(res2.percentage, 100, 'Should score 100% when string label matches correct label')

    // Respondent selects wrong option
    const answersWrong = { q_peng_1: 'B. 20°C - 40°C' }
    const resWrong = calculateQuestionScore(question as any, answersWrong.q_peng_1)
    assert.equal(resWrong.percentage, 0, 'Should score 0% for wrong answer')
  })

  test('Calculate V1.5 score for legacy Pengetahuan question with numeric index correctAnswer', () => {
    const { calculateQuestionScore } = require('../lib/forms/v1_5/scoring/scoringEngine')

    const question = {
      questionId: 'q_peng_idx',
      id: 'q_peng_idx',
      type: 'single-choice',
      prompt: 'Bakteri penyebab keracunan makanan adalah?',
      config: {
        options: ['Escherichia coli', 'Lactobacillus', 'Saccharomyces'],
        correctAnswer: 0, // 0-based index pointing to 'Escherichia coli'
      },
    }

    const res1 = calculateQuestionScore(question as any, 'Escherichia coli')
    assert.equal(res1.percentage, 100, 'Should score 100% when selected label matches index 0')

    const res2 = calculateQuestionScore(question as any, 'opt_q_peng_idx_0')
    assert.equal(res2.percentage, 100, 'Should score 100% when selected optionId matches index 0')

    const resWrong = calculateQuestionScore(question as any, 'Lactobacillus')
    assert.equal(resWrong.percentage, 0, 'Should score 0% for incorrect option')
  })

  test('Exclude Data Responden & Sumber Informasi biodata aspects from scoring summary', () => {
    const { isBiodataAspect, calculateResponseScore } = require('../lib/forms/v1_5/scoring/scoringEngine')

    assert.equal(isBiodataAspect('Data Responden'), true, 'Data Responden should be recognized as biodata')
    assert.equal(isBiodataAspect('Sumber Informasi & Media'), true, 'Sumber Informasi should be recognized as biodata')
    assert.equal(isBiodataAspect('Aspek Pengetahuan'), false, 'Aspek Pengetahuan is NOT biodata')

    const snapshot = {
      aspects: [
        { aspectId: 'asp_bio', title: 'Data Responden', questionIds: ['q_bio_1'] },
        { aspectId: 'asp_know', title: 'Aspek Pengetahuan', questionIds: ['q_know_1'] },
      ],
      questions: [
        { questionId: 'q_bio_1', aspectId: 'asp_bio', answerType: 'short-text', prompt: 'Nama' },
        { questionId: 'q_know_1', aspectId: 'asp_know', answerType: 'single-choice', prompt: 'Pertanyaan', options: ['A', 'B'], config: { correctAnswer: 'A' } },
      ],
      scoring: { totalPoints: 100, mode: 'auto', stagePointDistribution: {} },
      thresholds: [],
      recommendations: { mode: 'automatic', gradeArticleMap: {} },
    }

    const answers = {
      q_bio_1: 'Budi',
      q_know_1: 'A',
    }

    const result = calculateResponseScore(snapshot as any, answers)
    assert.equal(result.percentage, 100, 'Overall score should be 100% based ONLY on Pengetahuan')

    const bioAspect = result.aspectResults.find(a => a.aspectId === 'asp_bio')
    assert.equal(bioAspect?.weightPercentage, 0, 'Data Responden weight should be 0%')
    assert.equal(bioAspect?.weightedContribution, 0, 'Data Responden weighted contribution should be 0')
  })
})
