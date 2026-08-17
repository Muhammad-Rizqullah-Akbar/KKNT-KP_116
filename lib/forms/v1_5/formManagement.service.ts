import 'server-only'

import {
  getFormAggregateFromDb,
  saveFormAggregateToDb,
  publishFormVersionInDb,
  createNewVersionInDb,
  archiveFormInDb,
  getFormVersionSnapshotsFromDb,
  type FormAggregateDoc,
  type FormVersionSnapshotDoc,
} from '@/lib/firebase/repositories/v1_5/v1_5Forms.repo'
import { validateCanonicalForm } from '@/lib/forms/v1_5/validation'
import type { FormMetadata } from '@/lib/forms/v1_5/types'
import type { BuilderState } from '@/lib/forms/v1_5/builderState'
import {
  builderStateToFormAggregate,
  formAggregateToCanonicalForm,
} from '@/lib/forms/v1_5/formConverters'

export {
  builderStateToFormAggregate,
  formAggregateToBuilderState,
  formAggregateToCanonicalForm,
} from '@/lib/forms/v1_5/formConverters'

import { registerNewMetadataEntry } from '@/lib/firebase/repositories/v1_5/v1_5Registry.repo'

export async function createFormWorkflow(
  metadata: FormMetadata,
  sessionUid: string
): Promise<FormAggregateDoc> {
  const cleanTitle = metadata.title.trim()
  if (!cleanTitle) {
    throw new Error('Judul formulir wajib diisi.')
  }

  const slug = cleanTitle.toLowerCase().replace(/[^a-z0-9]/g, '_') || 'form'
  const formId = `form_${slug}_${crypto.randomUUID().substring(0, 6)}`

  const initialAspectId = `aspect_${crypto.randomUUID()}`
  const initialPayload: Partial<FormAggregateDoc> = {
    formId,
    metadata: {
      ...metadata,
      title: cleanTitle,
      status: 'draft',
    },
    activeVersionId: `${formId}_v1`,
    activeVersionNumber: 1,
    status: 'draft',
    aspects: [
      {
        aspectId: initialAspectId,
        title: 'Aspek 1 — Evaluasi Pangan Sehat',
        description: 'Penilaian dimensi standar sarana dan hygiene...',
      },
    ],
    questions: [],
    scoring: { totalPoints: 100, mode: 'auto', outputMode: 'both', stagePointDistribution: { [initialAspectId]: 100 }, allowOverride: true, autoBalance: true },
    validation: { mode: 'all_required', exceptionQuestionIds: [], allowOverride: true },
    thresholds: [
      { id: 't_a', min: 90, max: 100, grade: 'A', title: 'Sangat Baik', description: 'Memenuhi seluruh standar hygiene dan sanitasi.' },
      { id: 't_b', min: 80, max: 89, grade: 'B', title: 'Baik', description: 'Memenuhi standar dasar dengan sedikit catatan.' },
      { id: 't_c', min: 70, max: 79, grade: 'C', title: 'Cukup', description: 'Memerlukan pembinaan rutin.' },
      { id: 't_d', min: 60, max: 69, grade: 'D', title: 'Kurang', description: 'Memerlukan perbaikan mendesak.' },
      { id: 't_e', min: 0, max: 59, grade: 'E', title: 'Sangat Kurang', description: 'Belum memenuhi standar minimum.' },
    ],
    recommendations: { mode: 'manual' },
    distribution: { allowCadreDistribution: true, distributionCodePrefix: 'KDR-BPOM' },
  }

  await registerNewMetadataEntry(metadata.category, metadata.target)
  return await saveFormAggregateToDb(formId, initialPayload, sessionUid)
}

export async function saveDraftWorkflow(
  formId: string,
  state: BuilderState,
  sessionUid: string
): Promise<FormAggregateDoc> {
  const existing = await getFormAggregateFromDb(formId)
  if (!existing) {
    throw new Error(`Formulir dengan ID "${formId}" tidak ditemukan.`)
  }

  if (existing.status === 'published') {
    throw new Error('Formulir terpublikasi tidak dapat diubah secara langsung. Buat versi baru terlebih dahulu.')
  }

  await registerNewMetadataEntry(state.metadata.category, state.metadata.target)
  const payload = builderStateToFormAggregate(formId, state)
  return await saveFormAggregateToDb(formId, payload, sessionUid)
}

export async function publishFormWorkflow(
  formId: string,
  sessionUid: string
): Promise<{ aggregate: FormAggregateDoc; snapshot: FormVersionSnapshotDoc }> {
  const existing = await getFormAggregateFromDb(formId)
  if (!existing) {
    throw new Error(`Formulir dengan ID "${formId}" tidak ditemukan.`)
  }

  const canonical = formAggregateToCanonicalForm(existing)
  const validationIssues = validateCanonicalForm(canonical)

  if (validationIssues.length > 0) {
    const errorList = validationIssues.map((i) => `[${i.path}] ${i.message}`).join(', ')
    throw new Error(`Validasi gagal sebelum publikasi: ${errorList}`)
  }

  return await publishFormVersionInDb(formId, sessionUid)
}

export async function createNewVersionWorkflow(
  formId: string,
  sessionUid: string
): Promise<FormAggregateDoc> {
  return await createNewVersionInDb(formId, sessionUid)
}

export async function archiveFormWorkflow(
  formId: string,
  sessionUid: string
): Promise<FormAggregateDoc> {
  return await archiveFormInDb(formId, sessionUid)
}

export async function restoreFormWorkflow(
  formId: string,
  sessionUid: string
): Promise<FormAggregateDoc> {
  const { restoreFormInDb } = await import('@/lib/firebase/repositories/v1_5/v1_5Forms.repo')
  return await restoreFormInDb(formId, sessionUid)
}

export async function getFormVersionsWorkflow(
  formId: string
): Promise<FormVersionSnapshotDoc[]> {
  return await getFormVersionSnapshotsFromDb(formId)
}

export async function duplicateFormWorkflow(
  sourceFormId: string,
  sessionUid: string
): Promise<FormAggregateDoc> {
  const existing = await getFormAggregateFromDb(sourceFormId)
  if (!existing) {
    throw new Error(`Formulir asal dengan ID "${sourceFormId}" tidak ditemukan.`)
  }

  const cleanTitle = `[Salinan V1.5] ${existing.metadata.title}`
  const slug = cleanTitle.toLowerCase().replace(/[^a-z0-9]/g, '_') || 'form'
  const newFormId = `form_${slug}_${crypto.randomUUID().substring(0, 6)}`

  const duplicatePayload: Partial<FormAggregateDoc> = {
    formId: newFormId,
    metadata: {
      ...existing.metadata,
      title: cleanTitle,
      status: 'draft',
    },
    activeVersionId: `${newFormId}_v1`,
    activeVersionNumber: 1,
    status: 'draft',
    aspects: existing.aspects || [],
    questions: existing.questions || [],
    scoring: existing.scoring,
    validation: existing.validation,
    thresholds: existing.thresholds,
    recommendations: existing.recommendations,
    distribution: existing.distribution,
  }

  return await saveFormAggregateToDb(newFormId, duplicatePayload, sessionUid)
}
