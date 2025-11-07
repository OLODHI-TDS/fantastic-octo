import { NextResponse } from 'next/server'
import prisma from '@/lib/db/prisma'

// GET /api/reports - Get all generated reports
export async function GET() {
  try {
    const reports = await prisma.testReport.findMany({
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
