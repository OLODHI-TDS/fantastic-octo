/**
 * Test scenarios for Repayment Request endpoint
 * POST /services/apexrest/raiserepaymentrequest/
 * Submits a repayment request against a deposit
 *
 * Requirements:
 * - Deposit must be in "Deposits held by scheme" status
 * - tenant_repayment + agent_repayment.total must equal deposit amount
 * - agent_repayment sub-categories must sum to total
 */

export interface TestScenario {
  id: string
  name: string
  description: string
  type: 'positive' | 'negative'
  expectedStatus: number
  requiresDifferentCredential?: boolean
  generatePayload?: () => any
  modifyPayload?: (payload: any) => any
}

export const repaymentRequestScenarios: TestScenario[] = [
  // POSITIVE TESTS
  {
    id: 'positive-full-to-tenant',
    name: 'Positive: Full Amount to Tenant',
    description: 'Submit repayment request with full deposit amount going to tenant, zero to agent',
    type: 'positive',
    expectedStatus: 200,
    // Note: User must select a DAN from the dropdown
    // Payload will be auto-populated with:
    // - DAN number
    // - Tenancy end date
    // - tenant_repayment = deposit amount
    // - agent_repayment.total = 0 (all sub-categories = 0)
  },

  {
    id: 'positive-mixed-split',
    name: 'Positive: Mixed Split',
    description: 'Submit repayment request with deposit split between tenant and agent',
    type: 'positive',
    expectedStatus: 200,
    modifyPayload: (payload: any) => {
      const updated = JSON.parse(JSON.stringify(payload))
      // Split the amount - 60% to tenant, 40% to agent
      const depositAmount = parseFloat(payload.tenant_repayment) + parseFloat(payload.agent_repayment.total)
      const tenantAmount = Math.floor(depositAmount * 0.6 * 100) / 100
      const agentTotal = Math.round((depositAmount - tenantAmount) * 100) / 100 // Round to 2 decimal places

      updated.tenant_repayment = tenantAmount.toString()
      updated.agent_repayment.total = agentTotal.toString()

      // Split agent amount across categories - calculate first two, then remainder for third
      const cleaning = Math.floor(agentTotal * 0.5 * 100) / 100
      const damage = Math.floor(agentTotal * 0.3 * 100) / 100
      const other = Math.round((agentTotal - cleaning - damage) * 100) / 100 // Round to 2 decimal places

      updated.agent_repayment.cleaning = cleaning.toString()
      updated.agent_repayment.damage = damage.toString()
      updated.agent_repayment.rent_arrears = "0"
      updated.agent_repayment.redecoration = "0"
      updated.agent_repayment.gardening = "0"
      updated.agent_repayment.other = other.toString()
      updated.agent_repayment.other_text = "Miscellaneous charges"

      return updated
    },
  },

  {
    id: 'positive-full-to-agent',
    name: 'Positive: Full Amount to Agent',
    description: 'Submit repayment request with full deposit amount going to agent, zero to tenant',
    type: 'positive',
    expectedStatus: 200,
    modifyPayload: (payload: any) => {
      const updated = JSON.parse(JSON.stringify(payload))
      // Move all to agent
      const depositAmount = parseFloat(payload.tenant_repayment) + parseFloat(payload.agent_repayment.total)

      updated.tenant_repayment = "0"
      updated.agent_repayment.total = depositAmount.toString()

      // Allocate to cleaning and damage - calculate cleaning, then remainder for damage
      const cleaning = Math.floor(depositAmount * 0.7 * 100) / 100
      const damage = Math.round((depositAmount - cleaning) * 100) / 100 // Round to 2 decimal places

      updated.agent_repayment.cleaning = cleaning.toString()
      updated.agent_repayment.damage = damage.toString()
      updated.agent_repayment.rent_arrears = "0"
      updated.agent_repayment.redecoration = "0"
      updated.agent_repayment.gardening = "0"
      updated.agent_repayment.other = "0"
      updated.agent_repayment.other_text = ""

      return updated
    },
  },

  // NEGATIVE TESTS - Authentication & Authorization
  {
    id: 'negative-invalid-credentials',
    name: 'Negative: Invalid Credentials',
    description: 'Try to submit repayment request using made-up credentials that do not exist',
    type: 'negative',
    expectedStatus: 403,
    // Note: Create a credential with fake values (e.g., Member ID: "INVALID999", API Key: "fake-key-12345")
    // Should fail authentication
  },

  {
    id: 'negative-cross-org-access',
    name: 'Negative: Cross-Organization Access',
    description: 'Try to submit repayment for a DAN using valid credentials from a different organization',
    type: 'negative',
    expectedStatus: 403,
    requiresDifferentCredential: true,
    // Note: Provide a DAN from Organization A, then test with Organization B's credentials
    // Should be denied access (not authorized to repay this DAN)
  },

  // NEGATIVE TESTS - Invalid DAN
  {
    id: 'negative-non-existent-dan',
    name: 'Negative: Non-existent DAN',
    description: 'Try to submit repayment for a DAN that does not exist',
    type: 'negative',
    expectedStatus: 404,
    modifyPayload: (payload: any) => {
      const updated = JSON.parse(JSON.stringify(payload))
      updated.dan = 'EWC99999999'
      return updated
    },
  },

  {
    id: 'negative-invalid-dan-format',
    name: 'Negative: Invalid DAN Format',
    description: 'Use an incorrectly formatted DAN (without EWC prefix)',
    type: 'negative',
    expectedStatus: 400,
    modifyPayload: (payload: any) => {
      const updated = JSON.parse(JSON.stringify(payload))
      updated.dan = '12345678'
      return updated
    },
  },

  {
    id: 'negative-empty-dan',
    name: 'Negative: Empty DAN',
    description: 'Try to submit repayment with empty DAN parameter',
    type: 'negative',
    expectedStatus: 400,
    modifyPayload: (payload: any) => {
      const updated = JSON.parse(JSON.stringify(payload))
      updated.dan = ''
      return updated
    },
  },

  {
    id: 'negative-special-characters-dan',
    name: 'Negative: Special Characters in DAN',
    description: 'Try to use special characters in the DAN parameter',
    type: 'negative',
    expectedStatus: 400,
    modifyPayload: (payload: any) => {
      const updated = JSON.parse(JSON.stringify(payload))
      updated.dan = 'EWC00@#$%'
      return updated
    },
  },

  // NEGATIVE TESTS - Date Issues
  {
    id: 'negative-invalid-date-format',
    name: 'Negative: Invalid Date Format',
    description: 'Use incorrect date format for tenancy_end_date',
    type: 'negative',
    expectedStatus: 400,
    modifyPayload: (payload: any) => {
      const updated = JSON.parse(JSON.stringify(payload))
      updated.tenancy_end_date = '2023/08/23' // Wrong format (should be DD-MM-YYYY)
      return updated
    },
  },

  {
    id: 'negative-future-end-date',
    name: 'Negative: Future End Date',
    description: 'Use a tenancy end date in the future',
    type: 'negative',
    expectedStatus: 400,
    modifyPayload: (payload: any) => {
      const updated = JSON.parse(JSON.stringify(payload))
      // Set date 1 year in future
      const futureDate = new Date()
      futureDate.setFullYear(futureDate.getFullYear() + 1)
      const dd = String(futureDate.getDate()).padStart(2, '0')
      const mm = String(futureDate.getMonth() + 1).padStart(2, '0')
      const yyyy = futureDate.getFullYear()
      updated.tenancy_end_date = `${dd}-${mm}-${yyyy}`
      return updated
    },
  },

  // NEGATIVE TESTS - Amount Issues
  {
    id: 'negative-amounts-exceed-deposit',
    name: 'Negative: Amounts Exceed Deposit',
    description: 'tenant_repayment + agent_repayment.total exceeds the deposit amount',
    type: 'negative',
    expectedStatus: 400,
    modifyPayload: (payload: any) => {
      const updated = JSON.parse(JSON.stringify(payload))
      // Double the amounts
      const depositAmount = parseFloat(payload.tenant_repayment) + parseFloat(payload.agent_repayment.total)
      updated.tenant_repayment = (depositAmount * 1.5).toString()
      updated.agent_repayment.total = (depositAmount * 0.5).toString()
      return updated
    },
  },

  {
    id: 'negative-subtotals-dont-match',
    name: 'Negative: Agent Subtotals Dont Match Total',
    description: 'agent_repayment sub-categories do not sum to total',
    type: 'negative',
    expectedStatus: 400,
    modifyPayload: (payload: any) => {
      const updated = JSON.parse(JSON.stringify(payload))
      // Make subtotals not match
      updated.agent_repayment.cleaning = "100"
      updated.agent_repayment.damage = "50"
      updated.agent_repayment.total = "200" // Should be 150
      return updated
    },
  },

  {
    id: 'negative-negative-amounts',
    name: 'Negative: Negative Amounts',
    description: 'Use negative values for repayment amounts',
    type: 'negative',
    expectedStatus: 400,
    modifyPayload: (payload: any) => {
      const updated = JSON.parse(JSON.stringify(payload))
      updated.tenant_repayment = "-100"
      return updated
    },
  },

  {
    id: 'negative-missing-required-field',
    name: 'Negative: Missing Required Field',
    description: 'Omit a required field (tenancy_end_date)',
    type: 'negative',
    expectedStatus: 400,
    modifyPayload: (payload: any) => {
      const updated = JSON.parse(JSON.stringify(payload))
      delete updated.tenancy_end_date
      return updated
    },
  },

  {
    id: 'negative-deposit-wrong-status',
    name: 'Negative: Deposit Not in Correct Status',
    description: 'Try to submit repayment for a deposit not in "Deposits held by scheme" status',
    type: 'negative',
    expectedStatus: 400,
    // Note: Provide a DAN for a deposit that is in "Registered (not paid)" or "Repaid" status
    // API should reject as deposit must be in "Deposits held by scheme" status
    // This test may depend on having a deposit in the wrong status available
  },

  {
    id: 'negative-other-amount-no-text',
    name: 'Negative: Other Amount Without Description',
    description: 'Set agent_repayment.other > 0 without providing other_text',
    type: 'negative',
    expectedStatus: 400,
    modifyPayload: (payload: any) => {
      const updated = JSON.parse(JSON.stringify(payload))
      // Move some amount to "other" but don't provide text
      const depositAmount = parseFloat(payload.tenant_repayment)
      updated.tenant_repayment = "0"
      updated.agent_repayment.total = depositAmount.toString()
      updated.agent_repayment.cleaning = "0"
      updated.agent_repayment.rent_arrears = "0"
      updated.agent_repayment.damage = "0"
      updated.agent_repayment.redecoration = "0"
      updated.agent_repayment.gardening = "0"
      updated.agent_repayment.other = depositAmount.toString()
      updated.agent_repayment.other_text = "" // Missing required text
      return updated
    },
  },
]
