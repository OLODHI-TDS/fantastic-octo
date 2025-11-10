'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs'
import { useToast } from '@/hooks/use-toast'
import {
  ArrowLeft,
  Play,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  FileJson,
  Sparkles,
} from 'lucide-react'
import { getEndpointById, ApiEndpoint } from '@/lib/api-endpoints'
import { generateTestDataForEndpoint } from '@/lib/test-data-generator'
import { depositCreationScenarios } from '@/lib/test-scenarios/deposit-creation-scenarios'
import { depositStatusScenarios } from '@/lib/test-scenarios/deposit-status-scenarios'
import { depositUpdateScenarios } from '@/lib/test-scenarios/deposit-update-scenarios'
import { deleteDepositScenarios } from '@/lib/test-scenarios/delete-deposit-scenarios'
import { addToCartScenarios } from '@/lib/test-scenarios/add-to-cart-scenarios'
import { addAdditionalTenantScenarios } from '@/lib/test-scenarios/add-additional-tenant-scenarios'
import { removeTenantScenarios } from '@/lib/test-scenarios/remove-tenant-scenarios'
import { tenancyInfoScenarios } from '@/lib/test-scenarios/tenancy-info-scenarios'
import { landlordsSearchScenarios } from '@/lib/test-scenarios/landlords-search-scenarios'
import { propertiesSearchScenarios } from '@/lib/test-scenarios/properties-search-scenarios'
import { dpcCertificateScenarios } from '@/lib/test-scenarios/dpc-certificate-scenarios'
import { repaymentRequestScenarios } from '@/lib/test-scenarios/repayment-request-scenarios'
import { repaymentResponseScenarios } from '@/lib/test-scenarios/repayment-response-scenarios'
import { branchesListScenarios } from '@/lib/test-scenarios/branches-list-scenarios'
import { singleBranchScenarios } from '@/lib/test-scenarios/single-branch-scenarios'
import { disputeStatusScenarios } from '@/lib/test-scenarios/dispute-status-scenarios'
import { transferBranchDepositScenarios } from '@/lib/test-scenarios/transfer-branch-deposit-scenarios'
import { allTenanciesScenarios } from '@/lib/test-scenarios/all-tenancies-scenarios'

interface Environment {
  id: string
  name: string
  instanceUrl: string
}

interface Credential {
  id: string
  orgName: string
  authType: string
  branchId?: string
}

interface TestScenario {
  id: string
  name: string
  description: string
  type: 'positive' | 'negative'
  expectedStatus?: number
  generatePayload?: () => any
  requiresDifferentCredential?: boolean
  pathParam?: string
  generatePathParam?: () => string
  requiresCreationPayload?: boolean
  modifyPayload?: (payload: any) => any
}

// Function to get scenarios based on endpoint
function getScenariosForEndpoint(endpointId: string): TestScenario[] {
  switch (endpointId) {
    case 'deposit-creation':
      return depositCreationScenarios
    case 'deposit-status':
      return depositStatusScenarios
    case 'deposit-update':
      return depositUpdateScenarios
    case 'delete-deposit':
      return deleteDepositScenarios
    case 'add-to-cart':
      return addToCartScenarios
    case 'add-additional-tenant':
      return addAdditionalTenantScenarios
    case 'remove-tenant':
      return removeTenantScenarios
    case 'tenancy-info':
      return tenancyInfoScenarios
    case 'landlords-search':
      return landlordsSearchScenarios
    case 'properties-search':
      return propertiesSearchScenarios
    case 'dpc-certificate':
      return dpcCertificateScenarios
    case 'repayment-request':
      return repaymentRequestScenarios
    case 'repayment-response':
      return repaymentResponseScenarios
    case 'branches-list':
      return branchesListScenarios
    case 'branch-single':
      return singleBranchScenarios
    case 'dispute-status':
      return disputeStatusScenarios
    case 'transfer-branch-deposit':
      return transferBranchDepositScenarios
    case 'all-tenancies':
      return allTenanciesScenarios
    default:
      // Fallback to basic scenarios for endpoints without specific test scenarios
      return [
        {
          id: 'positive',
          name: 'Positive Test',
          description: 'Test with valid data expecting success',
          type: 'positive',
        }
      ]
  }
}

