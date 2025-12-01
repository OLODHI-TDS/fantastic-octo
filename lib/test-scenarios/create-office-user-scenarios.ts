/**
 * Test scenarios for Add New Office User endpoint
 * This endpoint creates a new office user with specified role and branch access
 */

import { generateCreateOfficeUserData } from '../test-data-generator'

export interface TestScenario {
  id: string
  name: string
  description: string
  type: 'positive' | 'negative'
  expectedStatus: number
  generatePayload?: () => any
  requiresDifferentCredential?: boolean
}

export const createOfficeUserScenarios: TestScenario[] = [
  // POSITIVE TESTS
  {
    id: 'positive-create-office-user',
    name: 'Positive: Create Office User',
    description: 'Create a new office user with valid details',
    type: 'positive',
    expectedStatus: 200,
    generatePayload: () => generateCreateOfficeUserData(),
  },

  {
    id: 'positive-account-administrator',
    name: 'Positive: Account Administrator Role',
    description: 'Create office user with Account administrator role',
    type: 'positive',
    expectedStatus: 200,
    generatePayload: () => {
      const data = generateCreateOfficeUserData()
      data.user.job_role = 'Account administrator'
      return data
    },
  },

  {
    id: 'positive-dispute-administrator',
    name: 'Positive: Dispute Administrator Role',
    description: 'Create office user with Dispute administrator role',
    type: 'positive',
    expectedStatus: 200,
    generatePayload: () => {
      const data = generateCreateOfficeUserData()
      data.user.job_role = 'Dispute administrator'
      return data
    },
  },

  {
    id: 'positive-finance-administrator',
    name: 'Positive: Finance Administrator Role',
    description: 'Create office user with Finance administrator role',
    type: 'positive',
    expectedStatus: 200,
    generatePayload: () => {
      const data = generateCreateOfficeUserData()
      data.user.job_role = 'Finance administrator'
      return data
    },
  },

  {
    id: 'positive-deposit-property-dispute-admin',
    name: 'Positive: Deposit, Property & Dispute Administrator',
    description: 'Create office user with Deposit, property & dispute administrator role',
    type: 'positive',
    expectedStatus: 200,
    generatePayload: () => {
      const data = generateCreateOfficeUserData()
      data.user.job_role = 'Deposit, property & dispute administrator'
      return data
    },
  },

  {
    id: 'positive-deposit-property-admin',
    name: 'Positive: Deposit & Property Administrator',
    description: 'Create office user with Deposit & property administrator role',
    type: 'positive',
    expectedStatus: 200,
    generatePayload: () => {
      const data = generateCreateOfficeUserData()
      data.user.job_role = 'Deposit & property administrator'
      return data
    },
  },

  {
    id: 'positive-view-only-access',
    name: 'Positive: View Only Access Role',
    description: 'Create office user with View only access role',
    type: 'positive',
    expectedStatus: 200,
    generatePayload: () => {
      const data = generateCreateOfficeUserData()
      data.user.job_role = 'View only access'
      return data
    },
  },

  {
    id: 'positive-single-branch',
    name: 'Positive: Single Branch Access',
    description: 'Create office user with access to a single branch',
    type: 'positive',
    expectedStatus: 200,
    generatePayload: () => {
      const data = generateCreateOfficeUserData()
      data.user.branches = 'BR12345A'
      return data
    },
  },

  {
    id: 'positive-multiple-branches',
    name: 'Positive: Multiple Branch Access',
    description: 'Create office user with access to multiple branches',
    type: 'positive',
    expectedStatus: 200,
    generatePayload: () => {
      const data = generateCreateOfficeUserData()
      data.user.branches = 'BR12345A, BR67890B, BR11111C'
      return data
    },
  },

  // NEGATIVE TESTS - Missing Required Fields
  {
    id: 'negative-missing-title',
    name: 'Negative: Missing Title',
    description: 'Attempt to create user without person_title',
    type: 'negative',
    expectedStatus: 400,
    generatePayload: () => {
      const data = generateCreateOfficeUserData() as any
      delete data.user.person_title
      return data
    },
  },

  {
    id: 'negative-missing-firstname',
    name: 'Negative: Missing First Name',
    description: 'Attempt to create user without person_firstname',
    type: 'negative',
    expectedStatus: 400,
    generatePayload: () => {
      const data = generateCreateOfficeUserData() as any
      delete data.user.person_firstname
      return data
    },
  },

  {
    id: 'negative-missing-surname',
    name: 'Negative: Missing Surname',
    description: 'Attempt to create user without person_surname',
    type: 'negative',
    expectedStatus: 400,
    generatePayload: () => {
      const data = generateCreateOfficeUserData() as any
      delete data.user.person_surname
      return data
    },
  },

  {
    id: 'negative-missing-email',
    name: 'Negative: Missing Email',
    description: 'Attempt to create user without person_email',
    type: 'negative',
    expectedStatus: 400,
    generatePayload: () => {
      const data = generateCreateOfficeUserData() as any
      delete data.user.person_email
      return data
    },
  },

  {
    id: 'negative-missing-mobile',
    name: 'Negative: Missing Mobile',
    description: 'Attempt to create user without person_mobile',
    type: 'negative',
    expectedStatus: 400,
    generatePayload: () => {
      const data = generateCreateOfficeUserData() as any
      delete data.user.person_mobile
      return data
    },
  },

  {
    id: 'negative-missing-job-role',
    name: 'Negative: Missing Job Role',
    description: 'Attempt to create user without job_role',
    type: 'negative',
    expectedStatus: 400,
    generatePayload: () => {
      const data = generateCreateOfficeUserData() as any
      delete data.user.job_role
      return data
    },
  },

  {
    id: 'negative-missing-branches',
    name: 'Negative: Missing Branches',
    description: 'Attempt to create user without branches',
    type: 'negative',
    expectedStatus: 400,
    generatePayload: () => {
      const data = generateCreateOfficeUserData() as any
      delete data.user.branches
      return data
    },
  },

  {
    id: 'negative-missing-user-object',
    name: 'Negative: Missing user Object',
    description: 'Request body missing the user object entirely',
    type: 'negative',
    expectedStatus: 400,
    generatePayload: () => ({}),
  },

  // NEGATIVE TESTS - Invalid Data Formats
  {
    id: 'negative-invalid-email-format',
    name: 'Negative: Invalid Email Format',
    description: 'Attempt to create user with invalid email format',
    type: 'negative',
    expectedStatus: 400,
    generatePayload: () => {
      const data = generateCreateOfficeUserData()
      data.user.person_email = 'invalid-email'
      return data
    },
  },

  {
    id: 'negative-invalid-mobile-format',
    name: 'Negative: Invalid Mobile Format',
    description: 'Attempt to create user with invalid UK mobile number',
    type: 'negative',
    expectedStatus: 400,
    generatePayload: () => {
      const data = generateCreateOfficeUserData()
      data.user.person_mobile = '12345'
      return data
    },
  },

  {
    id: 'negative-invalid-job-role',
    name: 'Negative: Invalid Job Role',
    description: 'Attempt to create user with non-existent job role',
    type: 'negative',
    expectedStatus: 400,
    generatePayload: () => {
      const data = generateCreateOfficeUserData()
      data.user.job_role = 'Super Admin'
      return data
    },
  },

  {
    id: 'negative-invalid-branch-format',
    name: 'Negative: Invalid Branch Format',
    description: 'Attempt to create user with invalid branch ID format',
    type: 'negative',
    expectedStatus: 400,
    generatePayload: () => {
      const data = generateCreateOfficeUserData()
      data.user.branches = 'INVALID_BRANCH'
      return data
    },
  },

  {
    id: 'negative-empty-branches',
    name: 'Negative: Empty Branches String',
    description: 'Attempt to create user with empty branches string',
    type: 'negative',
    expectedStatus: 400,
    generatePayload: () => {
      const data = generateCreateOfficeUserData()
      data.user.branches = ''
      return data
    },
  },

  // SECURITY TESTS
  {
    id: 'negative-sql-injection-email',
    name: 'Negative: SQL Injection in Email',
    description: 'Security test - attempt SQL injection in email field',
    type: 'negative',
    expectedStatus: 400,
    generatePayload: () => {
      const data = generateCreateOfficeUserData()
      data.user.person_email = "test@test.com' OR '1'='1"
      return data
    },
  },

  {
    id: 'negative-xss-attempt-name',
    name: 'Negative: XSS Attempt in Name',
    description: 'Security test - attempt XSS injection in person name',
    type: 'negative',
    expectedStatus: 400,
    generatePayload: () => {
      const data = generateCreateOfficeUserData()
      data.user.person_firstname = '<script>alert("xss")</script>'
      return data
    },
  },
]
