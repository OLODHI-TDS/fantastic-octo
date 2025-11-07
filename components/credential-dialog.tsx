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
import { AuthType } from '@/types/credential'
import { REGION_SCHEMES } from '@/lib/salesforce/region-scheme'

interface Credential {
  id?: string
  authType: AuthType
  orgName: string
  regionScheme: string
  memberId: string
  branchId: string
  apiKey?: string
  clientId?: string
  clientSecret?: string
  description?: string
  active: boolean
  environmentId: string
}

interface CredentialDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  credential?: Credential | null
  environmentId: string
  onSuccess: () => void
}

export function CredentialDialog({
  open,
  onOpenChange,
  credential,
  environmentId,
  onSuccess,
}: CredentialDialogProps) {
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [fetchingCredential, setFetchingCredential] = useState(false)
  const [formData, setFormData] = useState<Credential>({
    authType: 'oauth2',
    orgName: '',
    regionScheme: 'EW - Custodial',
    memberId: '',
    branchId: '',
    apiKey: '',
    clientId: '',
    clientSecret: '',
    description: '',
    active: true,
    environmentId,
  })

  // Fetch full credential data when editing
  useEffect(() => {
    const fetchCredential = async () => {
      if (open && credential?.id) {
        setFetchingCredential(true)
        try {
          const response = await fetch(`/api/credentials/${credential.id}`)
          if (response.ok) {
            const data = await response.json()
            setFormData({
              ...data,
              // Clear sensitive fields for security
              apiKey: '',
              clientSecret: '',
              environmentId,
            })
          }
        } catch (error) {
          console.error('Error fetching credential:', error)
        } finally {
          setFetchingCredential(false)
        }
      } else if (open && !credential?.id) {
        // Reset for new credential
        setFormData({
          authType: 'oauth2',
          orgName: '',
          regionScheme: 'EW - Custodial',
          memberId: '',
          branchId: '',
          apiKey: '',
          clientId: '',
          clientSecret: '',
          description: '',
          active: true,
          environmentId,
        })
      }
    }

    fetchCredential()
  }, [open, credential?.id, environmentId])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const url = credential?.id
        ? `/api/credentials/${credential.id}`
        : '/api/credentials'
      const method = credential?.id ? 'PUT' : 'POST'

      // Prepare submit data based on auth type
      const submitData: any = {
        authType: formData.authType,
        orgName: formData.orgName,
        regionScheme: formData.regionScheme,
        memberId: formData.memberId,
        branchId: formData.branchId,
        description: formData.description,
        active: formData.active,
        environmentId: formData.environmentId,
      }

      // Add auth-specific fields
      if (formData.authType === 'apikey') {
        if (formData.apiKey || !credential?.id) {
          submitData.apiKey = formData.apiKey
        }
      } else {
        // oauth2
        if (formData.clientId || !credential?.id) {
          submitData.clientId = formData.clientId
        }
        if (formData.clientSecret || !credential?.id) {
          submitData.clientSecret = formData.clientSecret
        }
      }

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(submitData),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to save credential')
      }

      toast({
        title: 'Success',
        description: credential?.id
          ? 'Credential updated successfully'
          : 'Credential created successfully',
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[550px] max-h-[90vh] overflow-y-auto">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>
              {credential?.id ? 'Edit Credential' : 'Add Credential'}
            </DialogTitle>
            <DialogDescription>
              Add authentication credentials for this environment
            </DialogDescription>
          </DialogHeader>

          {fetchingCredential ? (
            <div className="py-8 text-center text-sm text-muted-foreground">
              Loading credential data...
            </div>
          ) : (
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="authType">Authentication Type *</Label>
                <Select
                  value={formData.authType}
                  onValueChange={(value: AuthType) => {
                    // Clear auth-specific fields when switching types
                    setFormData({
                      ...formData,
                      authType: value,
                      apiKey: '',
                      clientId: '',
                      clientSecret: ''
                    })
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select auth type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="oauth2">OAuth2</SelectItem>
                    <SelectItem value="apikey">API Key</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Organization Details */}
              <div className="border-t pt-4">
                <h4 className="text-sm font-semibold mb-3">Organization Details</h4>

                <div className="grid gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="orgName">Organization Name *</Label>
                    <Input
                      id="orgName"
                      placeholder="Your organization name"
                      value={formData.orgName}
                      onChange={(e) =>
                        setFormData({ ...formData, orgName: e.target.value })
                      }
                      required
                    />
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="regionScheme">Region & Scheme *</Label>
                    <Select
                      value={formData.regionScheme}
                      onValueChange={(value) =>
                        setFormData({ ...formData, regionScheme: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select region and scheme" />
                      </SelectTrigger>
                      <SelectContent>
                        {REGION_SCHEMES.map((scheme) => (
                          <SelectItem key={scheme} value={scheme}>
                            {scheme}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="memberId">Member ID *</Label>
                    <Input
                      id="memberId"
                      placeholder="Member ID"
                      value={formData.memberId}
                      onChange={(e) =>
                        setFormData({ ...formData, memberId: e.target.value })
                      }
                      required
                    />
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="branchId">Branch ID *</Label>
                    <Input
                      id="branchId"
                      placeholder="Branch ID"
                      value={formData.branchId}
                      onChange={(e) =>
                        setFormData({ ...formData, branchId: e.target.value })
                      }
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Auth-specific Fields */}
              <div className="border-t pt-4">
                <h4 className="text-sm font-semibold mb-3">
                  {formData.authType === 'apikey' ? 'API Key' : 'OAuth2'} Credentials
                </h4>

                {formData.authType === 'apikey' ? (
                  <div className="grid gap-2">
                    <Label htmlFor="apiKey">API Key *</Label>
                    <Input
                      id="apiKey"
                      type="password"
                      placeholder="Enter API key"
                      value={formData.apiKey || ''}
                      onChange={(e) =>
                        setFormData({ ...formData, apiKey: e.target.value })
                      }
                      required={!credential?.id}
                    />
                    {credential?.id && (
                      <p className="text-xs text-muted-foreground">
                        Leave blank to keep existing API key
                      </p>
                    )}
                  </div>
                ) : (
                  <div className="grid gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="clientId">Client ID *</Label>
                      <Input
                        id="clientId"
                        placeholder="3MVG9..."
                        value={formData.clientId || ''}
                        onChange={(e) =>
                          setFormData({ ...formData, clientId: e.target.value })
                        }
                        required={!credential?.id}
                      />
                      <p className="text-xs text-muted-foreground">
                        From your Salesforce Connected App
                      </p>
                    </div>

                    <div className="grid gap-2">
                      <Label htmlFor="clientSecret">Client Secret *</Label>
                      <Input
                        id="clientSecret"
                        type="password"
                        placeholder="Enter client secret"
                        value={formData.clientSecret || ''}
                        onChange={(e) =>
                          setFormData({ ...formData, clientSecret: e.target.value })
                        }
                        required={!credential?.id}
                      />
                      {credential?.id && (
                        <p className="text-xs text-muted-foreground">
                          Leave blank to keep existing secret
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>

              <div className="grid gap-2">
                <Label htmlFor="description">Description (Optional)</Label>
                <Textarea
                  id="description"
                  placeholder="Notes about this credential..."
                  value={formData.description || ''}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  rows={2}
                />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading || fetchingCredential}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading || fetchingCredential}>
              {loading ? 'Saving...' : credential?.id ? 'Update' : 'Create'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
