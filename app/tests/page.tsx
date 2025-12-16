'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { ArrowRight, Search, Download, Upload, RefreshCw, Pencil, Trash2, LucideIcon, LayoutGrid, List, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { API_ENDPOINTS } from '@/lib/api-endpoints'

type ViewMode = 'grid' | 'list'

export default function TestsPage() {
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState('')
  const [viewMode, setViewMode] = useState<ViewMode>('grid')

  // NRLA endpoints
  const nrlaEndpointIds = ['delete-deposit', 'add-to-cart', 'remove-from-cart', 'list-cart-contents', 'add-additional-tenant', 'remove-tenant', 'payment-link', 'register-landlord']

  // Filter and separate endpoints
  const allEndpoints = API_ENDPOINTS.filter(endpoint => {
    if (!searchQuery) return true
    const query = searchQuery.toLowerCase()
    return (
      endpoint.name.toLowerCase().includes(query) ||
      endpoint.description.toLowerCase().includes(query) ||
      endpoint.endpoint.toLowerCase().includes(query)
    )
  })

  const nrlaEndpoints = allEndpoints.filter(endpoint => nrlaEndpointIds.includes(endpoint.id))
  const depositManagementEndpoints = allEndpoints.filter(endpoint => !nrlaEndpointIds.includes(endpoint.id))

  // Group endpoints by method
  const groupByMethod = (endpoints: typeof allEndpoints) => {
    const methodOrder = ['POST', 'GET', 'PUT', 'PATCH', 'DELETE']
    const grouped: Record<string, typeof allEndpoints> = {}

    endpoints.forEach(endpoint => {
      const method = endpoint.method.toUpperCase()
      if (!grouped[method]) {
        grouped[method] = []
      }
      grouped[method].push(endpoint)
    })

    // Return in specific order
    return methodOrder
      .filter(method => grouped[method])
      .map(method => ({ method, endpoints: grouped[method] }))
  }

  const nrlaByMethod = groupByMethod(nrlaEndpoints)
  const depositManagementByMethod = groupByMethod(depositManagementEndpoints)

  const getMethodColor = (method: string) => {
    switch (method.toUpperCase()) {
      case 'GET':
        return 'bg-blue-600'
      case 'POST':
        return 'bg-emerald-600'
      case 'PUT':
        return 'bg-amber-500'
      case 'PATCH':
        return 'bg-purple-600'
      case 'DELETE':
        return 'bg-red-600'
      default:
        return 'bg-gray-500'
    }
  }

  const getMethodBorderColor = (method: string) => {
    switch (method.toUpperCase()) {
      case 'GET':
        return 'border-l-blue-600'
      case 'POST':
        return 'border-l-emerald-600'
      case 'PUT':
        return 'border-l-amber-500'
      case 'PATCH':
        return 'border-l-purple-600'
      case 'DELETE':
        return 'border-l-red-600'
      default:
        return 'border-l-gray-500'
    }
  }

  const getMethodGlow = (method: string) => {
    switch (method.toUpperCase()) {
      case 'GET':
        return 'hover:shadow-blue-600/25 dark:hover:shadow-blue-500/20'
      case 'POST':
        return 'hover:shadow-emerald-600/25 dark:hover:shadow-emerald-500/20'
      case 'PUT':
        return 'hover:shadow-amber-500/25 dark:hover:shadow-amber-400/20'
      case 'PATCH':
        return 'hover:shadow-purple-600/25 dark:hover:shadow-purple-500/20'
      case 'DELETE':
        return 'hover:shadow-red-600/25 dark:hover:shadow-red-500/20'
      default:
        return 'hover:shadow-gray-500/25 dark:hover:shadow-gray-500/20'
    }
  }

  const getMethodIcon = (method: string): LucideIcon => {
    switch (method.toUpperCase()) {
      case 'GET':
        return Download
      case 'POST':
        return Upload
      case 'PUT':
        return RefreshCw
      case 'PATCH':
        return Pencil
      case 'DELETE':
        return Trash2
      default:
        return ArrowRight
    }
  }

  const getMethodBadgeStyle = (method: string) => {
    switch (method.toUpperCase()) {
      case 'GET':
        return 'bg-blue-600/10 text-blue-700 dark:text-blue-400 border-blue-600/20'
      case 'POST':
        return 'bg-emerald-600/10 text-emerald-700 dark:text-emerald-400 border-emerald-600/20'
      case 'PUT':
        return 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20'
      case 'PATCH':
        return 'bg-purple-600/10 text-purple-700 dark:text-purple-400 border-purple-600/20'
      case 'DELETE':
        return 'bg-red-600/10 text-red-700 dark:text-red-400 border-red-600/20'
      default:
        return 'bg-gray-500/10 text-gray-600 dark:text-gray-400 border-gray-500/20'
    }
  }

  const openEndpointDashboard = (endpointId: string) => {
    router.push(`/tests/${endpointId}`)
  }

  return (
    <div className="container mx-auto py-8 px-4 max-w-7xl">
      <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold mb-2">API Endpoints</h1>
          <p className="text-muted-foreground">
            Select an endpoint to open its test dashboard
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center rounded-lg border bg-muted/50 p-1">
            <Button
              variant={viewMode === 'grid' ? 'default' : 'ghost'}
              size="sm"
              className="h-8 px-3"
              onClick={() => setViewMode('grid')}
            >
              <LayoutGrid className="h-4 w-4 mr-1.5" />
              Grid
            </Button>
            <Button
              variant={viewMode === 'list' ? 'default' : 'ghost'}
              size="sm"
              className="h-8 px-3"
              onClick={() => setViewMode('list')}
            >
              <List className="h-4 w-4 mr-1.5" />
              List
            </Button>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="mb-8">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search endpoints..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* NRLA Section */}
      {nrlaEndpoints.length > 0 && (
        <div className="mb-10">
          <div className="mb-6">
            <h2 className="text-2xl font-semibold mb-1">NRLA</h2>
            <p className="text-sm text-muted-foreground">National Residential Landlords Association endpoints</p>
          </div>
          {nrlaByMethod.map(({ method, endpoints }) => (
            <div key={method} className="mb-8">
              <h3 className="text-lg font-medium mb-3 flex items-center gap-2">
                <Badge className={`${getMethodColor(method)} text-white text-xs font-mono`}>
                  {method}
                </Badge>
                <span className="text-muted-foreground text-sm">({endpoints.length})</span>
              </h3>

              {/* Grid View */}
              {viewMode === 'grid' && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {endpoints.map((endpoint) => {
                    const MethodIcon = getMethodIcon(method)
                    return (
                      <Card
                        key={endpoint.id}
                        className={`border-l-4 ${getMethodBorderColor(method)} ${getMethodGlow(method)} hover:shadow-xl hover:scale-[1.02] transition-all duration-200 cursor-pointer group bg-card dark:bg-card border border-border/50 dark:border-border`}
                        onClick={() => openEndpointDashboard(endpoint.id)}
                      >
                        <CardHeader className="pb-3">
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <div className={`p-1.5 rounded-md ${getMethodBadgeStyle(method)}`}>
                                <MethodIcon className="h-3.5 w-3.5" />
                              </div>
                              <CardTitle className="text-base group-hover:text-primary transition-colors">
                                {endpoint.name}
                              </CardTitle>
                            </div>
                            <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
                          </div>
                          <div className="flex items-center gap-2 mb-2">
                            <Badge variant="outline" className={`text-xs font-mono ${getMethodBadgeStyle(method)}`}>
                              {method}
                            </Badge>
                            <Badge variant="outline" className="text-xs">
                              {endpoint.category}
                            </Badge>
                          </div>
                          <CardDescription className="text-sm line-clamp-2">
                            {endpoint.description}
                          </CardDescription>
                        </CardHeader>
                        <CardContent className="pt-0">
                          <code className="text-xs bg-muted dark:bg-muted/80 text-foreground dark:text-foreground/90 px-2 py-1.5 rounded-md block overflow-x-auto font-mono border border-border">
                            {endpoint.endpoint}
                          </code>
                          {endpoint.requiresPathParam && (
                            <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
                              <span className="inline-block w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                              Requires: <span className="font-mono text-amber-600 dark:text-amber-400">{endpoint.pathParamName}</span>
                            </p>
                          )}
                        </CardContent>
                      </Card>
                    )
                  })}
                </div>
              )}

              {/* List View */}
              {viewMode === 'list' && (
                <div className="space-y-2">
                  {endpoints.map((endpoint) => {
                    const MethodIcon = getMethodIcon(method)
                    return (
                      <div
                        key={endpoint.id}
                        className={`flex items-center gap-4 p-3 rounded-lg border-l-4 ${getMethodBorderColor(method)} ${getMethodGlow(method)} hover:shadow-md transition-all duration-200 cursor-pointer group bg-card dark:bg-card border border-border/50 dark:border-border`}
                        onClick={() => openEndpointDashboard(endpoint.id)}
                      >
                        <div className={`p-1.5 rounded-md ${getMethodBadgeStyle(method)} shrink-0`}>
                          <MethodIcon className="h-4 w-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium text-sm group-hover:text-primary transition-colors truncate">
                              {endpoint.name}
                            </span>
                            <Badge variant="outline" className="text-xs shrink-0">
                              {endpoint.category}
                            </Badge>
                            {endpoint.requiresPathParam && (
                              <span className="inline-block w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" title={`Requires: ${endpoint.pathParamName}`}></span>
                            )}
                          </div>
                          <code className="text-xs text-muted-foreground font-mono truncate block">
                            {endpoint.endpoint}
                          </code>
                        </div>
                        <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all shrink-0" />
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Deposit Management Section */}
      {depositManagementEndpoints.length > 0 && (
        <div className="mb-10">
          <div className="mb-6">
            <h2 className="text-2xl font-semibold mb-1">Deposit Management</h2>
            <p className="text-sm text-muted-foreground">Core deposit protection and management endpoints</p>
          </div>
          {depositManagementByMethod.map(({ method, endpoints }) => (
            <div key={method} className="mb-8">
              <h3 className="text-lg font-medium mb-3 flex items-center gap-2">
                <Badge className={`${getMethodColor(method)} text-white text-xs font-mono`}>
                  {method}
                </Badge>
                <span className="text-muted-foreground text-sm">({endpoints.length})</span>
              </h3>

              {/* Grid View */}
              {viewMode === 'grid' && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {endpoints.map((endpoint) => {
                    const MethodIcon = getMethodIcon(method)
                    return (
                      <Card
                        key={endpoint.id}
                        className={`border-l-4 ${getMethodBorderColor(method)} ${getMethodGlow(method)} hover:shadow-xl hover:scale-[1.02] transition-all duration-200 cursor-pointer group bg-card dark:bg-card border border-border/50 dark:border-border`}
                        onClick={() => openEndpointDashboard(endpoint.id)}
                      >
                        <CardHeader className="pb-3">
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <div className={`p-1.5 rounded-md ${getMethodBadgeStyle(method)}`}>
                                <MethodIcon className="h-3.5 w-3.5" />
                              </div>
                              <CardTitle className="text-base group-hover:text-primary transition-colors">
                                {endpoint.name}
                              </CardTitle>
                            </div>
                            <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
                          </div>
                          <div className="flex items-center gap-2 mb-2">
                            <Badge variant="outline" className={`text-xs font-mono ${getMethodBadgeStyle(method)}`}>
                              {method}
                            </Badge>
                            <Badge variant="outline" className="text-xs">
                              {endpoint.category}
                            </Badge>
                          </div>
                          <CardDescription className="text-sm line-clamp-2">
                            {endpoint.description}
                          </CardDescription>
                        </CardHeader>
                        <CardContent className="pt-0">
                          <code className="text-xs bg-muted dark:bg-muted/80 text-foreground dark:text-foreground/90 px-2 py-1.5 rounded-md block overflow-x-auto font-mono border border-border">
                            {endpoint.endpoint}
                          </code>
                          {endpoint.requiresPathParam && (
                            <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
                              <span className="inline-block w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                              Requires: <span className="font-mono text-amber-600 dark:text-amber-400">{endpoint.pathParamName}</span>
                            </p>
                          )}
                        </CardContent>
                      </Card>
                    )
                  })}
                </div>
              )}

              {/* List View */}
              {viewMode === 'list' && (
                <div className="space-y-2">
                  {endpoints.map((endpoint) => {
                    const MethodIcon = getMethodIcon(method)
                    return (
                      <div
                        key={endpoint.id}
                        className={`flex items-center gap-4 p-3 rounded-lg border-l-4 ${getMethodBorderColor(method)} ${getMethodGlow(method)} hover:shadow-md transition-all duration-200 cursor-pointer group bg-card dark:bg-card border border-border/50 dark:border-border`}
                        onClick={() => openEndpointDashboard(endpoint.id)}
                      >
                        <div className={`p-1.5 rounded-md ${getMethodBadgeStyle(method)} shrink-0`}>
                          <MethodIcon className="h-4 w-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium text-sm group-hover:text-primary transition-colors truncate">
                              {endpoint.name}
                            </span>
                            <Badge variant="outline" className="text-xs shrink-0">
                              {endpoint.category}
                            </Badge>
                            {endpoint.requiresPathParam && (
                              <span className="inline-block w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" title={`Requires: ${endpoint.pathParamName}`}></span>
                            )}
                          </div>
                          <code className="text-xs text-muted-foreground font-mono truncate block">
                            {endpoint.endpoint}
                          </code>
                        </div>
                        <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all shrink-0" />
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {nrlaEndpoints.length === 0 && depositManagementEndpoints.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <p className="text-muted-foreground">No endpoints found matching your search</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
