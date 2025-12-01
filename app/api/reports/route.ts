import { NextResponse } from 'next/server'
import prisma from '@/lib/db/prisma'
import { auth } from '@/lib/auth'

// GET /api/reports - Get all generated reports for the current user
export async function GET() {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const reports = await prisma.testReport.findMany({
      where: { userId: session.user.id },
      orderBy: {
        generatedAt: 'desc',
      },
    })

    return NextResponse.json(reports)
  } catch (error) {
    console.error('Error fetching reports:', error)
    return NextResponse.json(
      { error: 'Failed to fetch reports' },
      { status: 500 }
    )
  }
}
