import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios'
import { SalesforceApiResponse } from '@/types/salesforce'
import { buildApiKeyToken, buildOAuth2AuthCode } from './region-scheme'

export interface EWCCredentials {
  instanceUrl: string
  orgName: string
  regionScheme: string
  memberId: string
  branchId: string
  authType: 'apikey' | 'oauth2'
  // API Key auth
  apiKey?: string
  // OAuth2 auth
  clientId?: string
  clientSecret?: string
}

// OAuth2 token cache entry (CURRENTLY DISABLED - tokens are generated fresh for every request)
interface OAuth2TokenCache {
  accessToken: string
  expiresAt: number // timestamp
}

// Global cache for OAuth2 tokens - CACHING DISABLED (kept for potential future use)
const oauth2TokenCache = new Map<string, OAuth2TokenCache>()

/**
 * EWC-specific REST client that uses AccessToken header format
 * API Key Format: "England & Wales Custodial-Custodial-{MemberID}-{BranchID}-{ApiKey}"
 * OAuth2 Flow: Fresh token generated for EVERY request (caching disabled)
 *              - Authorizes to get token, then uses token with /auth/ prefixed endpoints
 *              - Token is logged in clear text to console for debugging
 */
export class EWCRestClient {
  private axiosInstance: AxiosInstance
  private instanceUrl: string
  private credentials: EWCCredentials
  private cacheKey: string

  constructor(credentials: EWCCredentials) {
    this.credentials = credentials
    this.instanceUrl = credentials.instanceUrl

    // Create cache key for OAuth2 token storage
    this.cacheKey = `${credentials.memberId}-${credentials.branchId}-${credentials.clientId || credentials.apiKey}`

    this.axiosInstance = axios.create({
      baseURL: this.instanceUrl,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    })

    // Add request interceptor to inject AccessToken header
    this.axiosInstance.interceptors.request.use(
      async (config) => {
        // For OAuth2, ensure we have a valid token before each request
        if (this.credentials.authType === 'oauth2') {
          const token = await this.getOAuth2Token()
          config.headers.AccessToken = token
          console.log('🔧 Interceptor: Setting AccessToken header', {
            tokenLength: token.length,
            headerKeys: Object.keys(config.headers)
          })
        } else {
          config.headers.AccessToken = this.buildApiKeyToken()
        }
        return config
      },
      (error) => Promise.reject(error)
    )
  }

  /**
   * Build the AccessToken header for API Key authentication
   * Format: "{RegionSchemePrefix}-{MemberID}-{BranchID}-{ApiKey}"
   */
  private buildApiKeyToken(): string {
    const { regionScheme, memberId, branchId, apiKey } = this.credentials

    if (!apiKey) {
      throw new Error('API Key is required for apikey authentication')
    }

    const token = buildApiKeyToken(regionScheme, memberId, branchId, apiKey)
    console.log('🔐 API Key AccessToken being sent')
    return token
  }

  /**
   * Get OAuth2 access token (always generates fresh token - caching disabled)
   */
  private async getOAuth2Token(): Promise<string> {
    // CACHING DISABLED - Always generate fresh token for every request
    console.log('🔐 Generating fresh OAuth2 token (caching disabled)...')
    return await this.authorizeOAuth2()
  }

