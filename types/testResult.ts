import { z } from 'zod'

export const TestStatusEnum = z.enum(['passed', 'failed', 'error'])
export type TestStatus = z.infer<typeof TestStatusEnum>

export const TestResultSchema = z.object({
  id: z.string().optional(),
  testId: z.string(),
  environmentId: z.string(),
  status: TestStatusEnum,
  responseTime: z.number().int(),
  statusCode: z.number().int(),
  request: z.object({
    url: z.string(),
    method: z.string(),
    headers: z.record(z.string()).optional(),
    body: z.any().optional(),
  }),
  response: z.object({
    status: z.number(),
    headers: z.record(z.string()).optional(),
    data: z.any(),
  }),
  validationResults: z.array(z.object({
    field: z.string(),
    condition: z.string(),
    expected: z.any().optional(),
    actual: z.any(),
    passed: z.boolean(),
  })).optional(),
  error: z.string().optional(),
  executedAt: z.date().optional(),
  pdfPath: z.string().optional(),
})

export type TestResult = z.infer<typeof TestResultSchema>

export const CreateTestResultSchema = TestResultSchema.omit({
  id: true,
  executedAt: true,
  pdfPath: true,
})

export type CreateTestResult = z.infer<typeof CreateTestResultSchema>
