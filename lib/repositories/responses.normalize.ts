import type { ResponseDoc } from '@/lib/domain/responses/response-types'
import { ScoringEngine } from '@/lib/domain/scoring/preview-engine'

function extractRespondentInfo(rawData: any) {
  const ans = rawData.answers || {}

  const findValue = (keys: string[]) => {
    for (const k of keys) {
      if (ans[k] !== undefined && ans[k] !== null && String(ans[k]).trim() !== '') {
        return String(ans[k]).trim()
      }
      const cleanK = cleanString(k)
      for (const [aKey, aVal] of Object.entries(ans)) {
        if (cleanString(aKey) === cleanK && aVal !== undefined && aVal !== null && String(aVal).trim() !== '') {
          return String(aVal).trim()
        }
      }
    }
    return undefined
  }

  const name =
    rawData.respondentName ||
    rawData.name ||
    rawData.respondent?.name ||
    findValue([
      'respondentName',
      'nama',
      'name',
      'namaLengkap',
      'Nama Lengkap',
      'Nama',
      'nama_lengkap',
      'Nama Responden',
      'namaResponden',
    ]) ||
    'Responden Publik'

  const email =
    rawData.respondentEmail ||
    rawData.email ||
    rawData.respondent?.email ||
    findValue(['respondentEmail', 'email', 'alamatEmail', 'Email', 'Alamat Email', 'e-mail', 'mail']) ||
    ''

  const phone =
    rawData.respondentPhone ||
    rawData.phone ||
    rawData.respondent?.phone ||
    findValue(['respondentPhone', 'phone', 'noHp', 'telepon', 'No HP', 'No. HP', 'HP', 'no_hp', 'Nomor HP', 'No Telepon']) ||
    ''

  const address =
    rawData.respondentAddress ||
    rawData.address ||
    rawData.respondent?.address ||
    findValue(['respondentAddress', 'alamat', 'address', 'Alamat', 'Lokasi', 'Alamat Lengkap']) ||
    ''

  const institution =
    rawData.respondentInstitution ||
    rawData.institution ||
    rawData.respondent?.institution ||
    findValue(['institution', 'instansi', 'sekolah', 'namaSekolah', 'Nama Sekolah / Instansi', 'Nama Instansi', 'Lembaga', 'Organisasi', 'unitKerja', 'Pekerjaan', 'Jabatan']) ||
    ''

  return { name, email, phone, address, institution, externalId: rawData.respondentId || rawData.externalId || '' }
}

/**
 * Helper: Normalizes legacy V1 or modern V1.5 response document on the fly.
 */
export function normalizeResponseDoc(rawData: any, docId?: string): ResponseDoc {
  const responseId = rawData.responseId || rawData.id || docId || 'resp_legacy'
  const distributionCode = rawData.distributionCode || rawData.formCode || rawData.formId || 'V1-LEGACY'
  const status = rawData.status || 'submitted'
  const extracted = extractRespondentInfo(rawData)
  const respondent = {
    name: rawData.respondent?.name || extracted.name || 'Responden Publik',
    email: rawData.respondent?.email || extracted.email || '',
    phone: rawData.respondent?.phone || extracted.phone || '',
    address: rawData.respondent?.address || extracted.address || '',
    institution: rawData.respondent?.institution || extracted.institution || '',
    externalId: rawData.respondent?.externalId || extracted.externalId || '',
    ...rawData.respondent,
  }

  let biodata = Array.isArray(rawData.biodata) ? rawData.biodata : []
  if (biodata.length === 0 && rawData.answers) {
    const items: Array<{ label: string; value: string }> = []
    Object.entries(rawData.answers).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '') {
        const cleanK = cleanString(k)
        if (['nama', 'email', 'nohp', 'telepon', 'alamat', 'instansi', 'sekolah', 'jabatan', 'pekerjaan', 'kelas', 'jeniskelamin', 'umur', 'usia'].some(b => cleanK.includes(b))) {
          items.push({ label: k, value: typeof v === 'object' ? JSON.stringify(v) : String(v) })
        }
      }
    })
    if (items.length > 0) biodata = items
  }

  return {
    responseId,
    distributionId: rawData.distributionId || 'dist_legacy',
    distributionCode,
    formId: rawData.formId || 'form_legacy',
    versionId: rawData.versionId || 'v1.5_init',
    versionNumber: rawData.versionNumber || 1.5,
    ownerType: rawData.ownerType || 'cadre',
    ownerId: rawData.ownerId || rawData.createdBy || 'cadre_system',
    respondent,
    answers: rawData.answers || {},
    biodata,
    status,
    startedAt: rawData.startedAt || rawData.createdAt || new Date().toISOString(),
    updatedAt: rawData.updatedAt || rawData.submittedAt || new Date().toISOString(),
    submittedAt: rawData.submittedAt || undefined,
    submissionToken: rawData.submissionToken || `token_${responseId}`,
    result: rawData.result || undefined,
    createdBy: rawData.createdBy,
    cadreId: rawData.cadreId,
    userId: rawData.userId,
    formTitle: rawData.formTitle,
    groupName: rawData.groupName,
    distributionTitle: rawData.distributionTitle,
    ownerName: rawData.ownerName,
    metadata: rawData.metadata || {},
  }
}

