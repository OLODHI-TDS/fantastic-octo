import { EWCRestClient, EWCCredentials } from '../salesforce/ewc-client'
import { validateResponse, allValidationsPassed, ValidationResult } from './validator'
import { buildApiKeyToken } from '../salesforce/region-scheme'
import { Test } from '@/types/test'
import { TestResult, TestStatus } from '@/types/testResult'
import { API_ENDPOINTS } from '../api-endpoints'

export interface TestExecutionResult {
  testId: string
  environmentId?: string
  credentialId: string
  status: TestStatus
  responseTime: number
  statusCode: number
  request: {
    url: string
    method: string
    headers?: Record<string, string>
    body?: any
  }
  response: {
    status: number
    headers: Record<string, string>
    data: any
  }
  validationResults?: ValidationResult[]
  error?: string
}

export interface TestExecutionContext {
  test: Test
  instanceUrl: string
  credential: EWCCredentials
}

/**
 * Build alias URL if useAliasUrl is enabled
 */
function buildAliasUrl(test: Test, credential: EWCCredentials): string | null {
  if (!test.useAliasUrl || credential.authType !== 'apikey') {
    return null
  }

  // Find the endpoint configuration
  const endpointConfig = API_ENDPOINTS.find(ep => {
    // Match by checking if the test endpoint starts with the configured endpoint path
    // (since test endpoint might have path parameters replaced)
    return test.endpoint.startsWith(ep.endpoint.split('{')[0])
  })

  if (!endpointConfig?.supportsAliasUrl || !endpointConfig.aliasEndpoint) {
    return null
  }

  let aliasUrl = endpointConfig.aliasEndpoint

  // For GET endpoints with auth in URL, replace placeholders
  if (endpointConfig.aliasAuthInUrl) {
    aliasUrl = aliasUrl
      .replace('{member_id}', credential.memberId)
      .replace('{branch_id}', credential.branchId)
      .replace('{api_key}', credential.apiKey!)

    // Replace any remaining path parameters from the original test endpoint
    // Extract parameter values from test.endpoint and apply to alias URL
    if (endpointConfig.requiresPathParam && endpointConfig.pathParamName) {
      const paramPattern = new RegExp(`{${endpointConfig.pathParamName}}`)
      const testEndpointParts = test.endpoint.split('/')
      const configEndpointParts = endpointConfig.endpoint.split('/')

      // Find the parameter value in test.endpoint
      for (let i = 0; i < configEndpointParts.length; i++) {
        if (configEndpointParts[i] === `{${endpointConfig.pathParamName}}` && testEndpointParts[i]) {
          // Replace in alias URL
          aliasUrl = aliasUrl.replace(paramPattern, testEndpointParts[i])
          break
        }
      }
    }
  }

  return aliasUrl
}

/**
 * Execute a single test against the EWC API
 */
