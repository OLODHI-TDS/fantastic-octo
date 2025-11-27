import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/db/prisma'
import { executeTest } from '@/lib/test-engine/runner'
import { API_ENDPOINTS } from '@/lib/api-endpoints'
import crypto from 'crypto'

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'dev-key-change-in-production-32b'
const ALGORITHM = 'aes-256-cbc'

function decrypt(text: string): string {
  const parts = text.split(':')
  const iv = Buffer.from(parts[0], 'hex')
  const encryptedText = parts[1]
  const decipher = crypto.createDecipheriv(ALGORITHM, Buffer.from(ENCRYPTION_KEY.padEnd(32, '0').slice(0, 32)), iv)
  let decrypted = decipher.update(encryptedText, 'hex', 'utf8')
  decrypted += decipher.final('utf8')
  return decrypted
}

// extractDanFromEndpoint function moved to verification/config.ts
// Now using VerificationEngine for all verification logic

// POST /api/tests/[id]/execute - Execute a test
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    // Fetch the test with its environment and credential
    const test = await prisma.test.findUnique({
      where: { id },
      include: {
        environment: true,
        credential: true,
      },
    })

    if (!test) {
      return NextResponse.json(
        { error: 'Test not found' },
        { status: 404 }
      )
    }

    if (!test.environment.active) {
      return NextResponse.json(
        { error: 'Environment is not active' },
        { status: 400 }
      )
    }

    // Find endpoint configuration to check for fixed API key
    const endpointConfig = API_ENDPOINTS.find(ep =>
      test.endpoint.startsWith(ep.endpoint.split('{')[0])
    )
    const usesFixedApiKey = endpointConfig?.usesFixedApiKey === true

    // Validate credential if not using fixed API key
    if (!usesFixedApiKey) {
      if (!test.credential) {
        return NextResponse.json(
          { error: 'Credential is required for this endpoint' },
          { status: 400 }
        )
      }
      if (!test.credential.active) {
        return NextResponse.json(
          { error: 'Credential is not active' },
          { status: 400 }
        )
      }
    }

    // Parse test data
    const testData = {
      ...test,
      method: test.method as 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE',
      description: test.description ?? undefined,
      headers: test.headers ? JSON.parse(test.headers) : undefined,
      body: test.body ? JSON.parse(test.body) : undefined,
      validations: test.validations ? JSON.parse(test.validations) : undefined,
    }

    let executionResult

    // Execute with fixed API key if endpoint requires it
    if (usesFixedApiKey && endpointConfig?.fixedApiKeyHeader && endpointConfig?.fixedApiKeyValue) {
      executionResult = await executeTest({
        test: testData,
        instanceUrl: test.environment.instanceUrl,
        fixedApiKey: {
          header: endpointConfig.fixedApiKeyHeader,
          value: endpointConfig.fixedApiKeyValue,
        },
      })
    } else {
      // Standard credential-based execution
      const credentialData = {
        instanceUrl: test.environment.instanceUrl,
        orgName: test.credential!.orgName,
        regionScheme: test.credential!.regionScheme,
        memberId: test.credential!.memberId,
        branchId: test.credential!.branchId,
        authType: test.credential!.authType as 'apikey' | 'oauth2',
        apiKey: test.credential!.authType === 'apikey' && test.credential!.apiKey
          ? decrypt(test.credential!.apiKey)
          : undefined,
        clientId: test.credential!.authType === 'oauth2' && test.credential!.clientId
          ? test.credential!.clientId
          : undefined,
        clientSecret: test.credential!.authType === 'oauth2' && test.credential!.clientSecret
          ? decrypt(test.credential!.clientSecret)
          : undefined,
      }

      executionResult = await executeTest({
        test: testData,
        instanceUrl: credentialData.instanceUrl,
        credential: credentialData,
      })
    }

    // Perform verification if enabled and test passed
    let verificationResults = null
    let verificationPassed = null
    let verificationError = null

    if (
      test.environment.verificationEnabled &&
      test.environment.verificationBearerToken &&
      executionResult.status === 'passed'
    ) {
      try {
        console.log('🔍 Verification enabled, checking for rules...')

        // Import verification engine dynamically
        const { VerificationEngine } = await import('@/lib/verification/engine')

        // Bearer token is stored as plain text (no decryption needed)
        const bearerToken = test.environment.verificationBearerToken

        // Run verification using engine
        const verificationResult = await VerificationEngine.verify({
          endpoint: test.endpoint,
          requestBody: testData.body,
          response: executionResult.response,
          instanceUrl: test.environment.instanceUrl,
          bearerToken,
        })

        verificationResults = JSON.stringify(verificationResult.checks)
        verificationPassed = verificationResult.allPassed
        verificationError = verificationResult.error || null

        console.log('✅ Verification complete:', {
          passed: verificationPassed,
          checks: verificationResult.checks,
        })
      } catch (error: any) {
        console.error('❌ Verification failed:', error)
        verificationError = error.message
      }
    }

    // Save the result to database
    const testResult = await prisma.testResult.create({
      data: {
        testId: test.id,
        credentialId: test.credentialId,
        status: executionResult.status,
        responseTime: executionResult.responseTime,
        statusCode: executionResult.statusCode,
        request: JSON.stringify(executionResult.request),
        response: JSON.stringify(executionResult.response),
        validationResults: executionResult.validationResults
          ? JSON.stringify(executionResult.validationResults)
          : null,
        error: executionResult.error || null,
        verificationResults,
        verificationPassed,
        verificationError,
      },
    })

    // Return the parsed result
    return NextResponse.json({
      ...testResult,
      request: JSON.parse(testResult.request),
      response: JSON.parse(testResult.response),
      validationResults: testResult.validationResults
        ? JSON.parse(testResult.validationResults)
        : undefined,
      verificationResults: testResult.verificationResults
        ? JSON.parse(testResult.verificationResults)
        : undefined,
    })
  } catch (error: any) {
    console.error('Error executing test:', error)

    return NextResponse.json(
      {
        error: 'Failed to execute test',
        message: error.message,
      },
      { status: 500 }
    )
  }
}
