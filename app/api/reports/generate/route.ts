import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/db/prisma'
import { generateTestReportPDF } from '@/lib/pdf/generator'
import { auth } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { title, description, resultIds, groupingType, groupingValue } = body

    // Validate input
    if (!title || !resultIds || !Array.isArray(resultIds) || resultIds.length === 0) {
      return NextResponse.json(
        { error: 'Invalid request. Title and resultIds are required.' },
        { status: 400 }
      )
    }

    console.log(`Generating report for ${resultIds.length} test results...`)

    // Fetch test results from database with all related data (verify ownership)
    const fetchedResults = await prisma.testResult.findMany({
      where: {
        id: { in: resultIds },
        test: { environment: { userId: session.user.id } },
      },
      include: {
        test: {
          select: {
            id: true,
            name: true,
            method: true,
            endpoint: true,
            expectedStatus: true,
            environment: {
              select: {
                name: true,
                instanceUrl: true,
              },
            },
          },
        },
        credential: {
          select: {
            id: true,
            orgName: true,
            authType: true,
          },
        },
      },
    })

    if (fetchedResults.length === 0) {
      return NextResponse.json(
        { error: 'No test results found for the provided IDs' },
        { status: 404 }
      )
    }

    // Sort results to match the order of resultIds (preserves drag-and-drop order from UI)
    const resultMap = new Map(fetchedResults.map(r => [r.id, r]))
    const testResults = resultIds
      .map(id => resultMap.get(id))
      .filter((r): r is NonNullable<typeof r> => r !== undefined)

    // Get environment details from first test
    const environmentName = testResults[0].test.environment.name
    const instanceUrl = testResults[0].test.environment.instanceUrl

    // Generate PDF
    const pdfResult = await generateTestReportPDF({
      title,
      description,
      testResults,
      environmentName,
      instanceUrl,
      groupingType: groupingType || 'manual',
      groupingValue,
    })

    if (!pdfResult.success) {
      return NextResponse.json(
        { error: pdfResult.error || 'Failed to generate PDF' },
        { status: 500 }
      )
    }

    // Calculate statistics using effective status (manualStatus if set, otherwise status)
    const totalTests = testResults.length
    const passedTests = testResults.filter((t) => (t.manualStatus || t.status) === 'passed').length
    const failedTests = testResults.filter((t) => (t.manualStatus || t.status) === 'failed').length
    const errorTests = testResults.filter((t) => (t.manualStatus || t.status) === 'error').length
    const avgResponseTime = Math.round(
      testResults.reduce((sum, t) => sum + t.responseTime, 0) / totalTests
    )

    // Save report metadata to database
    const testReport = await prisma.testReport.create({
      data: {
        title,
        description: description || null,
        groupingType: groupingType || 'manual',
        groupingValue: groupingValue || null,
        resultIds: JSON.stringify(resultIds),
        totalTests,
        passedTests,
        failedTests,
        errorTests,
        avgResponseTime,
        pdfPath: pdfResult.pdfPath!,
        userId: session.user.id,
      },
    })

    console.log(`Report generated successfully: ${testReport.id}`)

    return NextResponse.json({
      success: true,
      report: {
        id: testReport.id,
        title: testReport.title,
        pdfPath: testReport.pdfPath,
        fileName: pdfResult.fileName,
        totalTests,
        passedTests,
        failedTests,
        errorTests,
        generatedAt: testReport.generatedAt,
      },
    })
  } catch (error: any) {
    console.error('Error generating report:', error)
    return NextResponse.json(
      {
        error: 'Failed to generate report',
        details: error.message,
      },
      { status: 500 }
    )
  }
}
