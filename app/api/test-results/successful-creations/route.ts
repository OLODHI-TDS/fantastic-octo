import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/db/prisma'

/**
 * GET /api/test-results/successful-creations
 * Fetch recent successful deposit creation test results for use in deposit update tests
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const credentialId = searchParams.get('credentialId')
    const limit = parseInt(searchParams.get('limit') || '10')

    // Build where clause
    const where: any = {
      test: {
        endpoint: {
          contains: 'depositcreation'
        }
      },
      status: 'passed',
      // Only get results from last 30 days
      executedAt: {
        gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
      }
    }

    // Optionally filter by credential (to only show deposits created with same credential)
    if (credentialId) {
      where.credentialId = credentialId
    }

    const results = await prisma.testResult.findMany({
      where,
      include: {
        test: {
          select: {
            id: true,
            name: true,
            endpoint: true,
          }
        },
        credential: {
          select: {
            id: true,
            orgName: true,
            authType: true,
          }
        }
      },
      orderBy: {
        executedAt: 'desc'
      },
      take: limit
    })

    // Parse JSON fields and extract useful information
    const formattedResults = results.map(result => {
      const request = typeof result.request === 'string' ? JSON.parse(result.request) : result.request
      const response = typeof result.response === 'string' ? JSON.parse(result.response) : result.response

      // Extract key fields from the creation payload
      const tenancy = request.body?.tenancy || {}

      // Extract DAN from various possible locations in the response
      let dan = null
      if (response.data?.dan) {
        dan = response.data.dan
      } else if (response.data?.DAN) {
        dan = response.data.DAN
      } else if (response.dan) {
        dan = response.dan
      } else if (response.DAN) {
        dan = response.DAN
      }

      return {
        id: result.id,
        testId: result.testId,
        testName: result.test.name,
        executedAt: result.executedAt,
        responseTime: result.responseTime,
        credential: {
          id: result.credential.id,
          orgName: result.credential.orgName,
          authType: result.credential.authType,
        },
        // Key reference fields needed for update
        references: {
          user_tenancy_reference: tenancy.user_tenancy_reference,
          deposit_reference: tenancy.deposit_reference,
          property_id: tenancy.property_id,
        },
        // Response data (includes DAN if available)
        response: {
          dan: dan,
          batch_id: response.data?.batch_id || response.batch_id,
          success: response.data?.success || response.success,
        },
        // Full request payload (for populating update form)
        requestPayload: request.body
      }
    })

    return NextResponse.json(formattedResults)
  } catch (error: any) {
    console.error('Error fetching successful creation tests:', error)
    return NextResponse.json(
      {
        error: 'Failed to fetch creation tests',
        message: error.message
      },
      { status: 500 }
    )
  }
}
