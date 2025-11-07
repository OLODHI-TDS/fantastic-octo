import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/db/prisma'

// PATCH /api/results/[id]/manual-status - Update manual status override
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const { manualStatus } = await request.json()

    // Validate manualStatus
    if (manualStatus !== null && !['passed', 'failed', 'error'].includes(manualStatus)) {
      return NextResponse.json(
        { error: 'Invalid manual status. Must be "passed", "failed", "error", or null' },
        { status: 400 }
      )
    }

    // Update the test result
    const result = await prisma.testResult.update({
      where: { id },
      data: { manualStatus },
      include: {
        test: true,
        credential: true,
      },
    })

    return NextResponse.json({
      success: true,
      result,
    })
  } catch (error: any) {
    console.error('Error updating manual status:', error)

    return NextResponse.json(
      {
        error: 'Failed to update manual status',
        message: error.message,
      },
      { status: 500 }
    )
  }
}
