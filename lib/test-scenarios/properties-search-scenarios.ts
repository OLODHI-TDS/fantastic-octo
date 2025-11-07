/**
 * Test scenarios for Properties Search endpoint
 * GET /services/apexrest/property
 * Provides search capabilities for existing properties associated with a member
 */

export interface TestScenario {
  id: string
  name: string
  description: string
  type: 'positive' | 'negative'
  expectedStatus: number
  requiresDifferentCredential?: boolean
}

export const propertiesSearchScenarios: TestScenario[] = [
  // POSITIVE TESTS
  {
    id: 'positive-get-all-properties',
    name: 'Positive: Get All Properties',
    description: 'Retrieve all properties for the authenticated member',
    type: 'positive',
    expectedStatus: 200,
    // Note: Should return array of properties associated with the member
  },

  {
    id: 'positive-empty-result',
    name: 'Positive: Empty Result Set',
    description: 'Valid request that returns no properties (member has none)',
    type: 'positive',
    expectedStatus: 200,
    // Note: Should return empty array with success: true
    // This may not be testable if all test members have properties
  },

  // NEGATIVE TESTS
  {
    id: 'negative-invalid-credentials',
    name: 'Negative: Invalid Credentials',
    description: 'Search properties using made-up credentials that do not exist in the system',
    type: 'negative',
    expectedStatus: 403,
    // Note: Create a credential in the system with fake/invalid values:
    // - Fake Member ID (e.g., "INVALID999")
    // - Fake API Key (e.g., "fake-key-12345")
    // - Or invalid OAuth2 client credentials
    // Running the test with this credential should fail authentication
  },
]
