import axios from 'axios'
import { SalesforceAuthResponse } from '@/types/salesforce'

export interface SalesforceCredentials {
  instanceUrl: string
  clientId: string
  clientSecret: string
  username?: string
  password?: string
}

/**
 * Authenticate with Salesforce using OAuth 2.0
 * This uses the client credentials flow for server-to-server authentication
 */
export async function authenticateSalesforce(
  credentials: SalesforceCredentials
): Promise<SalesforceAuthResponse> {
  try {
    const response = await axios.post(
      `${credentials.instanceUrl}/services/oauth2/token`,
      new URLSearchParams({
        grant_type: 'client_credentials',
        client_id: credentials.clientId,
        client_secret: credentials.clientSecret,
      }),
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      }
    )

    return response.data
  } catch (error: any) {
    console.error('Salesforce authentication failed:', error.response?.data || error.message)
    throw new Error(
      `Authentication failed: ${error.response?.data?.error_description || error.message}`
    )
  }
}

/**
 * Authenticate with Salesforce using username-password flow (for testing)
 */
export async function authenticateWithPassword(
  credentials: SalesforceCredentials & { password: string }
): Promise<SalesforceAuthResponse> {
  try {
    const response = await axios.post(
      `${credentials.instanceUrl}/services/oauth2/token`,
      new URLSearchParams({
        grant_type: 'password',
        client_id: credentials.clientId,
        client_secret: credentials.clientSecret,
        username: credentials.username!,
        password: credentials.password,
      }),
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      }
    )

    return response.data
  } catch (error: any) {
    console.error('Salesforce authentication failed:', error.response?.data || error.message)
    throw new Error(
      `Authentication failed: ${error.response?.data?.error_description || error.message}`
    )
  }
}
