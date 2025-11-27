import { z } from 'zod'

export const HttpMethodEnum = z.enum(['GET', 'POST', 'PUT', 'PATCH', 'DELETE'])
export type HttpMethod = z.infer<typeof HttpMethodEnum>

export const TestSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
  endpoint: z.string().min(1, 'Endpoint is required'),
  method: HttpMethodEnum,
  headers: z.record(z.string()).optional(),
  body: z.any().optional(),
  expectedStatus: z.number().int().min(100).max(599).default(200),
  validations: z.array(z.object({
    field: z.string(),
    condition: z.enum(['equals', 'contains', 'exists', 'notExists', 'greaterThan', 'lessThan']),
    value: z.any().optional(),
  })).optional(),
  useAliasUrl: z.boolean().optional().default(false),
  environmentId: z.string(),
  credentialId: z.string().optional().nullable(), // Optional - not required for fixed API key endpoints
  createdAt: z.date().optional(),
  updatedAt: z.date().optional(),
})

export type Test = z.infer<typeof TestSchema>

export const CreateTestSchema = TestSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
})

export type CreateTest = z.infer<typeof CreateTestSchema>

export const UpdateTestSchema = TestSchema.partial().required({ id: true })

export type UpdateTest = z.infer<typeof UpdateTestSchema>
