/**
 * Test scenarios for Transfer Branch Deposit endpoint
 * Endpoint: POST /services/apexrest/transferBranch/{DAN}
 *
 * Transfers a deposit from one branch to another branch within the same member organization
 *
 * Request Body:
 * - branch_id (mandatory): The target branch ID where the deposit will be transferred
 * - person_id (optional): If provided, system checks if landlord exists in target branch
 */

export interface TestScenario {
  id: string
  name: string
  description: string
  type: 'positive' | 'negative'
  expectedStatus?: number
  payload?: any
  generatePayload?: () => any
  requiresDifferentCredential?: boolean
  pathParam?: string
  generatePathParam?: () => string
  requiresCreationPayload?: boolean
  modifyPayload?: (payload: any, credential?: any) => any
}

export const transferBranchDepositScenarios: TestScenario[] = [
  // ==================== POSITIVE SCENARIOS ====================
  {
    id: 'positive-branch-transfer-basic',
    name: 'Positive: Transfer to Another Branch (Basic)',
    description: 'Transfer a deposit to another branch using only branch_id. Use the Target Branch selector to choose the destination branch.',
    type: 'positive',
    expectedStatus: 200,
    // Uses branch_id from Target Branch Credential selector
    // No payload needed - request body comes from UI
  },
  {
    id: 'positive-branch-transfer-with-person',
    name: 'Positive: Transfer with Person ID',
    description: 'Transfer a deposit with person_id to check for existing landlord. Select a target branch, then this will add person_id to the payload.',
    type: 'positive',
    expectedStatus: 200,
    // Uses branch_id from Target Branch Credential selector, adds person_id
    modifyPayload: (payload: any) => {
      return {
        ...payload,
        person_id: '123',
      }
    },
  },

  // ==================== NEGATIVE SCENARIOS ====================
  {
    id: 'negative-missing-branch-id',
    name: 'Negative: Missing branch_id',
    description: 'Request without mandatory branch_id field should fail',
    type: 'negative',
    expectedStatus: 400,
    // pathParam uses user's input from form
    payload: {},
  },
  {
    id: 'negative-empty-branch-id',
    name: 'Negative: Empty branch_id',
    description: 'branch_id field is empty string',
    type: 'negative',
    expectedStatus: 400,
    // pathParam uses user's input from form
    payload: {
      branch_id: '',
    },
  },
  {
    id: 'negative-null-branch-id',
    name: 'Negative: Null branch_id',
    description: 'branch_id field is null',
    type: 'negative',
    expectedStatus: 400,
    // pathParam uses user's input from form
    payload: {
      branch_id: null,
    },
  },
  {
    id: 'negative-whitespace-branch-id',
    name: 'Negative: Whitespace branch_id',
    description: 'branch_id contains only whitespace',
    type: 'negative',
    expectedStatus: 400,
    // pathParam uses user's input from form
    payload: {
      branch_id: '   ',
    },
  },
  {
    id: 'negative-invalid-branch-id',
    name: 'Negative: Branch Not Found',
    description: 'branch_id does not exist under the member',
    type: 'negative',
    expectedStatus: 404,
    // pathParam uses user's input from form
    payload: {
      branch_id: 'INVALIDBRANCH999',
    },
  },
  {
    id: 'negative-special-chars-branch-id',
    name: 'Negative: Special Characters in branch_id',
    description: 'branch_id contains invalid special characters',
    type: 'negative',
    expectedStatus: 400,
    // pathParam uses user's input from form
    payload: {
      branch_id: 'BR3224SC!@#',
    },
  },
  {
    id: 'negative-invalid-dan-format',
    name: 'Negative: Invalid DAN Format in Path',
    description: 'DAN in path parameter has invalid format',
    type: 'negative',
    expectedStatus: 400,
    pathParam: 'INVALID123',
    payload: {
      branch_id: 'BR3224SC',
    },
  },
  {
    id: 'negative-dan-not-found',
    name: 'Negative: DAN Not Found',
    description: 'DAN does not exist in the system',
    type: 'negative',
    expectedStatus: 404,
    pathParam: 'NI9999999',
    payload: {
      branch_id: 'BR3224SC',
    },
  },
  {
    id: 'negative-empty-dan-path',
    name: 'Negative: Empty DAN in Path',
    description: 'DAN path parameter is empty',
    type: 'negative',
    expectedStatus: 400,
    pathParam: '',
    payload: {
      branch_id: 'BR3224SC',
    },
  },
  {
    id: 'negative-special-chars-dan',
    name: 'Negative: Special Characters in DAN',
    description: 'DAN contains invalid special characters',
    type: 'negative',
    expectedStatus: 400,
    pathParam: 'NI1022709!@#',
    payload: {
      branch_id: 'BR3224SC',
    },
  },
  {
    id: 'negative-same-branch-transfer',
    name: 'Negative: Transfer to Same Branch',
    description: 'Attempt to transfer deposit to the same branch it is currently in',
    type: 'negative',
    expectedStatus: 400,
    // pathParam uses user's input from form
    modifyPayload: (payload: any, credential: any) => {
      // Use the same branch ID as the credential
      return {
        branch_id: credential?.branchId || 'BR3224SC',
      }
    },
  },
  {
    id: 'negative-invalid-person-id',
    name: 'Negative: Invalid person_id Format',
    description: 'person_id has invalid format',
    type: 'negative',
    expectedStatus: 400,
    // pathParam uses user's input from form
    payload: {
      branch_id: 'BR3224SC',
      person_id: 'invalid!@#',
    },
  },
  {
    id: 'negative-empty-person-id',
    name: 'Negative: Empty person_id',
    description: 'person_id is empty string',
    type: 'negative',
    expectedStatus: 400,
    // pathParam uses user's input from form
    payload: {
      branch_id: 'BR3224SC',
      person_id: '',
    },
  },
  {
    id: 'negative-null-person-id',
    name: 'Negative: Null person_id',
    description: 'person_id is explicitly null',
    type: 'negative',
    expectedStatus: 400,
    // pathParam uses user's input from form
    payload: {
      branch_id: 'BR3224SC',
      person_id: null,
    },
  },
  {
    id: 'negative-cross-org-dan',
    name: 'Negative: DAN from Different Organization',
    description: 'Attempt to transfer a DAN that belongs to a different member organization',
    type: 'negative',
    expectedStatus: 403,
    pathParam: 'EWC00001111', // Different scheme DAN
    payload: {
      branch_id: 'BR3224SC',
    },
  },
  {
    id: 'negative-excess-fields',
    name: 'Negative: Excess Unexpected Fields',
    description: 'Include unexpected fields in the request body',
    type: 'negative',
    expectedStatus: 400,
    // pathParam uses user's input from form
    payload: {
      branch_id: 'BR3224SC',
      unexpected_field: 'should_not_be_here',
      another_field: 12345,
    },
  },
  {
    id: 'negative-deposit-already-transferred',
    name: 'Negative: Deposit Already in Transit',
    description: 'Attempt to transfer a deposit that is already being transferred',
    type: 'negative',
    expectedStatus: 400,
    // pathParam uses user's input from form
    payload: {
      branch_id: 'BR3224SC',
    },
  },
]
