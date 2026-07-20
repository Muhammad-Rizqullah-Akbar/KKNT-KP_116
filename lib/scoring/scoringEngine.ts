// lib/scoring/ScoringEngine.ts

import { FlexibleQuestion, FormScoring, FormValidation, FormStage } from '@/components/form-builder/ElementTypes'

export interface ScoringResult {
  totalScore: number
  maxScore: number
  percentage: number
  grade: string
  perQuestion: Record<string, {
    earned: number
    possible: number
    percentage: number
    label: string
  }>
  perStage: Record<string, {
    earned: number
    possible: number
    percentage: number
    name: string
    rawEarned?: number
    rawPossible?: number
  }>
  details: {
    correctCount: number
    wrongCount: number
    skippedCount: number
    totalQuestions: number
    scoredQuestions?: number
    unscoredQuestions?: number
  }
  recommendations: string[]
}

export interface AnswerMap {
  [questionId: string]: any
}

export class ScoringEngine {
  private questions: any[]
  private scoring: FormScoring
  private validation: FormValidation
  private stages: FormStage[]

  constructor(
    questions: any[],
    scoring: FormScoring,
    validation: FormValidation,
    stages: FormStage[]
  ) {
    this.questions = questions
    this.scoring = scoring
    this.validation = validation
    this.stages = stages
  }

  /**
   * Dapatkan stage yang masuk penilaian
   */
  private getScoredStages(): FormStage[] {
    return this.stages.filter(s => s.includeInScoring !== false)
  }

  /**
   * Hitung skor berdasarkan jawaban user
   */
  calculateScore(answers: AnswerMap): ScoringResult {
    const perQuestion: Record<string, any> = {}
    const perStage: Record<string, any> = {}
    let correctCount = 0
    let wrongCount = 0
    let skippedCount = 0
    let totalQuestions = 0

    // Inisialisasi per stage
    this.stages.forEach(stage => {
      perStage[stage.id] = { 
        earned: 0, 
        possible: 0, 
        percentage: 0,
        name: stage.name,
        rawEarned: 0,
        rawPossible: 0,
      }
    })

    // Filter pertanyaan yang bisa discore
    const scorableQuestions = this.questions.filter((q: any) => {
      const type = q.answerType || q.type || 'short-text'
      return type !== 'image' && type !== 'file-upload' && type !== 'signature'
    })

    totalQuestions = scorableQuestions.length

    // ===== HITUNG SKOR MENTAH (RAW SCORE) =====
    scorableQuestions.forEach((q: any) => {
      const result = this.calculateQuestionScore(q, answers)
      const label = q.question || q.label || `Pertanyaan ${q.order + 1 || ''}`
      
      perQuestion[q.id] = {
        ...result,
        label
      }
      
      // Akumulasi ke stage (RAW)
      const stageId = q.stageId || this.stages[0]?.id
      if (stageId && perStage[stageId]) {
        perStage[stageId].rawEarned += result.earned
        perStage[stageId].rawPossible += result.possible
      }
      
      // Statistik
      if (result.possible > 0) {
        if (result.earned === result.possible) {
          correctCount++
        } else if (result.earned === 0) {
          wrongCount++
        } else {
          // Partial correct
          correctCount++
        }
      } else {
        skippedCount++
      }
    })

    // ===== HITUNG PERSENTASE PER STAGE (RAW) =====
    Object.keys(perStage).forEach(stageId => {
      const stage = perStage[stageId]
      const rawPercentage = stage.rawPossible > 0 
        ? Math.round((stage.rawEarned / stage.rawPossible) * 100) 
        : 0
      stage.percentage = rawPercentage
    })

    // ===== NORMALISASI KE TOTAL POINTS =====
    let totalEarnedPoints = 0
    let totalPossiblePoints = 0
    const scoredStages = this.getScoredStages()

    scoredStages.forEach(stage => {
      const stageData = perStage[stage.id]
      const allocatedPoints = this.scoring.distribution[stage.id] || 0
      
      // Normalisasi: (percentage / 100) * allocatedPoints
      const normalizedEarned = (stageData.percentage / 100) * allocatedPoints
      
      stageData.earned = Math.round(normalizedEarned * 100) / 100
      stageData.possible = allocatedPoints
      
      totalEarnedPoints += stageData.earned
      totalPossiblePoints += allocatedPoints
    })

    // ===== UNSCORED STAGES =====
    this.stages.forEach(stage => {
      if (!scoredStages.find(s => s.id === stage.id)) {
        perStage[stage.id].earned = 0
        perStage[stage.id].possible = 0
        perStage[stage.id].percentage = 0
      }
    })

    // ===== TOTAL =====
    const totalPercentage = totalPossiblePoints > 0 
      ? Math.round((totalEarnedPoints / totalPossiblePoints) * 100) 
      : 0

    const grade = this.getGrade(totalPercentage)
    const recommendations = this.generateRecommendations(perStage, totalPercentage)

    return {
      totalScore: Math.round(totalEarnedPoints * 100) / 100,
      maxScore: this.scoring.totalPoints,
      percentage: totalPercentage,
      grade,
      perQuestion,
      perStage,
      details: {
        correctCount,
        wrongCount,
        skippedCount,
        totalQuestions,
        scoredQuestions: scorableQuestions.length,
        unscoredQuestions: this.questions.length - scorableQuestions.length,
      },
      recommendations
    }
  }

