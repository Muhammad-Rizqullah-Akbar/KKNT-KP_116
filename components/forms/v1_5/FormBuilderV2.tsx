'use client'

import React from 'react'
import type { BuilderState } from '@/lib/forms/v1_5/builderState'
import type { CanonicalForm } from '@/lib/forms/v1_5/types'
import { FormBuilderWorkflow } from './FormBuilderWorkflow'

export interface FormBuilderV2Props {
  formId?: string
  activeVersionId?: string
  activeVersionNumber?: number
  initialState?: BuilderState
  onSaveDraft?: (canonical: CanonicalForm) => void
  onSaveDraftToServer?: (state: BuilderState) => Promise<void>
  onPublishVersion?: () => Promise<void>
  onCreateNewVersion?: () => Promise<void>
  onOpenVersionHistory?: () => void
}

export function FormBuilderV2({
  formId,
  activeVersionId,
  activeVersionNumber = 1,
  initialState,
  onSaveDraftToServer,
  onPublishVersion,
  onOpenVersionHistory,
}: FormBuilderV2Props) {
  return (
    <FormBuilderWorkflow
      formId={formId}
      activeVersionId={activeVersionId}
      activeVersionNumber={activeVersionNumber}
      initialState={initialState}
      onSaveDraftToServer={onSaveDraftToServer}
      onPublishVersion={onPublishVersion}
      onOpenVersionHistory={onOpenVersionHistory}
    />
  )
}
