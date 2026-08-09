'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { FormBuilderV2 } from '@/components/forms/v1_5/FormBuilderV2'
import type { BuilderState } from '@/lib/forms/v1_5/builderState'

export default function FormBuilderV15TestPage() {
  const router = useRouter()
  const [createdFormId, setCreatedFormId] = useState<string | null>(null)

  const handleSaveInitialDraft = async (state: BuilderState) => {
    // If not yet created in Firestore, call POST /api/v1_5/forms
    const res = await fetch('/api/v1_5/forms', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ metadata: state.metadata }),
    })
    const data = await res.json()
    if (!res.ok || !data.success) {
      throw new Error(data.message || 'Gagal membuat formulir baru di server.')
    }

    const newFormId = data.form.formId

    // Then save full initial state via PUT /api/v1_5/forms/[newFormId]
    const updateRes = await fetch(`/api/v1_5/forms/${newFormId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ state }),
    })
    const updateData = await updateRes.json()
    if (!updateRes.ok || !updateData.success) {
      throw new Error(updateData.message || 'Gagal menyimpan rincian formulir.')
    }

    setCreatedFormId(newFormId)
    // Redirect to persistent builder route
    router.push(`/dashboard/forms/${newFormId}/builder`)
  }

  return (
    <FormBuilderV2
      formId={createdFormId || undefined}
      onSaveDraftToServer={handleSaveInitialDraft}
    />
  )
}
