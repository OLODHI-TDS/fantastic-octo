/**
 * Test scenarios for Register Landlord (NRLA) endpoint
 * This endpoint registers a new landlord/client with NRLA membership details
 */

import { generateRegisterLandlordData, generateNRLAId } from '../test-data-generator'

export interface TestScenario {
  id: string
  name: string
  description: string
  type: 'positive' | 'negative'
  expectedStatus: number
  generatePayload?: () => any
  requiresDifferentCredential?: boolean
}

export const registerLandlordScenarios: TestScenario[] = [
  // POSITIVE TESTS
  {
    id: 'positive-register-landlord',
    name: 'Positive: Register New Landlord',
    description: 'Register a new landlord with valid NRLA membership details',
    type: 'positive',
    expectedStatus: 200,
    generatePayload: () => generateRegisterLandlordData(),
  },

  {
    id: 'positive-register-business-landlord',
    name: 'Positive: Register Business Landlord',
    description: 'Register a landlord who is a business entity',
    type: 'positive',
    expectedStatus: 200,
    generatePayload: () => {
      const data = generateRegisterLandlordData()
      data.people.is_business = 'true'
      return data
    },
  },

  {
    id: 'positive-register-individual-landlord',
    name: 'Positive: Register Individual Landlord',
    description: 'Register a landlord who is an individual (not a business)',
    type: 'positive',
    expectedStatus: 200,
    generatePayload: () => {
      const data = generateRegisterLandlordData()
      data.people.is_business = 'false'
      return data
    },
  },

  // NEGATIVE TESTS - Missing Required Fields
  {
    id: 'negative-missing-nrla-id',
    name: 'Negative: Missing NRLA ID',
    description: 'Attempt to register landlord without nrla_id',
    type: 'negative',
    expectedStatus: 400,
    generatePayload: () => {
      const data = generateRegisterLandlordData()
      delete data.people.nrla_id
      return data
    },
  },

  {
    id: 'negative-missing-firstname',
    name: 'Negative: Missing First Name',
    description: 'Attempt to register landlord without person_firstname',
    type: 'negative',
    expectedStatus: 400,
    generatePayload: () => {
      const data = generateRegisterLandlordData()
      delete data.people.person_firstname
      return data
    },
  },

  {
    id: 'negative-missing-surname',
    name: 'Negative: Missing Surname',
    description: 'Attempt to register landlord without person_surname',
    type: 'negative',
    expectedStatus: 400,
    generatePayload: () => {
      const data = generateRegisterLandlordData()
      delete data.people.person_surname
      return data
    },
  },

  {
    id: 'negative-missing-email',
    name: 'Negative: Missing Email',
    description: 'Attempt to register landlord without person_email',
    type: 'negative',
    expectedStatus: 400,
    generatePayload: () => {
      const data = generateRegisterLandlordData()
      delete data.people.person_email
      return data
    },
  },

  {
    id: 'negative-missing-postcode',
    name: 'Negative: Missing Postcode',
    description: 'Attempt to register landlord without person_postcode',
    type: 'negative',
    expectedStatus: 400,
    generatePayload: () => {
      const data = generateRegisterLandlordData()
      delete data.people.person_postcode
      return data
    },
  },

  {
    id: 'negative-missing-people-object',
    name: 'Negative: Missing people Object',
    description: 'Request body missing the people object entirely',
    type: 'negative',
    expectedStatus: 400,
    generatePayload: () => ({}),
  },

  // NEGATIVE TESTS - Invalid Data Formats
  {
    id: 'negative-invalid-nrla-id-format',
    name: 'Negative: Invalid NRLA ID Format',
    description: 'Attempt to register with malformed NRLA ID (not RLA-XXXXX-XX format)',
    type: 'negative',
    expectedStatus: 400,
    generatePayload: () => {
      const data = generateRegisterLandlordData()
      data.people.nrla_id = 'INVALID-ID'
      return data
    },
  },

  {
    id: 'negative-invalid-email-format',
    name: 'Negative: Invalid Email Format',
    description: 'Attempt to register landlord with invalid email format',
    type: 'negative',
    expectedStatus: 400,
    generatePayload: () => {
      const data = generateRegisterLandlordData()
      data.people.person_email = 'invalid-email'
      return data
    },
  },

  {
    id: 'negative-invalid-postcode',
    name: 'Negative: Invalid UK Postcode',
    description: 'Attempt to register landlord with invalid UK postcode',
    type: 'negative',
    expectedStatus: 400,
    generatePayload: () => {
      const data = generateRegisterLandlordData()
      data.people.person_postcode = 'INVALID'
      return data
    },
  },

  {
    id: 'negative-invalid-classification',
    name: 'Negative: Invalid Classification',
    description: 'Attempt to register with classification other than "Primary Landlord"',
    type: 'negative',
    expectedStatus: 400,
    generatePayload: () => {
      const data = generateRegisterLandlordData()
      data.people.person_classification = 'Tenant'
      return data
    },
  },

  {
    id: 'negative-invalid-phone-format',
    name: 'Negative: Invalid Phone Format',
    description: 'Attempt to register landlord with invalid phone number',
    type: 'negative',
    expectedStatus: 400,
    generatePayload: () => {
      const data = generateRegisterLandlordData()
      data.people.person_phone = 'not-a-phone'
      return data
    },
  },

  // NEGATIVE TESTS - Duplicate/Existing Records
  {
    id: 'negative-duplicate-nrla-id',
    name: 'Negative: Duplicate NRLA ID',
    description: 'Attempt to register a landlord with an NRLA ID that already exists',
    type: 'negative',
    expectedStatus: 400,
    generatePayload: () => {
      const data = generateRegisterLandlordData()
      // Use a known existing NRLA ID - this will need to be populated with a real one during testing
      data.people.nrla_id = 'RLA-00001-AA'
      return data
    },
  },

  // SECURITY TESTS
  {
    id: 'negative-sql-injection-nrla-id',
    name: 'Negative: SQL Injection in NRLA ID',
    description: 'Security test - attempt SQL injection in nrla_id field',
    type: 'negative',
    expectedStatus: 400,
    generatePayload: () => {
      const data = generateRegisterLandlordData()
      data.people.nrla_id = "RLA' OR '1'='1"
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
      const data = generateRegisterLandlordData()
      data.people.person_firstname = '<script>alert("xss")</script>'
      return data
    },
  },
]
