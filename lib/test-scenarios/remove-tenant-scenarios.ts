/**
 * Test scenarios for Remove Tenant endpoint (NRLA)
 * This endpoint removes a tenant from an existing deposit
 */

import { generateRemoveTenantData } from '../test-data-generator'

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

export const removeTenantScenarios: TestScenario[] = [
  // POSITIVE TESTS
  {
    id: 'positive-remove-single-tenant',
    name: 'Positive: Remove Single Tenant',
    description: 'Remove one tenant from an existing deposit',
    type: 'positive',
    expectedStatus: 200,
    generatePayload: () => {
      const data = generateRemoveTenantData()
      // Ensure only 1 tenant
      data.people = data.people.slice(0, 1)
      return data
    },
    // Note: Requires a valid DAN and person_id from an existing deposit
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
    id: 'positive-delete-flag-true',
    name: 'Positive: Delete Flag Explicitly True',
    description: 'Remove tenant with delete flag explicitly set to true (boolean)',
    type: 'positive',
    expectedStatus: 200,
    generatePayload: () => ({
      people: [
        {
          person_id: 'TENABCD1234',
          delete: true
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
    id: 'negative-missing-person-id',
    name: 'Negative: Missing person_id',
    description: 'Person object missing the required person_id field',
    type: 'negative',
    expectedStatus: 400,
    generatePayload: () => ({
      people: [
        {
          delete: true
        }
      ]
    }),
  },

  {
    id: 'negative-missing-delete-flag',
    name: 'Negative: Missing delete Flag',
    description: 'Person object missing the delete flag',
    type: 'negative',
    expectedStatus: 400,
    generatePayload: () => ({
      people: [
        {
          person_id: 'TENABCD1234'
        }
      ]
    }),
  },

  {
    id: 'negative-empty-person-id',
    name: 'Negative: Empty person_id',
    description: 'person_id field is empty string',
    type: 'negative',
    expectedStatus: 400,
    generatePayload: () => ({
      people: [
        {
          person_id: '',
          delete: true
        }
      ]
    }),
  },

  {
    id: 'negative-null-person-id',
    name: 'Negative: Null person_id',
    description: 'person_id field is null',
    type: 'negative',
    expectedStatus: 400,
    generatePayload: () => ({
      people: [
        {
          person_id: null,
          delete: true
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
    // Note: Requires a valid DAN from Credential A, running with Credential B
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

  // NEGATIVE TESTS - Invalid person_id
  {
    id: 'negative-non-existent-person-id',
    name: 'Negative: Non-existent person_id',
    description: 'Attempt to remove a person_id that does not exist on the deposit',
    type: 'negative',
    expectedStatus: 404,
    generatePayload: () => ({
      people: [
        {
          person_id: 'NONEXISTENT123',
          delete: true
        }
      ]
    }),
    // Note: Using a person_id that doesn't belong to the deposit
  },

  {
    id: 'negative-invalid-person-id-format',
    name: 'Negative: Invalid person_id Format',
    description: 'Attempt to remove tenant with malformed person_id',
    type: 'negative',
    expectedStatus: 400,
    generatePayload: () => ({
      people: [
        {
          person_id: 'INVALID@#$%',
          delete: true
        }
      ]
    }),
  },

  {
    id: 'negative-numeric-person-id',
    name: 'Negative: Numeric person_id',
    description: 'Attempt to remove tenant with numeric-only person_id',
    type: 'negative',
    expectedStatus: 400,
    generatePayload: () => ({
      people: [
        {
          person_id: '12345678',
          delete: true
        }
      ]
    }),
  },

  // NEGATIVE TESTS - Delete Flag Validation
  {
    id: 'negative-delete-flag-false',
    name: 'Negative: Delete Flag Set to False',
    description: 'Attempt to remove tenant with delete flag set to false',
    type: 'negative',
    expectedStatus: 400,
    generatePayload: () => ({
      people: [
        {
          person_id: 'TENABCD1234',
          delete: false
        }
      ]
    }),
    // Note: API might require delete to be true for removal
  },

  {
    id: 'negative-delete-flag-string',
    name: 'Negative: Delete Flag as String',
    description: 'Attempt to remove tenant with delete flag as string "true" instead of boolean',
    type: 'negative',
    expectedStatus: 400,
    generatePayload: () => ({
      people: [
        {
          person_id: 'TENABCD1234',
          delete: 'true'
        }
      ]
    }),
  },

  {
    id: 'negative-delete-flag-numeric',
    name: 'Negative: Numeric Delete Flag',
    description: 'Attempt to remove tenant with numeric delete flag (1 instead of true)',
    type: 'negative',
    expectedStatus: 400,
    generatePayload: () => ({
      people: [
        {
          person_id: 'TENABCD1234',
          delete: 1
        }
      ]
    }),
  },

  // NEGATIVE TESTS - Business Logic
  {
    id: 'negative-last-tenant',
    name: 'Negative: Remove Last Tenant',
    description: 'Attempt to remove the only/last tenant from a deposit',
    type: 'negative',
    expectedStatus: 400,
    generatePayload: () => generateRemoveTenantData(),
    // Note: Deposit must have at least one tenant, cannot remove the last one
    // Expected: 400 Bad Request with message about requiring at least one tenant
  },

  {
    id: 'negative-landlord-person-id',
    name: 'Negative: Remove Landlord Instead of Tenant',
    description: 'Attempt to remove a landlord using the remove tenant endpoint',
    type: 'negative',
    expectedStatus: 400,
    generatePayload: () => ({
      people: [
        {
          person_id: 'LLABCD1234',  // Landlord person_id
          delete: true
        }
      ]
    }),
    // Note: This endpoint should only remove tenants, not landlords
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
    id: 'negative-sql-injection-person-id',
    name: 'Negative: SQL Injection in person_id',
    description: 'Security test - attempt SQL injection in person_id field',
    type: 'negative',
    expectedStatus: 400,
    generatePayload: () => ({
      people: [
        {
          person_id: "TEN123' OR '1'='1",
          delete: true
        }
      ]
    }),
  },

  {
    id: 'negative-script-injection',
    name: 'Negative: Script Injection in person_id',
    description: 'Security test - attempt script injection in person_id',
    type: 'negative',
    expectedStatus: 400,
    generatePayload: () => ({
      people: [
        {
          person_id: '<script>alert("xss")</script>',
          delete: true
        }
      ]
    }),
  },
]
