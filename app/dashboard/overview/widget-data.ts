// Real data widget aggregator
export function getWidgetData(
  widget: any,
  responses: any[],
  selectedFormId: string,
  resolveOption: (val: any) => string,
): { labels: string[]; values: number[] } {
  const targetResponses = selectedFormId === 'all'
    ? responses
    : responses.filter(r => !widget.formId || r.formId === widget.formId || r.formId === selectedFormId || r.metadata?.formId === widget.formId)

  const counts: Record<string, number> = {}

  targetResponses.forEach(r => {
    if (r.answers) {
      Object.entries(r.answers).forEach(([key, val]) => {
        const isMatch =
          key === widget.questionText ||
          key === widget.questionId ||
          key.toLowerCase().includes((widget.questionText || '').toLowerCase().trim())

        if (isMatch) {
          const addValue = (v: any) => {
            const labelText = resolveOption(v)
            if (labelText && labelText.trim() !== '') {
              counts[labelText] = (counts[labelText] || 0) + 1
            }
          }

          if (typeof val === 'string' || typeof val === 'number') {
            addValue(val)
          } else if (Array.isArray(val)) {
            val.forEach(addValue)
          } else if (typeof val === 'object' && val !== null) {
            Object.values(val).forEach(addValue)
          }
        }
      })
    }
  })

  const labels = Object.keys(counts)
  const values = labels.map(l => counts[l])

  if (labels.length > 0) {
    return { labels, values }
  }

  return { labels: ['Belum Ada Respon'], values: [0] }
}