  /**
   * Authorize with OAuth2 and get access token
   * Endpoint: /services/apexrest/authorise
   * Header: auth_code with value "{RegionSchemePrefix}-{ClientID}-{ClientSecret}-{MemberID}"
   */
  private async authorizeOAuth2(): Promise<string> {
    const { regionScheme, clientId, clientSecret, memberId } = this.credentials

    if (!clientId || !clientSecret) {
      throw new Error('Client ID and Client Secret are required for OAuth2 authentication')
    }

    // Build auth_code header value
    const authCode = buildOAuth2AuthCode(regionScheme, clientId, clientSecret, memberId)

    console.log('🔑 Authorizing OAuth2...')
    console.log('📍 Authorization endpoint: /services/apexrest/authorise')

    try {
      // Make authorization request (without interceptor, manually set header)
      const response = await axios.get(`${this.instanceUrl}/services/apexrest/authorise`, {
        headers: {
          'Content-Type': 'application/json',
          'auth_code': authCode,
        },
        timeout: 30000,
      })

      const data = response.data

      if (data.success === 'true' && data.AccessToken) {
        let accessToken = data.AccessToken

        // Replace the '0' placeholder in the token with the actual Branch ID
        // Token format: "England & Wales Insured-Insured-0-1761208144244-..."
        // The '0' needs to be replaced with the actual branchId
        const tokenParts = accessToken.split('-')
        if (tokenParts.length >= 3 && tokenParts[2].trim() === '0') {
          // Trim the branch ID to remove any leading/trailing spaces
          tokenParts[2] = this.credentials.branchId.trim()
          accessToken = tokenParts.join('-')
          console.log('🔄 Replaced placeholder 0 with Branch ID in OAuth2 token')
        }

        // CACHING DISABLED - Log token in clear text
        console.log('✅ OAuth2 authorization successful')
        console.log('🔑 FRESH OAuth2 AccessToken (CLEAR TEXT):', accessToken)

        return accessToken
      } else {
        throw new Error('OAuth2 authorization failed: Invalid response format')
      }
    } catch (error: any) {
      console.error('❌ OAuth2 authorization failed:', error.message)
      if (error.response) {
        console.error('📋 Response data:', error.response.data)
        console.error('📋 Status:', error.response.status)
      }
      throw new Error(`OAuth2 authorization failed: ${error.message}`)
    }
  }

  /**
   * Transform endpoint path for OAuth2 (add /auth/ prefix)
   * Example: /services/apexrest/depositcreation -> /services/apexrest/auth/depositcreation
   */
  private transformEndpointForOAuth2(endpoint: string): string {
    if (this.credentials.authType === 'oauth2') {
      // Check if endpoint starts with /services/apexrest/
      if (endpoint.startsWith('/services/apexrest/')) {
        // Don't add /auth/ if it's the authorize endpoint
        if (endpoint === '/services/apexrest/authorise') {
          return endpoint
        }
        // Insert 'auth/' after '/services/apexrest/'
        return endpoint.replace('/services/apexrest/', '/services/apexrest/auth/')
      }
    }
    return endpoint
  }

  /**
   * Make a GET request
   */
  async get<T = any>(
    endpoint: string,
    config?: AxiosRequestConfig
  ): Promise<SalesforceApiResponse<T>> {
    try {
      const transformedEndpoint = this.transformEndpointForOAuth2(endpoint)
      console.log(`🌐 GET ${transformedEndpoint}`)

      const response: AxiosResponse<T> = await this.axiosInstance.get(transformedEndpoint, config)

      return {
        success: true,
        data: response.data,
        statusCode: response.status,
        headers: this.extractHeaders(response.headers),
      }
    } catch (error: any) {
      return this.handleError(error)
    }
  }

  /**
   * Make a POST request
   */
  async post<T = any>(
    endpoint: string,
    data?: any,
    config?: AxiosRequestConfig
  ): Promise<SalesforceApiResponse<T>> {
    try {
      const transformedEndpoint = this.transformEndpointForOAuth2(endpoint)

      // Get the token that will be used
      let tokenToUse = ''
      if (this.credentials.authType === 'oauth2') {
        tokenToUse = await this.getOAuth2Token()
      } else {
        tokenToUse = this.buildApiKeyToken()
      }

      console.log('🚀 POST Request:', {
        originalEndpoint: endpoint,
        transformedEndpoint,
        authType: this.credentials.authType,
        hasBody: !!data,
        bodySize: data ? JSON.stringify(data).length : 0
      })

      console.log('🔑 AccessToken being used:', {
        length: tokenToUse.length,
        preview: `${tokenToUse.substring(0, 60)}...${tokenToUse.substring(tokenToUse.length - 20)}`,
        full: tokenToUse
      })

      // For POST requests without body, explicitly set Content-Length: 0
      const requestConfig = { ...config }
      if (!data) {
        requestConfig.headers = {
          ...requestConfig.headers,
          'Content-Length': '0'
        }
      }

      const response: AxiosResponse<T> = await this.axiosInstance.post(transformedEndpoint, data, requestConfig)

      console.log('✅ POST Response:', {
        status: response.status,
        statusText: response.statusText
      })

      return {
        success: true,
        data: response.data,
        statusCode: response.status,
        headers: this.extractHeaders(response.headers),
      }
    } catch (error: any) {
      console.error('❌ POST Request Failed:', {
        endpoint: this.transformEndpointForOAuth2(endpoint),
        status: error.response?.status,
        statusText: error.response?.statusText,
      })

      // Log the complete raw error response
      console.error('📋 Raw error response:', JSON.stringify(error.response?.data, null, 2))

      // Log detailed error information if available
      if (error.response?.data?.errors?.failure) {
        console.error('📋 Detailed validation errors:', JSON.stringify(error.response.data.errors.failure, null, 2))
      }

      return this.handleError(error)
    }
  }

