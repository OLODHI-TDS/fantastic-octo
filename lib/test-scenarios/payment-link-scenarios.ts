/**
 * Test scenarios for Payment Link endpoint
 * This endpoint gets the payment link for the current NRLA cart
 * GET endpoint - no request body required
 */

export interface TestScenario {
  id: string
  name: string
  description: string
  type: 'positive' | 'negative'
  expectedStatus: number
  generatePayload?: () => any
  requiresDifferentCredential?: boolean
}

export const paymentLinkScenarios: TestScenario[] = [
  // POSITIVE TESTS
  {
    id: 'positive-get-payment-link',
    name: 'Positive: Get Payment Link',
    description: 'Get payment link for current cart with valid credentials',
    type: 'positive',
    expectedStatus: 200,
  },

  {
    id: 'positive-payment-link-with-items',
    name: 'Positive: Payment Link with Cart Items',
    description: 'Get payment link when cart has items added',
    type: 'positive',
    expectedStatus: 200,
  },

  // NEGATIVE TESTS
  {
    id: 'negative-empty-cart',
    name: 'Negative: Empty Cart',
    description: 'Attempt to get payment link when cart is empty',
    type: 'negative',
    expectedStatus: 400,
  },

  {
    id: 'negative-invalid-credentials',
    name: 'Negative: Invalid Credentials',
    description: 'Attempt to get payment link with invalid AccessToken',
    type: 'negative',
    expectedStatus: 401,
    requiresDifferentCredential: true,
  },
]