  /**
   * Hitung skor per pertanyaan
   */
  private calculateQuestionScore(
    question: any,
    answers: AnswerMap
  ): { earned: number; possible: number; percentage: number } {
    const type = question.answerType || question.type || 'short-text'
    const scoring = question.scoring || { scheme: 'none', weight: 1 }
    const weight = scoring.weight || 1
    
    // Jika tidak ada skema penilaian
    if (scoring.scheme === 'none') {
      return { earned: 0, possible: 0, percentage: 0 }
    }

    // Dapatkan jawaban user
    let userAnswer = answers[question.id]
    
    // Untuk indicator table, ambil semua jawaban per row
    if (type === 'indicator-table' || type === 'likert') {
      const indicators = question.config?.indicators || []
      const statements = question.config?.statements || question.options || []
      const rows = indicators.length > 0 ? indicators : statements
      const rowAnswers: Record<string, string> = {}
      rows.forEach((_: any, i: number) => {
        const key = `${question.id}-${i}`
        if (answers[key]) {
          rowAnswers[key] = answers[key]
        }
      })
      userAnswer = rowAnswers
    }

    // Jika pertanyaan tidak dijawab
    if (this.isAnswerEmpty(userAnswer, type)) {
      const possible = this.getMaxScore(question)
      return { earned: 0, possible, percentage: 0 }
    }

    let earned = 0
    const possible = this.getMaxScore(question)

    switch (type) {
      case 'single-choice':
      case 'binary':
        earned = this.calculateSingleChoice(question, userAnswer, weight)
        break
        
      case 'multiple-choice':
        earned = this.calculateMultipleChoice(question, userAnswer, weight)
        break
        
      case 'indicator-table':
      case 'likert':
        earned = this.calculateIndicatorTable(question, userAnswer)
        break
        
      case 'rating':
        earned = this.calculateRating(question, userAnswer, weight)
        break
        
      case 'dropdown':
        earned = this.calculateSingleChoice(question, userAnswer, weight)
        break
        
      default:
        earned = userAnswer ? possible : 0
    }

    const percentage = possible > 0 ? Math.round((earned / possible) * 100) : 0
    
    return { earned, possible, percentage }
  }

  /**
   * Cek apakah jawaban kosong
   */
  private isAnswerEmpty(answer: any, type: string): boolean {
    if (answer === undefined || answer === null) return true
    
    if (type === 'indicator-table' || type === 'likert') {
      if (typeof answer === 'object') {
        return Object.values(answer).every(v => !v || v === '')
      }
      return true
    }
    
    if (type === 'multiple-choice') {
      return !Array.isArray(answer) || answer.length === 0
    }
    
    if (type === 'signature') {
      return !answer || answer === ''
    }
    
    return answer === ''
  }

  /**
   * Hitung skor untuk single choice
   */
  private calculateSingleChoice(
    question: any,
    userAnswer: string,
    weight: number
  ): number {
    const config = question.config || {}
    const correctAnswer = config.correctAnswer
    
    if (!correctAnswer) return 0
    
    if (userAnswer === correctAnswer) {
      return weight
    }
    
    return 0
  }

  /**
   * Hitung skor untuk multiple choice (Partial Scoring - TANPA PENALTI)
   */
  private calculateMultipleChoice(
    question: any,
    userAnswers: string[],
    weight: number
  ): number {
    const config = question.config || {}
    const correctAnswers = config.correctAnswer 
      ? (Array.isArray(config.correctAnswer) 
          ? config.correctAnswer 
          : [config.correctAnswer])
      : []
    
    if (correctAnswers.length === 0) return 0
    if (!Array.isArray(userAnswers) || userAnswers.length === 0) return 0

    // Hitung jawaban benar yang dipilih (TANPA PENALTI)
    let correctSelected = 0
    userAnswers.forEach(ans => {
      if (correctAnswers.includes(ans)) {
        correctSelected++
      }
    })

    // Partial scoring: (correct_selected / total_correct) * weight
    const maxScore = correctAnswers.length
    const score = Math.min(correctSelected, maxScore)
    
    return (score / maxScore) * weight
  }

