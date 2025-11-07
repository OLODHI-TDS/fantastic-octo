/**
 * Test scenarios for Branches List endpoint
 * GET /services/apexrest/branches/
 * Returns all branches associated with a member
 */

export interface TestScenario {
  id: string
  name: string
  description: string
  type: 'positive' | 'negative'
  expectedStatus: number
  requiresDifferentCredential?: boolean
}

export const branchesListScenarios: TestScenario[] = [
  // POSITIVE TESTS
  {
    id: 'positive-get-all-branches',
    name: 'Positive: Get All Branches',
    description: 'Retrieve all branches for the authenticated member',
    type: 'positive',
    expectedStatus: 200,
    // Note: Should return array of branches with branch details
    // Response includes: branch_name, branch_status, branch_contact_name, emails, phone, address, etc.
  },

  {
    id: 'positive-empty-result',
    name: 'Positive: Empty Result Set',
    description: 'Valid request that returns no branches (member has none)',
    type: 'positive',
    expectedStatus: 200,
    // Note: Should return empty array with totalResults: "0", isSuccess: "true"
    // This may not be testable if all test members have branches
  },

  // NEGATIVE TESTS - Authentication
  {
    id: 'negative-invalid-credentials',
    name: 'Negative: Invalid Credentials',
    description: 'Search branches using made-up credentials that do not exist in the system',
    type: 'negative',
    expectedStatus: 403,
    // Note: Create a credential in the system with fake/invalid values:
    // - Fake Member ID (e.g., "INVALID999")
    // - Fake API Key (e.g., "fake-key-12345")
    // - Or invalid OAuth2 client credentials
    // Running the test with this credential should fail authentication
  },
]
