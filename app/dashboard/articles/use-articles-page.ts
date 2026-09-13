'use client'

import { useArticlesData } from './use-articles-data'
import { useArticlesActions } from './use-articles-actions'
import { useArticlesEditor } from './use-articles-editor'

// Komposisi controller halaman artikel: data/state + actions + editor.
export function useArticlesPage() {
  const data = useArticlesData()
  const actions = useArticlesActions(data)
  const editor = useArticlesEditor(data)

  return {
    ...data,
    ...actions,
    ...editor,
  }
}

export type ArticlesPageController = ReturnType<typeof useArticlesPage>
