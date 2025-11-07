/**
 * Test scenarios for Respond to Repayment Request endpoint
 * POST /services/apexrest/raiserepaymentrequest/
 * Responds to a tenant-initiated repayment request
 *
 * Requirements:
 * - Can only respond if there is already a repayment request by tenant
 * - Response values that match tenant's request will accept it
 * - Different values will counter-propose
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

export const repaymentResponseScenarios: TestScenario[] = [
  // POSITIVE TESTS
  {
    id: 'positive-accept-tenant-request',
    name: 'Positive: Accept Tenant Request',
    description: 'Respond with matching values to accept the tenant repayment request',
    type: 'positive',
    expectedStatus: 200,
    // Note: User must select a DAN that has an existing tenant-initiated repayment request
    // The response values should match the tenant's original request to accept it
    // Payload will be auto-populated, user should verify values match tenant's request
  },

  {
    id: 'positive-counter-propose',
    name: 'Positive: Counter-Propose Different Split',
    description: 'Respond with different split to counter-propose',
    type: 'positive',
    expectedStatus: 200,
    modifyPayload: (payload: any) => {
      const updated = JSON.parse(JSON.stringify(payload))
      // Propose a different split - 40% to tenant, 60% to agent
      const depositAmount = parseFloat(payload.tenant_repayment) + parseFloat(payload.agent_repayment.total)
      const tenantAmount = Math.floor(depositAmount * 0.4 * 100) / 100
      const agentTotal = Math.floor(depositAmount * 0.6 * 100) / 100

      updated.tenant_repayment = tenantAmount.toString()
      updated.agent_repayment.total = agentTotal.toString()
      // Split agent amount across categories
      updated.agent_repayment.cleaning = Math.floor(agentTotal * 0.6 * 100) / 100
      updated.agent_repayment.damage = Math.floor(agentTotal * 0.4 * 100) / 100
      updated.agent_repayment.rent_arrears = "0"
      updated.agent_repayment.redecoration = "0"
      updated.agent_repayment.gardening = "0"
      updated.agent_repayment.other = "0"
      updated.agent_repayment.other_text = ""

      return updated
    },
  },

  {
    id: 'positive-reject-full-to-agent',
    name: 'Positive: Reject - Full Amount to Agent',
    description: 'Counter-propose with full deposit going to agent (0% to tenant)',
    type: 'positive',
    expectedStatus: 200,
    modifyPayload: (payload: any) => {
      const updated = JSON.parse(JSON.stringify(payload))
      // Propose all to agent
      const depositAmount = parseFloat(payload.tenant_repayment) + parseFloat(payload.agent_repayment.total)

      updated.tenant_repayment = "0"
      updated.agent_repayment.total = depositAmount.toString()
      updated.agent_repayment.cleaning = Math.floor(depositAmount * 0.5 * 100) / 100
      updated.agent_repayment.damage = Math.floor(depositAmount * 0.3 * 100) / 100
      updated.agent_repayment.rent_arrears = Math.floor(depositAmount * 0.2 * 100) / 100
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
    description: 'Try to respond using made-up credentials that do not exist',
    type: 'negative',
    expectedStatus: 403,
    // Note: Create a credential with fake values (e.g., Member ID: "INVALID999", API Key: "fake-key-12345")
    // Should fail authentication
  },

  {
    id: 'negative-cross-org-access',
    name: 'Negative: Cross-Organization Access',
    description: 'Try to respond to a repayment request using credentials from a different organization',
    type: 'negative',
    expectedStatus: 403,
    requiresDifferentCredential: true,
    // Note: Provide a DAN from Organization A, then test with Organization B's credentials
    // Should be denied access (not authorized to respond to this DAN's repayment request)
  },

  // NEGATIVE TESTS - No Existing Repayment Request
  {
    id: 'negative-no-existing-request',
    name: 'Negative: No Existing Repayment Request',
    description: 'Try to respond when there is no tenant-initiated repayment request',
    type: 'negative',
    expectedStatus: 400,
    // Note: Provide a DAN that does NOT have an existing tenant repayment request
    // API should reject with error indicating no request exists to respond to
    // This test requires a deposit without an active repayment request
  },

  // NEGATIVE TESTS - Invalid DAN
  {
    id: 'negative-non-existent-dan',
    name: 'Negative: Non-existent DAN',
    description: 'Try to respond for a DAN that does not exist',
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
    description: 'Try to respond with empty DAN parameter',
    type: 'negative',
    expectedStatus: 400,
    modifyPayload: (payload: any) => {
      const updated = JSON.parse(JSON.stringify(payload))
      updated.dan = ''
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
    id: 'negative-other-amount-no-text',
    name: 'Negative: Other Amount Without Description',
    description: 'Set agent_repayment.other > 0 without providing other_text',
    type: 'negative',
    expectedStatus: 400,
    modifyPayload: (payload: any) => {
      const updated = JSON.parse(JSON.stringify(payload))
      // Move some amount to "other" but don't provide text
      const depositAmount = parseFloat(payload.tenant_repayment) + parseFloat(payload.agent_repayment.total)
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
