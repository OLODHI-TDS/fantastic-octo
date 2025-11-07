'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/hooks/use-toast'
import { Plus, Trash2, Edit, Key, ChevronDown, ChevronRight } from 'lucide-react'
import { EnvironmentDialog } from '@/components/environment-dialog'
import { CredentialDialog } from '@/components/credential-dialog'

interface Credential {
  id: string
  authType: 'apikey' | 'oauth2'
  orgName: string
  regionScheme: string
  memberId: string
  branchId: string
  description?: string
  active: boolean
  environmentId: string
}

interface Environment {
  id: string
  name: string
  type: string
  instanceUrl: string
  description?: string
  active: boolean
  createdAt: string
  credentials: Credential[]
  _count: {
    credentials: number
    tests: number
  }
}

export default function EnvironmentsPage() {
  const [environments, setEnvironments] = useState<Environment[]>([])
  const [loading, setLoading] = useState(true)
  const [envDialogOpen, setEnvDialogOpen] = useState(false)
  const [credDialogOpen, setCredDialogOpen] = useState(false)
  const [selectedEnvironment, setSelectedEnvironment] = useState<Environment | null>(null)
  const [selectedCredential, setSelectedCredential] = useState<any>(null)
  const [expandedEnvs, setExpandedEnvs] = useState<Set<string>>(new Set())
  const { toast } = useToast()

  useEffect(() => {
    fetchEnvironments()
  }, [])

  const fetchEnvironments = async () => {
    try {
      const response = await fetch('/api/environments')
      if (!response.ok) throw new Error('Failed to fetch environments')
      const data = await response.json()
      setEnvironments(data)
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

  const deleteEnvironment = async (id: string) => {
    if (!confirm('Are you sure you want to delete this environment? All credentials and tests will also be deleted.')) return

    try {
      const response = await fetch(`/api/environments/${id}`, {
        method: 'DELETE',
      })
      if (!response.ok) throw new Error('Failed to delete environment')

      toast({
        title: 'Success',
        description: 'Environment deleted successfully',
      })
      fetchEnvironments()
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message,
      })
    }
  }

  const deleteCredential = async (envId: string, credId: string) => {
    if (!confirm('Are you sure you want to delete this credential?')) return

    try {
      const response = await fetch(`/api/credentials/${credId}`, {
        method: 'DELETE',
      })
      if (!response.ok) throw new Error('Failed to delete credential')

      toast({
        title: 'Success',
        description: 'Credential deleted successfully',
      })
      fetchEnvironments()
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message,
      })
    }
  }

  const openAddEnvDialog = () => {
    setSelectedEnvironment(null)
    setEnvDialogOpen(true)
  }

  const openEditEnvDialog = (env: Environment) => {
    setSelectedEnvironment(env)
    setEnvDialogOpen(true)
  }

  const openAddCredDialog = (env: Environment) => {
    setSelectedEnvironment(env)
    setSelectedCredential(null)
    setCredDialogOpen(true)
  }

  const openEditCredDialog = (env: Environment, cred: Credential) => {
    setSelectedEnvironment(env)
    setSelectedCredential(cred)
    setCredDialogOpen(true)
  }

  const toggleExpanded = (envId: string) => {
    const newExpanded = new Set(expandedEnvs)
    if (newExpanded.has(envId)) {
      newExpanded.delete(envId)
    } else {
      newExpanded.add(envId)
    }
    setExpandedEnvs(newExpanded)
  }

  if (loading) {
    return (
      <div className="container mx-auto py-8 px-4">
        <p>Loading environments...</p>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-8 px-4 max-w-6xl">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">Environments</h1>
          <p className="text-muted-foreground">
            Manage your Salesforce environments and their credentials
          </p>
        </div>
        <Button onClick={openAddEnvDialog}>
          <Plus className="mr-2 h-4 w-4" />
          Add Environment
        </Button>
      </div>

      {environments.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <p className="text-muted-foreground mb-4">No environments configured yet</p>
            <Button onClick={openAddEnvDialog}>
              <Plus className="mr-2 h-4 w-4" />
              Add Your First Environment
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {environments.map((env) => (
            <Card key={env.id}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0"
                        onClick={() => toggleExpanded(env.id)}
                      >
                        {expandedEnvs.has(env.id) ? (
                          <ChevronDown className="h-4 w-4" />
                        ) : (
                          <ChevronRight className="h-4 w-4" />
                        )}
                      </Button>
                      <CardTitle>{env.name}</CardTitle>
                      <Badge variant={env.active ? 'default' : 'secondary'} className="ml-2">
                        {env.active ? 'Active' : 'Inactive'}
                      </Badge>
                      <Badge variant="outline" className="capitalize">
                        {env.type}
                      </Badge>
                    </div>
                    <CardDescription className="mt-2 ml-8">
                      {env.instanceUrl}
                      {env.description && ` • ${env.description}`}
                    </CardDescription>
                    <div className="flex gap-4 mt-2 ml-8 text-sm text-muted-foreground">
                      <span>{env._count.credentials} credential{env._count.credentials !== 1 ? 's' : ''}</span>
                      <span>{env._count.tests} test{env._count.tests !== 1 ? 's' : ''}</span>
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <Button variant="outline" size="sm" onClick={() => openEditEnvDialog(env)}>
                      <Edit className="mr-2 h-3 w-3" />
                      Edit
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => deleteEnvironment(env.id)}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </CardHeader>

              {expandedEnvs.has(env.id) && (
                <CardContent>
                  <div className="border-t pt-4">
                    <div className="flex justify-between items-center mb-3">
                      <h3 className="text-sm font-semibold flex items-center gap-2">
                        <Key className="h-4 w-4" />
                        Credentials
                      </h3>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => openAddCredDialog(env)}
                      >
                        <Plus className="mr-2 h-3 w-3" />
                        Add Credential
                      </Button>
                    </div>

                    {env.credentials.length === 0 ? (
                      <div className="text-center py-6 text-sm text-muted-foreground bg-muted/30 rounded-md">
                        No credentials added yet. Add one to start testing.
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {env.credentials.map((cred) => (
                          <div
                            key={cred.id}
                            className="flex items-center justify-between p-3 bg-muted/30 rounded-md hover:bg-muted/50 transition-colors"
                          >
                            <div className="flex items-center gap-2">
                              <Key className="h-3 w-3 text-muted-foreground" />
                              <span className="font-medium text-sm">{cred.orgName}</span>
                              <Badge variant="outline" className="text-xs capitalize">
                                {cred.authType === 'apikey' ? 'API Key' : 'OAuth2'}
                              </Badge>
                              <Badge
                                variant={cred.active ? 'default' : 'secondary'}
                                className="text-xs"
                              >
                                {cred.active ? 'Active' : 'Inactive'}
                              </Badge>
                            </div>
                            <div className="flex space-x-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => openEditCredDialog(env, cred)}
                              >
                                <Edit className="h-3 w-3" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => deleteCredential(env.id, cred.id)}
                              >
                                <Trash2 className="h-3 w-3 text-destructive" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </CardContent>
              )}
            </Card>
          ))}
        </div>
      )}

      <EnvironmentDialog
        open={envDialogOpen}
        onOpenChange={setEnvDialogOpen}
        environment={selectedEnvironment}
        onSuccess={fetchEnvironments}
      />

      {selectedEnvironment && (
        <CredentialDialog
          open={credDialogOpen}
          onOpenChange={setCredDialogOpen}
          credential={selectedCredential}
          environmentId={selectedEnvironment.id}
          onSuccess={fetchEnvironments}
        />
      )}
    </div>
  )
}
