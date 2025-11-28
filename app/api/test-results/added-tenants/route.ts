import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/db/prisma'

/**
 * GET /api/test-results/added-tenants
 * Fetch tenants from successful Deposit Creation AND Add Additional Tenant tests
 * Used to auto-populate the Remove Tenant endpoint
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const credentialId = searchParams.get('credentialId')
    const limit = parseInt(searchParams.get('limit') || '100')

    if (!credentialId) {
      return NextResponse.json(
        { error: 'credentialId is required' },
        { status: 400 }
      )
    }

    // Find successful tests from both:
    // 1. Deposit Creation: /services/apexrest/nrla/deposit/create
    // 2. Add Additional Tenant: /services/apexrest/nrla/tenant/add/{DAN}
    const results = await prisma.testResult.findMany({
      where: {
        credentialId,
        status: 'passed',
        executedAt: {
          gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
        },
        OR: [
          { test: { endpoint: { contains: 'deposit/create' } } },
          { test: { endpoint: { contains: 'tenant/add' } } }
        ]
      },
      include: {
        test: {
          select: {
            id: true,
            name: true,
            endpoint: true,
          }
        },
        credential: {
          select: {
            id: true,
            orgName: true,
            authType: true,
          }
        }
      },
      orderBy: {
        executedAt: 'desc'
      },
      take: limit
    })

    console.log(`[Tenants] Found ${results.length} test results (deposit creation + add tenant)`)

    // Process results to extract tenant details
    const allTenants: any[] = []

    for (const result of results) {
      try {
        const request = JSON.parse(result.request)
        const requestBody = request.body
        const response = JSON.parse(result.response)

        const isDepositCreation = result.test.endpoint.includes('deposit/create')
        const isAddTenant = result.test.endpoint.includes('tenant/add')

        console.log(`[Tenants] Processing ${isDepositCreation ? 'DEPOSIT CREATION' : 'ADD TENANT'}: ${result.test.endpoint}`)

        let dan: string | null = null
        let people: any[] = []

        if (isDepositCreation) {
          // For deposit creation, get DAN from response and tenants from tenancy.people
          dan = response?.data?.dan || response?.dan || null
          people = requestBody?.tenancy?.people || []
          console.log(`[Tenants] Deposit creation - DAN from response: ${dan}, people count: ${people.length}`)
        } else if (isAddTenant) {
          // For add tenant, get DAN from endpoint and tenants from people array
          const danMatch = result.test.endpoint.match(/(EWCS?|EWI|NI|SDS)\d+/i)
          dan = danMatch ? danMatch[0] : null
          people = requestBody?.people || []
          console.log(`[Tenants] Add tenant - DAN from endpoint: ${dan}, people count: ${people.length}`)
        }

        if (!dan) {
          console.log(`[Tenants] Skipping - could not determine DAN`)
          continue
        }

        if (!Array.isArray(people) || people.length === 0) {
          console.log(`[Tenants] Skipping - no people array`)
          continue
        }

        // Extract tenants (not landlords)
        for (const person of people) {
          const classification = (person.person_classification || '').toLowerCase()
          if (classification !== 'tenant') {
            continue
          }

          allTenants.push({
            id: `${result.id}-${person.person_id || person.person_email || Math.random()}`,
            testResultId: result.id,
            dan,
            source: isDepositCreation ? 'deposit-creation' : 'add-tenant',
            tenant: {
              person_classification: person.person_classification,
              person_id: person.person_id,
              person_reference: person.person_reference,
              person_title: person.person_title,
              person_firstname: person.person_firstname,
              person_surname: person.person_surname,
              is_business: person.is_business,
              person_paon: person.person_paon,
              person_saon: person.person_saon,
              person_street: person.person_street,
              person_locality: person.person_locality,
              person_town: person.person_town,
              person_postcode: person.person_postcode,
              person_country: person.person_country,
              person_phone: person.person_phone,
              person_email: person.person_email,
              person_mobile: person.person_mobile,
              business_name: person.business_name,
            },
            addedAt: result.executedAt,
            testName: result.test.name,
            credential: result.credential ? {
              id: result.credential.id,
              orgName: result.credential.orgName,
              authType: result.credential.authType,
            } : null,
          })
        }
      } catch (e) {
        console.error('Error processing result:', e)
        continue
      }
    }

    console.log(`[Tenants] Total tenants found: ${allTenants.length}`)

    return NextResponse.json(allTenants)
  } catch (error) {
    console.error('Error fetching tenants:', error)
    return NextResponse.json(
      { error: 'Failed to fetch tenants' },
      { status: 500 }
    )
  }
}
