'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { ArrowRight, Search } from 'lucide-react'
import { API_ENDPOINTS } from '@/lib/api-endpoints'

export default function TestsPage() {
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState('')

  // NRLA endpoints
  const nrlaEndpointIds = ['delete-deposit', 'add-to-cart', 'add-additional-tenant', 'remove-tenant']

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

  const openEndpointDashboard = (endpointId: string) => {
    router.push(`/tests/${endpointId}`)
  }

  return (
    <div className="container mx-auto py-8 px-4 max-w-7xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">API Endpoints</h1>
        <p className="text-muted-foreground">
          Select an endpoint to open its test dashboard
        </p>
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
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {endpoints.map((endpoint) => (
                  <Card
                    key={endpoint.id}
                    className="hover:shadow-md transition-shadow cursor-pointer group"
                    onClick={() => openEndpointDashboard(endpoint.id)}
                  >
                    <CardHeader>
                      <div className="flex items-start justify-between mb-2">
                        <CardTitle className="text-base group-hover:text-primary transition-colors">
                          {endpoint.name}
                        </CardTitle>
                        <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
                      </div>
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant="outline" className="text-xs">
                          {endpoint.category}
                        </Badge>
                      </div>
                      <CardDescription className="text-sm">
                        {endpoint.description}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <code className="text-xs bg-muted px-2 py-1 rounded block overflow-x-auto">
                        {endpoint.endpoint}
                      </code>
                      {endpoint.requiresPathParam && (
                        <p className="text-xs text-muted-foreground mt-2">
                          Requires: {endpoint.pathParamName}
                        </p>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
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
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {endpoints.map((endpoint) => (
                  <Card
                    key={endpoint.id}
                    className="hover:shadow-md transition-shadow cursor-pointer group"
                    onClick={() => openEndpointDashboard(endpoint.id)}
                  >
                    <CardHeader>
                      <div className="flex items-start justify-between mb-2">
                        <CardTitle className="text-base group-hover:text-primary transition-colors">
                          {endpoint.name}
                        </CardTitle>
                        <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
                      </div>
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant="outline" className="text-xs">
                          {endpoint.category}
                        </Badge>
                      </div>
                      <CardDescription className="text-sm">
                        {endpoint.description}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <code className="text-xs bg-muted px-2 py-1 rounded block overflow-x-auto">
                        {endpoint.endpoint}
                      </code>
                      {endpoint.requiresPathParam && (
                        <p className="text-xs text-muted-foreground mt-2">
                          Requires: {endpoint.pathParamName}
                        </p>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
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
