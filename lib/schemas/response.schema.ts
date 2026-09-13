import { z } from 'zod'
import { userRoleSchema } from './user.schema'

export const responseStatusSchema = z.enum([
  'in_progress',
  'submitted',
  'abandoned',
  'invalid',
])
export type ResponseStatus = z.infer<typeof responseStatusSchema>

export const respondentSchema = z.object({
  name: z.string(),
  email: z.string().optional(),
  phone: z.string().optional(),
  address: z.string().optional(),
  institution: z.string().optional(),
})
export type Respondent = z.infer<typeof respondentSchema>

export const responseQuestionSchema = z.object({
  questionId: z.string(),
  aspectId: z.string().optional(),
  label: z.string(),
  value: z.any(),
  score: z.number().optional(),
})
export type ResponseQuestion = z.infer<typeof responseQuestionSchema>

export const responseResultSchema = z.object({
  rawScore: z.number(),
  maximumScore: z.number(),
  percentage: z.number(),
  grade: z.string(),
  thresholdTitle: z.string().optional(),
  aspects: z.array(z.any()),
  questions: z.array(z.any()),
  recommendations: z.array(z.any()),
})
export type ResponseResult = z.infer<typeof responseResultSchema>

export const responseSchema = z.object({
  responseId: z.string(),
  distributionId: z.string(),
  distributionCode: z.string(),
  formId: z.string(),
  versionId: z.string(),
  versionNumber: z.number().int(),
  ownerType: userRoleSchema,
  ownerId: z.string(),
  partnershipId: z.string().optional(),
  respondent: respondentSchema,
  questions: z.array(responseQuestionSchema),
  biodata: z.array(z.any()),
  status: responseStatusSchema,
  submissionToken: z.string(),
  result: responseResultSchema.optional(),
  startedAt: z.any(),
  submittedAt: z.any().optional(),
  updatedAt: z.any(),
  updatedBy: z.string(),
})
export type Response = z.infer<typeof responseSchema>
