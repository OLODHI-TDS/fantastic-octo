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

interface Environment {
  id?: string
  name: string
  type: string
  instanceUrl: string
  description?: string
  active: boolean
  verificationEnabled?: boolean
  verificationBearerToken?: string
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
  const [formData, setFormData] = useState<Environment>({
    name: '',
    type: 'sandbox',
    instanceUrl: '',
    description: '',
    active: true,
    verificationEnabled: false,
    verificationBearerToken: '',
  })

  // Reset form when dialog opens
  useEffect(() => {
    if (open) {
      if (environment) {
        setFormData(environment)
      } else {
        setFormData({
          name: '',
          type: 'sandbox',
          instanceUrl: '',
          description: '',
          active: true,
          verificationEnabled: false,
          verificationBearerToken: '',
        })
      }
    }
  }, [open, environment])

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
                <div className="grid gap-2 pl-6">
                  <Label htmlFor="verificationBearerToken">Verification Bearer Token *</Label>
                  <Textarea
                    id="verificationBearerToken"
                    placeholder="00D... (Salesforce session token from CLI)"
                    value={formData.verificationBearerToken || ''}
                    onChange={(e) =>
                      setFormData({ ...formData, verificationBearerToken: e.target.value })
                    }
                    rows={3}
                    className="font-mono text-xs"
                  />
                  <p className="text-xs text-muted-foreground">
                    Get token via: <code className="bg-muted px-1 py-0.5 rounded">sf org display --target-org [ALIAS] --json</code>
                  </p>
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
