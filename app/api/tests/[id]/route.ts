import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/db/prisma'
import { UpdateTestSchema } from '@/types/test'

// GET /api/tests/[id] - Get single test
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const test = await prisma.test.findUnique({
      where: { id },
      include: {
        environment: {
          select: {
            id: true,
            name: true,
            type: true,
          },
        },
      },
    })

    if (!test) {
      return NextResponse.json(
        { error: 'Test not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      ...test,
      headers: test.headers ? JSON.parse(test.headers) : undefined,
      body: test.body ? JSON.parse(test.body) : undefined,
      validations: test.validations ? JSON.parse(test.validations) : undefined,
    })
  } catch (error) {
    console.error('Error fetching test:', error)
    return NextResponse.json(
      { error: 'Failed to fetch test' },
      { status: 500 }
    )
  }
}

// PUT /api/tests/[id] - Update test
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const validatedData = UpdateTestSchema.parse({ ...body, id })

    const updateData: any = { ...validatedData }
    delete updateData.id

    // Convert objects to JSON strings
    if (updateData.headers !== undefined) {
      updateData.headers = updateData.headers ? JSON.stringify(updateData.headers) : null
    }
    if (updateData.body !== undefined) {
      updateData.body = updateData.body ? JSON.stringify(updateData.body) : null
    }
    if (updateData.validations !== undefined) {
      updateData.validations = updateData.validations ? JSON.stringify(updateData.validations) : null
    }

    const test = await prisma.test.update({
      where: { id },
      data: updateData,
      include: {
        environment: {
          select: {
            id: true,
            name: true,
            type: true,
          },
        },
      },
    })

    return NextResponse.json({
      ...test,
      headers: test.headers ? JSON.parse(test.headers) : undefined,
      body: test.body ? JSON.parse(test.body) : undefined,
      validations: test.validations ? JSON.parse(test.validations) : undefined,
    })
  } catch (error: any) {
    console.error('Error updating test:', error)

    if (error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      )
    }

    if (error.code === 'P2025') {
      return NextResponse.json(
        { error: 'Test not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to update test' },
      { status: 500 }
    )
  }
}

// DELETE /api/tests/[id] - Delete test
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    await prisma.test.delete({
      where: { id },
    })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Error deleting test:', error)

    if (error.code === 'P2025') {
      return NextResponse.json(
        { error: 'Test not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to delete test' },
      { status: 500 }
    )
  }
}
