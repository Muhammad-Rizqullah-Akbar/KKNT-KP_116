/**
 * Client & Server Safe Respondent Utilities (No server-only dependencies)
 */

export function extractRespondentName(response: any, form?: any): string {
  if (!response) return 'Responden'

  const isValidName = (val: any): boolean => {
    if (typeof val !== 'string') return false
    const trimmed = val.trim()
    if (!trimmed || trimmed.length < 2) return false
    const lower = trimmed.toLowerCase()

    // 1. Must not be fallback / metadata strings
    if (
      [
        'responden',
        'anonim',
        'publik',
        'responden publik',
        'responden publik (anonim)',
        'undefined',
        'null',
        'n/a',
        '-',
      ].includes(lower)
    ) {
      return false
    }

    // 2. Must NOT be a question ID, section ID, or option ID
    if (
      /^(q_|sec_\d+_q_|opt_|question_|ind_)/i.test(trimmed) ||
      /^(q_\d+|sec_\d+|opt_\d+|q_[0-9]{10,})$/i.test(trimmed)
    ) {
      return false
    }

    // 3. Must NOT be base64 image or pure numbers
    if (trimmed.startsWith('data:image/') || /^\d+$/.test(trimmed)) {
      return false
    }

    return true
  }

  // 1. Direct property on response (response.respondentName)
  if (isValidName(response.respondentName)) {
    return response.respondentName.trim()
  }

  // 2. Direct property on response.respondent (response.respondent.name / fullName / nama)
  const respObj = response.respondent
  if (respObj && typeof respObj === 'object') {
    const directName = respObj.name || respObj.fullName || respObj.nama || respObj.respondentName || respObj.label
    if (isValidName(directName)) {
      return String(directName).trim()
    }
  }

  const answers = response.answers
  if (answers && typeof answers === 'object') {
    // 3. PRIORITY A: Check form questions explicitly tagged as biodata-name or respondent_name or containing 'nama'
    if (form && Array.isArray(form.questions)) {
      for (const q of form.questions) {
        const biodataKey = q.biodataKey || q.identifierType
        const qType = q.type
        const prompt = (q.question || q.prompt || q.title || q.label || '').trim()
        const cleanPrompt = prompt.toLowerCase()

        const isNameQuestion =
          biodataKey === 'respondent_name' ||
          qType === 'biodata-name' ||
          q.isIdentifier ||
          biodataKey === 'name' ||
          ((cleanPrompt.includes('nama') || cleanPrompt.includes('name')) &&
            !cleanPrompt.includes('instansi') &&
            !cleanPrompt.includes('sarana') &&
            !cleanPrompt.includes('sekolah') &&
            !cleanPrompt.includes('alamat') &&
            !cleanPrompt.includes('lokasi'))

        if (isNameQuestion) {
          const qId = q.id || q.questionId
          const val =
            answers[qId] ||
            (q.id ? answers[q.id] : null) ||
            (q.questionId ? answers[q.questionId] : null) ||
            answers[prompt] ||
            answers[q.question]

          if (isValidName(val)) {
            return String(val).trim()
          }
        }
      }
    }

    // 4. PRIORITY B: Common keys in answers
    const commonKeys = [
      'respondentName',
      'respondent_name',
      'namaLengkap',
      'nama_lengkap',
      'namaResponden',
      'nama_responden',
      'namaSiswa',
      'nama_siswa',
      'Nama Lengkap',
      'Nama Responden',
      'Nama Siswa',
      'Nama Siswa/i',
      'Nama Lengkap Siswa',
      'Nama Lengkap Siswa/i',
      'Nama Karyawan',
      'Nama',
      'nama',
      'name',
      '1. Nama Lengkap',
      '1. Nama',
      'a. Nama',
      'A. Nama',
    ]

    for (const key of commonKeys) {
      const val = answers[key]
      if (isValidName(val)) {
        return String(val).trim()
      }
    }

    // 5. PRIORITY C: Key containing 'nama' or 'name'
    for (const [key, val] of Object.entries(answers)) {
      if (isValidName(val)) {
        const cleanKey = key.trim().toLowerCase()
        if (
          cleanKey.includes('nama') ||
          cleanKey.includes('name')
        ) {
          if (!['formname', 'groupname', 'filename', 'username', 'code', 'instansi', 'sarana', 'sekolah', 'alamat'].some(sub => cleanKey.includes(sub))) {
            return String(val).trim()
          }
        }
      }
    }

    // 6. PRIORITY D: Any valid string value in answers that is not an ID/image/number
    for (const [key, val] of Object.entries(answers)) {
      if (isValidName(val)) {
        const strVal = String(val).trim()
        if (/[a-zA-Z]/.test(strVal) && strVal.length >= 2) {
          return strVal
        }
      }
    }
  }

  return 'Responden'
}

export function extractRespondentEmail(response: any, form?: any): string {
  if (!response) return ''

  if (response.respondentEmail && typeof response.respondentEmail === 'string' && response.respondentEmail.trim()) {
    return response.respondentEmail.trim()
  }

  const respObj = response.respondent
  if (respObj && typeof respObj === 'object') {
    const directEmail = respObj.email || respObj.respondentEmail || respObj.surel
    if (typeof directEmail === 'string' && directEmail.trim()) {
      return directEmail.trim()
    }
  }

  const answers = response.answers
  if (answers && typeof answers === 'object') {
    const commonKeys = [
      'respondentEmail',
      'respondent_email',
      'email',
      'surel',
      'Email',
      'Alamat Email',
      'Email Responden',
      'Email Siswa',
      '1. Email',
    ]

    for (const key of commonKeys) {
      const val = answers[key]
      if (typeof val === 'string' && val.trim() && val.includes('@')) {
        return val.trim()
      }
    }

    for (const [key, val] of Object.entries(answers)) {
      if (typeof val === 'string' && val.trim() && val.includes('@')) {
        const cleanKey = key.trim().toLowerCase()
        if (cleanKey.includes('email') || cleanKey.includes('surel') || cleanKey.includes('mail')) {
          return val.trim()
        }
      }
    }
  }

  return ''
}
