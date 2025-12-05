/**
 * Test scenarios for Register Landlord (NRLA) endpoint
 * This endpoint registers a new landlord/client with NRLA membership details
 *
 * Required fields: person_title, person_firstname, person_lastname, person_email,
 *                  person_mobile, person_street, person_city, person_postcode
 * person_pr_sector should always be true
 */

import { generateRegisterLandlordData } from '../test-data-generator'

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
    description: 'Register a new landlord with valid details',
    type: 'positive',
    expectedStatus: 200,
    generatePayload: () => generateRegisterLandlordData(),
  },

  {
    id: 'positive-register-business-landlord',
    name: 'Positive: Register Business Landlord',
    description: 'Register a landlord who is a business entity with all business fields',
    type: 'positive',
    expectedStatus: 200,
    generatePayload: () => ({
      people: [{
        person_title: 'Mr',
        person_firstname: 'John',
        person_lastname: 'Smith',
        person_email: 'john.smith@example.com',
        person_mobile: '07700900123',
        person_street: '123 High Street',
        person_city: 'London',
        person_postcode: 'SW1A 1AA',
        person_pr_sector: true,
        is_business: true,
        business_name: 'Smith Properties Ltd',
        tradename: 'Smith Lettings',
        companyreg: '12345678',
        business_phone: '02079876543',
      }]
    }),
  },

  {
    id: 'positive-register-individual-landlord',
    name: 'Positive: Register Individual Landlord',
    description: 'Register a landlord who is an individual (not a business)',
    type: 'positive',
    expectedStatus: 200,
    generatePayload: () => ({
      people: [{
        person_title: 'Mrs',
        person_firstname: 'Jane',
        person_lastname: 'Doe',
        person_email: 'jane.doe@example.com',
        person_mobile: '07700900456',
        person_street: '456 Oak Lane',
        person_city: 'Manchester',
        person_postcode: 'M1 1AA',
        person_pr_sector: true,
      }]
    }),
  },

  {
    id: 'positive-all-optional-fields',
    name: 'Positive: All Optional Fields',
    description: 'Register landlord with all optional fields populated',
    type: 'positive',
    expectedStatus: 200,
    generatePayload: () => ({
      people: [{
        person_title: 'Mr',
        person_firstname: 'John',
        person_lastname: 'Smith',
        person_email: 'john.smith@example.com',
        person_additional_email: 'john.alt@example.com',
        person_mobile: '07700900123',
        person_telephone: '02071234567',
        person_street: '123 High Street',
        person_city: 'London',
        person_postcode: 'SW1A 1AA',
        person_county: 'Greater London',
        person_correspondence_street: '456 Business Park',
        person_correspondence_city: 'Manchester',
        person_correspondence_postcode: 'M1 1AA',
        person_correspondence_county: 'Greater Manchester',
        person_pr_sector: true,
        is_business: true,
        business_name: 'Smith Properties Ltd',
        tradename: 'Smith Lettings',
        companyreg: '12345678',
        business_phone: '02079876543',
      }]
    }),
  },

  {
    id: 'positive-with-correspondence-address',
    name: 'Positive: With Correspondence Address',
    description: 'Register landlord with separate correspondence address',
    type: 'positive',
    expectedStatus: 200,
    generatePayload: () => ({
      people: [{
        person_title: 'Ms',
        person_firstname: 'Sarah',
        person_lastname: 'Johnson',
        person_email: 'sarah.johnson@example.com',
        person_mobile: '07700900789',
        person_street: '789 Main Road',
        person_city: 'Birmingham',
        person_postcode: 'B1 1AA',
        person_correspondence_street: '100 Office Street',
        person_correspondence_city: 'Leeds',
        person_correspondence_postcode: 'LS1 1AA',
        person_correspondence_county: 'West Yorkshire',
        person_pr_sector: true,
      }]
    }),
  },

  // NEGATIVE TESTS - Missing Required Fields
  {
    id: 'negative-missing-title',
    name: 'Negative: Missing Title',
    description: 'Attempt to register landlord without person_title',
    type: 'negative',
    expectedStatus: 400,
    generatePayload: () => {
      const data = generateRegisterLandlordData() as any
      delete data.people[0].person_title
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
      const data = generateRegisterLandlordData() as any
      delete data.people[0].person_firstname
      return data
    },
  },

  {
    id: 'negative-missing-lastname',
    name: 'Negative: Missing Last Name',
    description: 'Attempt to register landlord without person_lastname',
    type: 'negative',
    expectedStatus: 400,
    generatePayload: () => {
      const data = generateRegisterLandlordData() as any
      delete data.people[0].person_lastname
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
      const data = generateRegisterLandlordData() as any
      delete data.people[0].person_email
      return data
    },
  },

  {
    id: 'negative-missing-mobile',
    name: 'Negative: Missing Mobile',
    description: 'Attempt to register landlord without person_mobile',
    type: 'negative',
    expectedStatus: 400,
    generatePayload: () => {
      const data = generateRegisterLandlordData() as any
      delete data.people[0].person_mobile
      return data
    },
  },

  {
    id: 'negative-missing-street',
    name: 'Negative: Missing Street',
    description: 'Attempt to register landlord without person_street',
    type: 'negative',
    expectedStatus: 400,
    generatePayload: () => {
      const data = generateRegisterLandlordData() as any
      delete data.people[0].person_street
      return data
    },
  },

  {
    id: 'negative-missing-city',
    name: 'Negative: Missing City',
    description: 'Attempt to register landlord without person_city',
    type: 'negative',
    expectedStatus: 400,
    generatePayload: () => {
      const data = generateRegisterLandlordData() as any
      delete data.people[0].person_city
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
      const data = generateRegisterLandlordData() as any
      delete data.people[0].person_postcode
      return data
    },
  },

  {
    id: 'negative-missing-people-array',
    name: 'Negative: Missing people Array',
    description: 'Request body missing the people array entirely',
    type: 'negative',
    expectedStatus: 400,
    generatePayload: () => ({}),
  },

  {
    id: 'negative-empty-people-array',
    name: 'Negative: Empty people Array',
    description: 'Request body with empty people array',
    type: 'negative',
    expectedStatus: 400,
    generatePayload: () => ({ people: [] }),
  },

  // NEGATIVE TESTS - Business Fields Missing When is_business=true
  {
    id: 'negative-business-missing-business-name',
    name: 'Negative: Business Missing business_name',
    description: 'Business landlord without required business_name field',
    type: 'negative',
    expectedStatus: 400,
    generatePayload: () => ({
      people: [{
        person_title: 'Mr',
        person_firstname: 'John',
        person_lastname: 'Smith',
        person_email: 'john@example.com',
        person_mobile: '07700900123',
        person_street: '123 High Street',
        person_city: 'London',
        person_postcode: 'SW1A 1AA',
        person_pr_sector: true,
        is_business: true,
        tradename: 'Smith Lettings',
        companyreg: '12345678',
        business_phone: '02079876543',
      }]
    }),
  },

  {
    id: 'negative-business-missing-tradename',
    name: 'Negative: Business Missing tradename',
    description: 'Business landlord without required tradename field',
    type: 'negative',
    expectedStatus: 400,
    generatePayload: () => ({
      people: [{
        person_title: 'Mr',
        person_firstname: 'John',
        person_lastname: 'Smith',
        person_email: 'john@example.com',
        person_mobile: '07700900123',
        person_street: '123 High Street',
        person_city: 'London',
        person_postcode: 'SW1A 1AA',
        person_pr_sector: true,
        is_business: true,
        business_name: 'Smith Properties Ltd',
        companyreg: '12345678',
        business_phone: '02079876543',
      }]
    }),
  },

  {
    id: 'negative-business-missing-companyreg',
    name: 'Negative: Business Missing companyreg',
    description: 'Business landlord without required companyreg field',
    type: 'negative',
    expectedStatus: 400,
    generatePayload: () => ({
      people: [{
        person_title: 'Mr',
        person_firstname: 'John',
        person_lastname: 'Smith',
        person_email: 'john@example.com',
        person_mobile: '07700900123',
        person_street: '123 High Street',
        person_city: 'London',
        person_postcode: 'SW1A 1AA',
        person_pr_sector: true,
        is_business: true,
        business_name: 'Smith Properties Ltd',
        tradename: 'Smith Lettings',
        business_phone: '02079876543',
      }]
    }),
  },

  {
    id: 'negative-business-missing-business-phone',
    name: 'Negative: Business Missing business_phone',
    description: 'Business landlord without required business_phone field',
    type: 'negative',
    expectedStatus: 400,
    generatePayload: () => ({
      people: [{
        person_title: 'Mr',
        person_firstname: 'John',
        person_lastname: 'Smith',
        person_email: 'john@example.com',
        person_mobile: '07700900123',
        person_street: '123 High Street',
        person_city: 'London',
        person_postcode: 'SW1A 1AA',
        person_pr_sector: true,
        is_business: true,
        business_name: 'Smith Properties Ltd',
        tradename: 'Smith Lettings',
        companyreg: '12345678',
      }]
    }),
  },

  // NEGATIVE TESTS - Invalid Data Formats
  {
    id: 'negative-invalid-email-format',
    name: 'Negative: Invalid Email Format',
    description: 'Attempt to register landlord with invalid email format',
    type: 'negative',
    expectedStatus: 400,
    generatePayload: () => {
      const data = generateRegisterLandlordData() as any
      data.people[0].person_email = 'invalid-email'
      return data
    },
  },

  {
    id: 'negative-invalid-additional-email-format',
    name: 'Negative: Invalid Additional Email Format',
    description: 'Attempt to register with invalid additional email format',
    type: 'negative',
    expectedStatus: 400,
    generatePayload: () => {
      const data = generateRegisterLandlordData() as any
      data.people[0].person_additional_email = 'not-an-email'
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
      const data = generateRegisterLandlordData() as any
      data.people[0].person_postcode = 'INVALID'
      return data
    },
  },

  {
    id: 'negative-invalid-mobile-format',
    name: 'Negative: Invalid Mobile Format',
    description: 'Attempt to register landlord with invalid mobile number',
    type: 'negative',
    expectedStatus: 400,
    generatePayload: () => {
      const data = generateRegisterLandlordData() as any
      data.people[0].person_mobile = 'not-a-phone'
      return data
    },
  },

  {
    id: 'negative-invalid-telephone-format',
    name: 'Negative: Invalid Telephone Format',
    description: 'Attempt to register landlord with invalid telephone number',
    type: 'negative',
    expectedStatus: 400,
    generatePayload: () => {
      const data = generateRegisterLandlordData() as any
      data.people[0].person_telephone = '12345'
      return data
    },
  },

  {
    id: 'negative-invalid-companyreg-format',
    name: 'Negative: Invalid Company Registration',
    description: 'Attempt to register with invalid company registration number',
    type: 'negative',
    expectedStatus: 400,
    generatePayload: () => ({
      people: [{
        person_title: 'Mr',
        person_firstname: 'John',
        person_lastname: 'Smith',
        person_email: 'john@example.com',
        person_mobile: '07700900123',
        person_street: '123 High Street',
        person_city: 'London',
        person_postcode: 'SW1A 1AA',
        person_pr_sector: true,
        is_business: true,
        business_name: 'Smith Properties Ltd',
        tradename: 'Smith Lettings',
        companyreg: 'ABC', // Should be 8 digits
        business_phone: '02079876543',
      }]
    }),
  },

  // SECURITY TESTS
  {
    id: 'negative-sql-injection-name',
    name: 'Negative: SQL Injection in Name',
    description: 'Security test - attempt SQL injection in name field',
    type: 'negative',
    expectedStatus: 400,
    generatePayload: () => {
      const data = generateRegisterLandlordData() as any
      data.people[0].person_firstname = "John' OR '1'='1"
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
      const data = generateRegisterLandlordData() as any
      data.people[0].person_firstname = '<script>alert("xss")</script>'
      return data
    },
  },

  {
    id: 'negative-xss-attempt-email',
    name: 'Negative: XSS Attempt in Email',
    description: 'Security test - attempt XSS injection in email field',
    type: 'negative',
    expectedStatus: 400,
    generatePayload: () => {
      const data = generateRegisterLandlordData() as any
      data.people[0].person_email = '<script>alert("xss")</script>@test.com'
      return data
    },
  },
]