export function cleanString(str: string): string {
  return str.toLowerCase().replace(/[^a-z0-9]/g, '')
}

function mapAnswersToQuestionIdsV1(
  rawAnswers: Record<string, any>,
  form: any
): Record<string, any> {
  if (!form || !form.questions) return rawAnswers

  const mapped: Record<string, any> = {}
  const questionById: Record<string, any> = {}
  const questionByLabel: Record<string, any> = {}
  const questionByCleanLabel: Record<string, any> = {}

  form.questions.forEach((q: any) => {
    if (q.id) questionById[q.id] = q
    const label = (q.question || q.label || '').trim()
    if (label) {
      questionByLabel[label] = q
      questionByCleanLabel[cleanString(label)] = q
    }
  })

  for (const [key, value] of Object.entries(rawAnswers)) {
    let q = questionByLabel[key] || questionByCleanLabel[cleanString(key)] || questionById[key]

    if (!q) {
      for (const [lbl, ques] of Object.entries(questionByLabel)) {
        if (key.includes(lbl) || cleanString(key).includes(cleanString(lbl))) {
          q = ques
          break
        }
      }
    }

    if (q) {
      const type = q.answerType || q.type || 'short-text'

      if ((type === 'indicator-table' || type === 'likert') && typeof value === 'object' && value !== null && !Array.isArray(value)) {
        const indicators = q.config?.indicators || q.indicators || []
        const statements = q.config?.statements || q.statements || q.options || []
        const rows = indicators.length > 0 ? indicators.map((ind: any) => (typeof ind === 'string' ? ind : ind.label || ind)) : statements

        for (const [rowLabel, rowVal] of Object.entries(value)) {
          const rowIndex = rows.findIndex((r: any) => {
            const rStr = typeof r === 'string' ? r : (r.label || r.title || r.text || String(r))
            return rStr === rowLabel || cleanString(rStr) === cleanString(rowLabel)
          })
          if (rowIndex !== -1) {
            mapped[`${q.id}-${rowIndex}`] = rowVal
          }
        }
      } else {
        mapped[q.id || q.questionId] = value
      }
    } else {
      mapped[key] = value
    }
  }

  return mapped
}

export function calculateScoreWithV1Engine(
  docAnswers: Record<string, any>,
  form: any
) {
  if (!form || !form.questions || form.questions.length === 0) return null

  const mappedAnswers = mapAnswersToQuestionIdsV1(docAnswers || {}, form)

  const scoring = form.scoring || {
    totalPoints: 100,
    mode: 'auto',
    distribution: {},
    overrides: {},
    allowOverride: true,
    autoBalance: true,
  }

  const validation = form.validation || {
    mode: 'all_required',
    exceptions: [],
    allowOverride: true,
  }

  let stages = form.stages
  if (!stages || stages.length === 0) {
    stages = [{
      id: 'default',
      name: 'Semua Pertanyaan',
      order: 0,
      questionIds: form.questions.map((q: any) => q.id),
      includeInScoring: true,
    }]
  }

  const questionsWithScoring = form.questions.map((q: any) => {
    const type = q.answerType || q.type || 'short-text'
    let scheme: 'none' | 'binary' | 'likert' | 'rating' | 'indicator' = 'none'
    if (type === 'single-choice' || type === 'dropdown' || type === 'binary') scheme = 'binary'
    else if (type === 'multiple-choice') scheme = 'binary'
    else if (type === 'indicator-table' || type === 'likert') scheme = 'indicator'
    else if (type === 'rating') scheme = 'rating'
    return { ...q, scoring: q.scoring || { scheme, weight: 1 } }
  })

  const engine = new ScoringEngine(questionsWithScoring, scoring as any, validation as any, stages as any)
  const legacyResult = engine.calculateScore(mappedAnswers)
  return { mappedAnswers, legacyResult }
}

