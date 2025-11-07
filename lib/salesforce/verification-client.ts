import axios, { AxiosInstance, AxiosError } from 'axios'

/**
 * Salesforce Verification Client
 * Uses standard Salesforce REST API with Bearer token authentication
 * to query and verify deposit records after test execution
 */

export interface VerificationConfig {
  instanceUrl: string
  bearerToken: string
}

export interface VerificationCheck {
  field: string
  expected: any
  actual: any
  passed: boolean
  message?: string
}

export interface VerificationResult {
  success: boolean
  checks: VerificationCheck[]
  allPassed: boolean
  error?: string
  queryTime?: number
}

export interface DepositRecord {
  Id: string
  Name?: string
  EWC_DAN__c?: string
  EWI_DAN_AutoNum__c?: string
  Is_Added_to_cart__c?: boolean
  Status__c?: string
  [key: string]: any
}

export class SalesforceVerificationClient {
  private axiosInstance: AxiosInstance
  private instanceUrl: string
  private bearerToken: string

  constructor(config: VerificationConfig) {
    this.instanceUrl = config.instanceUrl
    this.bearerToken = config.bearerToken

    this.axiosInstance = axios.create({
      baseURL: this.instanceUrl,
      timeout: 30000,
      headers: {
        'Authorization': `Bearer ${this.bearerToken}`,
        'Content-Type': 'application/json',
      },
    })
  }

  /**
   * Query deposit by DAN using SOQL
   * Searches across both EWC_DAN__c and EWI_DAN_AutoNum__c fields
   */
  async queryDepositByDAN(dan: string, fields: string[] = ['Id', 'Name', 'EWC_DAN__c', 'EWI_DAN_AutoNum__c', 'Is_Added_to_cart__c', 'Status__c']): Promise<DepositRecord | null> {
    try {
      // Search across both DAN fields (EWC and EWI)
      const soql = `SELECT ${fields.join(',')} FROM Deposit__c WHERE EWC_DAN__c = '${dan}' OR EWI_DAN_AutoNum__c = '${dan}' LIMIT 1`

      console.log('🔍 Verification Query:', soql)

      const response = await this.axiosInstance.get('/services/data/v59.0/query', {
        params: { q: soql },
      })

      if (response.data.totalSize === 0) {
        console.log('⚠️  No deposit found with DAN:', dan)
        return null
      }

      const record = response.data.records[0]
      console.log('✅ Deposit record found:', record)
      return record

    } catch (error) {
      this.handleError('queryDepositByDAN', error as AxiosError)
      throw error
    }
  }

  /**
   * Verify that a deposit has the "Added to Cart" flag set
   */
  async verifyAddedToCart(dan: string): Promise<VerificationResult> {
    const startTime = Date.now()

    try {
      const record = await this.queryDepositByDAN(dan, ['Id', 'Name', 'EWC_DAN__c', 'EWI_DAN_AutoNum__c', 'Is_Added_to_cart__c'])

      if (!record) {
        return {
          success: false,
          checks: [],
          allPassed: false,
          error: `Deposit not found with DAN: ${dan}`,
        }
      }

      const checks: VerificationCheck[] = [
        {
          field: 'Is_Added_to_cart__c',
          expected: true,
          actual: record.Is_Added_to_cart__c,
          passed: record.Is_Added_to_cart__c === true,
          message: record.Is_Added_to_cart__c === true
            ? 'Deposit successfully added to cart'
            : 'Deposit not marked as added to cart',
        },
      ]

      const allPassed = checks.every(check => check.passed)
      const queryTime = Date.now() - startTime

      return {
        success: true,
        checks,
        allPassed,
        queryTime,
      }

    } catch (error) {
      const queryTime = Date.now() - startTime
      return {
        success: false,
        checks: [],
        allPassed: false,
        error: (error as Error).message,
        queryTime,
      }
    }
  }

  /**
   * Verify multiple fields on a deposit record
   */
  async verifyDeposit(dan: string, expectedValues: Record<string, any>): Promise<VerificationResult> {
    const startTime = Date.now()

    try {
      const fields = ['Id', 'Name', 'EWC_DAN__c', 'EWI_DAN_AutoNum__c', ...Object.keys(expectedValues)]
      const record = await this.queryDepositByDAN(dan, fields)

      if (!record) {
        return {
          success: false,
          checks: [],
          allPassed: false,
          error: `Deposit not found with DAN: ${dan}`,
        }
      }

      const checks: VerificationCheck[] = Object.entries(expectedValues).map(([field, expectedValue]) => {
        const actualValue = record[field]
        const passed = actualValue === expectedValue

        return {
          field,
          expected: expectedValue,
          actual: actualValue,
          passed,
          message: passed
            ? `${field} matches expected value`
            : `${field} = ${actualValue}, expected ${expectedValue}`,
        }
      })

      const allPassed = checks.every(check => check.passed)
      const queryTime = Date.now() - startTime

      return {
        success: true,
        checks,
        allPassed,
        queryTime,
      }

    } catch (error) {
      const queryTime = Date.now() - startTime
      return {
        success: false,
        checks: [],
        allPassed: false,
        error: (error as Error).message,
        queryTime,
      }
    }
  }

  /**
   * Execute a custom SOQL query
   */
  async executeQuery<T = any>(soql: string): Promise<{ records: T[], totalSize: number }> {
    try {
      console.log('🔍 Custom Query:', soql)

      const response = await this.axiosInstance.get('/services/data/v59.0/query', {
        params: { q: soql },
      })

      console.log(`✅ Query returned ${response.data.totalSize} records`)

      return {
        records: response.data.records,
        totalSize: response.data.totalSize,
      }

    } catch (error) {
      this.handleError('executeQuery', error as AxiosError)
      throw error
    }
  }

  /**
   * Test connection and token validity
   */
  async testConnection(): Promise<boolean> {
    try {
      console.log('🔍 Testing Salesforce connection...')

      const response = await this.axiosInstance.get('/services/data/v59.0/limits')

      console.log('✅ Connection successful')
      return true

    } catch (error) {
      console.error('❌ Connection failed')
      this.handleError('testConnection', error as AxiosError)
      return false
    }
  }

  /**
   * Handle axios errors
   */
  private handleError(method: string, error: AxiosError) {
    console.error(`❌ SalesforceVerificationClient.${method} failed:`)

    if (error.response) {
      console.error('📋 Status:', error.response.status)
      console.error('📋 Response:', JSON.stringify(error.response.data, null, 2))
    } else if (error.request) {
      console.error('📋 No response received from server')
    } else {
      console.error('📋 Error:', error.message)
    }
  }
}
