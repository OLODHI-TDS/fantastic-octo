import { z } from 'zod'

export const AuthTypeEnum = z.enum(['apikey', 'oauth2'])
export type AuthType = z.infer<typeof AuthTypeEnum>

// Base schema with common fields
const BaseCredentialSchema = z.object({
  id: z.string().optional(),
  authType: AuthTypeEnum,
  orgName: z.string().min(1, 'Organization name is required'),
  regionScheme: z.string().min(1, 'Region & Scheme is required'),
  memberId: z.string().min(1, 'Member ID is required'),
  branchId: z.string().min(1, 'Branch ID is required'),
  description: z.string().optional(),
  active: z.boolean().default(true),
  environmentId: z.string(),
  createdAt: z.date().optional(),
  updatedAt: z.date().optional(),
})

// API Key credentials
export const ApiKeyCredentialSchema = BaseCredentialSchema.extend({
  authType: z.literal('apikey'),
  apiKey: z.string().min(1, 'API Key is required'),
  clientId: z.string().optional(),
  clientSecret: z.string().optional(),
})

// OAuth2 credentials
export const OAuth2CredentialSchema = BaseCredentialSchema.extend({
  authType: z.literal('oauth2'),
  clientId: z.string().min(1, 'Client ID is required'),
  clientSecret: z.string().min(1, 'Client Secret is required'),
  apiKey: z.string().optional(),
})

// Union of both types
export const CredentialSchema = z.discriminatedUnion('authType', [
  ApiKeyCredentialSchema,
  OAuth2CredentialSchema,
])

export type Credential = z.infer<typeof CredentialSchema>

export const CreateCredentialSchema = z.discriminatedUnion('authType', [
  ApiKeyCredentialSchema.omit({ id: true, createdAt: true, updatedAt: true }),
  OAuth2CredentialSchema.omit({ id: true, createdAt: true, updatedAt: true }),
])

export type CreateCredential = z.infer<typeof CreateCredentialSchema>

// For updates, we make fields optional except id and authType
export const UpdateCredentialSchema = BaseCredentialSchema.omit({
  createdAt: true,
  updatedAt: true,
}).partial().required({ id: true, authType: true }).and(
  z.discriminatedUnion('authType', [
    z.object({
      authType: z.literal('apikey'),
      apiKey: z.string().optional(),
    }),
    z.object({
      authType: z.literal('oauth2'),
      clientId: z.string().optional(),
      clientSecret: z.string().optional(),
    }),
  ])
)

export type UpdateCredential = z.infer<typeof UpdateCredentialSchema>
