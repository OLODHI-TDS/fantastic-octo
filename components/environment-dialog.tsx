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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { useToast } from '@/hooks/use-toast'
import { Textarea } from '@/components/ui/textarea'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import { ChevronDown, ChevronRight, CheckCircle2, AlertCircle } from 'lucide-react'
import { SalesforceLoginButton } from '@/components/salesforce-login-button'

interface Environment {
  id?: string
  name: string
  type: string
  instanceUrl: string
  description?: string
  active: boolean
  verificationEnabled?: boolean
  verificationBearerToken?: string
  sfConnectedAppClientId?: string
  sfConnectedAppClientSecret?: string
  sfRefreshToken?: string
  sfTokenExpiresAt?: string | Date | null
}

interface EnvironmentDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  environment?: Environment | null
  onSuccess: () => void
}

export function EnvironmentDialog({
  open,
  onOpenChange,
  environment,
  onSuccess,
}: EnvironmentDialogProps) {
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [oauthConfigOpen, setOauthConfigOpen] = useState(false)
  const [formData, setFormData] = useState<Environment>({
    name: '',
    type: 'sandbox',
    instanceUrl: '',
    description: '',
    active: true,
    verificationEnabled: false,
    verificationBearerToken: '',
    sfConnectedAppClientId: '',
    sfConnectedAppClientSecret: '',
  })

  // Reset form when dialog opens
  useEffect(() => {
    if (open) {
      if (environment) {
        setFormData(environment)
        // Open OAuth config if already configured
        if (environment.sfConnectedAppClientId) {
          setOauthConfigOpen(true)
        }
      } else {
        setFormData({
          name: '',
          type: 'sandbox',
          instanceUrl: '',
          description: '',
          active: true,
          verificationEnabled: false,
          verificationBearerToken: '',
          sfConnectedAppClientId: '',
          sfConnectedAppClientSecret: '',
        })
        setOauthConfigOpen(false)
      }
    }
  }, [open, environment])

  // Check if OAuth is configured
  const isOAuthConfigured = !!(formData.sfConnectedAppClientId && formData.sfConnectedAppClientSecret)

  // Handler for OAuth token received
  const handleTokenReceived = (token: string, expiresAt: string) => {
    setFormData(prev => ({
      ...prev,
      verificationBearerToken: token,
      sfTokenExpiresAt: expiresAt,
    }))
    toast({
      title: 'Connected to Salesforce',
      description: 'Bearer token has been automatically retrieved.',
    })
  }

  const handleOAuthError = (error: string) => {
    toast({
      variant: 'destructive',
      title: 'Salesforce Login Failed',
      description: error,
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const url = environment?.id
        ? `/api/environments/${environment.id}`
        : '/api/environments'
      const method = environment?.id ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to save environment')
      }

      toast({
        title: 'Success',
        description: environment?.id
          ? 'Environment updated successfully'
          : 'Environment created successfully',
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
      <DialogContent className="sm:max-w-[500px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>
              {environment?.id ? 'Edit Environment' : 'Add Environment'}
            </DialogTitle>
            <DialogDescription>
              Configure a Salesforce environment. You'll add credentials separately.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Name *</Label>
              <Input
                id="name"
                placeholder="Production, Sandbox, Dev..."
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                required
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="type">Type *</Label>
              <Select
                value={formData.type}
                onValueChange={(value) =>
                  setFormData({ ...formData, type: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select environment type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="production">Production</SelectItem>
                  <SelectItem value="sandbox">Sandbox</SelectItem>
                  <SelectItem value="scratch">Scratch Org</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="instanceUrl">Instance URL *</Label>
              <Input
                id="instanceUrl"
                type="url"
                placeholder="https://your-domain.my.salesforce.com"
                value={formData.instanceUrl}
                onChange={(e) =>
                  setFormData({ ...formData, instanceUrl: e.target.value })
                }
                required
              />
              <p className="text-xs text-muted-foreground">
                Your Salesforce instance URL
              </p>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="description">Description (Optional)</Label>
              <Textarea
                id="description"
                placeholder="Additional notes about this environment..."
                value={formData.description || ''}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                rows={3}
              />
            </div>

            {/* Verification Settings */}
            <div className="border-t pt-4 space-y-4">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="verificationEnabled"
                  checked={formData.verificationEnabled}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, verificationEnabled: checked === true })
                  }
                />
                <div className="grid gap-0.5">
                  <label
                    htmlFor="verificationEnabled"
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                  >
                    Enable Verification Queries
                  </label>
                  <p className="text-xs text-muted-foreground">
                    Allow test bench to verify API changes via Salesforce REST API
                  </p>
                </div>
              </div>

              {formData.verificationEnabled && (
                <div className="space-y-4 pl-6">
                  {/* OAuth Configuration - Collapsible */}
                  <Collapsible open={oauthConfigOpen} onOpenChange={setOauthConfigOpen}>
                    <CollapsibleTrigger className="flex items-center gap-2 text-sm font-medium hover:text-primary transition-colors">
                      {oauthConfigOpen ? (
                        <ChevronDown className="h-4 w-4" />
                      ) : (
                        <ChevronRight className="h-4 w-4" />
                      )}
                      OAuth Configuration
                      {isOAuthConfigured && (
                        <CheckCircle2 className="h-4 w-4 text-green-500 ml-1" />
                      )}
                    </CollapsibleTrigger>
                    <CollapsibleContent className="mt-3 space-y-3">
                      <p className="text-xs text-muted-foreground">
                        Configure a Connected App in Salesforce to enable automatic token retrieval.
                      </p>
                      <div className="grid gap-2">
                        <Label htmlFor="sfConnectedAppClientId">Connected App Client ID</Label>
                        <Input
                          id="sfConnectedAppClientId"
                          placeholder="Consumer Key from Connected App"
                          value={formData.sfConnectedAppClientId || ''}
                          onChange={(e) =>
                            setFormData({ ...formData, sfConnectedAppClientId: e.target.value })
                          }
                          className="font-mono text-xs"
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="sfConnectedAppClientSecret">Connected App Secret</Label>
                        <Input
                          id="sfConnectedAppClientSecret"
                          type="password"
                          placeholder="Consumer Secret from Connected App"
                          value={formData.sfConnectedAppClientSecret || ''}
                          onChange={(e) =>
                            setFormData({ ...formData, sfConnectedAppClientSecret: e.target.value })
                          }
                          className="font-mono text-xs"
                        />
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Create in Salesforce: Setup &gt; App Manager &gt; New Connected App
                        <br />
                        Callback URL: <code className="bg-muted px-1 py-0.5 rounded">{typeof window !== 'undefined' ? window.location.origin : ''}/api/auth/salesforce/callback</code>
                      </p>
                    </CollapsibleContent>
                  </Collapsible>

                  {/* Bearer Token Section */}
                  <div className="grid gap-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="verificationBearerToken">Verification Bearer Token</Label>
                      {formData.verificationBearerToken && (
                        <span className="flex items-center gap-1 text-xs text-green-600">
                          <CheckCircle2 className="h-3 w-3" />
                          Token configured
                        </span>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <Textarea
                        id="verificationBearerToken"
                        placeholder="00D... (Salesforce session token)"
                        value={formData.verificationBearerToken || ''}
                        onChange={(e) =>
                          setFormData({ ...formData, verificationBearerToken: e.target.value })
                        }
                        rows={2}
                        className="font-mono text-xs flex-1"
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <p className="text-xs text-muted-foreground">
                        Get token manually: <code className="bg-muted px-1 py-0.5 rounded">sf org display --target-org [ALIAS]</code>
                      </p>
                      {environment?.id && isOAuthConfigured && (
                        <SalesforceLoginButton
                          environmentId={environment.id}
                          disabled={!isOAuthConfigured}
                          onTokenReceived={handleTokenReceived}
                          onError={handleOAuthError}
                        />
                      )}
                    </div>
                    {!environment?.id && isOAuthConfigured && (
                      <p className="text-xs text-amber-600 flex items-center gap-1">
                        <AlertCircle className="h-3 w-3" />
                        Save the environment first to use Salesforce Login
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>
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
              {loading ? 'Saving...' : environment?.id ? 'Update' : 'Create'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
