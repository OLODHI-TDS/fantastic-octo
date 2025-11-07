/**
 * Test scenarios for All Registered Tenancies endpoint
 * GET /services/apexrest/alltenanciesregistered
 * Returns a list of all tenancies registered with the authenticated member
 */

export interface TestScenario {
  id: string
  name: string
  description: string
  type: 'positive' | 'negative'
  expectedStatus: number
  requiresDifferentCredential?: boolean
}

export const allTenanciesScenarios: TestScenario[] = [
  // POSITIVE TESTS
  {
    id: 'positive-retrieve-all-tenancies',
    name: 'Positive: Retrieve All Tenancies',
    description: 'Successfully retrieve all registered tenancies for the authenticated member',
    type: 'positive',
    expectedStatus: 200,
    // Note: Should return array of tenancies with deposit details
    // Response includes: success, totalResults, tenancies array
    // Each tenancy contains: dan, deposit_status, user_tenancy_reference, deposit_reference, property details, landlord/tenant details, dates, amounts, etc.
  },

  {
    id: 'positive-empty-list',
    name: 'Positive: Empty Tenancy List',
    description: 'Valid request when member has no registered tenancies (returns empty array)',
    type: 'positive',
    expectedStatus: 200,
    // Note: Should return empty array with totalResults: "0", success: "true"
    // This may not be testable if test member already has tenancies registered
  },

  // NEGATIVE TESTS - Authentication
  {
    id: 'negative-invalid-credentials',
    name: 'Negative: Invalid Credentials',
    description: 'Retrieve tenancies using made-up credentials that do not exist in the system',
    type: 'negative',
    expectedStatus: 403,
    // Note: Create a credential in the system with fake/invalid values:
    // - Fake Member ID (e.g., "INVALID999")
    // - Fake API Key (e.g., "fake-key-12345")
    // - Or invalid OAuth2 client credentials
    // Running the test with this credential should fail authentication
  },

  {
    id: 'negative-cross-organization-access',
    name: 'Negative: Cross-Organization Access',
    description: 'Attempt to access tenancies using credentials from a different organization/member',
    type: 'negative',
    expectedStatus: 403,
    requiresDifferentCredential: true,
    // Note: Test with credentials from Organization B when trying to access Organization A's data
    // Each member should only see their own tenancies
  },
]
