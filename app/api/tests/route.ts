import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/db/prisma'
import { CreateTestSchema } from '@/types/test'
import { auth } from '@/lib/auth'

// GET /api/tests - List all tests (optionally filter by environment)
export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const searchParams = request.nextUrl.searchParams
    const environmentId = searchParams.get('environmentId')

    const tests = await prisma.test.findMany({
      where: {
        ...(environmentId ? { environmentId } : {}),
        environment: { userId: session.user.id },
      },
      include: {
        environment: {
          select: {
            id: true,
            name: true,
            type: true,
          },
        },
        credential: {
          select: {
            id: true,
            orgName: true,
            authType: true,
          },
        },
        _count: {
          select: {
            results: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    // Parse JSON strings back to objects
    const parsedTests = tests.map(test => ({
      ...test,
      headers: test.headers ? JSON.parse(test.headers) : undefined,
      body: test.body ? JSON.parse(test.body) : undefined,
      validations: test.validations ? JSON.parse(test.validations) : undefined,
    }))

    return NextResponse.json(parsedTests)
  } catch (error) {
    console.error('Error fetching tests:', error)
    return NextResponse.json(
      { error: 'Failed to fetch tests' },
      { status: 500 }
    )
  }
}

// POST /api/tests - Create new test
export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const validatedData = CreateTestSchema.parse(body)

    // Verify the environment belongs to the user
    const environment = await prisma.environment.findFirst({
      where: { id: validatedData.environmentId, userId: session.user.id },
    })
    if (!environment) {
      return NextResponse.json({ error: 'Environment not found' }, { status: 404 })
    }

    // Handle empty credentialId (for fixed API key endpoints)
    const credentialId = validatedData.credentialId && validatedData.credentialId.trim() !== ''
      ? validatedData.credentialId
      : null

    const test = await prisma.test.create({
      data: {
        ...validatedData,
        credentialId, // Use sanitized credentialId (null if empty)
        headers: validatedData.headers ? JSON.stringify(validatedData.headers) : null,
        body: validatedData.body ? JSON.stringify(validatedData.body) : null,
        validations: validatedData.validations ? JSON.stringify(validatedData.validations) : null,
      },
      include: {
        environment: {
          select: {
            id: true,
            name: true,
            type: true,
          },
        },
        credential: {
          select: {
            id: true,
            orgName: true,
            authType: true,
          },
        },
        _count: {
          select: {
            results: true,
          },
        },
      },
    })

    return NextResponse.json(
      {
        ...test,
        headers: test.headers ? JSON.parse(test.headers) : undefined,
        body: test.body ? JSON.parse(test.body) : undefined,
        validations: test.validations ? JSON.parse(test.validations) : undefined,
      },
      { status: 201 }
    )
  } catch (error: any) {
    console.error('Error creating test:', error)

    if (error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to create test' },
      { status: 500 }
    )
  }
}
