import type { FormData as LegacyFormData } from '@/lib/repositories/forms.repo'

export type LegacyStatusFilter = 'all' | 'published' | 'draft'
export type LegacyViewMode = 'grid' | 'table'

export function filterForms(
  forms: LegacyFormData[],
  searchTerm: string,
  statusFilter: LegacyStatusFilter,
  selectedGroupId: string
): LegacyFormData[] {
  return forms.filter((form) => {
    const term = searchTerm.toLowerCase()
    const matchesSearch =
      (form.title || '').toLowerCase().includes(term) ||
      (form.code || '').toLowerCase().includes(term) ||
      (form.category || '').toLowerCase().includes(term) ||
      (form.target || '').toLowerCase().includes(term)

    const matchesStatus = statusFilter === 'all' || form.status === statusFilter
    const matchesGroup = selectedGroupId === 'all' || form.groupId === selectedGroupId

    return matchesSearch && matchesStatus && matchesGroup
  })
}

// Build the duplicated (post-test) title from a source form title.
export function buildDuplicateTitle(rawTitle: string): string {
  const baseTitle = rawTitle.replace(/^\[Salinan[^\]]*\]\s*/i, '').replace(/^Salinan\s*[-–:]\s*/i, '').trim()
  if (/pre[-_\s]*test/i.test(baseTitle)) {
    return baseTitle.replace(/pre[-_\s]*test/gi, 'Post-Test')
  }
  if (!/post[-_\s]*test/i.test(baseTitle)) {
    return `${baseTitle} (Post-Test)`
  }
  return baseTitle
}

export function buildDuplicateCode(code: string): string {
  return `${code || 'FORM'}_COPY_${Math.random().toString(36).substring(2, 6).toUpperCase()}`
}