  /**
   * Make a PUT request
   */
  async put<T = any>(
    endpoint: string,
    data?: any,
    config?: AxiosRequestConfig
  ): Promise<SalesforceApiResponse<T>> {
    try {
      const transformedEndpoint = this.transformEndpointForOAuth2(endpoint)
      const response: AxiosResponse<T> = await this.axiosInstance.put(transformedEndpoint, data, config)

      return {
        success: true,
        data: response.data,
        statusCode: response.status,
        headers: this.extractHeaders(response.headers),
      }
    } catch (error: any) {
      return this.handleError(error)
    }
  }

  /**
   * Make a PATCH request
   */
  async patch<T = any>(
    endpoint: string,
    data?: any,
    config?: AxiosRequestConfig
  ): Promise<SalesforceApiResponse<T>> {
    try {
      const transformedEndpoint = this.transformEndpointForOAuth2(endpoint)
      const response: AxiosResponse<T> = await this.axiosInstance.patch(transformedEndpoint, data, config)

      return {
        success: true,
        data: response.data,
        statusCode: response.status,
        headers: this.extractHeaders(response.headers),
      }
    } catch (error: any) {
      return this.handleError(error)
    }
  }

  /**
   * Make a DELETE request
   */
  async delete<T = any>(
    endpoint: string,
    config?: AxiosRequestConfig
  ): Promise<SalesforceApiResponse<T>> {
    try {
      const transformedEndpoint = this.transformEndpointForOAuth2(endpoint)
      const response: AxiosResponse<T> = await this.axiosInstance.delete(transformedEndpoint, config)

      return {
        success: true,
        data: response.data,
        statusCode: response.status,
        headers: this.extractHeaders(response.headers),
      }
    } catch (error: any) {
      return this.handleError(error)
    }
  }

  /**
   * Handle axios errors and return standardized error response
   */
  private handleError(error: any): SalesforceApiResponse {
    if (error.response) {
      // Preserve the full error data structure from Salesforce
      const errorData = error.response.data || {}

      return {
        success: false,
        error: {
          message: errorData.message || errorData.error || error.message || 'Request failed',
          errorCode: errorData.errorCode || 'UNKNOWN_ERROR',
          fields: errorData.fields,
          // Include any additional error details from Salesforce
          ...(errorData.errors && { errors: errorData.errors }),
          ...(errorData.success !== undefined && { success: errorData.success }),
        },
        statusCode: error.response.status,
        headers: this.extractHeaders(error.response.headers),
      }
    } else if (error.request) {
      return {
        success: false,
        error: {
          message: 'No response received from server',
          errorCode: 'NO_RESPONSE',
        },
        statusCode: 0,
        headers: {},
      }
    } else {
      return {
        success: false,
        error: {
          message: error.message,
          errorCode: 'REQUEST_ERROR',
        },
        statusCode: 0,
        headers: {},
      }
    }
  }

  /**
   * Extract headers from axios response
   */
  private extractHeaders(headers: any): Record<string, string> {
    const extracted: Record<string, string> = {}

    for (const [key, value] of Object.entries(headers)) {
      if (typeof value === 'string') {
        extracted[key] = value
      }
    }

    return extracted
  }

  /**
   * Clear OAuth2 token from cache (useful for testing or forced re-auth)
   */
  public clearOAuth2Token(): void {
    oauth2TokenCache.delete(this.cacheKey)
    console.log('🗑️  OAuth2 token cleared from cache')
  }
}
