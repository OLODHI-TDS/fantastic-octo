import { z } from 'zod'

export const EnvironmentTypeEnum = z.enum(['production', 'sandbox', 'scratch'])
export type EnvironmentType = z.infer<typeof EnvironmentTypeEnum>

export const EnvironmentSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, 'Name is required'),
  type: EnvironmentTypeEnum,
  instanceUrl: z.string().url('Must be a valid URL'),
  description: z.string().optional(),
  active: z.boolean().default(true),
  verificationEnabled: z.boolean().default(false),
  verificationBearerToken: z.string().optional(),
  // Salesforce Connected App credentials for OAuth-based token retrieval
  sfConnectedAppClientId: z.string().optional(),
  sfConnectedAppClientSecret: z.string().optional(),
  sfRefreshToken: z.string().optional(),
  sfTokenExpiresAt: z.union([z.string(), z.date(), z.null()]).optional(),
  createdAt: z.union([z.string(), z.date()]).optional(),
  updatedAt: z.union([z.string(), z.date()]).optional(),
})

export type Environment = z.infer<typeof EnvironmentSchema>

export const CreateEnvironmentSchema = EnvironmentSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
})

export type CreateEnvironment = z.infer<typeof CreateEnvironmentSchema>

export const UpdateEnvironmentSchema = EnvironmentSchema.omit({
  createdAt: true,
  updatedAt: true,
}).partial().required({ id: true })

export type UpdateEnvironment = z.infer<typeof UpdateEnvironmentSchema>
