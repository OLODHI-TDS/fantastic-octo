import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

export default function Home() {
  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Dashboard</h1>
        <p className="text-muted-foreground">
          Test and validate your Salesforce APIs across multiple environments
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card>
          <CardHeader>
            <CardTitle>Environments</CardTitle>
            <CardDescription>Manage Salesforce environments</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Configure and manage your Salesforce sandbox, production, and scratch org environments.
            </p>
            <Link href="/environments">
              <Button className="w-full">Manage Environments</Button>
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Tests</CardTitle>
            <CardDescription>Create and run API tests</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Build test cases for your Salesforce REST API endpoints with custom validations.
            </p>
            <Link href="/tests">
              <Button className="w-full">Manage Tests</Button>
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Results</CardTitle>
            <CardDescription>View test execution history</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Review test results, generate PDF reports, and track API performance over time.
            </p>
            <Link href="/results">
              <Button className="w-full">View Results</Button>
            </Link>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Quick Start Guide</CardTitle>
          <CardDescription>Get started in 3 simple steps</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-start space-x-3">
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">
              1
            </div>
            <div>
              <h3 className="font-semibold">Add an Environment</h3>
              <p className="text-sm text-muted-foreground">
                Configure your Salesforce instance credentials (Client ID, Secret, Instance URL)
              </p>
            </div>
          </div>
          <div className="flex items-start space-x-3">
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">
              2
            </div>
            <div>
              <h3 className="font-semibold">Create a Test</h3>
              <p className="text-sm text-muted-foreground">
                Define your API endpoint, method, headers, body, and validation rules
              </p>
            </div>
          </div>
          <div className="flex items-start space-x-3">
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">
              3
            </div>
            <div>
              <h3 className="font-semibold">Run & Export</h3>
              <p className="text-sm text-muted-foreground">
                Execute your tests and generate PDF reports for documentation or ticket uploads
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
