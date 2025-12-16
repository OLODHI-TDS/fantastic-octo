'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { useToast } from '@/hooks/use-toast'
import { CheckCircle2, XCircle, AlertCircle, Clock, FileText, Download, Edit2, Trash2, GripVertical, Sparkles } from 'lucide-react'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

interface TestResult {
  id: string
  test: {
    id: string
    name: string
    method: string
    endpoint: string
    expectedStatus: number
    environment: {
      name: string
      instanceUrl: string
    }
  }
  credential: {
    id: string
    orgName: string
    authType: string
    memberId: string
    branchId: string
  } | null
  status: string
  manualStatus: string | null
  statusCode: number
  responseTime: number
  request: string
  response: string
  validationResults: string | null
  verificationResults: string | null
  verificationPassed: boolean | null
  verificationError: string | null
  error: string | null
  notes: string | null
  executedAt: string
}

// Sortable Item Component for drag-and-drop
interface SortableTestItemProps {
  id: string
  result: TestResult
  index: number
}

function SortableTestItem({ id, result, index }: SortableTestItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg border"
    >
      <div
        {...attributes}
        {...listeners}
        className="cursor-grab active:cursor-grabbing touch-none"
      >
        <GripVertical className="h-5 w-5 text-muted-foreground" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-mono text-muted-foreground">#{index + 1}</span>
          <span className="text-sm font-medium truncate">{result.test.name}</span>
        </div>
        <div className="text-xs text-muted-foreground mt-1">
          {result.test.method} • {result.credential?.orgName || 'Fixed API Key'}
        </div>
      </div>
    </div>
  )
}

