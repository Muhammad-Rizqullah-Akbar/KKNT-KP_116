// Pure helper untuk memetakan questionId/optionId mentah menjadi teks yang bisa dibaca manusia.

function resolveQuestionMeta(formDoc: any, key: string) {
  if (!formDoc?.questions) return { prompt: key, options: null }
  const strKey = String(key).trim()
  const cleanKey = strKey.toLowerCase().replace(/[^a-z0-9]/g, '')
  const q = formDoc.questions.find(
    (item: any) =>
      item.questionId === strKey ||
      item.id === strKey ||
      item.prompt === strKey ||
      item.title === strKey ||
      item.question === strKey ||
      item.label === strKey ||
      (cleanKey && cleanKey === (item.prompt || item.title || item.question || item.label || '').toLowerCase().replace(/[^a-z0-9]/g, ''))
  )
  if (q) {
    return {
      prompt: q.prompt || q.title || q.question || q.label || key,
      options: q.options || q.presentation?.options || q.config?.options || null,
    }
  }
  return { prompt: key, options: null }
}

export function resolveAnswerDisplay(formDoc: any, key: string, val: any) {
  const meta = resolveQuestionMeta(formDoc, key)
  let displayVal = val
  if (meta.options && Array.isArray(meta.options)) {
    if (typeof val === 'string' || typeof val === 'number') {
      const strVal = String(val).trim()
      const cleanVal = strVal.toLowerCase().replace(/[^a-z0-9]/g, '')
      const opt = meta.options.find((o: any) => {
        if (typeof o === 'string') return o === strVal || (cleanVal && o.toLowerCase().replace(/[^a-z0-9]/g, '') === cleanVal)
        if (o && typeof o === 'object') {
          const oId = String(o.optionId || o.id || o.value || o.val || '')
          const oLbl = String(o.label || o.text || o.title || '')
          return oId === strVal || oLbl === strVal || (cleanVal && (oId.toLowerCase().replace(/[^a-z0-9]/g, '') === cleanVal || oLbl.toLowerCase().replace(/[^a-z0-9]/g, '') === cleanVal))
        }
        return false
      })
      if (opt) displayVal = typeof opt === 'object' ? (opt.label || opt.text || opt.title || val) : opt
    } else if (Array.isArray(val)) {
      displayVal = val.map((vItem) => {
        const strVal = String(vItem).trim()
        const cleanVal = strVal.toLowerCase().replace(/[^a-z0-9]/g, '')
        const opt = meta.options.find((o: any) => {
          if (typeof o === 'string') return o === strVal || (cleanVal && o.toLowerCase().replace(/[^a-z0-9]/g, '') === cleanVal)
          if (o && typeof o === 'object') {
            const oId = String(o.optionId || o.id || o.value || o.val || '')
            const oLbl = String(o.label || o.text || o.title || '')
            return oId === strVal || oLbl === strVal || (cleanVal && (oId.toLowerCase().replace(/[^a-z0-9]/g, '') === cleanVal || oLbl.toLowerCase().replace(/[^a-z0-9]/g, '') === cleanVal))
          }
          return false
        })
        return opt ? (typeof opt === 'object' ? (opt.label || opt.text || vItem) : opt) : vItem
      }).join(', ')
    }
  }
  return { prompt: meta.prompt, displayVal }
}
