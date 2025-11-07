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
import { HttpMethod } from '@/types/test'

interface Environment {
  id: string
  name: string
}

interface Credential {
  id: string
  orgName: string
  authType: string
}

interface Test {
  id?: string
  name: string
  description?: string
  endpoint: string
  method: HttpMethod
  headers?: Record<string, string>
  body?: any
  expectedStatus: number
  environmentId: string
  credentialId: string
}

interface CustomTestDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  test?: Test | null
  onSuccess: () => void
}

export function CustomTestDialog({
  open,
  onOpenChange,
  test,
  onSuccess,
}: CustomTestDialogProps) {
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [environments, setEnvironments] = useState<Environment[]>([])
  const [credentials, setCredentials] = useState<Credential[]>([])
  const [formData, setFormData] = useState<Test>({
    name: '',
    description: '',
    endpoint: '/services/apexrest/',
    method: 'GET',
    headers: {},
    body: undefined,
    expectedStatus: 200,
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

  // Reset form when dialog opens/closes or test changes
  useEffect(() => {
    if (open && test) {
      setFormData(test)
    } else if (open && !test) {
      setFormData({
        name: '',
        description: '',
        endpoint: '/services/apexrest/',
        method: 'GET',
        headers: {},
        body: undefined,
        expectedStatus: 200,
        environmentId: '',
        credentialId: '',
      })
    }
  }, [open, test])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const url = test?.id
        ? `/api/tests/${test.id}`
        : '/api/tests'
      const method = test?.id ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to save test')
      }

      toast({
        title: 'Success',
        description: test?.id
          ? 'Test updated successfully'
          : 'Test created successfully',
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

  const handleHeadersChange = (value: string) => {
    try {
      const parsed = value ? JSON.parse(value) : {}
      setFormData({ ...formData, headers: parsed })
    } catch (e) {
      // Keep the string value for now, will validate on submit
    }
  }

  const handleBodyChange = (value: string) => {
    try {
      const parsed = value ? JSON.parse(value) : undefined
      setFormData({ ...formData, body: parsed })
    } catch (e) {
      // Keep the string value for now, will validate on submit
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[650px] max-h-[90vh] overflow-y-auto">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>
              {test?.id ? 'Edit Custom Test' : 'Create Custom Test'}
            </DialogTitle>
            <DialogDescription>
              Configure a custom API test with full control over all parameters
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            {/* Test Name */}
            <div className="grid gap-2">
              <Label htmlFor="name">Test Name *</Label>
              <Input
                id="name"
                placeholder="Get deposit status"
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
                value={formData.description || ''}
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

            {/* HTTP Method & Endpoint */}
            <div className="grid grid-cols-3 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="method">Method *</Label>
                <Select
                  value={formData.method}
                  onValueChange={(value: HttpMethod) =>
                    setFormData({ ...formData, method: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="GET">GET</SelectItem>
                    <SelectItem value="POST">POST</SelectItem>
                    <SelectItem value="PUT">PUT</SelectItem>
                    <SelectItem value="PATCH">PATCH</SelectItem>
                    <SelectItem value="DELETE">DELETE</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2 col-span-2">
                <Label htmlFor="endpoint">Endpoint *</Label>
                <Input
                  id="endpoint"
                  placeholder="/services/apexrest/depositcreation"
                  value={formData.endpoint}
                  onChange={(e) =>
                    setFormData({ ...formData, endpoint: e.target.value })
                  }
                  required
                />
              </div>
            </div>

            {/* Expected Status */}
            <div className="grid gap-2">
              <Label htmlFor="expectedStatus">Expected Status Code *</Label>
              <Input
                id="expectedStatus"
                type="number"
                min="100"
                max="599"
                value={formData.expectedStatus}
                onChange={(e) =>
                  setFormData({ ...formData, expectedStatus: parseInt(e.target.value) })
                }
                required
              />
            </div>

            {/* Custom Headers */}
            <div className="grid gap-2">
              <Label htmlFor="headers">Custom Headers (JSON)</Label>
              <Textarea
                id="headers"
                placeholder='{"Content-Type": "application/json"}'
                value={formData.headers ? JSON.stringify(formData.headers, null, 2) : ''}
                onChange={(e) => handleHeadersChange(e.target.value)}
                rows={3}
                className="font-mono text-sm"
              />
            </div>

            {/* Request Body */}
            {formData.method !== 'GET' && formData.method !== 'DELETE' && (
              <div className="grid gap-2">
                <Label htmlFor="body">Request Body (JSON)</Label>
                <Textarea
                  id="body"
                  placeholder='{"tenancy": {...}}'
                  value={formData.body ? JSON.stringify(formData.body, null, 2) : ''}
                  onChange={(e) => handleBodyChange(e.target.value)}
                  rows={6}
                  className="font-mono text-sm"
                />
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
              {loading ? 'Saving...' : test?.id ? 'Update' : 'Create'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
