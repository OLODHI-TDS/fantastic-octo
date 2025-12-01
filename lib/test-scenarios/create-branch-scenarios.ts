/**
 * Test scenarios for Create New Branch endpoint
 * This endpoint creates a new branch with contact and address details
 */

import { generateCreateBranchData } from '../test-data-generator'

export interface TestScenario {
  id: string
  name: string
  description: string
  type: 'positive' | 'negative'
  expectedStatus: number
  generatePayload?: () => any
  requiresDifferentCredential?: boolean
}

export const createBranchScenarios: TestScenario[] = [
  // POSITIVE TESTS
  {
    id: 'positive-create-branch',
    name: 'Positive: Create Branch',
    description: 'Create a new branch with valid details',
    type: 'positive',
    expectedStatus: 200,
    generatePayload: () => generateCreateBranchData(),
  },

  {
    id: 'positive-mandatory-fields-only',
    name: 'Positive: Mandatory Fields Only',
    description: 'Create branch with only mandatory fields',
    type: 'positive',
    expectedStatus: 200,
    generatePayload: () => ({
      branch: {
        branch_name: 'Test Branch Central',
        branch_poan: '123',
        branch_street: 'High Street',
        branch_town: 'London',
        branch_postcode: 'SW1A 1AA',
        branch_telephone: '02012345678',
        branch_general_email: 'general@testbranch.com',
      }
    }),
  },

  {
    id: 'positive-all-fields',
    name: 'Positive: All Fields Populated',
    description: 'Create branch with all mandatory and optional fields',
    type: 'positive',
    expectedStatus: 200,
    generatePayload: () => ({
      branch: {
        branch_name: 'London Central Office',
        branch_poan: '10',
        branch_street: 'Downing Street',
        branch_town: 'City of London',
        branch_administrative_area: 'London',
        branch_postcode: 'SW1A 9AA',
        branch_mobile: '07557886987',
        branch_telephone: '02075796832',
        branch_fax: '02075796833',
        branch_general_email: 'general@branchemail.com',
        branch_dispute_email: 'dispute@branchemail.com',
        branch_finance_email: 'finance@branchemail.com',
        branch_website: 'https://www.branch.com/',
      }
    }),
  },

  {
    id: 'positive-with-mobile',
    name: 'Positive: With Mobile Number',
    description: 'Create branch including optional mobile number',
    type: 'positive',
    expectedStatus: 200,
    generatePayload: () => {
      const data = generateCreateBranchData()
      data.branch.branch_mobile = '07123456789'
      return data
    },
  },

  {
    id: 'positive-with-all-emails',
    name: 'Positive: With All Email Types',
    description: 'Create branch with general, dispute, and finance emails',
    type: 'positive',
    expectedStatus: 200,
    generatePayload: () => {
      const data = generateCreateBranchData()
      data.branch.branch_dispute_email = 'disputes@testbranch.com'
      data.branch.branch_finance_email = 'finance@testbranch.com'
      return data
    },
  },

  {
    id: 'positive-with-website',
    name: 'Positive: With Website',
    description: 'Create branch including website URL',
    type: 'positive',
    expectedStatus: 200,
    generatePayload: () => {
      const data = generateCreateBranchData()
      data.branch.branch_website = 'https://www.mybranch.co.uk/'
      return data
    },
  },

  // NEGATIVE TESTS - Missing Mandatory Fields
  {
    id: 'negative-missing-branch-name',
    name: 'Negative: Missing Branch Name',
    description: 'Attempt to create branch without branch_name',
    type: 'negative',
    expectedStatus: 400,
    generatePayload: () => {
      const data = generateCreateBranchData() as any
      delete data.branch.branch_name
      return data
    },
  },

  {
    id: 'negative-missing-poan',
    name: 'Negative: Missing POAN',
    description: 'Attempt to create branch without branch_poan',
    type: 'negative',
    expectedStatus: 400,
    generatePayload: () => {
      const data = generateCreateBranchData() as any
      delete data.branch.branch_poan
      return data
    },
  },

  {
    id: 'negative-missing-street',
    name: 'Negative: Missing Street',
    description: 'Attempt to create branch without branch_street',
    type: 'negative',
    expectedStatus: 400,
    generatePayload: () => {
      const data = generateCreateBranchData() as any
      delete data.branch.branch_street
      return data
    },
  },

  {
    id: 'negative-missing-town',
    name: 'Negative: Missing Town',
    description: 'Attempt to create branch without branch_town',
    type: 'negative',
    expectedStatus: 400,
    generatePayload: () => {
      const data = generateCreateBranchData() as any
      delete data.branch.branch_town
      return data
    },
  },

  {
    id: 'negative-missing-postcode',
    name: 'Negative: Missing Postcode',
    description: 'Attempt to create branch without branch_postcode',
    type: 'negative',
    expectedStatus: 400,
    generatePayload: () => {
      const data = generateCreateBranchData() as any
      delete data.branch.branch_postcode
      return data
    },
  },

  {
    id: 'negative-missing-telephone',
    name: 'Negative: Missing Telephone',
    description: 'Attempt to create branch without branch_telephone',
    type: 'negative',
    expectedStatus: 400,
    generatePayload: () => {
      const data = generateCreateBranchData() as any
      delete data.branch.branch_telephone
      return data
    },
  },

  {
    id: 'negative-missing-general-email',
    name: 'Negative: Missing General Email',
    description: 'Attempt to create branch without branch_general_email',
    type: 'negative',
    expectedStatus: 400,
    generatePayload: () => {
      const data = generateCreateBranchData() as any
      delete data.branch.branch_general_email
      return data
    },
  },

  {
    id: 'negative-missing-branch-object',
    name: 'Negative: Missing branch Object',
    description: 'Request body missing the branch object entirely',
    type: 'negative',
    expectedStatus: 400,
    generatePayload: () => ({}),
  },

  // NEGATIVE TESTS - Invalid Data Formats
  {
    id: 'negative-invalid-postcode',
    name: 'Negative: Invalid UK Postcode',
    description: 'Attempt to create branch with invalid UK postcode',
    type: 'negative',
    expectedStatus: 400,
    generatePayload: () => {
      const data = generateCreateBranchData()
      data.branch.branch_postcode = 'INVALID'
      return data
    },
  },

  {
    id: 'negative-invalid-telephone',
    name: 'Negative: Invalid Telephone Format',
    description: 'Attempt to create branch with invalid telephone number',
    type: 'negative',
    expectedStatus: 400,
    generatePayload: () => {
      const data = generateCreateBranchData()
      data.branch.branch_telephone = '12345'
      return data
    },
  },

  {
    id: 'negative-invalid-mobile',
    name: 'Negative: Invalid Mobile Format',
    description: 'Attempt to create branch with invalid UK mobile number',
    type: 'negative',
    expectedStatus: 400,
    generatePayload: () => {
      const data = generateCreateBranchData()
      data.branch.branch_mobile = 'not-a-mobile'
      return data
    },
  },

  {
    id: 'negative-invalid-general-email',
    name: 'Negative: Invalid General Email',
    description: 'Attempt to create branch with invalid general email format',
    type: 'negative',
    expectedStatus: 400,
    generatePayload: () => {
      const data = generateCreateBranchData()
      data.branch.branch_general_email = 'invalid-email'
      return data
    },
  },

  {
    id: 'negative-invalid-dispute-email',
    name: 'Negative: Invalid Dispute Email',
    description: 'Attempt to create branch with invalid dispute email format',
    type: 'negative',
    expectedStatus: 400,
    generatePayload: () => {
      const data = generateCreateBranchData()
      data.branch.branch_dispute_email = 'invalid-email'
      return data
    },
  },

  {
    id: 'negative-invalid-finance-email',
    name: 'Negative: Invalid Finance Email',
    description: 'Attempt to create branch with invalid finance email format',
    type: 'negative',
    expectedStatus: 400,
    generatePayload: () => {
      const data = generateCreateBranchData()
      data.branch.branch_finance_email = 'invalid-email'
      return data
    },
  },

  {
    id: 'negative-invalid-website',
    name: 'Negative: Invalid Website URL',
    description: 'Attempt to create branch with invalid website URL',
    type: 'negative',
    expectedStatus: 400,
    generatePayload: () => {
      const data = generateCreateBranchData()
      data.branch.branch_website = 'not-a-url'
      return data
    },
  },

  {
    id: 'negative-empty-branch-name',
    name: 'Negative: Empty Branch Name',
    description: 'Attempt to create branch with empty branch_name',
    type: 'negative',
    expectedStatus: 400,
    generatePayload: () => {
      const data = generateCreateBranchData()
      data.branch.branch_name = ''
      return data
    },
  },

  // SECURITY TESTS
  {
    id: 'negative-sql-injection-branch-name',
    name: 'Negative: SQL Injection in Branch Name',
    description: 'Security test - attempt SQL injection in branch_name field',
    type: 'negative',
    expectedStatus: 400,
    generatePayload: () => {
      const data = generateCreateBranchData()
      data.branch.branch_name = "Test' OR '1'='1"
      return data
    },
  },

  {
    id: 'negative-xss-attempt-branch-name',
    name: 'Negative: XSS Attempt in Branch Name',
    description: 'Security test - attempt XSS injection in branch name',
    type: 'negative',
    expectedStatus: 400,
    generatePayload: () => {
      const data = generateCreateBranchData()
      data.branch.branch_name = '<script>alert("xss")</script>'
      return data
    },
  },

  {
    id: 'negative-xss-attempt-website',
    name: 'Negative: XSS Attempt in Website',
    description: 'Security test - attempt XSS injection in website URL',
    type: 'negative',
    expectedStatus: 400,
    generatePayload: () => {
      const data = generateCreateBranchData()
      data.branch.branch_website = 'javascript:alert("xss")'
      return data
    },
  },
]
