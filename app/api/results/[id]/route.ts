import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/db/prisma'

// PATCH /api/results/[id] - Update test result (e.g., notes)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { notes } = body

    console.log(`Updating test result: ${id}`)

    // Update the test result
    const result = await prisma.testResult.update({
      where: { id },
      data: {
        ...(notes !== undefined && { notes }),
      },
    })

    console.log(`Successfully updated test result: ${id}`)

    return NextResponse.json({
      success: true,
      result,
    })
  } catch (error: any) {
    console.error('Error updating test result:', error)

    // Check if the record was not found
    if (error.code === 'P2025') {
      return NextResponse.json(
        { error: 'Test result not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(
      {
        error: 'Failed to update test result',
        details: error.message,
      },
      { status: 500 }
    )
  }
}

// DELETE /api/results/[id] - Delete a single test result
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    console.log(`Deleting test result: ${id}`)

    // Delete the test result
    await prisma.testResult.delete({
      where: { id },
    })

    console.log(`Successfully deleted test result: ${id}`)

    return NextResponse.json({
      success: true,
      message: 'Test result deleted successfully',
    })
  } catch (error: any) {
    console.error('Error deleting test result:', error)

    // Check if the record was not found
    if (error.code === 'P2025') {
      return NextResponse.json(
        { error: 'Test result not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(
      {
        error: 'Failed to delete test result',
        details: error.message,
      },
      { status: 500 }
    )
  }
}
