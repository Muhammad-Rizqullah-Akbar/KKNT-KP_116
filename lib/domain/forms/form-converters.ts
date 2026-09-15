import type { FormDocument } from '@/lib/domain/forms/types'
import type { BuilderState } from '@/lib/domain/forms/builder-state'
import type { FormAggregateDoc } from '@/lib/repositories/form-versions.repo'

/**
 * Convert BuilderState to FormAggregateDoc payload.
 */
export function builderStateToFormAggregate(
  formId: string,
  state: BuilderState
): Partial<FormAggregateDoc> {
  return {
    formId,
    metadata: state.metadata,
    aspects: state.aspects,
    questions: state.questions,
    scoring: state.scoring,
    validation: state.validation,
    thresholds: state.thresholds,
    recommendations: state.recommendations,
    distribution: state.distribution,
  }
}

/**
 * Convert FormAggregateDoc to BuilderState.
 */
export function formAggregateToBuilderState(doc: FormAggregateDoc): BuilderState {
  return {
    metadata: doc.metadata || { title: 'Formulir Tanpa Judul', description: '', category: 'Umum', target: 'Umum' },
    aspects: doc.aspects || [],
    questions: doc.questions || [],
    scoring: doc.scoring || { totalPoints: 100, mode: 'auto', stagePointDistribution: {} },
    validation: doc.validation || { mode: 'all_required', allowOverride: true },
    thresholds: doc.thresholds || [],
    recommendations: doc.recommendations || { mode: 'manual' },
    distribution: doc.distribution || { allowCadreDistribution: true },
  }
}

/**
 * Convert FormAggregateDoc to FormDocument for validation.
 */
export function formAggregateToFormDocument(doc: FormAggregateDoc): FormDocument {
  return {
    form: {
      formId: doc.formId || 'form-draft',
      metadata: doc.metadata || { title: 'Formulir Tanpa Judul', description: '', category: 'Umum', target: 'Umum' },
      activeVersionId: doc.activeVersionId || 'v1',
      createdAt: doc.createdAt || new Date().toISOString(),
      updatedAt: doc.updatedAt || new Date().toISOString(),
    },
    version: {
      versionId: doc.activeVersionId || 'v1',
      formId: doc.formId || 'form-draft',
      versionNumber: doc.activeVersionNumber || 1,
      status: doc.status || 'draft',
      aspects: doc.aspects || [],
      questions: doc.questions || [],
      scoring: doc.scoring || { totalPoints: 100, mode: 'auto', stagePointDistribution: {} },
      validation: doc.validation || { mode: 'all_required', allowOverride: true },
      createdAt: doc.createdAt || new Date().toISOString(),
    },
  }
}

/**
 * Convert BuilderState to FormDocument for local validation.
 */
export function builderStateToFormDocument(state: BuilderState): FormDocument {
  return {
    form: {
      formId: 'draft',
      metadata: state.metadata,
    },
    version: {
      versionId: 'draft',
      formId: 'draft',
      versionNumber: 1,
      status: 'draft',
      aspects: state.aspects || [],
      questions: state.questions,
      scoring: state.scoring,
      validation: state.validation,
    },
  }
}
