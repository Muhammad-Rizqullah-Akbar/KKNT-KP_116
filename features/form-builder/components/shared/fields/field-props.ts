// shared/fields/field-props.ts
// Shared prop contract for ElementProperties field sub-components.

import type { CanvasElement } from './../ElementTypes'

export interface FieldProps {
  element: CanvasElement
  setElement: (updated: CanvasElement) => void
}
