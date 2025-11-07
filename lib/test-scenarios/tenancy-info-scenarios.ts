/**
 * Test scenarios for Tenancy Information endpoint
 * GET /services/apexrest/tenancyinformation/{DAN}
 * Returns summary information about a deposit throughout its lifecycle
 */

export interface TestScenario {
  id: string
  name: string
  description: string
  type: 'positive' | 'negative'
  expectedStatus: number
  pathParam?: string
  generatePathParam?: () => string
  requiresDifferentCredential?: boolean
}

export const tenancyInfoScenarios: TestScenario[] = [
  // POSITIVE TEST
  {
    id: 'positive-valid-dan',
    name: 'Positive: Valid DAN',
    description: 'Get tenancy information with a valid DAN number',
    type: 'positive',
    expectedStatus: 200,
    // Note: User must provide a valid DAN in the path param field
  },

  // NEGATIVE TESTS
  {
    id: 'negative-invalid-credentials',
    name: 'Negative: Invalid Credentials',
    description: 'Try to access a DAN using credentials from a different organization',
    type: 'negative',
    expectedStatus: 403,
    requiresDifferentCredential: true,
    // Note: User must provide a DAN from Org A, then test with Org B credentials
  },

  {
    id: 'negative-non-existent-dan',
    name: 'Negative: Non-existent DAN',
    description: 'Try to get information for a DAN that does not exist',
    type: 'negative',
    expectedStatus: 404,
    pathParam: 'EWC99999999',
    // Note: Using a DAN unlikely to exist
  },

  {
    id: 'negative-invalid-dan-format',
    name: 'Negative: Invalid DAN Format',
    description: 'Use an incorrectly formatted DAN (without EWC prefix)',
    type: 'negative',
    expectedStatus: 400,
    pathParam: '12345678',
    // Note: Missing EWC prefix
  },

  {
    id: 'negative-empty-dan',
    name: 'Negative: Empty DAN',
    description: 'Try to get information with empty DAN parameter',
    type: 'negative',
    expectedStatus: 400,
    pathParam: '',
    // Note: Empty DAN should be rejected
  },

  {
    id: 'negative-special-characters-dan',
    name: 'Negative: Special Characters in DAN',
    description: 'Try to use special characters in the DAN parameter',
    type: 'negative',
    expectedStatus: 400,
    pathParam: 'EWC00@#$%',
    // Note: Special characters should be rejected
  },

  {
    id: 'negative-sql-injection-dan',
    name: 'Negative: SQL Injection Attempt',
    description: 'Security test - try SQL injection in DAN parameter',
    type: 'negative',
    expectedStatus: 400,
    pathParam: "EWC' OR '1'='1",
    // Note: Should be properly escaped/rejected
  },

  {
    id: 'negative-too-long-dan',
    name: 'Negative: DAN Too Long',
    description: 'Use a DAN that exceeds the expected length',
    type: 'negative',
    expectedStatus: 400,
    pathParam: 'EWC00000000000000000000000',
    // Note: Excessively long DAN
  },

  {
    id: 'negative-wrong-prefix-dan',
    name: 'Negative: Wrong Prefix',
    description: 'Use a DAN with incorrect prefix (NI instead of EWC)',
    type: 'negative',
    expectedStatus: 400,
    pathParam: 'NI00004420',
    // Note: Wrong scheme prefix
  },
]
