import PDFDocument from 'pdfkit'
import { put } from '@vercel/blob'

export interface TestResultData {
  id: string
  testId: string
  test: {
    id: string
    name: string
    method: string
    endpoint: string
    expectedStatus: number
  }
  credential: {
    id: string
    orgName: string
    authType: string
  } | null
  status: 'passed' | 'failed' | 'error'
  manualStatus?: 'passed' | 'failed' | 'error' | null
  statusCode: number
  responseTime: number
  request: any
  response: any
  error?: string | null
  notes?: string | null
  verificationResults?: any
  verificationPassed?: boolean | null
  verificationError?: string | null
  executedAt: string
}

export interface ReportData {
  title: string
  description?: string
  tests: TestResultData[]
  environmentName: string
  instanceUrl: string
  generatedAt: Date
}

export interface GeneratePDFOptions {
  title: string
  description?: string
  testResults: any[]
  environmentName: string
  instanceUrl: string
  groupingType: string
  groupingValue?: string
}

export interface GeneratePDFResult {
  success: boolean
  pdfPath?: string
  fileName?: string
  error?: string
}

export async function generateTestReportPDF(
  options: GeneratePDFOptions
): Promise<GeneratePDFResult> {
  try {
    const {
      title,
      description,
      testResults,
      environmentName,
      instanceUrl,
    } = options

    // Generate unique filename
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
    const fileName = `test-report-${timestamp}.pdf`

    // Prepare report data
    const reportData: ReportData = {
      title,
      description,
      tests: testResults.map((result) => ({
        id: result.id,
        testId: result.testId,
        test: {
          id: result.test.id,
          name: result.test.name,
          method: result.test.method,
          endpoint: result.test.endpoint,
          expectedStatus: result.test.expectedStatus || 200,
        },
        credential: result.credential ? {
          id: result.credential.id,
          orgName: result.credential.orgName,
          authType: result.credential.authType,
        } : null,
        status: result.status,
        manualStatus: result.manualStatus || null,
        statusCode: result.statusCode,
        responseTime: result.responseTime,
        request: typeof result.request === 'string'
          ? JSON.parse(result.request)
          : result.request,
        response: typeof result.response === 'string'
          ? JSON.parse(result.response)
          : result.response,
        error: result.error,
        notes: result.notes || null,
        verificationResults: result.verificationResults
          ? (typeof result.verificationResults === 'string'
            ? JSON.parse(result.verificationResults)
            : result.verificationResults)
          : undefined,
        verificationPassed: result.verificationPassed ?? null,
        verificationError: result.verificationError || null,
        executedAt: result.executedAt,
      })),
      environmentName,
      instanceUrl,
      generatedAt: new Date(),
    }

    // Generate PDF using PDFKit
    console.log('Creating PDF document with data:', {
      title,
      testsCount: reportData.tests.length,
      generatedAt: reportData.generatedAt.toISOString(),
    })

    // Generate PDF in memory
    const pdfBuffer = await new Promise<Buffer>((resolve, reject) => {
      try {
        const doc = new PDFDocument({ size: 'A4', margin: 50 })
        const buffers: Buffer[] = []

        doc.on('data', buffers.push.bind(buffers))
        doc.on('end', () => {
          const pdfData = Buffer.concat(buffers)
          resolve(pdfData)
        })
        doc.on('error', reject)

        // Calculate statistics using effective status (manualStatus if set, otherwise status)
        const totalTests = reportData.tests.length
        const passedTests = reportData.tests.filter((t) => (t.manualStatus || t.status) === 'passed').length
        const failedTests = reportData.tests.filter((t) => (t.manualStatus || t.status) === 'failed').length
        const errorTests = reportData.tests.filter((t) => (t.manualStatus || t.status) === 'error').length
        const successRate = totalTests > 0 ? ((passedTests / totalTests) * 100).toFixed(1) : '0.0'
        const avgResponseTime = totalTests > 0
          ? Math.round(reportData.tests.reduce((sum, t) => sum + t.responseTime, 0) / totalTests)
          : 0

        // Header
        doc.fontSize(24).fillColor('#1e40af').text(title, { align: 'left' })
        if (description) {
          doc.fontSize(12).fillColor('#64748b').text(description, { align: 'left' })
        }
        doc.fontSize(10).fillColor('#64748b')
          .text(`Generated: ${reportData.generatedAt.toLocaleString('en-GB')}`, { align: 'left' })
        doc.moveDown(2)

        // Executive Summary
        doc.fontSize(14).fillColor('#1e40af').text('EXECUTIVE SUMMARY', { underline: true })
        doc.moveDown(0.5)
        doc.fontSize(10).fillColor('#000000')
        doc.text(`Total Tests: ${totalTests}`)
        doc.fillColor('#16a34a').text(`Passed: ${passedTests}`)
        doc.fillColor('#dc2626').text(`Failed: ${failedTests}`)
        doc.fillColor('#ca8a04').text(`Errors: ${errorTests}`)
        doc.fillColor('#000000').text(`Success Rate: ${successRate}%`)
        doc.text(`Average Response Time: ${avgResponseTime}ms`)
        doc.moveDown(2)

        // Note: Environment details are shown per-test below since tests may use different credentials/environments
        doc.moveDown(1)

        // Test Results
        doc.fontSize(14).fillColor('#1e40af').text('TEST RESULTS', { underline: true })
        doc.moveDown(1)

        reportData.tests.forEach((test, index) => {
          // Check if we need a new page
          if (doc.y > 650) {
            doc.addPage()
          }

          // Test header
          doc.fontSize(12).fillColor('#000000')
            .text(`${index + 1}. ${test.test.name}`, { underline: false })

          // Status badge (use effective status: manualStatus if set, otherwise status)
          const effectiveStatus = test.manualStatus || test.status
          const statusColor = effectiveStatus === 'passed' ? '#16a34a' : effectiveStatus === 'failed' ? '#dc2626' : '#ca8a04'
          doc.fontSize(10).fillColor(statusColor).text(`[${effectiveStatus.toUpperCase()}]`)

          // Show if status was manually overridden
          if (test.manualStatus) {
            doc.fontSize(8).fillColor('#64748b').text(`(Manual override - actual result: ${test.status})`)
          }

          // Test metadata
          doc.fontSize(9).fillColor('#64748b')
          doc.text(`Credential: ${test.credential ? `${test.credential.orgName} (${test.credential.authType})` : 'Fixed API Key'}`)
          doc.text(`Endpoint: ${test.test.method} ${test.test.endpoint}`)
          doc.text(`Status Code: ${test.statusCode} (Expected: ${test.test.expectedStatus})`)
          doc.text(`Response Time: ${test.responseTime}ms`)
          doc.text(`Executed: ${new Date(test.executedAt).toLocaleString('en-GB')}`)

          if (test.error) {
            doc.fillColor('#dc2626').text(`Error: ${test.error}`)
          }

          // Notes (if present)
          if (test.notes) {
            doc.moveDown(0.5)
            doc.fontSize(9).fillColor('#475569').text('NOTES:', { underline: true })
            doc.fontSize(9).fillColor('#1e293b')
            doc.text(test.notes, { width: 500 })
          }

          // Verification Results (if present)
          if (test.verificationResults || test.verificationError) {
            doc.moveDown(0.5)
            doc.fontSize(9).fillColor('#475569').text('SALESFORCE VERIFICATION:', { underline: true })

            // Verification Status
            const verificationStatusColor = test.verificationPassed === true ? '#16a34a' : test.verificationPassed === false ? '#dc2626' : '#ca8a04'
            const verificationStatusText = test.verificationPassed === true ? 'PASSED' : test.verificationPassed === false ? 'FAILED' : 'ERROR'
            doc.fontSize(9).fillColor(verificationStatusColor).text(`Status: ${verificationStatusText}`)

            // Verification Error
            if (test.verificationError) {
              doc.fontSize(8).fillColor('#dc2626').text(`Error: ${test.verificationError}`, { width: 500 })
            }

            // Verification Checks
            if (test.verificationResults && Array.isArray(test.verificationResults)) {
              doc.moveDown(0.3)
              test.verificationResults.forEach((check: any) => {
                const checkStatusColor = check.passed ? '#16a34a' : '#dc2626'
                const checkStatusIcon = check.passed ? '✓' : '✗'
                doc.fontSize(8).fillColor(checkStatusColor)
                  .text(`${checkStatusIcon} ${check.field}: Expected ${JSON.stringify(check.expected)}, Got ${JSON.stringify(check.actual)}`, { width: 500 })
                if (check.message) {
                  doc.fontSize(7).fillColor('#64748b').text(`   ${check.message}`, { width: 500 })
                }
              })
            }
          }

          doc.moveDown(0.5)

          // Request
          doc.fontSize(9).fillColor('#475569').text('REQUEST:', { underline: true })
          doc.fontSize(8).fillColor('#1e293b').font('Courier')
          doc.text(JSON.stringify(test.request, null, 2), { width: 500 })
          doc.font('Helvetica')

          doc.moveDown(0.5)

          // Response (truncate if too long)
          doc.fontSize(9).fillColor('#475569').text('RESPONSE:', { underline: true })
          doc.fontSize(8).fillColor('#1e293b').font('Courier')
          const responseStr = JSON.stringify(test.response, null, 2)
          doc.text(responseStr.length > 1000 ? responseStr.substring(0, 1000) + '...' : responseStr, { width: 500 })
          doc.font('Helvetica')

          doc.moveDown(1)
        })

        // Footer
        const range = doc.bufferedPageRange()
        for (let i = 0; i < range.count; i++) {
          doc.switchToPage(range.start + i)
          doc.fontSize(8).fillColor('#64748b')
          doc.text(
            `Generated by EWC API Test Bench - Page ${i + 1} of ${range.count}`,
            50,
            doc.page.height - 50,
            { align: 'center' }
          )
        }

        doc.end()
      } catch (error: any) {
        console.error('Error creating PDF:', error)
        reject(error)
      }
    })

    console.log('PDF buffer created, size:', pdfBuffer.length, 'bytes')

    // Upload to Vercel Blob Storage
    console.log('Uploading PDF to Vercel Blob Storage...')
    const blob = await put(fileName, pdfBuffer, {
      access: 'public',
      contentType: 'application/pdf',
    })

    console.log('PDF uploaded successfully to:', blob.url)

    return {
      success: true,
      pdfPath: blob.url,
      fileName,
    }
  } catch (error: any) {
    console.error('Error generating PDF:', error)
    return {
      success: false,
      error: error.message || 'Failed to generate PDF',
    }
  }
}
