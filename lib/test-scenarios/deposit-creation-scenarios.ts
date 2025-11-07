/**
 * Test scenarios for Deposit Creation endpoint
 * Based on actual API validation discovery
 */

import { generateDepositCreationData } from '../test-data-generator'

export interface TestScenario {
  id: string
  name: string
  description: string
  type: 'positive' | 'negative'
  expectedStatus: number
  generatePayload: () => any
}

export const depositCreationScenarios: TestScenario[] = [
  // POSITIVE TESTS
  {
    id: 'positive-full',
    name: 'Positive: Full Valid Data',
    description: 'Test with all fields populated and valid',
    type: 'positive',
    expectedStatus: 201,
    generatePayload: () => generateDepositCreationData()
  },

  {
    id: 'positive-minimal',
    name: 'Positive: Minimal Required Fields',
    description: 'Only required fields, optional fields omitted',
    type: 'positive',
    expectedStatus: 201,
    generatePayload: () => {
      const data = generateDepositCreationData()
      // Remove optional fields
      delete data.tenancy.property_id
      delete data.tenancy.deposit_reference
      data.tenancy.people = data.tenancy.people.map((person: any) => {
        const minimal = { ...person }
        delete minimal.person_email
        delete minimal.person_saon
        if (minimal.is_business === 'FALSE') {
          delete minimal.business_name
        }
        return minimal
      })
      return data
    }
  },

  // NEGATIVE TESTS - Missing Required Fields
  {
    id: 'negative-missing-user-tenancy-ref',
    name: 'Negative: Missing user_tenancy_reference',
    description: 'Required field user_tenancy_reference is missing',
    type: 'negative',
    expectedStatus: 400,
    generatePayload: () => {
      const data = generateDepositCreationData()
      delete data.tenancy.user_tenancy_reference
      return data
    }
  },

  {
    id: 'negative-missing-deposit-amount',
    name: 'Negative: Missing deposit_amount',
    description: 'Required field deposit_amount is missing',
    type: 'negative',
    expectedStatus: 400,
    generatePayload: () => {
      const data = generateDepositCreationData()
      delete data.tenancy.deposit_amount
      return data
    }
  },

  {
    id: 'negative-missing-tenancy-start-date',
    name: 'Negative: Missing tenancy_start_date',
    description: 'Required field tenancy_start_date is missing',
    type: 'negative',
    expectedStatus: 400,
    generatePayload: () => {
      const data = generateDepositCreationData()
      delete data.tenancy.tenancy_start_date
      return data
    }
  },

  {
    id: 'negative-missing-property-postcode',
    name: 'Negative: Missing property_postcode',
    description: 'Required field property_postcode is missing',
    type: 'negative',
    expectedStatus: 400,
    generatePayload: () => {
      const data = generateDepositCreationData()
      delete data.tenancy.property_postcode
      return data
    }
  },

  {
    id: 'negative-missing-person-firstname',
    name: 'Negative: Missing person_firstname',
    description: 'Required field person_firstname is missing for tenant',
    type: 'negative',
    expectedStatus: 400,
    generatePayload: () => {
      const data = generateDepositCreationData()
      delete data.tenancy.people[0].person_firstname
      return data
    }
  },

  {
    id: 'negative-missing-person-surname',
    name: 'Negative: Missing person_surname',
    description: 'Required field person_surname is missing for tenant',
    type: 'negative',
    expectedStatus: 400,
    generatePayload: () => {
      const data = generateDepositCreationData()
      delete data.tenancy.people[0].person_surname
      return data
    }
  },

  // NEGATIVE TESTS - People/Entity Validation
  {
    id: 'negative-no-tenants',
    name: 'Negative: No Tenants',
    description: 'People array contains no tenants',
    type: 'negative',
    expectedStatus: 400,
    generatePayload: () => {
      const data = generateDepositCreationData()
      data.tenancy.people = data.tenancy.people.filter(
        (p: any) => p.person_classification !== 'Tenant'
      )
      data.tenancy.number_of_tenants = '0'
      return data
    }
  },

  {
    id: 'negative-no-landlords',
    name: 'Negative: No Landlords',
    description: 'People array contains no landlords',
    type: 'negative',
    expectedStatus: 400,
    generatePayload: () => {
      const data = generateDepositCreationData()
      data.tenancy.people = data.tenancy.people.filter(
        (p: any) => !p.person_classification.includes('Landlord')
      )
      data.tenancy.number_of_landlords = '0'
      return data
    }
  },

  {
    id: 'negative-count-mismatch-tenants',
    name: 'Negative: Tenant Count Mismatch',
    description: 'number_of_tenants does not match actual tenant count',
    type: 'negative',
    expectedStatus: 400,
    generatePayload: () => {
      const data = generateDepositCreationData()
      data.tenancy.number_of_tenants = '99'
      return data
    }
  },

  {
    id: 'negative-count-mismatch-landlords',
    name: 'Negative: Landlord Count Mismatch',
    description: 'number_of_landlords does not match actual landlord count',
    type: 'negative',
    expectedStatus: 400,
    generatePayload: () => {
      const data = generateDepositCreationData()
      data.tenancy.number_of_landlords = '99'
      return data
    }
  },

  // NEGATIVE TESTS - Date Validation
  {
    id: 'negative-invalid-date-format',
    name: 'Negative: Invalid Date Format',
    description: 'Date in YYYY-MM-DD format instead of DD-MM-YYYY',
    type: 'negative',
    expectedStatus: 400,
    generatePayload: () => {
      const data = generateDepositCreationData()
      data.tenancy.tenancy_start_date = '2026-02-10'
      return data
    }
  },

  {
    id: 'negative-end-before-start',
    name: 'Negative: End Date Before Start',
    description: 'tenancy_expected_end_date is before tenancy_start_date',
    type: 'negative',
    expectedStatus: 400,
    generatePayload: () => {
      const data = generateDepositCreationData()
      data.tenancy.tenancy_expected_end_date = '01-01-2020'
      return data
    }
  },

  {
    id: 'negative-deposit-received-future',
    name: 'Negative: Deposit Received in Future',
    description: 'deposit_received_date is in the future',
    type: 'negative',
    expectedStatus: 400,
    generatePayload: () => {
      const data = generateDepositCreationData()
      data.tenancy.deposit_received_date = '01-01-2030'
      return data
    }
  },

  // NEGATIVE TESTS - Amount Validation
  {
    id: 'negative-negative-amount',
    name: 'Negative: Negative Amount',
    description: 'deposit_amount is negative',
    type: 'negative',
    expectedStatus: 400,
    generatePayload: () => {
      const data = generateDepositCreationData()
      data.tenancy.deposit_amount = '-500'
      return data
    }
  },

  {
    id: 'negative-zero-amount',
    name: 'Negative: Zero Amount',
    description: 'deposit_amount is zero',
    type: 'negative',
    expectedStatus: 400,
    generatePayload: () => {
      const data = generateDepositCreationData()
      data.tenancy.deposit_amount = '0'
      data.tenancy.deposit_amount_to_protect = '0'
      return data
    }
  },

  {
    id: 'negative-non-numeric-amount',
    name: 'Negative: Non-Numeric Amount',
    description: 'deposit_amount contains non-numeric characters',
    type: 'negative',
    expectedStatus: 400,
    generatePayload: () => {
      const data = generateDepositCreationData()
      data.tenancy.deposit_amount = 'abc123'
      return data
    }
  },

  // NEGATIVE TESTS - Other Field Validation
  {
    id: 'negative-invalid-furnished-status',
    name: 'Negative: Invalid furnished_status',
    description: 'furnished_status has invalid value (not true/false)',
    type: 'negative',
    expectedStatus: 400,
    generatePayload: () => {
      const data = generateDepositCreationData()
      data.tenancy.furnished_status = 'yes'
      return data
    }
  },

  {
    id: 'negative-invalid-email',
    name: 'Negative: Invalid Email Format',
    description: 'person_email has invalid email format',
    type: 'negative',
    expectedStatus: 409,
    generatePayload: () => {
      const data = generateDepositCreationData()
      data.tenancy.people[0].person_email = 'not-a-valid-email'
      return data
    }
  },

  {
    id: 'negative-very-long-string',
    name: 'Negative: String Too Long',
    description: 'property_street exceeds maximum length',
    type: 'negative',
    expectedStatus: 400,
    generatePayload: () => {
      const data = generateDepositCreationData()
      data.tenancy.property_street = 'A'.repeat(500)
      return data
    }
  },

  {
    id: 'negative-duplicate-reference',
    name: 'Negative: Duplicate Reference',
    description: 'user_tenancy_reference already exists',
    type: 'negative',
    expectedStatus: 409,
    generatePayload: () => {
      // This will use a fixed reference that should already exist (no special characters)
      const data = generateDepositCreationData()
      data.tenancy.user_tenancy_reference = 'DUPLICATETESTREF'
      return data
    }
  }
]