export default function EndpointDashboard() {
  const params = useParams()
  const router = useRouter()
  const { toast } = useToast()
  const endpointId = params.endpointId as string

  const [endpoint, setEndpoint] = useState<ApiEndpoint | null>(null)
  const [scenarios, setScenarios] = useState<TestScenario[]>([])
  const [environments, setEnvironments] = useState<Environment[]>([])
  const [credentials, setCredentials] = useState<Credential[]>([])
  const [selectedEnvironmentId, setSelectedEnvironmentId] = useState('')
  const [selectedCredentialId, setSelectedCredentialId] = useState('')
  const [pathParamValue, setPathParamValue] = useState('')
  const [requestBody, setRequestBody] = useState('')
  const [executingScenario, setExecutingScenario] = useState<string | null>(null)
  const [scenarioResults, setScenarioResults] = useState<Record<string, any>>({})
  const [successfulCreations, setSuccessfulCreations] = useState<any[]>([])
  const [selectedCreationId, setSelectedCreationId] = useState('')
  const [loadingCreations, setLoadingCreations] = useState(false)
  const [availableDans, setAvailableDans] = useState<any[]>([])
  const [selectedDanId, setSelectedDanId] = useState('')
  const [loadingDans, setLoadingDans] = useState(false)
  const [selectedTargetCredentialId, setSelectedTargetCredentialId] = useState('')
  const [targetCredentials, setTargetCredentials] = useState<Credential[]>([])
  const [useAliasUrl, setUseAliasUrl] = useState(false)

  useEffect(() => {
    const ep = getEndpointById(endpointId)
    setEndpoint(ep || null)
    setScenarios(getScenariosForEndpoint(endpointId))

    if (!ep) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Endpoint not found',
      })
      router.push('/tests')
    }
  }, [endpointId])

  useEffect(() => {
    fetchEnvironments()
  }, [])

  useEffect(() => {
    if (selectedEnvironmentId) {
      fetchCredentials(selectedEnvironmentId)
    } else {
      setCredentials([])
      setSelectedCredentialId('')
    }
  }, [selectedEnvironmentId])

  useEffect(() => {
    // Fetch successful creation tests for deposit-update endpoint
    if (endpointId === 'deposit-update' && selectedCredentialId) {
      fetchSuccessfulCreations()
    } else {
      setSuccessfulCreations([])
      setSelectedCreationId('')
    }
  }, [endpointId, selectedCredentialId])

  useEffect(() => {
    // Fetch available DANs for repayment-request, repayment-response, and dispute-status endpoints
    if ((endpointId === 'repayment-request' || endpointId === 'repayment-response' || endpointId === 'dispute-status') && selectedCredentialId) {
      fetchAvailableDans()
    } else {
      setAvailableDans([])
      setSelectedDanId('')
    }
  }, [endpointId, selectedCredentialId])

  useEffect(() => {
    // For transfer-branch-deposit, populate target credentials from the same environment
    if (endpointId === 'transfer-branch-deposit' && selectedEnvironmentId) {
      // Use the already fetched credentials as target options
      setTargetCredentials(credentials)
    } else {
      setTargetCredentials([])
      setSelectedTargetCredentialId('')
    }
  }, [endpointId, selectedEnvironmentId, credentials])

  const fetchEnvironments = async () => {
    try {
      const response = await fetch('/api/environments')
      if (response.ok) {
        const data = await response.json()
        setEnvironments(data)
      }
    } catch (error) {
      console.error('Error fetching environments:', error)
    }
  }

  const fetchCredentials = async (environmentId: string) => {
    try {
      const response = await fetch(`/api/credentials?environmentId=${environmentId}`)
      if (response.ok) {
        const data = await response.json()
        setCredentials(data)
      }
    } catch (error) {
      console.error('Error fetching credentials:', error)
    }
  }

  const fetchSuccessfulCreations = async () => {
    setLoadingCreations(true)
    try {
      const response = await fetch(`/api/test-results/successful-creations?credentialId=${selectedCredentialId}&limit=20`)
      if (response.ok) {
        const data = await response.json()
        setSuccessfulCreations(data)
      }
    } catch (error) {
      console.error('Error fetching successful creations:', error)
    } finally {
      setLoadingCreations(false)
    }
  }

  const loadCreationPayload = (creationId: string) => {
    const creation = successfulCreations.find(c => c.id === creationId)
    if (creation && creation.requestPayload) {
      // Clone the payload
      const payload = JSON.parse(JSON.stringify(creation.requestPayload))

      // Add DAN to the tenancy object if available
      if (creation.response.dan && payload.tenancy) {
        // Reconstruct tenancy object with dan at the top
        const { tenancy } = payload
        payload.tenancy = {
          dan: creation.response.dan,
          ...tenancy
        }
      }

      setRequestBody(JSON.stringify(payload, null, 2))
      setSelectedCreationId(creationId)
      toast({
        title: 'Payload Loaded',
        description: `Loaded creation test: ${creation.testName} (DAN: ${creation.response.dan || 'N/A'})`,
      })
    }
  }

  const fetchAvailableDans = async () => {
    setLoadingDans(true)
    try {
      const response = await fetch(`/api/test-results/available-dans?credentialId=${selectedCredentialId}&limit=20`)
      if (response.ok) {
        const data = await response.json()
        setAvailableDans(data)
      }
    } catch (error) {
      console.error('Error fetching available DANs:', error)
    } finally {
      setLoadingDans(false)
    }
  }

  const loadDanForRepayment = (danId: string) => {
    const danRecord = availableDans.find(d => d.id === danId)
    if (danRecord && danRecord.deposit) {
      const { dan, deposit_amount } = danRecord.deposit

      // Get today's date in DD-MM-YYYY format
      const today = new Date()
      const dd = String(today.getDate()).padStart(2, '0')
      const mm = String(today.getMonth() + 1).padStart(2, '0')
      const yyyy = today.getFullYear()
      const todayFormatted = `${dd}-${mm}-${yyyy}`

      // Create repayment payload
      // Set tenant_repayment to full deposit amount, agent_repayment fields to 0
      const payload = {
        dan: dan,
        tenancy_end_date: todayFormatted,
        tenant_repayment: deposit_amount || "0",
        tenant_repayment_type: "split", // Required field (not in docs but API requires it)
        agent_repayment: {
          total: "0",
          cleaning: "0",
          rent_arrears: "0",
          damage: "0",
          redecoration: "0",
          gardening: "0",
          other: "0",
          other_text: ""
        }
      }

      setRequestBody(JSON.stringify(payload, null, 2))
      setSelectedDanId(danId)
      toast({
        title: 'DAN Loaded',
        description: `DAN: ${dan} | Amount: £${deposit_amount} | End Date: ${todayFormatted}`,
      })
    }
  }

  const loadDanForDisputeStatus = (danId: string) => {
    const danRecord = availableDans.find(d => d.id === danId)
    if (danRecord && danRecord.deposit) {
      const { dan, deposit_amount } = danRecord.deposit

      // Set the DAN in the path parameter field
      setPathParamValue(dan)
      setSelectedDanId(danId)
      toast({
        title: 'DAN Loaded',
        description: `DAN: ${dan} | Deposit Amount: £${deposit_amount}`,
      })
    }
  }

  const generateTestData = () => {
    const generatedData = generateTestDataForEndpoint(endpointId)

    if (generatedData) {
      setRequestBody(JSON.stringify(generatedData, null, 2))
      toast({
        title: 'Test Data Generated',
        description: 'Fake data has been generated using Faker.js',
      })
    } else {
      toast({
        variant: 'destructive',
        title: 'Not Supported',
        description: 'Data generation is not available for this endpoint',
      })
    }
  }

  const executeScenario = async (scenario: TestScenario) => {
    if (!selectedEnvironmentId || !selectedCredentialId) {
      toast({
        variant: 'destructive',
        title: 'Missing Configuration',
        description: 'Please select an environment and credential',
      })
      return
    }

    // Determine which path param value to use
    let actualPathParam = ''
    if (endpoint?.requiresPathParam) {
      if (scenario.generatePathParam) {
        actualPathParam = scenario.generatePathParam()
      } else if (scenario.pathParam !== undefined) {
        actualPathParam = scenario.pathParam
      } else {
        actualPathParam = pathParamValue
      }

      // Only require manual path param if scenario doesn't provide one
      if (!actualPathParam && !scenario.pathParam && scenario.pathParam !== '') {
        toast({
          variant: 'destructive',
          title: 'Missing Parameter',
          description: `Please provide ${endpoint.pathParamName}`,
        })
        return
      }
    }

    setExecutingScenario(scenario.id)

    try {
      // Build the final endpoint URL
      let finalEndpoint = endpoint?.endpoint || ''
      if (endpoint?.requiresPathParam && actualPathParam !== undefined) {
        finalEndpoint = finalEndpoint.replace(`{${endpoint.pathParamName}}`, actualPathParam)
      }

      // Get payload - prioritize Request Body editor, fall back to generatePayload
      let parsedBody
      if (requestBody.trim()) {
        // Use the Request Body from the editor (user may have generated and modified it)
        try {
          parsedBody = JSON.parse(requestBody)
        } catch (e) {
          throw new Error('Invalid JSON in request body')
        }
        // Apply modifyPayload if scenario has one (for deposit-update scenarios)
        if (scenario.modifyPayload) {
          parsedBody = scenario.modifyPayload(parsedBody)
        }
      } else if (scenario.generatePayload) {
        // Only auto-generate if Request Body is empty
        parsedBody = scenario.generatePayload()
      } else if (scenario.requiresCreationPayload) {
        // Scenario requires a creation payload but none is loaded
        throw new Error('Please load a creation test payload first using the "Load from Creation Test" dropdown')
      }

      // Determine expected status code - use scenario's expected status, then endpoint's, then default
      const expectedStatus = scenario.expectedStatus || endpoint?.expectedStatus || 200

      // Create test
      const testResponse = await fetch('/api/tests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: `${endpoint?.name} - ${scenario.name}`,
          description: scenario.description,
          endpoint: finalEndpoint,
          method: endpoint?.method,
          headers: {},
          body: parsedBody,
          expectedStatus,
          environmentId: selectedEnvironmentId,
          credentialId: selectedCredentialId,
          useAliasUrl: useAliasUrl, // Flag for alias URL usage
        }),
      })

      if (!testResponse.ok) {
        throw new Error('Failed to create test')
      }

      const test = await testResponse.json()

      // Execute test
      const executeResponse = await fetch(`/api/tests/${test.id}/execute`, {
        method: 'POST',
      })

      if (!executeResponse.ok) {
        throw new Error('Failed to execute test')
      }

      const result = await executeResponse.json()

      setScenarioResults(prev => ({
        ...prev,
        [scenario.id]: result,
      }))

      toast({
        title: result.status === 'passed' ? 'Test Passed' : 'Test Failed',
        description: `${scenario.name} completed in ${result.responseTime}ms`,
        variant: result.status === 'passed' ? 'default' : 'destructive',
      })
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Execution Error',
        description: error.message,
      })
    } finally {
      setExecutingScenario(null)
    }
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

  if (!endpoint) {
    return (
      <div className="container mx-auto py-8 px-4">
        <p>Loading...</p>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-8 px-4 max-w-7xl">
      {/* Header */}
      <div className="mb-6">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push('/tests')}
          className="mb-4"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Endpoints
        </Button>

        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">{endpoint.name}</h1>
            <p className="text-muted-foreground mb-4">{endpoint.description}</p>
            <div className="flex items-center gap-3">
              <Badge className={`${getMethodColor(endpoint.method)} text-white font-mono`}>
                {endpoint.method}
              </Badge>
              <Badge variant="outline">{endpoint.category}</Badge>
              <code className="text-sm bg-muted px-3 py-1 rounded">
                {endpoint.endpoint}
              </code>
            </div>
          </div>
        </div>
      </div>

      {/* Configuration */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Test Configuration</CardTitle>
          <CardDescription>
            Select environment and credentials for testing
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label>Environment *</Label>
              <Select
                value={selectedEnvironmentId}
                onValueChange={setSelectedEnvironmentId}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select environment" />
                </SelectTrigger>
                <SelectContent>
                  {environments.map((env) => (
                    <SelectItem key={env.id} value={env.id}>
                      {env.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label>Credential *</Label>
              <Select
                value={selectedCredentialId}
                onValueChange={setSelectedCredentialId}
                disabled={!selectedEnvironmentId}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select credential" />
                </SelectTrigger>
                <SelectContent>
                  {credentials.map((cred) => (
                    <SelectItem key={cred.id} value={cred.id}>
                      {cred.orgName} ({cred.authType})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Alias URL Toggle (for API-key credentials only) */}
          {endpoint.supportsAliasUrl && selectedCredentialId && credentials.find(c => c.id === selectedCredentialId)?.authType === 'apikey' && (
            <div className="flex items-center space-x-2 mt-4 p-3 bg-muted rounded-lg">
              <Checkbox
                id="useAliasUrl"
                checked={useAliasUrl}
                onCheckedChange={(checked) => setUseAliasUrl(checked === true)}
              />
              <div className="grid gap-0.5">
                <label
                  htmlFor="useAliasUrl"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                >
                  Use Alias URL (Legacy-style)?
                </label>
                <p className="text-xs text-muted-foreground">
                  Enable to use legacy-style endpoint URLs (v2 paths with auth parameters in URL for GET requests)
                </p>
              </div>
            </div>
          )}

          {endpoint.requiresPathParam && (
            <div className="grid gap-2 mt-4">
              <Label>{endpoint.pathParamName} *</Label>
              <Input
                placeholder={endpoint.pathParamPlaceholder}
                value={pathParamValue}
                onChange={(e) => setPathParamValue(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Note: Some test scenarios provide their own {endpoint.pathParamName} value automatically
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Load from Creation Test (for deposit-update only) */}
      {endpointId === 'deposit-update' && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Load from Creation Test</CardTitle>
            <CardDescription>
              Select a successful deposit creation test to use as the basis for your update
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-2">
              <Label>Recent Successful Deposit Creations</Label>
              <Select
                value={selectedCreationId}
                onValueChange={loadCreationPayload}
                disabled={!selectedCredentialId || loadingCreations}
              >
                <SelectTrigger>
                  <SelectValue placeholder={loadingCreations ? 'Loading...' : 'Select a creation test'} />
                </SelectTrigger>
                <SelectContent>
                  {successfulCreations.map((creation) => (
                    <SelectItem key={creation.id} value={creation.id}>
                      {creation.testName} - {new Date(creation.executedAt).toLocaleString('en-GB')} ({creation.references.user_tenancy_reference})
                    </SelectItem>
                  ))}
                  {successfulCreations.length === 0 && !loadingCreations && (
                    <SelectItem value="none" disabled>
                      No successful creation tests found
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Loading a creation test will populate the Request Body with the original FULL payload plus DAN. The deposit update endpoint requires the complete payload (not partial objects). Test scenarios will automatically modify specific fields while keeping everything else intact.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Load DAN for Repayment Request/Response (for repayment-request and repayment-response) */}
      {(endpointId === 'repayment-request' || endpointId === 'repayment-response') && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Select DAN for Repayment</CardTitle>
            <CardDescription>
              {endpointId === 'repayment-request'
                ? 'Select a deposit (DAN) to submit a repayment request. The payload will be auto-populated with deposit details.'
                : 'Select a deposit (DAN) with an existing tenant repayment request to respond to. The payload will be auto-populated with deposit details.'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-2">
              <Label>Available Deposits (DANs)</Label>
              <Select
                value={selectedDanId}
                onValueChange={loadDanForRepayment}
                disabled={!selectedCredentialId || loadingDans}
              >
                <SelectTrigger>
                  <SelectValue placeholder={loadingDans ? 'Loading...' : 'Select a DAN'} />
                </SelectTrigger>
                <SelectContent>
                  {availableDans.map((danRecord) => (
                    <SelectItem key={danRecord.id} value={danRecord.id}>
                      {danRecord.deposit.dan} - £{danRecord.deposit.deposit_amount} (End: {danRecord.deposit.tenancy_end_date})
                    </SelectItem>
                  ))}
                  {availableDans.length === 0 && !loadingDans && (
                    <SelectItem value="none" disabled>
                      No deposits found
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                {endpointId === 'repayment-request'
                  ? 'Selecting a DAN will auto-populate the Request Body with: DAN number, tenancy end date, deposit amount. By default, tenant_repayment is set to the full deposit amount and all agent_repayment fields are set to 0. You can modify these values as needed for your test scenario.'
                  : 'Selecting a DAN will auto-populate the Request Body. For "Accept Tenant Request" test, ensure values match the tenant\'s original request. For counter-proposals, the test scenarios will automatically modify the split.'}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Select DAN for Dispute Status (for dispute-status) */}
      {endpointId === 'dispute-status' && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Select DAN for Dispute Status</CardTitle>
            <CardDescription>
              Select a deposit (DAN) to check its dispute status. The DAN will be populated in the path parameter field.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-2">
              <Label>Available Deposits (DANs)</Label>
              <Select
                value={selectedDanId}
                onValueChange={loadDanForDisputeStatus}
                disabled={!selectedCredentialId || loadingDans}
              >
                <SelectTrigger>
                  <SelectValue placeholder={loadingDans ? 'Loading...' : 'Select a DAN'} />
                </SelectTrigger>
                <SelectContent>
                  {availableDans.map((danRecord) => (
                    <SelectItem key={danRecord.id} value={danRecord.id}>
                      {danRecord.deposit.dan} - £{danRecord.deposit.deposit_amount} (Status: {danRecord.deposit.deposit_status || 'Unknown'})
                    </SelectItem>
                  ))}
                  {availableDans.length === 0 && !loadingDans && (
                    <SelectItem value="none" disabled>
                      No deposits found
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Selecting a DAN will auto-populate the DAN path parameter field above. You can also manually enter a DAN in the path parameter field if needed.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Select Target Branch (for transfer-branch-deposit) */}
      {endpointId === 'transfer-branch-deposit' && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Select Target Branch</CardTitle>
            <CardDescription>
              Select the credential that represents the target branch where you want to transfer the deposit
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-2">
              <Label>Target Branch Credential *</Label>
              <Select
                value={selectedTargetCredentialId}
                onValueChange={(value) => {
                  setSelectedTargetCredentialId(value)
                  // Auto-populate the branch_id in the request body
                  const targetCred = targetCredentials.find(c => c.id === value)
                  if (targetCred && targetCred.branchId) {
                    const payload = {
                      branch_id: targetCred.branchId,
                    }
                    setRequestBody(JSON.stringify(payload, null, 2))
                  }
                }}
                disabled={!selectedCredentialId}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select target branch credential" />
                </SelectTrigger>
                <SelectContent>
                  {targetCredentials.map((cred) => (
                    <SelectItem key={cred.id} value={cred.id}>
                      {cred.orgName} - {cred.branchId || 'N/A'} ({cred.authType})
                    </SelectItem>
                  ))}
                  {targetCredentials.length === 0 && (
                    <SelectItem value="none" disabled>
                      No credentials available for target branch
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Selecting a target credential will auto-populate the Request Body with the branch_id. The deposit will be transferred to this branch. You can also manually add person_id if needed.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Request Body Editor */}
      {endpoint.method !== 'GET' && endpoint.method !== 'DELETE' && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileJson className="h-5 w-5" />
              Request Body
            </CardTitle>
            <CardDescription>
              Enter the JSON request body for testing
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Textarea
              placeholder='{"key": "value"}'
              value={requestBody}
              onChange={(e) => setRequestBody(e.target.value)}
              rows={10}
              className="font-mono text-sm"
            />
            <Button
              type="button"
              variant="outline"
              onClick={generateTestData}
              className="w-full"
            >
              <Sparkles className="mr-2 h-4 w-4" />
              Generate Test Data with Faker.js
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Response Section */}
      {Object.keys(scenarioResults).length > 0 && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>API Response</CardTitle>
            <CardDescription>
              View the response data from the most recent test execution
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue={Object.keys(scenarioResults)[0]} className="w-full">
              <TabsList className="w-full flex-wrap h-auto justify-start">
                {scenarios.map((scenario) => {
                  const result = scenarioResults[scenario.id]
                  if (!result) return null

                  return (
                    <TabsTrigger key={scenario.id} value={scenario.id} className="text-xs">
                      {scenario.name}
                    </TabsTrigger>
                  )
                }).filter(Boolean)}
              </TabsList>

              {scenarios.map((scenario) => {
                const result = scenarioResults[scenario.id]
                if (!result) return null

                return (
                  <TabsContent key={scenario.id} value={scenario.id} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Request */}
                      <div>
                        <Label className="text-sm font-semibold mb-2 block">Request</Label>
                        <Textarea
                          value={JSON.stringify(result.request, null, 2)}
                          readOnly
                          rows={15}
                          className="font-mono text-xs"
                        />
                      </div>

                      {/* Response */}
                      <div>
                        <Label className="text-sm font-semibold mb-2 block">Response</Label>
                        <Textarea
                          value={JSON.stringify(result.response, null, 2)}
                          readOnly
                          rows={15}
                          className="font-mono text-xs"
                        />
                      </div>
                    </div>

                    {/* Verification Results */}
                    {(result.verificationResults || result.verificationError) && (
                      <div className="mt-6 p-4 border rounded-lg bg-muted/50">
                        <div className="flex items-center gap-2 mb-4">
                          <Sparkles className="h-5 w-5 text-blue-500" />
                          <Label className="text-base font-semibold">Salesforce Verification</Label>
                        </div>

                        {/* Verification Status Badge */}
                        <div className="flex items-center gap-2 mb-4">
                          {result.verificationPassed === true ? (
                            <>
                              <CheckCircle2 className="h-5 w-5 text-green-500" />
                              <Badge variant="default" className="bg-green-600">
                                Verification Passed
                              </Badge>
                            </>
                          ) : result.verificationPassed === false ? (
                            <>
                              <XCircle className="h-5 w-5 text-red-500" />
                              <Badge variant="destructive">
                                Verification Failed
                              </Badge>
                            </>
                          ) : (
                            <>
                              <AlertCircle className="h-5 w-5 text-yellow-500" />
                              <Badge variant="secondary" className="bg-yellow-600 text-white">
                                Verification Error
                              </Badge>
                            </>
                          )}
                        </div>

                        {/* Verification Error */}
                        {result.verificationError && (
                          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
                            <p className="text-sm text-red-700 font-medium mb-1">Error</p>
                            <p className="text-sm text-red-600">{result.verificationError}</p>
                          </div>
                        )}

                        {/* Verification Checks */}
                        {result.verificationResults && Array.isArray(result.verificationResults) && (
                          <div className="space-y-2">
                            <p className="text-sm font-medium text-muted-foreground mb-2">
                              Verification Checks:
                            </p>
                            {result.verificationResults.map((check: any, index: number) => (
                              <div
                                key={index}
                                className={`p-3 rounded-md border ${
                                  check.passed
                                    ? 'bg-green-50 border-green-200'
                                    : 'bg-red-50 border-red-200'
                                }`}
                              >
                                <div className="flex items-start gap-2">
                                  {check.passed ? (
                                    <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5" />
                                  ) : (
                                    <XCircle className="h-4 w-4 text-red-600 mt-0.5" />
                                  )}
                                  <div className="flex-1 min-w-0">
                                    <p className={`text-sm font-medium ${
                                      check.passed ? 'text-green-900' : 'text-red-900'
                                    }`}>
                                      {check.field}
                                    </p>
                                    <div className="mt-1 space-y-1">
                                      <div className="flex items-center gap-2 text-xs">
                                        <span className="text-muted-foreground font-medium">Expected:</span>
                                        <code className={`px-2 py-0.5 rounded ${
                                          check.passed ? 'bg-green-100' : 'bg-red-100'
                                        }`}>
                                          {JSON.stringify(check.expected)}
                                        </code>
                                      </div>
                                      <div className="flex items-center gap-2 text-xs">
                                        <span className="text-muted-foreground font-medium">Actual:</span>
                                        <code className={`px-2 py-0.5 rounded ${
                                          check.passed ? 'bg-green-100' : 'bg-red-100'
                                        }`}>
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
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </TabsContent>
                )
              })}
            </Tabs>
          </CardContent>
        </Card>
      )}

      {/* Test Scenarios */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {scenarios.map((scenario) => {
          const result = scenarioResults[scenario.id]
          const isExecuting = executingScenario === scenario.id

          return (
            <Card key={scenario.id} className="relative">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <CardTitle className="text-base">{scenario.name}</CardTitle>
                  {result && getStatusIcon(result.status)}
                </div>
                <CardDescription className="text-sm">
                  {scenario.description}
                </CardDescription>
                {(scenario.requiresDifferentCredential || scenario.pathParam !== undefined || scenario.requiresCreationPayload) && (
                  <div className="mt-2 space-y-1">
                    {scenario.requiresDifferentCredential && (
                      <Badge variant="secondary" className="text-xs">
                        ⚠️ Requires different credential
                      </Badge>
                    )}
                    {scenario.pathParam !== undefined && (
                      <Badge variant="outline" className="text-xs ml-1">
                        ✓ Path param provided
                      </Badge>
                    )}
                    {scenario.requiresCreationPayload && (
                      <Badge variant="outline" className="text-xs ml-1">
                        📋 Uses creation payload
                      </Badge>
                    )}
                  </div>
                )}
              </CardHeader>
              <CardContent>
                <Button
                  onClick={() => executeScenario(scenario)}
                  disabled={isExecuting}
                  className="w-full"
                  variant={result?.status === 'passed' ? 'outline' : 'default'}
                >
                  <Play className="mr-2 h-4 w-4" />
                  {isExecuting ? 'Running...' : 'Run Test'}
                </Button>

                {result && (
                  <div className="mt-4 space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Status Code:</span>
                      <span className="font-mono">{result.statusCode}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Response Time:</span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {result.responseTime}ms
                      </span>
                    </div>
                    {(result.verificationResults || result.verificationError) && (
                      <div className="flex items-center justify-between text-sm pt-2 border-t">
                        <span className="text-muted-foreground flex items-center gap-1">
                          <Sparkles className="h-3 w-3" />
                          Verification:
                        </span>
                        {result.verificationPassed === true ? (
                          <Badge variant="default" className="bg-green-600 text-xs">
                            ✓ Passed
                          </Badge>
                        ) : result.verificationPassed === false ? (
                          <Badge variant="destructive" className="text-xs">
                            ✗ Failed
                          </Badge>
                        ) : (
                          <Badge variant="secondary" className="bg-yellow-600 text-white text-xs">
                            ⚠ Error
                          </Badge>
                        )}
                      </div>
                    )}
                    {result.error && (
                      <p className="text-xs text-destructive mt-2">{result.error}</p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
