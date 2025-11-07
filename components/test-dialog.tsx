'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
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
import { useToast } from '@/hooks/use-toast'
import { API_ENDPOINTS, API_CATEGORIES, getEndpointById, getEndpointsByCategory, ApiEndpoint } from '@/lib/api-endpoints'

interface Environment {
  id: string
  name: string
}

interface Credential {
  id: string
  orgName: string
  authType: string
}

interface TestDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

export function TestDialog({
  open,
  onOpenChange,
  onSuccess,
}: TestDialogProps) {
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [environments, setEnvironments] = useState<Environment[]>([])
  const [credentials, setCredentials] = useState<Credential[]>([])
  const [selectedCategory, setSelectedCategory] = useState('All')
  const [selectedEndpointId, setSelectedEndpointId] = useState<string>('')
  const [selectedEndpoint, setSelectedEndpoint] = useState<ApiEndpoint | null>(null)
  const [pathParamValue, setPathParamValue] = useState('')
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    environmentId: '',
    credentialId: '',
  })

  // Fetch environments on mount
  useEffect(() => {
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
    fetchEnvironments()
  }, [])

  // Fetch credentials when environment changes
  useEffect(() => {
    const fetchCredentials = async () => {
      if (!formData.environmentId) {
        setCredentials([])
        return
      }

      try {
        const response = await fetch(`/api/credentials?environmentId=${formData.environmentId}`)
        if (response.ok) {
          const data = await response.json()
          setCredentials(data)
        }
      } catch (error) {
        console.error('Error fetching credentials:', error)
      }
    }
    fetchCredentials()
  }, [formData.environmentId])

  // Update selected endpoint when endpoint ID changes
  useEffect(() => {
    if (selectedEndpointId) {
      const endpoint = getEndpointById(selectedEndpointId)
      setSelectedEndpoint(endpoint || null)
      setPathParamValue('')

      // Auto-populate test name if empty
      if (!formData.name && endpoint) {
        setFormData(prev => ({ ...prev, name: endpoint.name }))
      }
    } else {
      setSelectedEndpoint(null)
    }
  }, [selectedEndpointId])

  // Reset form when dialog opens/closes
  useEffect(() => {
    if (open) {
      setFormData({
        name: '',
        description: '',
        environmentId: '',
        credentialId: '',
      })
      setSelectedCategory('All')
      setSelectedEndpointId('')
      setPathParamValue('')
    }
  }, [open])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!selectedEndpoint) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Please select an endpoint',
      })
      return
    }

    setLoading(true)

    try {
      // Build the final endpoint URL with path parameter if needed
      let finalEndpoint = selectedEndpoint.endpoint
      if (selectedEndpoint.requiresPathParam && pathParamValue) {
        finalEndpoint = finalEndpoint.replace(`{${selectedEndpoint.pathParamName}}`, pathParamValue)
      }

      const testData = {
        name: formData.name,
        description: formData.description || undefined,
        endpoint: finalEndpoint,
        method: selectedEndpoint.method,
        headers: {},
        body: undefined,
        expectedStatus: 200,
        environmentId: formData.environmentId,
        credentialId: formData.credentialId,
      }

      const response = await fetch('/api/tests', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(testData),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to create test')
      }

      toast({
        title: 'Success',
        description: 'Test created successfully',
      })

      onSuccess()
      onOpenChange(false)
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message,
      })
    } finally {
      setLoading(false)
    }
  }

  const filteredEndpoints = getEndpointsByCategory(selectedCategory)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Create Test</DialogTitle>
            <DialogDescription>
              Create a test from predefined API endpoints
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            {/* Test Name */}
            <div className="grid gap-2">
              <Label htmlFor="name">Test Name *</Label>
              <Input
                id="name"
                placeholder="My API Test"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                required
              />
            </div>

            {/* Description */}
            <div className="grid gap-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Describe what this test does..."
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                rows={2}
              />
            </div>

            {/* Environment & Credential */}
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="environment">Environment *</Label>
                <Select
                  value={formData.environmentId}
                  onValueChange={(value) =>
                    setFormData({ ...formData, environmentId: value, credentialId: '' })
                  }
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
                <Label htmlFor="credential">Credential *</Label>
                <Select
                  value={formData.credentialId}
                  onValueChange={(value) =>
                    setFormData({ ...formData, credentialId: value })
                  }
                  disabled={!formData.environmentId}
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

            {/* Category Filter */}
            <div className="grid gap-2">
              <Label htmlFor="category">Category</Label>
              <Select
                value={selectedCategory}
                onValueChange={(value) => {
                  setSelectedCategory(value)
                  setSelectedEndpointId('')
                }}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {API_CATEGORIES.map((category) => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Endpoint Selection */}
            <div className="grid gap-2">
              <Label htmlFor="endpoint">API Endpoint *</Label>
              <Select
                value={selectedEndpointId}
                onValueChange={setSelectedEndpointId}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select an API endpoint" />
                </SelectTrigger>
                <SelectContent>
                  {filteredEndpoints.map((endpoint) => (
                    <SelectItem key={endpoint.id} value={endpoint.id}>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs bg-muted px-1 py-0.5 rounded">
                          {endpoint.method}
                        </span>
                        <span>{endpoint.name}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {selectedEndpoint && (
                <p className="text-xs text-muted-foreground mt-1">
                  {selectedEndpoint.description}
                </p>
              )}
            </div>

            {/* Path Parameter Input */}
            {selectedEndpoint?.requiresPathParam && (
              <div className="grid gap-2">
                <Label htmlFor="pathParam">
                  {selectedEndpoint.pathParamName} *
                </Label>
                <Input
                  id="pathParam"
                  placeholder={selectedEndpoint.pathParamPlaceholder}
                  value={pathParamValue}
                  onChange={(e) => setPathParamValue(e.target.value)}
                  required
                />
                <p className="text-xs text-muted-foreground">
                  Final endpoint: <code className="bg-muted px-1 py-0.5 rounded text-xs">
                    {selectedEndpoint.endpoint.replace(`{${selectedEndpoint.pathParamName}}`, pathParamValue || `{${selectedEndpoint.pathParamName}}`)}
                  </code>
                </p>
              </div>
            )}

            {/* Endpoint Preview */}
            {selectedEndpoint && !selectedEndpoint.requiresPathParam && (
              <div className="grid gap-2">
                <Label>Endpoint Preview</Label>
                <code className="text-xs bg-muted px-3 py-2 rounded block">
                  {selectedEndpoint.method} {selectedEndpoint.endpoint}
                </code>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Creating...' : 'Create Test'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
