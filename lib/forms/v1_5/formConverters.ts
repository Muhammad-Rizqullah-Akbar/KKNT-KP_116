import type { CanonicalForm } from '@/lib/forms/v1_5/types'
import type { BuilderState } from '@/lib/forms/v1_5/builderState'
import type { FormAggregateDoc } from '@/lib/firebase/repositories/v1_5/v1_5Forms.repo'

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
    metadata: doc.metadata,
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
 * Convert FormAggregateDoc to CanonicalForm for validation.
 */
export function formAggregateToCanonicalForm(doc: FormAggregateDoc): CanonicalForm {
  return {
    form: {
      formId: doc.formId,
      metadata: doc.metadata,
      activeVersionId: doc.activeVersionId,
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt,
    },
    version: {
      versionId: doc.activeVersionId,
      formId: doc.formId,
      versionNumber: doc.activeVersionNumber,
      status: doc.status,
      questions: doc.questions,
      scoring: doc.scoring,
      validation: doc.validation,
      createdAt: doc.createdAt,
    },
  }
}

/**
 * Convert BuilderState to CanonicalForm for local validation.
 */
export function builderStateToCanonicalForm(state: BuilderState): CanonicalForm {
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
      questions: state.questions,
      scoring: state.scoring,
      validation: state.validation,
    },
  }
}
