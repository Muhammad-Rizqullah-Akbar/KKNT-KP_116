import 'server-only'

import { extractRespondentName, extractRespondentEmail } from '@/lib/domain/responses/respondent-utils'

export { extractRespondentName, extractRespondentEmail }

export { startResponseWorkflow } from './response.start'
export { submitResponseWorkflow, recalculateResponseResultWorkflow } from './response.submit'
export { listResponsesWorkflow, getResponseDetailWorkflow, getPublicResponseResultWorkflow } from './response.list'
