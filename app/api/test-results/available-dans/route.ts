import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/db/prisma'

/**
 * GET /api/test-results/available-dans
 * Fetch DANs from successful deposit creation tests with deposit details
 * Used for repayment request and other endpoints that need to select from existing deposits
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const credentialId = searchParams.get('credentialId')
    const limit = parseInt(searchParams.get('limit') || '20')

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

    console.log(`[Available DANs] Found ${results.length} successful creation tests`)

    // Parse JSON fields and extract DAN, tenancy_end_date, and deposit_amount
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

      // Extract tenancy_end_date from request
      let tenancyEndDate = tenancy.tenancy_end_date || null

      // Extract deposit_amount from request
      let depositAmount = tenancy.deposit_amount || null

      console.log(`[Available DANs] Result ${result.id}: DAN=${dan}, EndDate=${tenancyEndDate}, Amount=${depositAmount}`)

      return {
        id: result.id,
        testId: result.testId,
        testName: result.test.name,
        executedAt: result.executedAt,
        responseTime: result.responseTime,
        credential: result.credential ? {
          id: result.credential.id,
          orgName: result.credential.orgName,
          authType: result.credential.authType,
        } : null,
        // Key deposit details needed for repayment
        deposit: {
          dan: dan,
          tenancy_end_date: tenancyEndDate,
          deposit_amount: depositAmount,
        },
        // Additional reference fields
        references: {
          user_tenancy_reference: tenancy.user_tenancy_reference,
          deposit_reference: tenancy.deposit_reference,
          property_id: tenancy.property_id,
        },
      }
    })

    // Filter out results that don't have a DAN (shouldn't happen, but be safe)
    const validResults = formattedResults.filter(r => r.deposit.dan)

    console.log(`[Available DANs] Returning ${validResults.length} valid DANs`)

    return NextResponse.json(validResults)
  } catch (error: any) {
    console.error('Error fetching available DANs:', error)
    return NextResponse.json(
      {
        error: 'Failed to fetch available DANs',
        message: error.message
      },
      { status: 500 }
    )
  }
}
