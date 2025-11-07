import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/db/prisma'
import { CreateEnvironmentSchema } from '@/types/environment'

// GET /api/environments - List all environments
export async function GET() {
  try {
    const environments = await prisma.environment.findMany({
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

    return NextResponse.json(environments)
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
    const body = await request.json()
    const validatedData = CreateEnvironmentSchema.parse(body)

    const environment = await prisma.environment.create({
      data: validatedData,
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
