/**
 * Test scenarios for Delete Deposit endpoint
 * Based on API documentation analysis
 */

export interface TestScenario {
  id: string
  name: string
  description: string
  type: 'positive' | 'negative'
  expectedStatus: number
  requiresDifferentCredential?: boolean
  pathParam?: string
  generatePathParam?: () => string
}

export const deleteDepositScenarios: TestScenario[] = [
  // POSITIVE TEST
  {
    id: 'positive-valid-dan',
    name: 'Positive: Valid DAN',
    description: 'Delete deposit with a valid DAN from an existing deposit',
    type: 'positive',
    expectedStatus: 200,
    // Note: This test requires a valid DAN from an existing deposit
    // The DAN should be entered manually or retrieved from a recent deposit creation
  },

  // NEGATIVE TESTS
  {
    id: 'negative-invalid-credentials',
    name: 'Negative: Invalid Credentials',
    description: 'Attempt to delete a deposit using wrong credentials from another organization',
    type: 'negative',
    expectedStatus: 403,
    requiresDifferentCredential: true,
    // Note: This test requires:
    // 1. A valid DAN from Credential A (entered manually)
    // 2. Running the test with Credential B (different org)
    // Expected: 403 Forbidden - "Failed authentication" or access denied
  },

  {
    id: 'negative-non-existent-dan',
    name: 'Negative: Non-existent DAN',
    description: 'Attempt to delete a deposit with a DAN that does not exist',
    type: 'negative',
    expectedStatus: 404,
    pathParam: 'EWC99999999',
    // Note: Using a DAN that is unlikely to exist
    // Expected: 404 Not Found or error response indicating DAN not found
  },

  {
    id: 'negative-invalid-dan-format',
    name: 'Negative: Invalid DAN Format',
    description: 'Attempt to delete with malformed DAN (special characters)',
    type: 'negative',
    expectedStatus: 400,
    pathParam: 'INVALID@#$%',
    // Note: Using invalid characters in DAN
    // Expected: 400 Bad Request or validation error
  },

  {
    id: 'negative-empty-dan',
    name: 'Negative: Empty DAN',
    description: 'Attempt to delete with empty DAN parameter',
    type: 'negative',
    expectedStatus: 400,
    pathParam: '',
    // Note: Empty DAN should be rejected
    // Expected: 400 Bad Request or 404 Not Found
  },

  {
    id: 'negative-wrong-region-prefix',
    name: 'Negative: Wrong Region Prefix DAN',
    description: 'Attempt to delete a deposit with DAN from different region (e.g., NI DAN with EW credentials)',
    type: 'negative',
    expectedStatus: 403,
    pathParam: 'NI1000000',
    // Note: Using a DAN with region prefix that doesn't match credentials
    // Expected: 403 Forbidden or 404 Not Found
  },

  {
    id: 'negative-sql-injection-dan',
    name: 'Negative: SQL Injection Attempt',
    description: 'Security test - attempt SQL injection in DAN parameter',
    type: 'negative',
    expectedStatus: 400,
    pathParam: "EWC' OR '1'='1",
    // Note: Security test - SQL injection attempt
    // Expected: 400 Bad Request or properly escaped/rejected
  },

  {
    id: 'negative-already-deleted-dan',
    name: 'Negative: Already Deleted DAN',
    description: 'Attempt to delete a deposit that has already been deleted',
    type: 'negative',
    expectedStatus: 404,
    // Note: This test requires:
    // 1. First successful deletion of a deposit (get the DAN)
    // 2. Attempt to delete the same DAN again
    // Expected: 404 Not Found or error indicating deposit already deleted/doesn't exist
  },

  {
    id: 'negative-numeric-only-dan',
    name: 'Negative: Numeric-only DAN',
    description: 'Attempt to delete with DAN missing required prefix',
    type: 'negative',
    expectedStatus: 400,
    pathParam: '12345678',
    // Note: DAN without region prefix (EWC, EWI, NI, etc.)
    // Expected: 400 Bad Request or validation error
  },

  {
    id: 'negative-excessive-length-dan',
    name: 'Negative: Excessively Long DAN',
    description: 'Attempt to delete with DAN exceeding maximum length',
    type: 'negative',
    expectedStatus: 400,
    pathParam: 'EWC' + '9'.repeat(100),
    // Note: DAN with excessive length
    // Expected: 400 Bad Request or validation error
  },
]
