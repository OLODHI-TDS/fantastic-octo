import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/db/prisma'
import { CreateEnvironmentSchema } from '@/types/environment'
import { encrypt, decrypt } from '@/lib/salesforce/oauth'
import { auth } from '@/lib/auth'

// GET /api/environments - List all environments for the current user
export async function GET() {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const environments = await prisma.environment.findMany({
      where: { userId: session.user.id },
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
      orderBy: { createdAt: 'desc' },
    })

    // Map environments to mask sensitive OAuth fields but indicate if they're configured
    const mappedEnvironments = environments.map(env => ({
      ...env,
      // Don't expose the actual secret, just indicate if it's configured
      sfConnectedAppClientSecret: env.sfConnectedAppClientSecret ? '••••••••' : null,
      sfRefreshToken: env.sfRefreshToken ? '••••••••' : null,
    }))

    return NextResponse.json(mappedEnvironments)
  } catch (error) {
    console.error('Error fetching environments:', error)
    return NextResponse.json(
      { error: 'Failed to fetch environments' },
      { status: 500 }
    )
  }
}

// POST /api/environments - Create new environment
export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const validatedData = CreateEnvironmentSchema.parse(body)

    // Prepare data, encrypting sensitive OAuth fields
    const createData: any = { ...validatedData, userId: session.user.id }
    if (createData.sfConnectedAppClientSecret) {
      createData.sfConnectedAppClientSecret = encrypt(createData.sfConnectedAppClientSecret)
    }

    const environment = await prisma.environment.create({
      data: createData,
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

    return NextResponse.json(environment, { status: 201 })
  } catch (error: any) {
    console.error('Error creating environment:', error)

    if (error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      )
    }

    if (error.code === 'P2002') {
      return NextResponse.json(
        { error: 'Environment with this name already exists' },
        { status: 409 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to create environment' },
      { status: 500 }
    )
  }
}
