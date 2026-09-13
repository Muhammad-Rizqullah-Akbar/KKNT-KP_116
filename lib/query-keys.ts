/**
 * Query Key Factory — single source of truth untuk semua query key TanStack Query.
 * Alasan: konsistensi + hierarchical invalidation (invalidateQueries prefix).
 * Jangan hardcode queryKey string literal di komponen — impor dari sini.
 */

export const queryKeys = {
  dashboard: {
    all: ['dashboard'] as const,
    articles: (uid?: string, role?: string | null) => ['dashboard', 'articles', uid, role] as const,
    responses: ['dashboard', 'responses'] as const,
    respondents: ['dashboard', 'respondents'] as const,
    monitoring: ['dashboard', 'monitoring'] as const,
    overview: {
      cadre: (uid?: string, displayName?: string) => ['dashboard', 'overview', 'cadre', uid, displayName] as const,
      admin: ['dashboard', 'overview', 'admin'] as const,
    },
  },
  forms: {
    list: ['forms', 'list'] as const,
    legacy: ['forms', 'legacy'] as const,
    detail: (formId?: string) => ['form', formId] as const,
  },
  distributions: {
    list: (userRole?: string | null) => ['distributions', 'list', userRole] as const,
    detail: (distributionId: string) => ['distribution', distributionId] as const,
  },
  responses: {
    detail: (responseId: string) => ['response', responseId] as const,
  },
  users: {
    list: ['users'] as const,
  },
  partnership: {
    data: ['partnership-data'] as const,
  },
  profile: {
    progress: (uid?: string, userData?: unknown) => ['user-progress', uid, userData] as const,
  },
  settings: {
    landing: ['landing-page-settings'] as const,
  },
  widgets: {
    cmsData: ['widget-cms-data'] as const,
  },
} as const