export default function ResultsPage() {
  const [results, setResults] = useState<TestResult[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [orderedIds, setOrderedIds] = useState<string[]>([]) // For drag-and-drop ordering
  const [dialogOpen, setDialogOpen] = useState(false)
  const [reportTitle, setReportTitle] = useState('')
  const [reportDescription, setReportDescription] = useState('')
  const [generating, setGenerating] = useState(false)
  const [selectedResult, setSelectedResult] = useState<TestResult | null>(null)
  const [detailDialogOpen, setDetailDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<'bulk' | 'single' | null>(null)
  const [editedNotes, setEditedNotes] = useState<string>('')
  const [savingNotes, setSavingNotes] = useState(false)

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1)
  const [perPage, setPerPage] = useState(50)
  const [totalCount, setTotalCount] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const [hasNext, setHasNext] = useState(false)
  const [hasPrev, setHasPrev] = useState(false)

  // Filter state
  const [endpointFilter, setEndpointFilter] = useState<string>('all')
  const [dateRangeFilter, setDateRangeFilter] = useState<string>('all')
  const [customStartDate, setCustomStartDate] = useState<string>('')
  const [customEndDate, setCustomEndDate] = useState<string>('')

  const { toast} = useToast()

  // Drag and drop sensors
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  // Extract unique endpoints for filter
  const uniqueEndpoints = Array.from(new Set(results.map(r => r.test.endpoint))).sort()

  // Calculate date range based on preset
  const getDateRange = () => {
    const now = new Date()
    let startDate: Date | null = null
    let endDate: Date | null = new Date()

    switch (dateRangeFilter) {
      case 'last-24h':
        startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000)
        break
      case 'last-7d':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
        break
      case 'last-30d':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
        break
      case 'last-90d':
        startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000)
        break
      case 'custom':
        startDate = customStartDate ? new Date(customStartDate) : null
        endDate = customEndDate ? new Date(customEndDate + 'T23:59:59') : null
        break
      case 'all':
      default:
        startDate = null
        endDate = null
        break
    }

    return { startDate, endDate }
  }

  // Apply filters
  const filteredResults = results.filter(r => {
    // Apply endpoint filter
    const matchesEndpoint = endpointFilter === 'all' || r.test.endpoint === endpointFilter

    // Apply date range filter
    const { startDate, endDate } = getDateRange()
    let matchesDateRange = true

    if (startDate || endDate) {
      const executedAt = new Date(r.executedAt)
      if (startDate && executedAt < startDate) matchesDateRange = false
      if (endDate && executedAt > endDate) matchesDateRange = false
    }

    return matchesEndpoint && matchesDateRange
  })

  useEffect(() => {
    fetchResults()
  }, [currentPage, perPage])

  const fetchResults = async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/test-results?page=${currentPage}&limit=${perPage}`)
      if (response.ok) {
        const data = await response.json()
        setResults(data.results)
        setTotalCount(data.pagination.totalCount)
        setTotalPages(data.pagination.totalPages)
        setHasNext(data.pagination.hasNext)
        setHasPrev(data.pagination.hasPrev)
      }
    } catch (error) {
      console.error('Error fetching results:', error)
    } finally {
      setLoading(false)
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'passed':
        return <CheckCircle2 className="h-5 w-5 text-green-500" />
      case 'failed':
        return <XCircle className="h-5 w-5 text-red-500" />
      case 'error':
        return <AlertCircle className="h-5 w-5 text-yellow-500" />
      default:
        return null
    }
  }

  const getStatusBadge = (status: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
      passed: 'default',
      failed: 'destructive',
      error: 'secondary',
    }
    return (
      <Badge variant={variants[status] || 'outline'}>
        {status.toUpperCase()}
      </Badge>
    )
  }

  const getMethodColor = (method: string) => {
    switch (method?.toUpperCase()) {
      case 'GET':
        return 'bg-blue-500'
      case 'POST':
        return 'bg-green-500'
      case 'PUT':
        return 'bg-yellow-500'
      case 'PATCH':
        return 'bg-purple-500'
      case 'DELETE':
        return 'bg-red-500'
      default:
        return 'bg-gray-500'
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

  const toggleSelection = (id: string) => {
    const newSelected = new Set(selectedIds)
    if (newSelected.has(id)) {
      newSelected.delete(id)
    } else {
      newSelected.add(id)
    }
    setSelectedIds(newSelected)
  }

  const toggleSelectAll = () => {
    if (selectedIds.size === results.length) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(results.map((r) => r.id)))
    }
  }

  const openGenerateDialog = () => {
    if (selectedIds.size === 0) {
      toast({
        variant: 'destructive',
        title: 'No Tests Selected',
        description: 'Please select at least one test result to generate a report.',
      })
      return
    }

    // Initialize ordered IDs from selected IDs
    // Order by execution time (most recent first) by default
    const ordered = results
      .filter(r => selectedIds.has(r.id))
      .sort((a, b) => new Date(b.executedAt).getTime() - new Date(a.executedAt).getTime())
      .map(r => r.id)

    setOrderedIds(ordered)
    setDialogOpen(true)
  }

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event

    if (over && active.id !== over.id) {
      setOrderedIds((items) => {
        const oldIndex = items.indexOf(active.id as string)
        const newIndex = items.indexOf(over.id as string)
        return arrayMove(items, oldIndex, newIndex)
      })
    }
  }

  const generateReport = async () => {
    if (!reportTitle.trim()) {
      toast({
        variant: 'destructive',
        title: 'Title Required',
        description: 'Please enter a title for the report.',
      })
      return
    }

    setGenerating(true)
    try {
      const response = await fetch('/api/reports/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: reportTitle,
          description: reportDescription || undefined,
          resultIds: orderedIds, // Use ordered IDs instead of selectedIds
          groupingType: 'manual',
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to generate report')
      }

      const data = await response.json()

      toast({
        title: 'Report Generated',
        description: `${data.report.title} has been generated successfully.`,
      })

      // Download the PDF
      window.open(data.report.pdfPath, '_blank')

      // Reset dialog
      setDialogOpen(false)
      setReportTitle('')
      setReportDescription('')
      setSelectedIds(new Set())
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Generation Failed',
        description: error.message || 'Failed to generate report',
      })
    } finally {
      setGenerating(false)
    }
  }

  const updateManualStatus = async (resultId: string, manualStatus: string | null) => {
    try {
      const response = await fetch(`/api/results/${resultId}/manual-status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ manualStatus }),
      })

      if (!response.ok) {
        throw new Error('Failed to update status')
      }

      // Update local state
      setResults((prev) =>
        prev.map((r) =>
          r.id === resultId ? { ...r, manualStatus } : r
        )
      )

      toast({
        title: 'Status Updated',
        description: manualStatus
          ? `Manually set to ${manualStatus.toUpperCase()}`
          : 'Reset to actual status',
      })
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Update Failed',
        description: error.message || 'Failed to update status',
      })
    }
  }

  const getEffectiveStatus = (result: TestResult) => {
    return result.manualStatus || result.status
  }

  const openDetailDialog = (result: TestResult) => {
    setSelectedResult(result)
    setEditedNotes(result.notes || '')
    setDetailDialogOpen(true)
  }

  const saveNotes = async () => {
    if (!selectedResult) return

    setSavingNotes(true)
    try {
      const response = await fetch(`/api/results/${selectedResult.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notes: editedNotes }),
      })

      if (!response.ok) {
        throw new Error('Failed to save notes')
      }

      toast({
        title: 'Notes Saved',
        description: 'Test notes updated successfully.',
      })

      // Update local state
      setResults((prev) =>
        prev.map((r) =>
          r.id === selectedResult.id ? { ...r, notes: editedNotes } : r
        )
      )
      setSelectedResult({ ...selectedResult, notes: editedNotes })
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Save Failed',
        description: error.message || 'Failed to save notes',
      })
    } finally {
      setSavingNotes(false)
    }
  }

  const parseJSON = (jsonString: string) => {
    try {
      return JSON.parse(jsonString)
    } catch {
      return jsonString
    }
  }

  const openDeleteDialog = (target: 'bulk' | 'single') => {
    if (target === 'bulk' && selectedIds.size === 0) {
      toast({
        variant: 'destructive',
        title: 'No Tests Selected',
        description: 'Please select at least one test result to delete.',
      })
      return
    }
    setDeleteTarget(target)
    setDeleteDialogOpen(true)
  }

  const handleDelete = async () => {
    setDeleting(true)
    try {
      if (deleteTarget === 'bulk') {
        // Bulk delete
        const response = await fetch('/api/results', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ids: Array.from(selectedIds) }),
        })

        if (!response.ok) {
          throw new Error('Failed to delete test results')
        }

        const data = await response.json()

        toast({
          title: 'Tests Deleted',
          description: `Successfully deleted ${data.deletedCount} test result${data.deletedCount !== 1 ? 's' : ''}.`,
        })

        // Clear selection and refresh
        setSelectedIds(new Set())
        fetchResults()
      } else if (deleteTarget === 'single' && selectedResult) {
        // Single delete
        const response = await fetch(`/api/results/${selectedResult.id}`, {
          method: 'DELETE',
        })

        if (!response.ok) {
          throw new Error('Failed to delete test result')
        }

        toast({
          title: 'Test Deleted',
          description: 'Test result deleted successfully.',
        })

        // Close detail dialog and refresh
        setDetailDialogOpen(false)
        setSelectedResult(null)
        fetchResults()
      }

      setDeleteDialogOpen(false)
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Delete Failed',
        description: error.message || 'Failed to delete test results',
      })
    } finally {
      setDeleting(false)
      setDeleteTarget(null)
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto py-8 px-4">
        <p>Loading results...</p>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-8 px-4 max-w-7xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Test Results</h1>
        <p className="text-muted-foreground">
          View test execution history and generate reports
        </p>
      </div>

      {results.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <p className="text-muted-foreground">No test results yet</p>
            <p className="text-sm text-muted-foreground mt-2">
              Run some tests to see results here
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          <Card className="mb-4">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <Checkbox
                    id="select-all"
                    checked={selectedIds.size === results.length && results.length > 0}
                    onCheckedChange={toggleSelectAll}
                  />
                  <Label htmlFor="select-all" className="cursor-pointer">
                    Select All ({selectedIds.size} of {results.length} selected)
                  </Label>
                </div>
                <div className="flex items-center gap-2">
                  {selectedIds.size > 0 && (
                    <>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedIds(new Set())}
                      >
                        Clear Selection
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => openDeleteDialog('bulk')}
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete Selected
                      </Button>
                    </>
                  )}
                  <Button
                    onClick={openGenerateDialog}
                    disabled={selectedIds.size === 0}
                  >
                    <FileText className="mr-2 h-4 w-4" />
                    Generate Report
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Filters Card */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Filters</CardTitle>
              <CardDescription>Filter test results by endpoint and date range</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Endpoint Filter */}
                <div className="space-y-2">
                  <Label htmlFor="endpoint-filter">Endpoint</Label>
                  <Select
                    value={endpointFilter}
                    onValueChange={setEndpointFilter}
                  >
                    <SelectTrigger id="endpoint-filter">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Endpoints</SelectItem>
                      {uniqueEndpoints.map((endpoint) => (
                        <SelectItem key={endpoint} value={endpoint}>
                          {endpoint}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Date Range Filter */}
                <div className="space-y-2">
                  <Label htmlFor="date-range-filter">Date Range</Label>
                  <Select
                    value={dateRangeFilter}
                    onValueChange={(value) => {
                      setDateRangeFilter(value)
                      if (value !== 'custom') {
                        setCustomStartDate('')
                        setCustomEndDate('')
                      }
                    }}
                  >
                    <SelectTrigger id="date-range-filter">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Time</SelectItem>
                      <SelectItem value="last-24h">Last 24 Hours</SelectItem>
                      <SelectItem value="last-7d">Last 7 Days</SelectItem>
                      <SelectItem value="last-30d">Last 30 Days</SelectItem>
                      <SelectItem value="last-90d">Last 90 Days</SelectItem>
                      <SelectItem value="custom">Custom Range</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Custom Date Range Inputs */}
                {dateRangeFilter === 'custom' && (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="start-date">Start Date</Label>
                      <Input
                        id="start-date"
                        type="date"
                        value={customStartDate}
                        onChange={(e) => setCustomStartDate(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="end-date">End Date</Label>
                      <Input
                        id="end-date"
                        type="date"
                        value={customEndDate}
                        onChange={(e) => setCustomEndDate(e.target.value)}
                      />
                    </div>
                  </>
                )}
              </div>

              {/* Clear All Filters Button */}
              {(endpointFilter !== 'all' || dateRangeFilter !== 'all') && (
                <div className="mt-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setEndpointFilter('all')
                      setDateRangeFilter('all')
                      setCustomStartDate('')
                      setCustomEndDate('')
                    }}
                  >
                    Clear All Filters
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Test Execution History</CardTitle>
                  <CardDescription>
                    Showing {filteredResults.length} of {totalCount} results
                    {(endpointFilter !== 'all' || dateRangeFilter !== 'all') && ' (filtered)'}
                    {' • '}Page {currentPage} of {totalPages}
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Label htmlFor="per-page" className="text-sm whitespace-nowrap">
                    Per page:
                  </Label>
                  <Select
                    value={perPage.toString()}
                    onValueChange={(value) => {
                      setPerPage(parseInt(value))
                      setCurrentPage(1) // Reset to first page when changing per page
                    }}
                  >
                    <SelectTrigger id="per-page" className="w-24">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="10">10</SelectItem>
                      <SelectItem value="25">25</SelectItem>
                      <SelectItem value="50">50</SelectItem>
                      <SelectItem value="100">100</SelectItem>
                      <SelectItem value="250">250</SelectItem>
                      <SelectItem value="500">500</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12"></TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Manual Override</TableHead>
                    <TableHead>Test Name</TableHead>
                    <TableHead>Method</TableHead>
                    <TableHead>Endpoint</TableHead>
                    <TableHead>Credential</TableHead>
                    <TableHead>Status Code</TableHead>
                    <TableHead>Response Time</TableHead>
                    <TableHead>Executed At</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredResults.map((result) => (
                    <TableRow
                      key={result.id}
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={(e) => {
                        // Don't open detail if clicking checkbox or select
                        if (
                          (e.target as HTMLElement).closest('button') ||
                          (e.target as HTMLElement).closest('[role="combobox"]')
                        ) {
                          return
                        }
                        openDetailDialog(result)
                      }}
                    >
                      <TableCell>
                        <Checkbox
                          checked={selectedIds.has(result.id)}
                          onCheckedChange={() => toggleSelection(result.id)}
                        />
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-1 items-start">
                          <div className="flex items-center gap-2">
                            {getStatusIcon(getEffectiveStatus(result))}
                            {getStatusBadge(getEffectiveStatus(result))}
                            {result.manualStatus && (
                              <span className="text-xs text-muted-foreground">
                                (was {result.status})
                              </span>
                            )}
                          </div>
                          {result.verificationResults && (
                            <div
                              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ml-7 ${
                                result.verificationPassed
                                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                  : 'bg-red-50 text-red-700 border border-red-200'
                              }`}
                              title={result.verificationPassed ? "Salesforce verification passed" : "Salesforce verification failed"}
                            >
                              <Sparkles className={`h-3 w-3 ${result.verificationPassed ? 'text-emerald-500' : 'text-red-500'}`} />
                              <span>{result.verificationPassed ? 'Verified' : 'Not Verified'}</span>
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Select
                          value={result.manualStatus || 'auto'}
                          onValueChange={(value) =>
                            updateManualStatus(result.id, value === 'auto' ? null : value)
                          }
                        >
                          <SelectTrigger className="w-32">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="auto">Auto</SelectItem>
                            <SelectItem value="passed">
                              <span className="text-green-600">Passed</span>
                            </SelectItem>
                            <SelectItem value="failed">
                              <span className="text-red-600">Failed</span>
                            </SelectItem>
                            <SelectItem value="error">
                              <span className="text-yellow-600">Error</span>
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                    <TableCell className="font-medium">
                      {result.test.name}
                    </TableCell>
                    <TableCell>
                      <Badge className={`${getMethodColor(result.test.method)} text-white font-mono text-xs`}>
                        {result.test.method}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <code className="text-xs bg-muted px-2 py-1 rounded">
                        {result.test.endpoint}
                      </code>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <div>{result.credential?.orgName || 'Fixed API Key'}</div>
                        <div className="text-xs text-muted-foreground">
                          {result.credential?.authType || 'N/A'}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className={`font-mono ${result.statusCode >= 400 ? 'text-red-500' : 'text-green-500'}`}>
                        {result.statusCode}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        <span className="text-sm">{result.responseTime}ms</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {formatDate(result.executedAt)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            {/* No results after filtering */}
            {results.length > 0 && filteredResults.length === 0 && (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <p className="text-muted-foreground">No results match the selected filters</p>
                <Button
                  variant="link"
                  onClick={() => {
                    setEndpointFilter('all')
                    setDateRangeFilter('all')
                    setCustomStartDate('')
                    setCustomEndDate('')
                  }}
                  className="mt-2"
                >
                  Clear all filters
                </Button>
              </div>
            )}

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between pt-4 mt-4 border-t">
                <div className="text-sm text-muted-foreground">
                  Showing {((currentPage - 1) * perPage) + 1} to {Math.min(currentPage * perPage, totalCount)} of {totalCount} results
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(1)}
                    disabled={!hasPrev || loading}
                  >
                    First
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={!hasPrev || loading}
                  >
                    Previous
                  </Button>
                  <div className="flex items-center gap-1">
                    <span className="text-sm">Page</span>
                    <Input
                      type="number"
                      min="1"
                      max={totalPages}
                      value={currentPage}
                      onChange={(e) => {
                        const page = parseInt(e.target.value)
                        if (page >= 1 && page <= totalPages) {
                          setCurrentPage(page)
                        }
                      }}
                      className="w-16 h-8 text-center"
                    />
                    <span className="text-sm">of {totalPages}</span>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                    disabled={!hasNext || loading}
                  >
                    Next
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(totalPages)}
                    disabled={!hasNext || loading}
                  >
                    Last
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
        </>
      )}

      {/* Generate Report Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Generate Test Evidence Report</DialogTitle>
            <DialogDescription>
              Create a comprehensive PDF report for the {selectedIds.size} selected test{selectedIds.size !== 1 ? 's' : ''}. Drag to reorder.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="report-title">Report Title *</Label>
              <Input
                id="report-title"
                placeholder="e.g., Deposit Creation Validation Tests"
                value={reportTitle}
                onChange={(e) => setReportTitle(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="report-description">Description (Optional)</Label>
              <Textarea
                id="report-description"
                placeholder="Brief description of the test report..."
                rows={3}
                value={reportDescription}
                onChange={(e) => setReportDescription(e.target.value)}
              />
            </div>

            {/* Drag and Drop Test Order */}
            <div className="space-y-2">
              <Label>Test Order in PDF</Label>
              <p className="text-sm text-muted-foreground mb-2">
                Drag tests to reorder them. The PDF will display tests in this order.
              </p>
              <div className="border rounded-lg p-3 bg-background max-h-96 overflow-y-auto">
                <DndContext
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragEnd={handleDragEnd}
                >
                  <SortableContext
                    items={orderedIds}
                    strategy={verticalListSortingStrategy}
                  >
                    <div className="space-y-2">
                      {orderedIds.map((id, index) => {
                        const result = results.find(r => r.id === id)
                        if (!result) return null
                        return (
                          <SortableTestItem
                            key={id}
                            id={id}
                            result={result}
                            index={index}
                          />
                        )
                      })}
                    </div>
                  </SortableContext>
                </DndContext>
              </div>
            </div>

            <div className="bg-muted p-4 rounded-lg space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Tests Selected:</span>
                <span className="font-medium">{selectedIds.size}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Estimated Pages:</span>
                <span className="font-medium">~{Math.ceil(selectedIds.size * 1.5)}</span>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDialogOpen(false)}
              disabled={generating}
            >
              Cancel
            </Button>
            <Button
              onClick={generateReport}
              disabled={generating || !reportTitle.trim()}
            >
              {generating ? (
                <>Generating...</>
              ) : (
                <>
                  <Download className="mr-2 h-4 w-4" />
                  Generate PDF
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Test Result Detail Dialog */}
      <Dialog open={detailDialogOpen} onOpenChange={setDetailDialogOpen}>
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
          {selectedResult && (
            <>
              <DialogHeader>
                <DialogTitle className="text-2xl">{selectedResult.test.name}</DialogTitle>
                <DialogDescription>
                  Test execution details and results
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-6">
                {/* Status Section */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Status & Overview</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label className="text-muted-foreground">Status</Label>
                        <div className="flex items-center gap-2 mt-1">
                          {getStatusIcon(getEffectiveStatus(selectedResult))}
                          {getStatusBadge(getEffectiveStatus(selectedResult))}
                          {selectedResult.manualStatus && (
                            <span className="text-xs text-muted-foreground">
                              (was {selectedResult.status})
                            </span>
                          )}
                        </div>
                      </div>
                      <div>
                        <Label className="text-muted-foreground">Status Code</Label>
                        <div className="mt-1">
                          <span className={`font-mono text-lg ${selectedResult.statusCode >= 400 ? 'text-red-500' : 'text-green-500'}`}>
                            {selectedResult.statusCode}
                          </span>
                          <span className="text-sm text-muted-foreground ml-2">
                            (Expected: {selectedResult.test.expectedStatus})
                          </span>
                        </div>
                      </div>
                      <div>
                        <Label className="text-muted-foreground">Response Time</Label>
                        <div className="flex items-center gap-1 mt-1">
                          <Clock className="h-4 w-4" />
                          <span className="text-lg">{selectedResult.responseTime}ms</span>
                        </div>
                      </div>
                      <div>
                        <Label className="text-muted-foreground">Executed At</Label>
                        <div className="text-sm mt-1">
                          {formatDate(selectedResult.executedAt)}
                        </div>
                      </div>
                    </div>

                    {selectedResult.error && (
                      <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                        <Label className="text-red-700">Error</Label>
                        <p className="text-sm text-red-600 mt-1">{selectedResult.error}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Test Details */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Test Configuration</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div>
                      <Label className="text-muted-foreground">Method & Endpoint</Label>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge className={`${getMethodColor(selectedResult.test.method)} text-white font-mono`}>
                          {selectedResult.test.method}
                        </Badge>
                        <code className="text-sm bg-muted px-3 py-1 rounded">
                          {selectedResult.test.endpoint}
                        </code>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label className="text-muted-foreground">Environment</Label>
                        <div className="text-sm mt-1">
                          <div className="font-medium">{selectedResult.test.environment.name}</div>
                          <div className="text-muted-foreground">{selectedResult.test.environment.instanceUrl}</div>
                        </div>
                      </div>
                      <div>
                        <Label className="text-muted-foreground">Credential</Label>
                        <div className="text-sm mt-1">
                          <div className="font-medium">{selectedResult.credential?.orgName || 'Fixed API Key'}</div>
                          <div className="text-muted-foreground">
                            {selectedResult.credential
                              ? `${selectedResult.credential.authType} • Member: ${selectedResult.credential.memberId || 'N/A'} • Branch: ${selectedResult.credential.branchId || 'N/A'}`
                              : 'Uses environment-level fixed API key authentication'}
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Notes */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Notes</CardTitle>
                    <CardDescription>
                      Add context or description for this test result
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <Textarea
                      placeholder="Add notes about this test result..."
                      value={editedNotes}
                      onChange={(e) => setEditedNotes(e.target.value)}
                      rows={4}
                      className="resize-none"
                    />
                    <Button
                      onClick={saveNotes}
                      disabled={savingNotes}
                      size="sm"
                    >
                      {savingNotes ? 'Saving...' : 'Save Notes'}
                    </Button>
                  </CardContent>
                </Card>

                {/* Request */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Request</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <pre className="bg-muted p-4 rounded-lg overflow-x-auto text-xs">
                      <code>{JSON.stringify(parseJSON(selectedResult.request), null, 2)}</code>
                    </pre>
                  </CardContent>
                </Card>

                {/* Response */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Response</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <pre className="bg-muted p-4 rounded-lg overflow-x-auto text-xs max-h-96">
                      <code>{JSON.stringify(parseJSON(selectedResult.response), null, 2)}</code>
                    </pre>
                  </CardContent>
                </Card>

                {/* Validation Results */}
                {selectedResult.validationResults && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Validation Results</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <pre className="bg-muted p-4 rounded-lg overflow-x-auto text-xs">
                        <code>{JSON.stringify(parseJSON(selectedResult.validationResults), null, 2)}</code>
                      </pre>
                    </CardContent>
                  </Card>
                )}

                {/* Verification Results */}
                {(selectedResult.verificationResults || selectedResult.verificationError) && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Salesforce Verification</CardTitle>
                      <CardDescription>
                        Verification queries executed against Salesforce to confirm API changes
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {/* Verification Status */}
                      <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
                        {selectedResult.verificationPassed === true ? (
                          <>
                            <CheckCircle2 className="h-5 w-5 text-green-500" />
                            <span className="font-medium text-green-700">Verification Passed</span>
                          </>
                        ) : selectedResult.verificationPassed === false ? (
                          <>
                            <XCircle className="h-5 w-5 text-red-500" />
                            <span className="font-medium text-red-700">Verification Failed</span>
                          </>
                        ) : (
                          <>
                            <AlertCircle className="h-5 w-5 text-yellow-500" />
                            <span className="font-medium text-yellow-700">Verification Error</span>
                          </>
                        )}
                      </div>

                      {/* Verification Error */}
                      {selectedResult.verificationError && (
                        <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                          <Label className="text-red-700">Error</Label>
                          <p className="text-sm text-red-600 mt-1">{selectedResult.verificationError}</p>
                        </div>
                      )}

                      {/* Verification Checks */}
                      {selectedResult.verificationResults && (
                        <div>
                          <Label className="text-muted-foreground mb-2 block">Verification Checks</Label>
                          <div className="space-y-2">
                            {(() => {
                              const checks = parseJSON(selectedResult.verificationResults)
                              if (Array.isArray(checks)) {
                                return checks.map((check: any, index: number) => (
                                  <div
                                    key={index}
                                    className={`p-3 rounded-lg border ${
                                      check.passed
                                        ? 'bg-green-50 border-green-200'
                                        : 'bg-red-50 border-red-200'
                                    }`}
                                  >
                                    <div className="flex items-start justify-between">
                                      <div className="flex-1">
                                        <div className="flex items-center gap-2">
                                          {check.passed ? (
                                            <CheckCircle2 className="h-4 w-4 text-green-600" />
                                          ) : (
                                            <XCircle className="h-4 w-4 text-red-600" />
                                          )}
                                          <span className="font-medium text-sm">
                                            {check.field || 'Field'}
                                          </span>
                                        </div>
                                        <div className="mt-2 text-xs space-y-1">
                                          <div className="flex gap-2">
                                            <span className="text-muted-foreground font-medium">Expected:</span>
                                            <code className="bg-white/50 px-2 py-0.5 rounded">
                                              {JSON.stringify(check.expected)}
                                            </code>
                                          </div>
                                          <div className="flex gap-2">
                                            <span className="text-muted-foreground font-medium">Actual:</span>
                                            <code className="bg-white/50 px-2 py-0.5 rounded">
                                              {JSON.stringify(check.actual)}
                                            </code>
                                          </div>
                                        </div>
                                        {check.message && (
                                          <p className="text-xs text-muted-foreground mt-2">
                                            {check.message}
                                          </p>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                ))
                              }
                              return (
                                <pre className="bg-muted p-4 rounded-lg overflow-x-auto text-xs">
                                  <code>{JSON.stringify(checks, null, 2)}</code>
                                </pre>
                              )
                            })()}
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )}
              </div>

              <DialogFooter className="flex justify-between">
                <Button
                  variant="destructive"
                  onClick={() => openDeleteDialog('single')}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete Test
                </Button>
                <Button variant="outline" onClick={() => setDetailDialogOpen(false)}>
                  Close
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Deletion</DialogTitle>
            <DialogDescription>
              {deleteTarget === 'bulk' ? (
                <>
                  Are you sure you want to delete <strong>{selectedIds.size}</strong> test result{selectedIds.size !== 1 ? 's' : ''}?
                  This action cannot be undone.
                </>
              ) : (
                <>
                  Are you sure you want to delete this test result?
                  This action cannot be undone.
                </>
              )}
            </DialogDescription>
          </DialogHeader>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
              disabled={deleting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={deleting}
            >
              {deleting ? (
                <>Deleting...</>
              ) : (
                <>
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
