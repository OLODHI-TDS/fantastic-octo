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
  Plus,
  Trash2,
  Users,
} from 'lucide-react'
import { getEndpointById, ApiEndpoint } from '@/lib/api-endpoints'
import { generateTestDataForEndpoint } from '@/lib/test-data-generator'
import { depositCreationScenarios } from '@/lib/test-scenarios/deposit-creation-scenarios'
import { depositStatusScenarios } from '@/lib/test-scenarios/deposit-status-scenarios'
import { depositUpdateScenarios } from '@/lib/test-scenarios/deposit-update-scenarios'
import { deleteDepositScenarios } from '@/lib/test-scenarios/delete-deposit-scenarios'
import { addToCartScenarios } from '@/lib/test-scenarios/add-to-cart-scenarios'
import { removeFromCartScenarios } from '@/lib/test-scenarios/remove-from-cart-scenarios'
import { listCartContentsScenarios } from '@/lib/test-scenarios/list-cart-contents-scenarios'
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
import { transferDepositScenarios } from '@/lib/test-scenarios/transfer-deposit-scenarios'
import { transferBranchDepositScenarios } from '@/lib/test-scenarios/transfer-branch-deposit-scenarios'
import { allTenanciesScenarios } from '@/lib/test-scenarios/all-tenancies-scenarios'
import { registerLandlordScenarios } from '@/lib/test-scenarios/register-landlord-scenarios'
import { createOfficeUserScenarios } from '@/lib/test-scenarios/create-office-user-scenarios'
import { createBranchScenarios } from '@/lib/test-scenarios/create-branch-scenarios'
import { paymentLinkScenarios } from '@/lib/test-scenarios/payment-link-scenarios'

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
    case 'remove-from-cart':
      return removeFromCartScenarios
    case 'list-cart-contents':
      return listCartContentsScenarios
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
    case 'transfer-deposit':
      return transferDepositScenarios
    case 'transfer-branch-deposit':
      return transferBranchDepositScenarios
    case 'all-tenancies':
      return allTenanciesScenarios
    case 'register-landlord':
      return registerLandlordScenarios
    case 'create-office-user':
      return createOfficeUserScenarios
    case 'create-branch':
      return createBranchScenarios
    case 'payment-link':
      return paymentLinkScenarios
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
  // Remove Tenant - multi-select state
  const [addedTenants, setAddedTenants] = useState<any[]>([])
  const [selectedTenantsToRemove, setSelectedTenantsToRemove] = useState<any[]>([])
  const [currentTenantSelection, setCurrentTenantSelection] = useState('')
  const [loadingAddedTenants, setLoadingAddedTenants] = useState(false)
  const [selectedRemoveTenantDan, setSelectedRemoveTenantDan] = useState('')

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
    // For transfer-deposit and transfer-branch-deposit, populate target credentials from the same environment
    if ((endpointId === 'transfer-deposit' || endpointId === 'transfer-branch-deposit') && selectedEnvironmentId) {
      // Use the already fetched credentials as target options
      setTargetCredentials(credentials)
    } else {
      setTargetCredentials([])
      setSelectedTargetCredentialId('')
    }
  }, [endpointId, selectedEnvironmentId, credentials])

  useEffect(() => {
    // Fetch added tenants for remove-tenant endpoint
    if (endpointId === 'remove-tenant' && selectedCredentialId) {
      fetchAddedTenants()
    } else {
      setAddedTenants([])
      setSelectedTenantsToRemove([])
      setCurrentTenantSelection('')
      setSelectedRemoveTenantDan('')
    }
  }, [endpointId, selectedCredentialId])

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

  // Remove Tenant - fetch added tenants
  const fetchAddedTenants = async () => {
    setLoadingAddedTenants(true)
    try {
      const response = await fetch(`/api/test-results/added-tenants?credentialId=${selectedCredentialId}&limit=50`)
      if (response.ok) {
        const data = await response.json()
        setAddedTenants(data)
      }
    } catch (error) {
      console.error('Error fetching added tenants:', error)
    } finally {
      setLoadingAddedTenants(false)
    }
  }

  // Remove Tenant - handle DAN selection
  const handleRemoveTenantDanChange = (dan: string) => {
    setSelectedRemoveTenantDan(dan)
    setPathParamValue(dan)
    // Clear tenant selection and selected tenants when DAN changes
    setCurrentTenantSelection('')
    setSelectedTenantsToRemove([])
    setRequestBody('')
  }

  // Remove Tenant - add tenant to removal list
  const addTenantToRemovalList = () => {
    if (!currentTenantSelection) return

    const tenant = addedTenants.find(t => t.id === currentTenantSelection)
    if (tenant && !selectedTenantsToRemove.find(t => t.id === tenant.id)) {
      const newSelected = [...selectedTenantsToRemove, tenant]
      setSelectedTenantsToRemove(newSelected)
      updateRemoveTenantRequestBody(newSelected)

      toast({
        title: 'Tenant Added',
        description: `${tenant.tenant.person_firstname} ${tenant.tenant.person_surname} added to removal list`,
      })
    }
    setCurrentTenantSelection('')
  }

  // Remove Tenant - remove tenant from removal list
  const removeTenantFromRemovalList = (tenantId: string) => {
    const newSelected = selectedTenantsToRemove.filter(t => t.id !== tenantId)
    setSelectedTenantsToRemove(newSelected)
    updateRemoveTenantRequestBody(newSelected)

    // Note: Don't clear DAN when tenants list becomes empty - user may want to add more tenants from same DAN

    toast({
      title: 'Tenant Removed',
      description: 'Tenant removed from removal list',
    })
  }

  // Remove Tenant - clear all selected tenants
  const clearAllSelectedTenants = () => {
    setSelectedTenantsToRemove([])
    setRequestBody('')
    // Don't clear DAN - user may want to select different tenants from same DAN
    toast({
      title: 'Cleared',
      description: 'All tenants removed from selection',
    })
  }

  // Remove Tenant - update request body in real-time
  const updateRemoveTenantRequestBody = (tenants: any[]) => {
    if (tenants.length === 0) {
      setRequestBody('')
      return
    }

    const payload = {
      people: tenants.map(t => ({
        person_classification: t.tenant.person_classification,
        person_id: t.tenant.person_id,
        person_reference: t.tenant.person_reference,
        person_title: t.tenant.person_title,
        person_firstname: t.tenant.person_firstname,
        person_surname: t.tenant.person_surname,
        is_business: t.tenant.is_business,
        person_paon: t.tenant.person_paon,
        person_saon: t.tenant.person_saon,
        person_street: t.tenant.person_street,
        person_locality: t.tenant.person_locality,
        person_town: t.tenant.person_town,
        person_postcode: t.tenant.person_postcode,
        person_country: t.tenant.person_country,
        person_phone: t.tenant.person_phone,
        person_email: t.tenant.person_email,
        person_mobile: t.tenant.person_mobile,
        business_name: t.tenant.business_name,
      }))
    }

    // Remove undefined/null fields
    payload.people = payload.people.map(person => {
      const cleaned: any = {}
      for (const [key, value] of Object.entries(person)) {
        if (value !== undefined && value !== null && value !== '') {
          cleaned[key] = value
        }
      }
      return cleaned
    })

    setRequestBody(JSON.stringify(payload, null, 2))
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
    // Check required configuration - credential not required for fixed API key endpoints
    if (!selectedEnvironmentId) {
      toast({
        variant: 'destructive',
        title: 'Missing Configuration',
        description: 'Please select an environment',
      })
      return
    }

    // Credential is required unless using fixed API key
    if (!endpoint?.usesFixedApiKey && !selectedCredentialId) {
      toast({
        variant: 'destructive',
        title: 'Missing Configuration',
        description: 'Please select a credential',
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
          <div className={`grid gap-4 ${endpoint.usesFixedApiKey ? 'grid-cols-1' : 'grid-cols-2'}`}>
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

            {/* Hide credential dropdown for fixed API key endpoints */}
            {!endpoint.usesFixedApiKey && (
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
            )}

            {/* Show info about fixed API key authentication */}
            {endpoint.usesFixedApiKey && (
              <div className="p-3 bg-muted rounded-lg">
                <p className="text-sm text-muted-foreground">
                  <span className="font-medium">Note:</span> This endpoint uses a fixed API key for authentication. No credential selection required.
                </p>
              </div>
            )}
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

      {/* Transfer Deposit Helper (for transfer-deposit) - Inter-member transfer */}
      {endpointId === 'transfer-deposit' && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Transfer Deposit Helper</CardTitle>
            <CardDescription>
              Transfer a deposit to another member (inter-member transfer by email)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4">
              {/* DAN Input */}
              <div className="grid gap-2">
                <Label htmlFor="transfer-dan">DAN (Deposit Account Number) *</Label>
                <Input
                  id="transfer-dan"
                  placeholder="e.g., NI00004420"
                  onChange={(e) => {
                    const danValue = e.target.value
                    try {
                      const existing = requestBody ? JSON.parse(requestBody) : {}
                      existing.dan = danValue
                      setRequestBody(JSON.stringify(existing, null, 2))
                    } catch {
                      setRequestBody(JSON.stringify({ dan: danValue, person_email: '' }, null, 2))
                    }
                  }}
                />
              </div>

              {/* Person Email Input */}
              <div className="grid gap-2">
                <Label htmlFor="transfer-person-email">Person Email *</Label>
                <Input
                  id="transfer-person-email"
                  type="email"
                  placeholder="e.g., recipient@example.com"
                  onChange={(e) => {
                    const emailValue = e.target.value
                    try {
                      const existing = requestBody ? JSON.parse(requestBody) : {}
                      existing.person_email = emailValue
                      setRequestBody(JSON.stringify(existing, null, 2))
                    } catch {
                      setRequestBody(JSON.stringify({ dan: '', person_email: emailValue }, null, 2))
                    }
                  }}
                />
                <p className="text-xs text-muted-foreground">
                  Enter the email address of the recipient member
                </p>
              </div>

              {/* Quick Create Button */}
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setRequestBody(JSON.stringify({ dan: 'NI00004420', person_email: 'recipient@example.com' }, null, 2))
                  toast({
                    title: 'Template Created',
                    description: 'Fill in the DAN and person_email fields',
                  })
                }}
              >
                Create Template
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Transfer Branch Deposit Helper (for transfer-branch-deposit) - Intra-member transfer */}
      {endpointId === 'transfer-branch-deposit' && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Transfer Branch Deposit Helper</CardTitle>
            <CardDescription>
              Transfer a deposit to another branch within the same member (intra-member transfer)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4">
              {/* Branch ID Selection */}
              <div className="grid gap-2">
                <Label>Target Branch ID *</Label>
                <Select
                  value={selectedTargetCredentialId}
                  onValueChange={(value) => {
                    setSelectedTargetCredentialId(value)
                    const targetCred = targetCredentials.find(c => c.id === value)
                    if (targetCred && targetCred.branchId) {
                      try {
                        const existing = requestBody ? JSON.parse(requestBody) : {}
                        existing.Branch_id = targetCred.branchId
                        setRequestBody(JSON.stringify(existing, null, 2))
                        toast({
                          title: 'Branch ID Populated',
                          description: `Set to: ${targetCred.branchId}`,
                        })
                      } catch {
                        setRequestBody(JSON.stringify({ Branch_id: targetCred.branchId }, null, 2))
                      }
                    }
                  }}
                  disabled={!selectedCredentialId}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a branch credential" />
                  </SelectTrigger>
                  <SelectContent>
                    {targetCredentials.map((cred) => (
                      <SelectItem key={cred.id} value={cred.id}>
                        {cred.orgName} - {cred.branchId || 'N/A'} ({cred.authType})
                      </SelectItem>
                    ))}
                    {targetCredentials.length === 0 && (
                      <SelectItem value="none" disabled>
                        No other credentials available
                      </SelectItem>
                    )}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Select a branch from your credentials to auto-populate Branch_id
                </p>
              </div>

              {/* Manual Branch ID Input */}
              <div className="grid gap-2">
                <Label htmlFor="transfer-branch-id">Or Enter Branch ID Manually *</Label>
                <Input
                  id="transfer-branch-id"
                  placeholder="e.g., BR3224SC"
                  onChange={(e) => {
                    const branchIdValue = e.target.value
                    try {
                      const existing = requestBody ? JSON.parse(requestBody) : {}
                      existing.Branch_id = branchIdValue
                      setRequestBody(JSON.stringify(existing, null, 2))
                    } catch {
                      setRequestBody(JSON.stringify({ Branch_id: branchIdValue }, null, 2))
                    }
                  }}
                />
              </div>

              {/* Optional Person ID Input */}
              <div className="grid gap-2">
                <Label htmlFor="transfer-person-id">Person ID (Optional)</Label>
                <Input
                  id="transfer-person-id"
                  placeholder="e.g., 123"
                  onChange={(e) => {
                    const personIdValue = e.target.value
                    try {
                      const existing = requestBody ? JSON.parse(requestBody) : {}
                      if (personIdValue) {
                        existing.person_id = personIdValue
                      } else {
                        delete existing.person_id
                      }
                      setRequestBody(JSON.stringify(existing, null, 2))
                    } catch {
                      if (personIdValue) {
                        setRequestBody(JSON.stringify({ Branch_id: '', person_id: personIdValue }, null, 2))
                      }
                    }
                  }}
                />
                <p className="text-xs text-muted-foreground">
                  Optional: person_id to clone/link the landlord
                </p>
              </div>

              {/* Quick Create Button */}
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setRequestBody(JSON.stringify({ Branch_id: 'BR3224SC' }, null, 2))
                  toast({
                    title: 'Template Created',
                    description: 'Fill in the Branch_id field (and optionally person_id)',
                  })
                }}
              >
                Create Template
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Remove Tenant - Multi-Select Helper */}
      {endpointId === 'remove-tenant' && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Select Tenants to Remove
            </CardTitle>
            <CardDescription>
              Select tenants that were previously added to deposits. You can add multiple tenants to remove in a single request.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4">
              {/* Step 1: DAN Selection Dropdown */}
              <div className="grid gap-2">
                <Label>Step 1: Select Deposit (DAN)</Label>
                <Select
                  value={selectedRemoveTenantDan}
                  onValueChange={handleRemoveTenantDanChange}
                  disabled={!selectedCredentialId || loadingAddedTenants}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={loadingAddedTenants ? 'Loading...' : 'Select a DAN...'} />
                  </SelectTrigger>
                  <SelectContent>
                    {/* Get unique DANs from added tenants */}
                    {[...new Set(addedTenants.map(t => t.dan))].map((dan) => {
                      const tenantsForDan = addedTenants.filter(t => t.dan === dan)
                      return (
                        <SelectItem key={dan} value={dan}>
                          {dan} ({tenantsForDan.length} tenant{tenantsForDan.length !== 1 ? 's' : ''} added)
                        </SelectItem>
                      )
                    })}
                    {addedTenants.length === 0 && !loadingAddedTenants && (
                      <SelectItem value="none" disabled>
                        No deposits with added tenants found
                      </SelectItem>
                    )}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Select the deposit (DAN) from which you want to remove tenants.
                </p>
              </div>

              {/* Step 2: Tenant Selection Dropdown + Add Button */}
              {selectedRemoveTenantDan && (
                <div className="grid gap-2">
                  <Label>Step 2: Select Tenant(s) to Remove</Label>
                  <div className="flex gap-2">
                    <Select
                      value={currentTenantSelection}
                      onValueChange={setCurrentTenantSelection}
                      disabled={!selectedRemoveTenantDan}
                    >
                      <SelectTrigger className="flex-1">
                        <SelectValue placeholder="Select a tenant..." />
                      </SelectTrigger>
                      <SelectContent>
                        {addedTenants
                          .filter(t => t.dan === selectedRemoveTenantDan && !selectedTenantsToRemove.find(s => s.id === t.id))
                          .map((tenantRecord) => (
                            <SelectItem key={tenantRecord.id} value={tenantRecord.id}>
                              {tenantRecord.tenant.person_firstname} {tenantRecord.tenant.person_surname} ({tenantRecord.tenant.person_email || tenantRecord.tenant.person_mobile || 'No contact'})
                            </SelectItem>
                          ))}
                        {addedTenants.filter(t => t.dan === selectedRemoveTenantDan && !selectedTenantsToRemove.find(s => s.id === t.id)).length === 0 && (
                          <SelectItem value="all-selected" disabled>
                            {addedTenants.filter(t => t.dan === selectedRemoveTenantDan).length === 0
                              ? 'No tenants found for this DAN'
                              : 'All tenants already selected'}
                          </SelectItem>
                        )}
                      </SelectContent>
                    </Select>
                    <Button
                      type="button"
                      onClick={addTenantToRemovalList}
                      disabled={!currentTenantSelection}
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      Add
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Select a tenant and click "Add" to include them in the removal request. You can add multiple tenants.
                  </p>
                </div>
              )}

              {/* Selected Tenants List */}
              {selectedTenantsToRemove.length > 0 && (
                <div className="grid gap-2">
                  <div className="flex items-center justify-between">
                    <Label>Selected Tenants ({selectedTenantsToRemove.length}):</Label>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={clearAllSelectedTenants}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4 mr-1" />
                      Clear All
                    </Button>
                  </div>
                  <div className="border rounded-lg divide-y">
                    {selectedTenantsToRemove.map((tenantRecord) => (
                      <div
                        key={tenantRecord.id}
                        className="flex items-center justify-between p-3 hover:bg-muted/50"
                      >
                        <div className="flex-1 min-w-0">
                          <span className="font-medium truncate">
                            {tenantRecord.tenant.person_firstname} {tenantRecord.tenant.person_surname}
                          </span>
                          <p className="text-xs text-muted-foreground truncate mt-1">
                            {tenantRecord.tenant.person_email || tenantRecord.tenant.person_mobile || tenantRecord.tenant.person_phone || 'No contact info'}
                          </p>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeTenantFromRemovalList(tenantRecord.id)}
                          className="text-destructive hover:text-destructive ml-2"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Empty State */}
              {selectedTenantsToRemove.length === 0 && (
                <div className="text-center py-6 text-muted-foreground border rounded-lg border-dashed">
                  <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No tenants selected</p>
                  <p className="text-xs">Select tenants from the dropdown above to add them to the removal list</p>
                </div>
              )}
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