  /**
   * Hitung skor untuk indicator table - DENGAN REVERSE SCORING
   */
  private calculateIndicatorTable(
    question: any,
    userAnswers: Record<string, string>
  ): number {
    const config = question.config || {}
    const indicators = config.indicators || []
    const scales = config.indicatorScales || [
      { value: 1, label: 'STS' },
      { value: 2, label: 'TS' },
      { value: 3, label: 'N' },
      { value: 4, label: 'S' },
      { value: 5, label: 'SS' },
    ]
    const showWeighted = config.showWeightedScore || false
    
    if (indicators.length === 0) return 0

    // Ambil min dan max dari skala yang SEBENARNYA
    const maxVal = scales.length > 0 ? Math.max(...scales.map(s => s.value)) : 5
    const minVal = scales.length > 0 ? Math.min(...scales.map(s => s.value)) : 1

    let totalEarned = 0

    indicators.forEach((indicator: any, index: number) => {
      const key = `${question.id}-${index}`
      const selectedLabel = userAnswers[key] || ''
      const selectedScale = scales.find((s: any) => s.label === selectedLabel)
      let value = selectedScale?.value || 0
      const weight = indicator.weight || 1
      
      // 🔥 REVERSE SCORING: balik nilainya jika reverse === true
      // Contoh: STS(1) → SS(5), TS(2) → S(4), dst.
      if (indicator.reverse === true && value > 0) {
        value = maxVal - value + minVal
      }
      
      totalEarned += showWeighted ? value * weight : value
    })

    return totalEarned
  }

  /**
   * Hitung skor untuk rating
   */
  private calculateRating(
    question: any,
    userAnswer: number,
    weight: number
  ): number {
    const config = question.config || {}
    const maxRating = config.ratingMax || 5
    
    const rating = Number(userAnswer) || 0
    return (rating / maxRating) * weight
  }

  /**
   * Dapatkan skor maksimal per pertanyaan
   */
  private getMaxScore(question: any): number {
    const type = question.answerType || question.type || 'short-text'
    const scoring = question.scoring || { scheme: 'none', weight: 1 }
    const weight = scoring.weight || 1
    
    switch (type) {
      case 'single-choice':
      case 'binary':
      case 'dropdown':
        return weight
        
      case 'multiple-choice': {
        const config = question.config || {}
        const correctAnswers = config.correctAnswer 
          ? (Array.isArray(config.correctAnswer) 
              ? config.correctAnswer 
              : [config.correctAnswer])
          : []
        return weight
      }
      
      case 'indicator-table':
      case 'likert': {
        const config = question.config || {}
        const indicators = config.indicators || []
        const scales = config.indicatorScales || [
          { value: 1, label: 'STS' },
          { value: 2, label: 'TS' },
          { value: 3, label: 'N' },
          { value: 4, label: 'S' },
          { value: 5, label: 'SS' },
        ]
        const showWeighted = config.showWeightedScore || false
        
        // 🔥 Cari nilai maksimal dari skala yang SEBENARNYA
        const maxScaleValue = scales.length > 0 
          ? Math.max(...scales.map((s: any) => s.value))
          : 5
        
        let max = 0
        indicators.forEach((ind: any) => {
          const w = ind.weight || 1
          max += showWeighted ? maxScaleValue * w : maxScaleValue
        })
        return max || 1
      }
      
      case 'rating':
        return weight
        
      default:
        return weight
    }
  }

  /**
   * Dapatkan grade berdasarkan persentase
   */
  private getGrade(percentage: number): string {
    if (percentage >= 90) return 'A (Sangat Baik)'
    if (percentage >= 80) return 'B (Baik)'
    if (percentage >= 70) return 'C (Cukup)'
    if (percentage >= 60) return 'D (Kurang)'
    return 'E (Sangat Kurang)'
  }

  /**
   * Generate rekomendasi berdasarkan hasil
   */
  private generateRecommendations(
    perStage: Record<string, any>,
    totalPercentage: number
  ): string[] {
    const recommendations: string[] = []

    if (totalPercentage < 40) {
      recommendations.push('🔴 Perlu perbaikan signifikan pada pemahaman materi.')
    } else if (totalPercentage < 60) {
      recommendations.push('🟡 Masih perlu peningkatan pemahaman.')
    } else if (totalPercentage < 80) {
      recommendations.push('🟢 Pemahaman sudah cukup baik.')
    } else {
      recommendations.push('🌟 Pemahaman sangat baik, pertahankan!')
    }

    const sortedStages = Object.entries(perStage)
      .filter(([_, data]) => data.possible > 0)
      .sort((a, b) => a[1].percentage - b[1].percentage)

    if (sortedStages.length > 0) {
      const lowest = sortedStages[0]
      if (lowest[1].percentage < 60) {
        recommendations.push(`📚 Fokus perbaiki pada: "${lowest[1].name}" (${lowest[1].percentage}%)`)
      }
    }

    return recommendations
  }
}