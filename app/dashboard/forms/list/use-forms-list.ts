'use client'

import { useFormsListData } from './use-forms-list-data'
import { useFormsListActions } from './use-forms-list-actions'

// Komposisi controller halaman daftar formulir.
export function useFormsList() {
  const data = useFormsListData()
  const actions = useFormsListActions(data)

  return {
    ...data,
    ...actions,
  }
}

export type FormsListController = ReturnType<typeof useFormsList>
