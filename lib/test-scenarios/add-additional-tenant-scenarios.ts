/**
 * Test scenarios for Add Additional Tenant endpoint (NRLA)
 * This endpoint adds additional tenants to an existing deposit
 */

import { generateAddAdditionalTenantData } from '../test-data-generator'

export interface TestScenario {
  id: string
  name: string
  description: string
  type: 'positive' | 'negative'
  expectedStatus: number
  generatePayload?: () => any
  requiresDifferentCredential?: boolean
  pathParam?: string
  generatePathParam?: () => string
}

export const addAdditionalTenantScenarios: TestScenario[] = [
  // POSITIVE TESTS
  {
    id: 'positive-single-tenant',
    name: 'Positive: Add Single Tenant',
    description: 'Add one additional tenant to an existing deposit',
    type: 'positive',
    expectedStatus: 200,
    generatePayload: () => {
      const data = generateAddAdditionalTenantData()
      // Ensure only 1 tenant
      data.people = data.people.slice(0, 1)
      return data
    },
    // Note: Requires a valid DAN from an existing deposit
  },

  {
    id: 'positive-multiple-tenants',
    name: 'Positive: Add Multiple Tenants',
    description: 'Add multiple tenants to an existing deposit',
    type: 'positive',
    expectedStatus: 200,
    generatePayload: () => generateAddAdditionalTenantData(),
    // Note: Requires a valid DAN from an existing deposit
  },

  {
    id: 'positive-business-tenant',
    name: 'Positive: Add Business Tenant',
    description: 'Add a business tenant with business_name field',
    type: 'positive',
    expectedStatus: 200,
    generatePayload: () => {
      const data = generateAddAdditionalTenantData()
      // Ensure tenant is a business
      data.people = data.people.slice(0, 1)
      data.people[0].is_business = 'TRUE'
      data.people[0].business_name = 'Test Business Ltd'
      return data
    },
  },

  // NEGATIVE TESTS - Missing Required Fields
  {
    id: 'negative-missing-people-array',
    name: 'Negative: Missing people Array',
    description: 'Request body missing the people array',
    type: 'negative',
    expectedStatus: 400,
    generatePayload: () => ({}),
  },

  {
    id: 'negative-empty-people-array',
    name: 'Negative: Empty people Array',
    description: 'People array is empty',
    type: 'negative',
    expectedStatus: 400,
    generatePayload: () => ({ people: [] }),
  },

  {
    id: 'negative-missing-firstname',
    name: 'Negative: Missing person_firstname',
    description: 'Required field person_firstname is missing',
    type: 'negative',
    expectedStatus: 400,
    generatePayload: () => {
      const data = generateAddAdditionalTenantData()
      delete data.people[0].person_firstname
      return data
    },
  },

  {
    id: 'negative-missing-surname',
    name: 'Negative: Missing person_surname',
    description: 'Required field person_surname is missing',
    type: 'negative',
    expectedStatus: 400,
    generatePayload: () => {
      const data = generateAddAdditionalTenantData()
      delete data.people[0].person_surname
      return data
    },
  },

  {
    id: 'negative-missing-postcode',
    name: 'Negative: Missing person_postcode',
    description: 'Required field person_postcode is missing',
    type: 'negative',
    expectedStatus: 400,
    generatePayload: () => {
      const data = generateAddAdditionalTenantData()
      delete data.people[0].person_postcode
      return data
    },
  },

  // NEGATIVE TESTS - Invalid DAN
  {
    id: 'negative-invalid-credentials',
    name: 'Negative: Invalid Credentials',
    description: 'Attempt to add tenant using wrong credentials from another organization',
    type: 'negative',
    expectedStatus: 403,
    requiresDifferentCredential: true,
    generatePayload: () => generateAddAdditionalTenantData(),
    // Note: Requires a valid DAN from Credential A, running with Credential B
  },

  {
    id: 'negative-non-existent-dan',
    name: 'Negative: Non-existent DAN',
    description: 'Attempt to add tenant to a deposit that does not exist',
    type: 'negative',
    expectedStatus: 404,
    pathParam: 'EWI99999999',
    generatePayload: () => generateAddAdditionalTenantData(),
  },

  {
    id: 'negative-invalid-dan-format',
    name: 'Negative: Invalid DAN Format',
    description: 'Attempt to add tenant with malformed DAN (special characters)',
    type: 'negative',
    expectedStatus: 400,
    pathParam: 'INVALID@#$%',
    generatePayload: () => generateAddAdditionalTenantData(),
  },

  {
    id: 'negative-empty-dan',
    name: 'Negative: Empty DAN',
    description: 'Attempt to add tenant with empty DAN parameter',
    type: 'negative',
    expectedStatus: 400,
    pathParam: '',
    generatePayload: () => generateAddAdditionalTenantData(),
  },

  // NEGATIVE TESTS - Data Validation
  {
    id: 'negative-invalid-email',
    name: 'Negative: Invalid Email Format',
    description: 'Attempt to add tenant with invalid email format',
    type: 'negative',
    expectedStatus: 400,
    generatePayload: () => {
      const data = generateAddAdditionalTenantData()
      data.people[0].person_email = 'invalid-email'
      return data
    },
  },

  {
    id: 'negative-invalid-postcode',
    name: 'Negative: Invalid UK Postcode',
    description: 'Attempt to add tenant with invalid UK postcode',
    type: 'negative',
    expectedStatus: 400,
    generatePayload: () => {
      const data = generateAddAdditionalTenantData()
      data.people[0].person_postcode = 'INVALID'
      return data
    },
  },

  {
    id: 'negative-invalid-classification',
    name: 'Negative: Invalid person_classification',
    description: 'Attempt to add with classification other than "Tenant"',
    type: 'negative',
    expectedStatus: 400,
    generatePayload: () => {
      const data = generateAddAdditionalTenantData()
      data.people[0].person_classification = 'Landlord'
      return data
    },
  },

  {
    id: 'negative-business-without-name',
    name: 'Negative: Business Flag Without business_name',
    description: 'is_business is TRUE but business_name is missing',
    type: 'negative',
    expectedStatus: 400,
    generatePayload: () => {
      const data = generateAddAdditionalTenantData()
      data.people[0].is_business = 'TRUE'
      delete data.people[0].business_name
      return data
    },
  },

  // NEGATIVE TESTS - Business Logic / Deposit Status
  {
    id: 'negative-protected-deposit',
    name: 'Negative: Add Tenant to Protected Deposit',
    description: 'Attempt to add tenant to a deposit in "Deposits protected by scheme" status',
    type: 'negative',
    expectedStatus: 400,
    generatePayload: () => generateAddAdditionalTenantData(),
    // Note: Requires DAN for a deposit in "Deposits protected by scheme" status
    // Additional tenants can ONLY be added when deposit status is "Registered (not paid)"
    // Expected: 400 Bad Request - cannot add tenants to protected deposit
  },

  {
    id: 'negative-released-deposit',
    name: 'Negative: Add Tenant to Released Deposit',
    description: 'Attempt to add tenant to a deposit that has been released/closed',
    type: 'negative',
    expectedStatus: 400,
    generatePayload: () => generateAddAdditionalTenantData(),
    // Note: Requires DAN for a deposit that has been released
    // Expected: 400 Bad Request - cannot add tenants to closed deposit
  },

  // SECURITY TESTS
  {
    id: 'negative-sql-injection',
    name: 'Negative: SQL Injection Attempt',
    description: 'Security test - attempt SQL injection in DAN parameter',
    type: 'negative',
    expectedStatus: 400,
    pathParam: "EWI' OR '1'='1",
    generatePayload: () => generateAddAdditionalTenantData(),
  },

  {
    id: 'negative-xss-attempt',
    name: 'Negative: XSS Attempt in Name',
    description: 'Security test - attempt XSS injection in person name',
    type: 'negative',
    expectedStatus: 400,
    generatePayload: () => {
      const data = generateAddAdditionalTenantData()
      data.people[0].person_firstname = '<script>alert("xss")</script>'
      return data
    },
  },
]
