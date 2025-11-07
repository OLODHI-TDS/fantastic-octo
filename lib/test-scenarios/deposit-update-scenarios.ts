/**
 * Test scenarios for Deposit Update endpoint
 * Based on API documentation:
 * - Can only update deposits in "Registered (not paid)" status
 * - IMPORTANT: Requires FULL original payload + DAN number (not partial objects)
 * - All tests must include complete creation payload with modified fields
 */

export interface TestScenario {
  id: string
  name: string
  description: string
  type: 'positive' | 'negative'
  expectedStatus: number
  requiresCreationPayload?: boolean
  modifyPayload?: (payload: any) => any
}

export const depositUpdateScenarios: TestScenario[] = [
  // POSITIVE TESTS
  {
    id: 'positive-full-update',
    name: 'Positive: Full Update',
    description: 'Update all fields of an existing deposit',
    type: 'positive',
    expectedStatus: 200,
    requiresCreationPayload: true,
    // Note: Uses creation payload as-is, updates all fields
  },

  {
    id: 'positive-update-property',
    name: 'Positive: Update Property Details',
    description: 'Update property street and town (full payload required)',
    type: 'positive',
    expectedStatus: 200,
    requiresCreationPayload: true,
    modifyPayload: (payload: any) => {
      const updated = JSON.parse(JSON.stringify(payload))
      // Keep all fields, just update specific property fields
      updated.tenancy.property_street = 'Updated Street Name'
      updated.tenancy.property_town = 'Updated Town'
      return updated
    }
  },

  {
    id: 'positive-update-dates',
    name: 'Positive: Update Dates',
    description: 'Update tenancy start and end dates (full payload required)',
    type: 'positive',
    expectedStatus: 200,
    requiresCreationPayload: true,
    modifyPayload: (payload: any) => {
      const updated = JSON.parse(JSON.stringify(payload))
      // Keep all fields, just update dates (must be in DD-MM-YYYY format)
      const newStart = new Date()
      newStart.setMonth(newStart.getMonth() + 1)
      const newEnd = new Date(newStart)
      newEnd.setFullYear(newEnd.getFullYear() + 1)
      updated.tenancy.tenancy_start_date = newStart.toLocaleDateString('en-GB', {
        day: '2-digit', month: '2-digit', year: 'numeric'
      }).replace(/\//g, '-')
      updated.tenancy.tenancy_expected_end_date = newEnd.toLocaleDateString('en-GB', {
        day: '2-digit', month: '2-digit', year: 'numeric'
      }).replace(/\//g, '-')
      return updated
    }
  },

  {
    id: 'positive-update-amount',
    name: 'Positive: Update Deposit Amount',
    description: 'Update deposit amount and amount to protect (full payload required)',
    type: 'positive',
    expectedStatus: 200,
    requiresCreationPayload: true,
    modifyPayload: (payload: any) => {
      const updated = JSON.parse(JSON.stringify(payload))
      // Keep all fields, just increase deposit amount by 500
      const currentAmount = parseInt(updated.tenancy.deposit_amount)
      const newAmount = currentAmount + 500
      updated.tenancy.deposit_amount = newAmount.toString()
      updated.tenancy.deposit_amount_to_protect = newAmount.toString()
      return updated
    }
  },

  // NEGATIVE TESTS
  {
    id: 'negative-non-existent-reference',
    name: 'Negative: Non-existent Reference',
    description: 'Try to update a deposit with a user_tenancy_reference that does not exist',
    type: 'negative',
    expectedStatus: 404,
    requiresCreationPayload: true,
    modifyPayload: (payload: any) => {
      const updated = JSON.parse(JSON.stringify(payload))
      // Use a reference that doesn't exist (keep all other fields)
      updated.tenancy.user_tenancy_reference = 'NONEXISTENT999'
      return updated
    }
  },

  {
    id: 'negative-invalid-date-format',
    name: 'Negative: Invalid Date Format',
    description: 'Update with incorrect date format (YYYY-MM-DD instead of DD-MM-YYYY)',
    type: 'negative',
    expectedStatus: 400,
    requiresCreationPayload: true,
    modifyPayload: (payload: any) => {
      const updated = JSON.parse(JSON.stringify(payload))
      // Wrong date format (keep all other fields)
      updated.tenancy.tenancy_start_date = '2026-12-25'
      return updated
    }
  },

  {
    id: 'negative-end-before-start',
    name: 'Negative: End Date Before Start Date',
    description: 'Update with tenancy_expected_end_date before tenancy_start_date',
    type: 'negative',
    expectedStatus: 400,
    requiresCreationPayload: true,
    modifyPayload: (payload: any) => {
      const updated = JSON.parse(JSON.stringify(payload))
      // End date before start date (keep all other fields)
      updated.tenancy.tenancy_expected_end_date = '01-01-2020'
      return updated
    }
  },

  {
    id: 'negative-negative-amount',
    name: 'Negative: Negative Amount',
    description: 'Update with negative deposit_amount',
    type: 'negative',
    expectedStatus: 400,
    requiresCreationPayload: true,
    modifyPayload: (payload: any) => {
      const updated = JSON.parse(JSON.stringify(payload))
      // Negative amount (keep all other fields)
      updated.tenancy.deposit_amount = '-500'
      return updated
    }
  },

  {
    id: 'negative-zero-amount',
    name: 'Negative: Zero Amount',
    description: 'Update with zero deposit_amount',
    type: 'negative',
    expectedStatus: 400,
    requiresCreationPayload: true,
    modifyPayload: (payload: any) => {
      const updated = JSON.parse(JSON.stringify(payload))
      // Zero amount (keep all other fields)
      updated.tenancy.deposit_amount = '0'
      updated.tenancy.deposit_amount_to_protect = '0'
      return updated
    }
  },

  {
    id: 'negative-invalid-postcode',
    name: 'Negative: Invalid Postcode',
    description: 'Update with property_postcode exceeding maximum length',
    type: 'negative',
    expectedStatus: 400,
    requiresCreationPayload: true,
    modifyPayload: (payload: any) => {
      const updated = JSON.parse(JSON.stringify(payload))
      // Invalid postcode (keep all other fields)
      updated.tenancy.property_postcode = 'TOOLONGPOSTCODE123456'
      return updated
    }
  },

  {
    id: 'negative-missing-reference-fields',
    name: 'Negative: Missing Reference Fields',
    description: 'Try to update without providing user_tenancy_reference',
    type: 'negative',
    expectedStatus: 400,
    requiresCreationPayload: true,
    modifyPayload: (payload: any) => {
      const updated = JSON.parse(JSON.stringify(payload))
      // Remove reference field (keep all other fields)
      delete updated.tenancy.user_tenancy_reference
      return updated
    }
  },

  {
    id: 'negative-invalid-credential',
    name: 'Negative: Invalid Credentials',
    description: 'Try to update a deposit using wrong credential (from different org)',
    type: 'negative',
    expectedStatus: 403,
    requiresCreationPayload: true,
    // Note: This test requires running with different credentials than the creation test
    // The user should select a different credential before running this test
  },
]
