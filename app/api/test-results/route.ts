import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/db/prisma'

// GET /api/test-results - Get paginated test results
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')

    // Validate parameters
    const validatedPage = Math.max(1, page)
    const validatedLimit = Math.min(Math.max(1, limit), 500) // Max 500 per page

    const skip = (validatedPage - 1) * validatedLimit

    console.log('Fetching test results from database...', {
      page: validatedPage,
      limit: validatedLimit,
      skip
    })

    // Get total count for pagination
    const totalCount = await prisma.testResult.count()

    const results = await prisma.testResult.findMany({
      include: {
        test: {
          select: {
            id: true,
            name: true,
            method: true,
            endpoint: true,
            expectedStatus: true,
            environment: {
              select: {
                name: true,
                instanceUrl: true,
              },
            },
          },
        },
        credential: {
          select: {
            id: true,
            orgName: true,
            authType: true,
            memberId: true,
            branchId: true,
          },
        },
      },
      orderBy: {
        executedAt: 'desc',
      },
      skip,
      take: validatedLimit,
    })

    console.log(`Successfully fetched ${results.length} of ${totalCount} test results`)

    return NextResponse.json({
      results,
      pagination: {
        page: validatedPage,
        limit: validatedLimit,
        totalCount,
        totalPages: Math.ceil(totalCount / validatedLimit),
        hasNext: validatedPage < Math.ceil(totalCount / validatedLimit),
        hasPrev: validatedPage > 1,
      }
    })
  } catch (error: any) {
    console.error('Error fetching test results:', error)
    console.error('Error details:', {
      message: error.message,
      code: error.code,
      meta: error.meta,
    })
    return NextResponse.json(
      {
        error: 'Failed to fetch test results',
        details: error.message
      },
      { status: 500 }
    )
  }
}
