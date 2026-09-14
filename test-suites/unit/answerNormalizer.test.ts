import assert from 'node:assert/strict'
import { test, describe } from 'node:test'
import {
  resolveOptionLabel,
  normalizeAnswerValue,
  normalizeScaleLabel,
  getQuestionOptions,
} from '../../lib/domain/answers/normalizer'

describe('Answer Normalizer (single source of truth)', () => {
  test('Jenis Kelamin: index "1" → "1. Laki Laki" (NOT "Pilihan 1")', () => {
    const q = { questionId: 'wqtota6', answerType: 'single-choice', config: { options: ['1. Laki Laki', '2. Perempuan'] } }
    assert.equal(resolveOptionLabel(q, '1'), '1. Laki Laki')
    assert.equal(resolveOptionLabel(q, '2'), '2. Perempuan')
    assert.notEqual(resolveOptionLabel(q, '1'), 'Pilihan 1')
  })

  test('Jenis Kelamin: full label passthrough', () => {
    const q = { questionId: 'wqtota6', answerType: 'single-choice', config: { options: ['1. Laki Laki', '2. Perempuan'] } }
    assert.equal(resolveOptionLabel(q, '1. Laki Laki'), '1. Laki Laki')
    assert.equal(resolveOptionLabel(q, '2. Perempuan'), '2. Perempuan')
  })

  test('Multiple-choice: numeric index array → labels', () => {
    const q = { questionId: 'wcu7mc3', answerType: 'multiple-choice', config: { options: ['Mikroba', 'Benda asing', 'Bahan kimia', 'Pewarna'] } }
    assert.deepEqual(normalizeAnswerValue(q, ['2', '4']), ['Benda asing', 'Pewarna'])
    assert.equal(resolveOptionLabel(q, '1'), 'Mikroba')
  })

  test('Likert scale abbreviation → full label', () => {
    assert.equal(normalizeScaleLabel('SS'), 'Sangat Setuju')
    assert.equal(normalizeScaleLabel('STS'), 'Sangat Tidak Setuju')
    assert.equal(normalizeScaleLabel('N'), 'Netral')
    assert.equal(normalizeScaleLabel('Sering/Selalu'), 'Sering/Selalu')
  })

  test('indicator-table map → normalized scale labels', () => {
    const q = { questionId: 'sikap', answerType: 'indicator-table' }
    const result = normalizeAnswerValue(q, { 'Saya mencuci tangan': 'SS', 'Saya jajan': 'N' })
    assert.equal(result['Saya mencuci tangan'], 'Sangat Setuju')
    assert.equal(result['Saya jajan'], 'Netral')
  })

  test('Unresolvable value returns raw (never fabricates "Pilihan N")', () => {
    const q = { questionId: 'q', answerType: 'single-choice', config: { options: ['A', 'B'] } }
    assert.equal(resolveOptionLabel(q, 'XYZ'), 'XYZ')
  })

  test('getQuestionOptions normalizes string + object shapes', () => {
    const q1 = { questionId: 'a', config: { options: ['X', 'Y'] } }
    assert.deepEqual(getQuestionOptions(q1).map(o => o.label), ['X', 'Y'])
    const q2 = { questionId: 'b', options: [{ optionId: 'o1', label: 'Label 1' }] }
    assert.deepEqual(getQuestionOptions(q2).map(o => o.label), ['Label 1'])
  })
})
