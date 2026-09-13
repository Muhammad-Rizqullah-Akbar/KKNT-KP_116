// Barrel module: re-exports the widget utilities split across per-concern
// modules while preserving the original public export API.
export {
  CHART_TYPES,
  COLOR_SCHEMES,
} from './widgets-types'
export type {
  WidgetItem,
  StackedAccountingItem,
  WidgetCmsData,
  MitraBreakdownItem,
  AccountingResult,
  ChartData,
  WidgetEditorConfig,
} from './widgets-types'
export { cleanString, mapAnswersToQuestionIds, findMatchingForm, isBiodataAspect } from './widgets-form-matcher'
export { fetchWidgetData, getWidgetChartData } from './widgets-fetch'
export { getRespondentAspects } from './widgets-aspects'
export { computeAccountingForStack } from './widgets-accounting'