export async function executeTest(
  context: TestExecutionContext
): Promise<TestExecutionResult> {
  const { test, instanceUrl, credential } = context
  const startTime = Date.now()

  try {
    // Create EWC client with credentials
    const client = new EWCRestClient({
      ...credential,
      instanceUrl,
    })

    // Build the AccessToken for logging purposes
    const accessToken = credential.authType === 'apikey'
      ? buildApiKeyToken(credential.regionScheme, credential.memberId, credential.branchId, credential.apiKey!)
      : '<OAuth2 Token - Dynamically Fetched>'

    // Determine the actual endpoint to use
    let actualEndpoint = test.endpoint

    // Check if we should use alias URL
    const aliasUrl = buildAliasUrl(test, credential)
    if (aliasUrl) {
      actualEndpoint = aliasUrl
    }
    // Note: OAuth2 /auth/ transformation is handled in EWCRestClient.transformEndpointForOAuth2()

    // Prepare request config with headers
    // Note: Skip AccessToken header if using alias URL with auth in URL
    const endpointConfig = API_ENDPOINTS.find(ep => test.endpoint.startsWith(ep.endpoint.split('{')[0]))
    const skipAccessTokenHeader = aliasUrl && endpointConfig?.aliasAuthInUrl

    const requestHeaders: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(test.headers || {}),
    }

    if (!skipAccessTokenHeader) {
      requestHeaders.AccessToken = accessToken
    }

    const requestConfig = {
      url: actualEndpoint,
      method: test.method,
      headers: requestHeaders,
      data: test.body,
    }

    // Execute the request based on method (use actualEndpoint which may be alias URL)
    let response
    switch (test.method.toUpperCase()) {
      case 'GET':
        response = await client.get(actualEndpoint, { headers: test.headers })
        break
      case 'POST':
        response = await client.post(actualEndpoint, test.body, { headers: test.headers })
        break
      case 'PUT':
        response = await client.put(actualEndpoint, test.body, { headers: test.headers })
        break
      case 'PATCH':
        response = await client.patch(actualEndpoint, test.body, { headers: test.headers })
        break
      case 'DELETE':
        response = await client.delete(actualEndpoint, { headers: test.headers })
        break
      default:
        throw new Error(`Unsupported HTTP method: ${test.method}`)
    }

    const responseTime = Date.now() - startTime

    // Check if request was successful
    if (!response.success) {
      return {
        testId: test.id!,
        credentialId: test.credentialId,
        environmentId: test.environmentId,
        status: 'error',
        responseTime,
        statusCode: response.statusCode,
        request: {
          url: `${instanceUrl}${actualEndpoint}`,
          method: test.method,
          headers: requestHeaders,
          body: test.body,
        },
        response: {
          status: response.statusCode,
          headers: response.headers,
          data: response.error,
        },
        error: response.error?.message || 'Request failed',
      }
    }

    // Validate status code
    const statusCodeMatches = response.statusCode === test.expectedStatus

    // Validate response data
    const validationResults = test.validations
      ? validateResponse(response.data, test.validations)
      : []

    const allValidationsPass = validationResults.length === 0 || allValidationsPassed(validationResults)

    // Determine overall test status
    const testStatus: TestStatus =
      statusCodeMatches && allValidationsPass ? 'passed' : 'failed'

    return {
      testId: test.id!,
      credentialId: test.credentialId,
      environmentId: test.environmentId,
      status: testStatus,
      responseTime,
      statusCode: response.statusCode,
      request: {
        url: `${instanceUrl}${actualEndpoint}`,
        method: test.method,
        headers: requestHeaders,
        body: test.body,
      },
      response: {
        status: response.statusCode,
        headers: response.headers,
        data: response.data,
      },
      validationResults: validationResults.length > 0 ? validationResults : undefined,
      error: !statusCodeMatches
        ? `Expected status code ${test.expectedStatus} but got ${response.statusCode}`
        : undefined,
    }
  } catch (error: any) {
    const responseTime = Date.now() - startTime

    // Build headers for error case (may not have been built if error occurred early)
    const accessToken = credential.authType === 'apikey'
      ? buildApiKeyToken(credential.regionScheme, credential.memberId, credential.branchId, credential.apiKey!)
      : '<OAuth2 Token - Dynamically Fetched>'

    // Determine the actual endpoint to use (error case)
    let actualEndpoint = test.endpoint

    // Check if we should use alias URL
    const aliasUrl = buildAliasUrl(test, credential)
    if (aliasUrl) {
      actualEndpoint = aliasUrl
    }
    // Note: OAuth2 /auth/ transformation is handled in EWCRestClient.transformEndpointForOAuth2()

    // Build error headers (skip AccessToken if using alias URL with auth in URL)
    const endpointConfigForError = API_ENDPOINTS.find(ep => test.endpoint.startsWith(ep.endpoint.split('{')[0]))
    const skipAccessTokenHeaderForError = aliasUrl && endpointConfigForError?.aliasAuthInUrl

    const errorHeaders: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(test.headers || {}),
    }

    if (!skipAccessTokenHeaderForError) {
      errorHeaders.AccessToken = accessToken
    }

    return {
      testId: test.id!,
      credentialId: test.credentialId,
      environmentId: test.environmentId,
      status: 'error',
      responseTime,
      statusCode: 0,
      request: {
        url: `${instanceUrl}${actualEndpoint}`,
        method: test.method,
        headers: errorHeaders,
        body: test.body,
      },
      response: {
        status: 0,
        headers: {},
        data: null,
      },
      error: error.message || 'Test execution failed',
    }
  }
}

/**
 * Execute multiple tests in sequence
 */
export async function executeTests(
  contexts: TestExecutionContext[]
): Promise<TestExecutionResult[]> {
  const results: TestExecutionResult[] = []

  for (const context of contexts) {
    const result = await executeTest(context)
    results.push(result)
  }

  return results
}