export function mapAnswersToHumanReadable(rawAnswers: Record<string, any>, form: any): Record<string, any> {
  if (!rawAnswers || typeof rawAnswers !== 'object') return {}
  const mapped: Record<string, any> = {}
  const questionMap = new Map<string, any>()
  const questionsList: any[] = form && Array.isArray(form.questions) ? form.questions : []

  questionsList.forEach((q: any, idx: number) => {
    if (q.id) questionMap.set(q.id, q)
    if (q.questionId) questionMap.set(q.questionId, q)
    const label = (q.question || q.label || q.title || q.prompt || '').trim()
    if (label) {
      questionMap.set(label, q)
      questionMap.set(cleanString(label), q)
    }
    questionMap.set(String(idx), q)
    questionMap.set(`q_${idx}`, q)
    questionMap.set(`q${idx}`, q)
    questionMap.set(`q_${idx + 1}`, q)
    questionMap.set(`q${idx + 1}`, q)
    questionMap.set(`question_${idx}`, q)
    questionMap.set(`question_${idx + 1}`, q)
  })

  for (const [key, value] of Object.entries(rawAnswers)) {
    if (
      [
        'respondentName',
        'respondentEmail',
        'name',
        'nama',
        'email',
        'createdAt',
        'submittedAt',
        'formId',
        'formTitle',
        'distributionCode',
        'formCode',
      ].includes(key)
    ) {
      continue
    }

    const q = questionMap.get(key) || questionMap.get(cleanString(key))
    const humanKey = q
      ? (q.question || q.label || q.title || q.prompt || key).trim()
      : key.replace(/^(q_|question_|sec_\d+_q_)/gi, 'Pertanyaan ').replace(/_/g, ' ')

    let humanVal = value
    if (q) {
      const options = q.options || q.presentation?.options || q.config?.options || []
      if (Array.isArray(options) && options.length > 0) {
        const findOptLabel = (valItem: any) => {
          if (valItem === undefined || valItem === null || valItem === '') return valItem
          const strItem = String(valItem).trim()
          const cleanItem = strItem.toLowerCase().replace(/[^a-z0-9]/g, '')
          let matched = options.find((opt: any) => {
            if (typeof opt === 'string') return opt === strItem || (cleanItem && opt.toLowerCase().replace(/[^a-z0-9]/g, '') === cleanItem)
            if (opt && typeof opt === 'object') {
              const oId = String(opt.optionId || opt.id || opt.value || opt.val || '')
              const oLbl = String(opt.label || opt.text || opt.title || '')
              return oId === strItem || oLbl === strItem || (cleanItem && (oId.toLowerCase().replace(/[^a-z0-9]/g, '') === cleanItem || oLbl.toLowerCase().replace(/[^a-z0-9]/g, '') === cleanItem))
            }
            return false
          })
          if (!matched && !isNaN(Number(valItem))) {
            const numIdx = Number(valItem)
            if (numIdx >= 0 && numIdx < options.length) matched = options[numIdx]
            else if (numIdx >= 1 && numIdx <= options.length) matched = options[numIdx - 1]
          }
          if (matched) {
            return typeof matched === 'object' ? (matched.label || matched.text || matched.title || valItem) : matched
          }
          return valItem
        }

        if (typeof value === 'string' || typeof value === 'number') {
          humanVal = findOptLabel(value)
        } else if (Array.isArray(value)) {
          humanVal = value.map((valItem) => findOptLabel(valItem))
        }
      }
    }

    mapped[humanKey] = humanVal
  }

  return mapped
}
