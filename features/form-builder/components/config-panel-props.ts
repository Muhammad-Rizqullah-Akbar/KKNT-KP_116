// components/form-builder/config-panel-props.ts

import { FlexibleQuestion } from './ElementTypes'

export interface ConfigPanelProps {
  config: any
  element: FlexibleQuestion
  onUpdate: (updated: FlexibleQuestion) => void
}
