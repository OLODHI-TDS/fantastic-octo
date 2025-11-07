import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/db/prisma'

// GET /api/results - List test results with filtering
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const testId = searchParams.get('testId')
    const environmentId = searchParams.get('environmentId')
    const status = searchParams.get('status')
    const limit = parseInt(searchParams.get('limit') || '50')

    const results = await prisma.testResult.findMany({
      where: {
        ...(testId && { testId }),
        ...(environmentId && { test: { environmentId } }),
        ...(status && { status }),
      },
      include: {
        test: {
          select: {
            id: true,
            name: true,
            method: true,
            endpoint: true,
            environment: {
              select: {
                id: true,
                name: true,
                type: true,
              },
            },
          },
        },
        credential: {
          select: {
            id: true,
            orgName: true,
          },
        },
      },
      orderBy: { executedAt: 'desc' },
      take: limit,
    })

    // Parse JSON strings
    const parsedResults = results.map(result => ({
      ...result,
      request: JSON.parse(result.request),
      response: JSON.parse(result.response),
      validationResults: result.validationResults
        ? JSON.parse(result.validationResults)
        : undefined,
    }))

    return NextResponse.json(parsedResults)
  } catch (error) {
    console.error('Error fetching test results:', error)
    return NextResponse.json(
      { error: 'Failed to fetch test results' },
      { status: 500 }
    )
  }
}

// DELETE /api/results - Bulk delete test results
export async function DELETE(request: NextRequest) {
  try {
    const { ids } = await request.json()

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json(
        { error: 'Invalid request. "ids" array is required.' },
        { status: 400 }
      )
    }

    console.log(`Deleting ${ids.length} test results...`)

    // Delete test results
    const result = await prisma.testResult.deleteMany({
      where: {
        id: { in: ids },
      },
    })

    console.log(`Successfully deleted ${result.count} test results`)

    return NextResponse.json({
      success: true,
      deletedCount: result.count,
    })
  } catch (error: any) {
    console.error('Error deleting test results:', error)
    return NextResponse.json(
      {
        error: 'Failed to delete test results',
        details: error.message,
      },
      { status: 500 }
    )
  }
}
