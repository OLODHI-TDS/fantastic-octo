/**
 * Test scenarios for Single Branch endpoint
 * GET /services/apexrest/branches/?name={branch_name}
 * Returns information for a specific branch by name
 */

export interface TestScenario {
  id: string
  name: string
  description: string
  type: 'positive' | 'negative'
  expectedStatus: number
  pathParam?: string
  requiresDifferentCredential?: boolean
}

export const singleBranchScenarios: TestScenario[] = [
  // POSITIVE TEST
  {
    id: 'positive-valid-branch-name',
    name: 'Positive: Valid Branch Name',
    description: 'Get single branch information with a valid branch name',
    type: 'positive',
    expectedStatus: 200,
    // Note: User must provide a valid branch name that exists for their member
    // Response should return array with single branch object
  },

  // NEGATIVE TESTS - Authentication
  {
    id: 'negative-invalid-credentials',
    name: 'Negative: Invalid Credentials',
    description: 'Try to get branch using made-up credentials that do not exist in the system',
    type: 'negative',
    expectedStatus: 403,
    // Note: Create a credential with fake values (e.g., Member ID: "INVALID999", API Key: "fake-key-12345")
    // Should fail authentication
  },

  // NEGATIVE TESTS - Invalid Branch Name
  {
    id: 'negative-non-existent-branch',
    name: 'Negative: Non-existent Branch',
    description: 'Try to get information for a branch that does not exist',
    type: 'negative',
    expectedStatus: 404,
    pathParam: 'BRANCH_DOES_NOT_EXIST_999',
    // Note: Using a branch name unlikely to exist in the system
  },

  {
    id: 'negative-empty-branch-name',
    name: 'Negative: Empty Branch Name',
    description: 'Try to get branch with empty name parameter',
    type: 'negative',
    expectedStatus: 400,
    pathParam: '',
    // Note: Empty branch name should be rejected
  },

  {
    id: 'negative-special-characters-branch',
    name: 'Negative: Special Characters in Branch Name',
    description: 'Try to use special characters in the branch name parameter',
    type: 'negative',
    expectedStatus: 400,
    pathParam: 'BRANCH@#$%',
    // Note: Special characters should be rejected
  },

  {
    id: 'negative-sql-injection-branch',
    name: 'Negative: SQL Injection Attempt',
    description: 'Security test - try SQL injection in branch name parameter',
    type: 'negative',
    expectedStatus: 400,
    pathParam: "BRANCH' OR '1'='1",
    // Note: Should be properly escaped/rejected
  },

  {
    id: 'negative-too-long-branch-name',
    name: 'Negative: Branch Name Too Long',
    description: 'Use a branch name that exceeds the expected length',
    type: 'negative',
    expectedStatus: 400,
    pathParam: 'BRANCH_NAME_THAT_IS_EXTREMELY_LONG_AND_EXCEEDS_ANY_REASONABLE_LENGTH_LIMIT_FOR_A_BRANCH_NAME_IN_THE_SYSTEM',
    // Note: Excessively long branch name should be rejected
  },
]
