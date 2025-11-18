/**
 * Test scenarios for Transfer Deposit endpoint
 * This endpoint transfers a deposit to another member (inter-member transfer)
 * Endpoint: /services/apexrest/transfer
 */

import { generateTransferDepositData } from '../test-data-generator'

export interface TestScenario {
  id: string
  name: string
  description: string
  type: 'positive' | 'negative'
  expectedStatus: number
  generatePayload?: () => any
  requiresDifferentCredential?: boolean
}

export const transferDepositScenarios: TestScenario[] = [
  // POSITIVE TESTS
  {
    id: 'positive-transfer-to-person',
    name: 'Positive: Transfer to Person by Email',
    description: 'Transfer deposit to another member using their email address',
    type: 'positive',
    expectedStatus: 200,
    generatePayload: () => ({
      dan: 'NI00004420',
      person_email: 'recipient@example.com'
    }),
    // Note: Requires valid DAN and recipient email that exists in the system
  },

  {
    id: 'positive-transfer-existing-member',
    name: 'Positive: Transfer to Existing Member',
    description: 'Transfer deposit to a member that already exists in the system',
    type: 'positive',
    expectedStatus: 200,
    generatePayload: () => {
      const data = generateTransferDepositData()
      return {
        dan: data.dan || 'NI00004420',
        person_email: 'existing.member@example.com'
      }
    },
  },

  {
    id: 'positive-transfer-generated-data',
    name: 'Positive: Transfer with Generated Data',
    description: 'Transfer deposit using auto-generated test data',
    type: 'positive',
    expectedStatus: 200,
    generatePayload: () => generateTransferDepositData(),
  },

  // NEGATIVE TESTS - Missing Required Fields
  {
    id: 'negative-missing-dan',
    name: 'Negative: Missing DAN',
    description: 'Request body missing the required dan field',
    type: 'negative',
    expectedStatus: 400,
    generatePayload: () => ({
      person_email: 'recipient@example.com'
    }),
  },

  {
    id: 'negative-missing-email',
    name: 'Negative: Missing person_email',
    description: 'Request body missing the required person_email field',
    type: 'negative',
    expectedStatus: 400,
    generatePayload: () => ({
      dan: 'NI00004420'
    }),
  },

  {
    id: 'negative-empty-dan',
    name: 'Negative: Empty DAN',
    description: 'DAN field is empty string',
    type: 'negative',
    expectedStatus: 400,
    generatePayload: () => ({
      dan: '',
      person_email: 'recipient@example.com'
    }),
  },

  {
    id: 'negative-null-dan',
    name: 'Negative: Null DAN',
    description: 'DAN field is null',
    type: 'negative',
    expectedStatus: 400,
    generatePayload: () => ({
      dan: null,
      person_email: 'recipient@example.com'
    }),
  },

  {
    id: 'negative-empty-body',
    name: 'Negative: Empty Request Body',
    description: 'Request body is empty',
    type: 'negative',
    expectedStatus: 400,
    generatePayload: () => ({}),
  },

  // NEGATIVE TESTS - Invalid Email Format
  {
    id: 'negative-invalid-email-format',
    name: 'Negative: Invalid Email Format',
    description: 'person_email has invalid email format',
    type: 'negative',
    expectedStatus: 400,
    generatePayload: () => ({
      dan: 'NI00004420',
      person_email: 'invalid-email-format'
    }),
  },

  {
    id: 'negative-empty-email',
    name: 'Negative: Empty person_email',
    description: 'person_email field is empty string',
    type: 'negative',
    expectedStatus: 400,
    generatePayload: () => ({
      dan: 'NI00004420',
      person_email: ''
    }),
  },

  {
    id: 'negative-null-email',
    name: 'Negative: Null person_email',
    description: 'person_email field is null',
    type: 'negative',
    expectedStatus: 400,
    generatePayload: () => ({
      dan: 'NI00004420',
      person_email: null
    }),
  },

  {
    id: 'negative-email-without-domain',
    name: 'Negative: Email Without Domain',
    description: 'person_email missing domain part',
    type: 'negative',
    expectedStatus: 400,
    generatePayload: () => ({
      dan: 'NI00004420',
      person_email: 'user@'
    }),
  },

  {
    id: 'negative-email-without-at',
    name: 'Negative: Email Without @ Symbol',
    description: 'person_email missing @ symbol',
    type: 'negative',
    expectedStatus: 400,
    generatePayload: () => ({
      dan: 'NI00004420',
      person_email: 'userexample.com'
    }),
  },

  // NEGATIVE TESTS - Non-existent Records
  {
    id: 'negative-non-existent-dan',
    name: 'Negative: Non-existent DAN',
    description: 'Attempt to transfer a deposit that does not exist',
    type: 'negative',
    expectedStatus: 404,
    generatePayload: () => ({
      dan: 'NI99999999',
      person_email: 'recipient@example.com'
    }),
  },

  {
    id: 'negative-non-existent-email',
    name: 'Negative: Non-existent person_email',
    description: 'Attempt to transfer to an email that does not exist in the system',
    type: 'negative',
    expectedStatus: 404,
    generatePayload: () => ({
      dan: 'NI00004420',
      person_email: 'nonexistent.user@example.com'
    }),
  },

  // NEGATIVE TESTS - Invalid DAN Format
  {
    id: 'negative-invalid-dan-format',
    name: 'Negative: Invalid DAN Format',
    description: 'DAN has invalid format (special characters)',
    type: 'negative',
    expectedStatus: 400,
    generatePayload: () => ({
      dan: 'INVALID@#$%',
      person_email: 'recipient@example.com'
    }),
  },

  {
    id: 'negative-wrong-region-dan',
    name: 'Negative: Wrong Region DAN',
    description: 'Attempt to transfer deposit with DAN from different region',
    type: 'negative',
    expectedStatus: 403,
    generatePayload: () => ({
      dan: 'EWC00004420',
      person_email: 'recipient@example.com'
    }),
    // Note: Using EWC DAN with NI credentials or vice versa
  },

  {
    id: 'negative-numeric-only-dan',
    name: 'Negative: Numeric-only DAN',
    description: 'DAN without region prefix',
    type: 'negative',
    expectedStatus: 400,
    generatePayload: () => ({
      dan: '00004420',
      person_email: 'recipient@example.com'
    }),
  },

  // NEGATIVE TESTS - Business Logic
  {
    id: 'negative-closed-deposit',
    name: 'Negative: Transfer Closed Deposit',
    description: 'Attempt to transfer a deposit that has been closed/released',
    type: 'negative',
    expectedStatus: 400,
    generatePayload: () => ({
      dan: 'NI00004420',
      person_email: 'recipient@example.com'
    }),
    // Note: Requires a DAN for a closed deposit
    // Expected: 400 Bad Request - cannot transfer closed deposit
  },

  {
    id: 'negative-disputed-deposit',
    name: 'Negative: Transfer Disputed Deposit',
    description: 'Attempt to transfer a deposit currently in dispute',
    type: 'negative',
    expectedStatus: 400,
    generatePayload: () => ({
      dan: 'NI00004420',
      person_email: 'recipient@example.com'
    }),
    // Note: Requires a DAN for a deposit in dispute
    // Expected: 400 Bad Request - cannot transfer disputed deposit
  },

  {
    id: 'negative-transfer-to-self',
    name: 'Negative: Transfer to Self',
    description: 'Attempt to transfer deposit to the same member',
    type: 'negative',
    expectedStatus: 400,
    generatePayload: () => ({
      dan: 'NI00004420',
      person_email: 'current.owner@example.com'
    }),
    // Note: person_email should be the current owner
    // Expected: 400 Bad Request - cannot transfer to self
  },

  // NEGATIVE TESTS - Authentication & Authorization
  {
    id: 'negative-invalid-credentials',
    name: 'Negative: Invalid Credentials',
    description: 'Attempt to transfer deposit with wrong credentials',
    type: 'negative',
    expectedStatus: 403,
    requiresDifferentCredential: true,
    generatePayload: () => ({
      dan: 'NI00004420',
      person_email: 'recipient@example.com'
    }),
    // Note: Use credentials from different organization
  },

  {
    id: 'negative-unauthorized-deposit',
    name: 'Negative: Unauthorized Deposit Access',
    description: 'Attempt to transfer a deposit not belonging to this organization',
    type: 'negative',
    expectedStatus: 403,
    generatePayload: () => ({
      dan: 'NI00001234',
      person_email: 'recipient@example.com'
    }),
    // Note: DAN from a different organization
  },

  // SECURITY TESTS
  {
    id: 'negative-sql-injection-dan',
    name: 'Negative: SQL Injection in DAN',
    description: 'Security test - attempt SQL injection in dan field',
    type: 'negative',
    expectedStatus: 400,
    generatePayload: () => ({
      dan: "NI' OR '1'='1",
      person_email: 'recipient@example.com'
    }),
  },

  {
    id: 'negative-sql-injection-email',
    name: 'Negative: SQL Injection in person_email',
    description: 'Security test - attempt SQL injection in person_email field',
    type: 'negative',
    expectedStatus: 400,
    generatePayload: () => ({
      dan: 'NI00004420',
      person_email: "test' OR '1'='1'--@example.com"
    }),
  },

  {
    id: 'negative-xss-attempt-email',
    name: 'Negative: XSS Attempt in Email',
    description: 'Security test - attempt XSS injection in person_email',
    type: 'negative',
    expectedStatus: 400,
    generatePayload: () => ({
      dan: 'NI00004420',
      person_email: '<script>alert("xss")</script>@example.com'
    }),
  },

  {
    id: 'negative-xss-attempt-dan',
    name: 'Negative: XSS Attempt in DAN',
    description: 'Security test - attempt XSS injection in dan field',
    type: 'negative',
    expectedStatus: 400,
    generatePayload: () => ({
      dan: '<script>alert("xss")</script>',
      person_email: 'recipient@example.com'
    }),
  },
]
