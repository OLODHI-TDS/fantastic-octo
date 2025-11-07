import { z } from 'zod'

// Salesforce OAuth response
export const SalesforceAuthResponseSchema = z.object({
  access_token: z.string(),
  instance_url: z.string(),
  id: z.string(),
  token_type: z.string(),
  issued_at: z.string(),
  signature: z.string(),
})

export type SalesforceAuthResponse = z.infer<typeof SalesforceAuthResponseSchema>

// Salesforce API error response
export const SalesforceErrorSchema = z.object({
  message: z.string(),
  errorCode: z.string(),
  fields: z.array(z.string()).optional(),
})

export type SalesforceError = z.infer<typeof SalesforceErrorSchema>

// Salesforce REST API response wrapper
export interface SalesforceApiResponse<T = any> {
  success: boolean
  data?: T
  error?: SalesforceError
  statusCode: number
  headers: Record<string, string>
}
