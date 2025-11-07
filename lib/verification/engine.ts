/**
 * Verification Engine
 * Automatically runs verification based on configuration rules
 */

import { SalesforceVerificationClient, VerificationResult, VerificationCheck } from '../salesforce/verification-client'
import { findVerificationRule, VerificationRule } from './config'

export interface VerificationContext {
  endpoint: string
  requestBody?: any
  response?: any
  instanceUrl: string
  bearerToken: string
}

export class VerificationEngine {
  /**
   * Run verification for a test based on configured rules
   */
  static async verify(context: VerificationContext): Promise<VerificationResult> {
    try {
      // Find matching verification rule
      const rule = findVerificationRule(context.endpoint)

      if (!rule) {
        return {
          success: false,
          checks: [],
          allPassed: false,
          error: 'No verification rule configured for this endpoint',
        }
      }

      console.log('🔍 Found verification rule for endpoint:', context.endpoint)

      // Extract identifier (DAN, ID, etc.)
      const identifier = rule.extractIdentifier(
        context.endpoint,
        context.requestBody,
        context.response
      )

      if (!identifier) {
        return {
          success: false,
          checks: [],
          allPassed: false,
          error: 'Could not extract identifier from endpoint/request/response',
        }
      }

      console.log('📋 Extracted identifier:', identifier)

      // Create verification client
      const client = new SalesforceVerificationClient({
        instanceUrl: context.instanceUrl,
        bearerToken: context.bearerToken,
      })

      // Wait for Salesforce to process
      const delay = rule.delay || 2000
      console.log(`⏱️  Waiting ${delay}ms for Salesforce to process...`)
      await new Promise(resolve => setTimeout(resolve, delay))

      // Run verification based on type
      if (rule.verificationType === 'deposit-fields') {
        return await this.verifyDepositFields(
          client,
          identifier,
          rule,
          context.requestBody,
          context.response
        )
      } else if (rule.verificationType === 'custom-query') {
        return await this.verifyCustomQuery(
          client,
          identifier,
          rule,
          context.requestBody,
          context.response
        )
      }

      return {
        success: false,
        checks: [],
        allPassed: false,
        error: `Unknown verification type: ${rule.verificationType}`,
      }

    } catch (error: any) {
      console.error('❌ Verification engine error:', error)
      return {
        success: false,
        checks: [],
        allPassed: false,
        error: error.message || 'Verification failed',
      }
    }
  }

  /**
   * Verify deposit fields
   */
  private static async verifyDepositFields(
    client: SalesforceVerificationClient,
    dan: string,
    rule: VerificationRule,
    requestBody: any,
    response: any
  ): Promise<VerificationResult> {
    let expectedFields: Record<string, any> = {}

    if (typeof rule.expectedFields === 'function') {
      expectedFields = rule.expectedFields(requestBody, response)
    } else if (rule.expectedFields) {
      expectedFields = rule.expectedFields
    }

    console.log('🔍 Verifying deposit fields:', expectedFields)

    return await client.verifyDeposit(dan, expectedFields)
  }

  /**
   * Verify using custom query
   */
  private static async verifyCustomQuery(
    client: SalesforceVerificationClient,
    identifier: string,
    rule: VerificationRule,
    requestBody: any,
    response: any
  ): Promise<VerificationResult> {
    if (!rule.customQuery) {
      return {
        success: false,
        checks: [],
        allPassed: false,
        error: 'Custom query not defined in rule',
      }
    }

    const queryConfig = rule.customQuery(identifier, requestBody, response)

    console.log('🔍 Executing custom query:', queryConfig.soql)

    const startTime = Date.now()

    try {
      const queryResult = await client.executeQuery(queryConfig.soql)

      if (queryResult.totalSize === 0) {
        return {
          success: false,
          checks: [],
          allPassed: false,
          error: 'No records found matching query',
        }
      }

      const record = queryResult.records[0]

      // Build verification checks
      const checks: VerificationCheck[] = queryConfig.checks.map(check => {
        const actual = this.getNestedValue(record, check.field)
        const passed = actual === check.expected

        return {
          field: check.field,
          expected: check.expected,
          actual,
          passed,
          message: check.getMessage
            ? check.getMessage(actual, check.expected)
            : passed
            ? `${check.field} matches expected value`
            : `${check.field} = ${actual}, expected ${check.expected}`,
        }
      })

      const allPassed = checks.every(c => c.passed)
      const queryTime = Date.now() - startTime

      return {
        success: true,
        checks,
        allPassed,
        queryTime,
      }

    } catch (error: any) {
      const queryTime = Date.now() - startTime
      return {
        success: false,
        checks: [],
        allPassed: false,
        error: error.message,
        queryTime,
      }
    }
  }

  /**
   * Get nested value from object using dot notation
   * e.g., getNestedValue(obj, 'Deposit__r.Name')
   */
  private static getNestedValue(obj: any, path: string): any {
    return path.split('.').reduce((current, key) => current?.[key], obj)
  }
}
