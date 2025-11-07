'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { FileText, Download, Calendar } from 'lucide-react'

interface TestReport {
  id: string
  title: string
  description: string | null
  groupingType: string
  groupingValue: string | null
  totalTests: number
  passedTests: number
  failedTests: number
  errorTests: number
  avgResponseTime: number | null
  pdfPath: string
  generatedAt: string
}

export default function ReportsPage() {
  const [reports, setReports] = useState<TestReport[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchReports()
  }, [])

  const fetchReports = async () => {
    try {
      const response = await fetch('/api/reports')
      if (response.ok) {
        const data = await response.json()
        setReports(data)
      }
    } catch (error) {
      console.error('Error fetching reports:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const getSuccessRate = (report: TestReport) => {
    if (report.totalTests === 0) return '0%'
    return `${((report.passedTests / report.totalTests) * 100).toFixed(1)}%`
  }

  const getGroupingBadge = (type: string) => {
    const colors: Record<string, string> = {
      manual: 'bg-blue-100 text-blue-800',
      endpoint: 'bg-purple-100 text-purple-800',
      date_range: 'bg-green-100 text-green-800',
      status: 'bg-yellow-100 text-yellow-800',
    }

    return (
      <Badge className={colors[type] || 'bg-gray-100 text-gray-800'}>
        {type.replace('_', ' ').toUpperCase()}
      </Badge>
    )
  }

  if (loading) {
    return (
      <div className="container mx-auto py-8 px-4">
        <p>Loading reports...</p>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-8 px-4 max-w-7xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Test Evidence Reports</h1>
        <p className="text-muted-foreground">
          View and download previously generated test evidence documents
        </p>
      </div>

      {reports.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <FileText className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No reports generated yet</p>
            <p className="text-sm text-muted-foreground mt-2">
              Generate reports from the Test Results page
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Generated Reports ({reports.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Tests</TableHead>
                  <TableHead>Passed</TableHead>
                  <TableHead>Failed</TableHead>
                  <TableHead>Success Rate</TableHead>
                  <TableHead>Avg Response Time</TableHead>
                  <TableHead>Generated</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {reports.map((report) => (
                  <TableRow key={report.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{report.title}</div>
                        {report.description && (
                          <div className="text-xs text-muted-foreground mt-1">
                            {report.description}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>{getGroupingBadge(report.groupingType)}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{report.totalTests}</Badge>
                    </TableCell>
                    <TableCell>
                      <span className="text-green-600 font-medium">
                        {report.passedTests}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className="text-red-600 font-medium">
                        {report.failedTests + report.errorTests}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          parseFloat(getSuccessRate(report)) >= 90
                            ? 'default'
                            : parseFloat(getSuccessRate(report)) >= 70
                            ? 'secondary'
                            : 'destructive'
                        }
                      >
                        {getSuccessRate(report)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {report.avgResponseTime !== null
                        ? `${report.avgResponseTime}ms`
                        : 'N/A'}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <Calendar className="h-3 w-3" />
                        {formatDate(report.generatedAt)}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => window.open(report.pdfPath, '_blank')}
                      >
                        <Download className="h-4 w-4 mr-2" />
                        Download
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
