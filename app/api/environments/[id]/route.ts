import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/db/prisma'
import { UpdateEnvironmentSchema } from '@/types/environment'
import { encrypt, decrypt } from '@/lib/salesforce/oauth'
import { auth } from '@/lib/auth'

// GET /api/environments/[id] - Get single environment
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const environment = await prisma.environment.findFirst({
      where: { id, userId: session.user.id },
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

    // Mask sensitive OAuth fields
    const maskedEnvironment = {
      ...environment,
      sfConnectedAppClientSecret: environment.sfConnectedAppClientSecret ? '••••••••' : null,
      sfRefreshToken: environment.sfRefreshToken ? '••••••••' : null,
    }

    return NextResponse.json(maskedEnvironment)
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
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    // Verify ownership
    const existing = await prisma.environment.findFirst({
      where: { id, userId: session.user.id },
    })
    if (!existing) {
      return NextResponse.json({ error: 'Environment not found' }, { status: 404 })
    }

    const body = await request.json()
    const validatedData = UpdateEnvironmentSchema.parse({ ...body, id })

    const updateData: any = { ...validatedData }
    delete updateData.id

    // Encrypt sfConnectedAppClientSecret if provided (and not masked placeholder)
    if (updateData.sfConnectedAppClientSecret && updateData.sfConnectedAppClientSecret !== '••••••••') {
      updateData.sfConnectedAppClientSecret = encrypt(updateData.sfConnectedAppClientSecret)
    } else if (updateData.sfConnectedAppClientSecret === '••••••••') {
      // If masked value sent back, don't update it
      delete updateData.sfConnectedAppClientSecret
    }

    // Don't update sfRefreshToken directly via PUT (managed by OAuth flow)
    if (updateData.sfRefreshToken === '••••••••') {
      delete updateData.sfRefreshToken
    }

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
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    // Verify ownership before deleting
    const existing = await prisma.environment.findFirst({
      where: { id, userId: session.user.id },
    })
    if (!existing) {
      return NextResponse.json({ error: 'Environment not found' }, { status: 404 })
    }

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
