/**
 * Verification Configuration
 * Define verification rules for each endpoint
 */

export interface VerificationRule {
  endpointPattern: string | RegExp
  extractIdentifier: (endpoint: string, requestBody?: any, response?: any) => string | null
  verificationType: 'deposit-fields' | 'custom-query'

  // For 'deposit-fields' type
  expectedFields?: Record<string, any> | ((request: any, response: any) => Record<string, any>)

  // For 'custom-query' type
  customQuery?: (identifier: string, request: any, response: any) => {
    soql: string
    checks: Array<{
      field: string
      expected: any
      getMessage?: (actual: any, expected: any) => string
    }>
  }

  // Delay before verification (ms)
  delay?: number
}

export const VERIFICATION_RULES: VerificationRule[] = [
  // Add to Cart
  {
    endpointPattern: '/cart/add/',
    extractIdentifier: (endpoint) => {
      const match = endpoint.match(/(EWC|EWI|NI|SDS)\d+/i)
      return match ? match[0] : null
    },
    verificationType: 'deposit-fields',
    expectedFields: {
      Is_Added_to_cart__c: true,
    },
    delay: 2000,
  },

  // Remove from Cart (NRLA)
  {
    endpointPattern: '/cart/remove/',
    extractIdentifier: (endpoint) => {
      const match = endpoint.match(/(EWC|EWI|NI|SDS)\d+/i)
      return match ? match[0] : null
    },
    verificationType: 'deposit-fields',
    expectedFields: {
      Is_Added_to_cart__c: false,
    },
    delay: 2000,
  },

  // Deposit Creation
  {
    endpointPattern: '/depositcreation',
    extractIdentifier: (endpoint, requestBody, response) => {
      // DAN is in response.data.DAN for deposit creation
      return response?.data?.DAN
        || response?.DAN
        || response?.dan
        || null
    },
    verificationType: 'deposit-fields',
    expectedFields: (request, response) => {
      // Request body structure: { tenancy: { deposit_amount: "2166", ... } }
      const tenancy = request?.tenancy || {}

      const depositAmount = parseFloat(
        tenancy.deposit_amount
        || tenancy.deposit_amount_to_protect
        || request?.deposit_amount  // Fallback for non-nested format
        || request?.DepositAmount
      )

      return {
        Status__c: 'Registered (not paid)', // Initial status after creation
        Deposit_Amount__c: depositAmount,
      }
    },
    delay: 3000, // Creation might take longer
  },

  // Deposit Update
  {
    endpointPattern: '/depositupdate',
    extractIdentifier: (endpoint, requestBody) => {
      return requestBody?.DAN || requestBody?.tenancy?.DAN || null
    },
    verificationType: 'deposit-fields',
    expectedFields: (request, response) => {
      // Request body structure: { tenancy: { tenancy_start_date: "...", ... } }
      const tenancy = request?.tenancy || request || {}
      const fields: Record<string, any> = {}

      // Only verify fields that were included in the update
      if (tenancy.tenancy_start_date) {
        fields.Tenancy_Start_Date__c = tenancy.tenancy_start_date
      }
      if (tenancy.deposit_amount) {
        fields.Deposit_Amount__c = parseFloat(tenancy.deposit_amount)
      }
      if (tenancy.tenancy_expected_end_date) {
        fields.Tenancy_Expected_End_Date__c = tenancy.tenancy_expected_end_date
      }

      return fields
    },
    delay: 2000,
  },

  // Delete Deposit
  {
    endpointPattern: '/delete/',
    extractIdentifier: (endpoint) => {
      const match = endpoint.match(/(EWC|EWI|NI|SDS)\d+/i)
      return match ? match[0] : null
    },
    verificationType: 'deposit-fields',
    expectedFields: {
      Status__c: 'Released', // Note: Verify this is the correct status after deletion
    },
    delay: 2000,
  },

  // Repayment Request (Custom Query Example)
  {
    endpointPattern: '/raiserepaymentrequest',
    extractIdentifier: (endpoint, requestBody) => {
      return requestBody?.DAN || null
    },
    verificationType: 'custom-query',
    customQuery: (dan, request, response) => ({
      soql: `
        SELECT Id, Status__c, Requested_Amount__c, Deposit__r.EWC_DAN__c
        FROM Repayment_Request__c
        WHERE Deposit__r.EWC_DAN__c = '${dan}'
        OR Deposit__r.EWI_DAN_AutoNum__c = '${dan}'
        ORDER BY CreatedDate DESC
        LIMIT 1
      `,
      checks: [
        {
          field: 'Repayment_Request__c.Status__c',
          expected: 'Pending',
          getMessage: (actual, expected) =>
            actual === expected
              ? 'Repayment request created successfully'
              : `Expected status ${expected}, got ${actual}`,
        },
        {
          field: 'Repayment_Request__c.Requested_Amount__c',
          expected: parseFloat(request.TotalAmount),
          getMessage: (actual, expected) =>
            actual === expected
              ? 'Repayment amount matches'
              : `Expected amount ${expected}, got ${actual}`,
        },
      ],
    }),
    delay: 3000,
  },

  // Mark as Depository Managed
  {
    endpointPattern: '/depositorymanaged',
    extractIdentifier: (endpoint, requestBody) => {
      return requestBody?.DAN || null
    },
    verificationType: 'deposit-fields',
    expectedFields: {
      Deposit_Type__c: 'Depository Managed', // Adjust field name as needed
    },
    delay: 2000,
  },
]

/**
 * Find verification rule for an endpoint
 */
export function findVerificationRule(endpoint: string): VerificationRule | null {
  for (const rule of VERIFICATION_RULES) {
    if (typeof rule.endpointPattern === 'string') {
      if (endpoint.includes(rule.endpointPattern)) {
        return rule
      }
    } else {
      if (rule.endpointPattern.test(endpoint)) {
        return rule
      }
    }
  }
  return null
}
