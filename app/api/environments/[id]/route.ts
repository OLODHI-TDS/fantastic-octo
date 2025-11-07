import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/db/prisma'
import { UpdateEnvironmentSchema } from '@/types/environment'

// GET /api/environments/[id] - Get single environment
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const environment = await prisma.environment.findUnique({
      where: { id },
      include: {
        credentials: {
          select: {
            id: true,
            authType: true,
            orgName: true,
            memberId: true,
            branchId: true,
            description: true,
            active: true,
            environmentId: true,
          },
        },
        _count: {
          select: {
            credentials: true,
            tests: true,
          },
        },
      },
    })

    if (!environment) {
      return NextResponse.json(
        { error: 'Environment not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(environment)
  } catch (error) {
    console.error('Error fetching environment:', error)
    return NextResponse.json(
      { error: 'Failed to fetch environment' },
      { status: 500 }
    )
  }
}

// PUT /api/environments/[id] - Update environment
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const validatedData = UpdateEnvironmentSchema.parse({ ...body, id })

    const updateData: any = { ...validatedData }
    delete updateData.id

    const environment = await prisma.environment.update({
      where: { id },
      data: updateData,
      include: {
        credentials: {
          select: {
            id: true,
            authType: true,
            orgName: true,
            memberId: true,
            branchId: true,
            description: true,
            active: true,
            environmentId: true,
          },
        },
        _count: {
          select: {
            credentials: true,
            tests: true,
          },
        },
      },
    })

    return NextResponse.json(environment)
  } catch (error: any) {
    console.error('Error updating environment:', error)

    if (error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      )
    }

    if (error.code === 'P2025') {
      return NextResponse.json(
        { error: 'Environment not found' },
        { status: 404 }
      )
    }

    if (error.code === 'P2002') {
      return NextResponse.json(
        { error: 'Environment with this name already exists' },
        { status: 409 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to update environment' },
      { status: 500 }
    )
  }
}

// DELETE /api/environments/[id] - Delete environment
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    await prisma.environment.delete({
      where: { id },
    })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Error deleting environment:', error)

    if (error.code === 'P2025') {
      return NextResponse.json(
        { error: 'Environment not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to delete environment' },
      { status: 500 }
    )
  }
}
