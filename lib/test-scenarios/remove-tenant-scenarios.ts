/**
 * Test scenarios for Remove Tenant endpoint (NRLA)
 * This endpoint removes a tenant from an existing deposit
 *
 * Updated payload format matches Add Tenant endpoint
 * Mandatory fields: person_classification, person_firstname, person_surname,
 * and one of person_email/person_mobile/person_phone (in that priority order)
 */

import { generateRemoveTenantData } from '../test-data-generator'
import { faker } from '@faker-js/faker'

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

// Helper to generate UK postcode
function generateUKPostcode(): string {
  const areas = ['B', 'HP', 'LU', 'HX']
  const area = faker.helpers.arrayElement(areas)
  const district = faker.number.int({ min: 1, max: 99 })
  const sector = faker.number.int({ min: 0, max: 9 })
  const unit = faker.string.alpha({ length: 2, casing: 'upper' })
  return `${area}${district} ${sector}${unit}`
}

// Helper to generate a minimal valid tenant payload
function generateMinimalTenantPayload() {
  return {
    people: [
      {
        person_classification: 'Tenant',
        person_firstname: faker.person.firstName(),
        person_surname: faker.person.lastName(),
        person_email: faker.internet.email(),
      }
    ]
  }
}

export const removeTenantScenarios: TestScenario[] = [
  // POSITIVE TESTS
  {
    id: 'positive-remove-single-tenant',
    name: 'Positive: Remove Single Tenant',
    description: 'Remove one tenant from an existing deposit with full tenant details',
    type: 'positive',
    expectedStatus: 200,
    generatePayload: () => {
      const data = generateRemoveTenantData()
      // Ensure only 1 tenant
      data.people = data.people.slice(0, 1)
      return data
    },
  },

  {
    id: 'positive-remove-multiple-tenants',
    name: 'Positive: Remove Multiple Tenants',
    description: 'Remove multiple tenants from an existing deposit',
    type: 'positive',
    expectedStatus: 200,
    generatePayload: () => generateRemoveTenantData(),
  },

  {
    id: 'positive-minimal-fields',
    name: 'Positive: Minimal Required Fields',
    description: 'Remove tenant with only mandatory fields (classification, firstname, surname, email)',
    type: 'positive',
    expectedStatus: 200,
    generatePayload: () => generateMinimalTenantPayload(),
  },

  {
    id: 'positive-with-mobile-only',
    name: 'Positive: Contact via Mobile Only',
    description: 'Remove tenant with person_mobile as the only contact method',
    type: 'positive',
    expectedStatus: 200,
    generatePayload: () => ({
      people: [
        {
          person_classification: 'Tenant',
          person_firstname: faker.person.firstName(),
          person_surname: faker.person.lastName(),
          person_mobile: `07${faker.string.numeric(9)}`,
        }
      ]
    }),
  },

  {
    id: 'positive-with-phone-only',
    name: 'Positive: Contact via Phone Only',
    description: 'Remove tenant with person_phone as the only contact method',
    type: 'positive',
    expectedStatus: 200,
    generatePayload: () => ({
      people: [
        {
          person_classification: 'Tenant',
          person_firstname: faker.person.firstName(),
          person_surname: faker.person.lastName(),
          person_phone: `01${faker.string.numeric(9)}`,
        }
      ]
    }),
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
    id: 'negative-missing-classification',
    name: 'Negative: Missing person_classification',
    description: 'Person object missing the required person_classification field',
    type: 'negative',
    expectedStatus: 400,
    generatePayload: () => ({
      people: [
        {
          person_firstname: faker.person.firstName(),
          person_surname: faker.person.lastName(),
          person_email: faker.internet.email(),
        }
      ]
    }),
  },

  {
    id: 'negative-missing-firstname',
    name: 'Negative: Missing person_firstname',
    description: 'Person object missing the required person_firstname field',
    type: 'negative',
    expectedStatus: 400,
    generatePayload: () => ({
      people: [
        {
          person_classification: 'Tenant',
          person_surname: faker.person.lastName(),
          person_email: faker.internet.email(),
        }
      ]
    }),
  },

  {
    id: 'negative-missing-surname',
    name: 'Negative: Missing person_surname',
    description: 'Person object missing the required person_surname field',
    type: 'negative',
    expectedStatus: 400,
    generatePayload: () => ({
      people: [
        {
          person_classification: 'Tenant',
          person_firstname: faker.person.firstName(),
          person_email: faker.internet.email(),
        }
      ]
    }),
  },

  {
    id: 'negative-missing-contact-info',
    name: 'Negative: Missing All Contact Info',
    description: 'Person object missing all contact fields (email, mobile, phone)',
    type: 'negative',
    expectedStatus: 400,
    generatePayload: () => ({
      people: [
        {
          person_classification: 'Tenant',
          person_firstname: faker.person.firstName(),
          person_surname: faker.person.lastName(),
        }
      ]
    }),
  },

  // NEGATIVE TESTS - Invalid Field Values
  {
    id: 'negative-invalid-classification',
    name: 'Negative: Invalid person_classification',
    description: 'Person classification is not "Tenant"',
    type: 'negative',
    expectedStatus: 400,
    generatePayload: () => ({
      people: [
        {
          person_classification: 'Landlord',
          person_firstname: faker.person.firstName(),
          person_surname: faker.person.lastName(),
          person_email: faker.internet.email(),
        }
      ]
    }),
  },

  {
    id: 'negative-empty-firstname',
    name: 'Negative: Empty person_firstname',
    description: 'person_firstname field is empty string',
    type: 'negative',
    expectedStatus: 400,
    generatePayload: () => ({
      people: [
        {
          person_classification: 'Tenant',
          person_firstname: '',
          person_surname: faker.person.lastName(),
          person_email: faker.internet.email(),
        }
      ]
    }),
  },

  {
    id: 'negative-empty-surname',
    name: 'Negative: Empty person_surname',
    description: 'person_surname field is empty string',
    type: 'negative',
    expectedStatus: 400,
    generatePayload: () => ({
      people: [
        {
          person_classification: 'Tenant',
          person_firstname: faker.person.firstName(),
          person_surname: '',
          person_email: faker.internet.email(),
        }
      ]
    }),
  },

  {
    id: 'negative-invalid-email-format',
    name: 'Negative: Invalid Email Format',
    description: 'person_email has invalid format',
    type: 'negative',
    expectedStatus: 400,
    generatePayload: () => ({
      people: [
        {
          person_classification: 'Tenant',
          person_firstname: faker.person.firstName(),
          person_surname: faker.person.lastName(),
          person_email: 'invalid-email',
        }
      ]
    }),
  },

  {
    id: 'negative-invalid-mobile-format',
    name: 'Negative: Invalid Mobile Format',
    description: 'person_mobile has invalid format',
    type: 'negative',
    expectedStatus: 400,
    generatePayload: () => ({
      people: [
        {
          person_classification: 'Tenant',
          person_firstname: faker.person.firstName(),
          person_surname: faker.person.lastName(),
          person_mobile: 'not-a-number',
        }
      ]
    }),
  },

  // NEGATIVE TESTS - Invalid DAN
  {
    id: 'negative-invalid-credentials',
    name: 'Negative: Invalid Credentials',
    description: 'Attempt to remove tenant using wrong credentials from another organization',
    type: 'negative',
    expectedStatus: 403,
    requiresDifferentCredential: true,
    generatePayload: () => generateRemoveTenantData(),
  },

  {
    id: 'negative-non-existent-dan',
    name: 'Negative: Non-existent DAN',
    description: 'Attempt to remove tenant from a deposit that does not exist',
    type: 'negative',
    expectedStatus: 404,
    pathParam: 'EWI99999999',
    generatePayload: () => generateRemoveTenantData(),
  },

  {
    id: 'negative-invalid-dan-format',
    name: 'Negative: Invalid DAN Format',
    description: 'Attempt to remove tenant with malformed DAN (special characters)',
    type: 'negative',
    expectedStatus: 400,
    pathParam: 'INVALID@#$%',
    generatePayload: () => generateRemoveTenantData(),
  },

  {
    id: 'negative-empty-dan',
    name: 'Negative: Empty DAN',
    description: 'Attempt to remove tenant with empty DAN parameter',
    type: 'negative',
    expectedStatus: 400,
    pathParam: '',
    generatePayload: () => generateRemoveTenantData(),
  },

  // NEGATIVE TESTS - Business Logic
  {
    id: 'negative-tenant-not-found',
    name: 'Negative: Tenant Not Found on Deposit',
    description: 'Attempt to remove a tenant that does not exist on the specified deposit',
    type: 'negative',
    expectedStatus: 404,
    generatePayload: () => ({
      people: [
        {
          person_classification: 'Tenant',
          person_firstname: 'NonExistent',
          person_surname: 'Person',
          person_email: 'nonexistent@example.com',
        }
      ]
    }),
  },

  {
    id: 'negative-last-tenant',
    name: 'Negative: Remove Last Tenant',
    description: 'Attempt to remove the only/last tenant from a deposit',
    type: 'negative',
    expectedStatus: 400,
    generatePayload: () => generateRemoveTenantData(),
    // Note: Deposit must have at least one tenant, cannot remove the last one
  },

  // SECURITY TESTS
  {
    id: 'negative-sql-injection-dan',
    name: 'Negative: SQL Injection in DAN',
    description: 'Security test - attempt SQL injection in DAN parameter',
    type: 'negative',
    expectedStatus: 400,
    pathParam: "EWI' OR '1'='1",
    generatePayload: () => generateRemoveTenantData(),
  },

  {
    id: 'negative-sql-injection-name',
    name: 'Negative: SQL Injection in Name',
    description: 'Security test - attempt SQL injection in person_firstname field',
    type: 'negative',
    expectedStatus: 400,
    generatePayload: () => ({
      people: [
        {
          person_classification: 'Tenant',
          person_firstname: "Robert'; DROP TABLE Tenants;--",
          person_surname: faker.person.lastName(),
          person_email: faker.internet.email(),
        }
      ]
    }),
  },

  {
    id: 'negative-xss-injection',
    name: 'Negative: XSS Injection in Name',
    description: 'Security test - attempt XSS injection in person_firstname',
    type: 'negative',
    expectedStatus: 400,
    generatePayload: () => ({
      people: [
        {
          person_classification: 'Tenant',
          person_firstname: '<script>alert("xss")</script>',
          person_surname: faker.person.lastName(),
          person_email: faker.internet.email(),
        }
      ]
    }),
  },
]
