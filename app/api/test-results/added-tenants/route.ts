import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/db/prisma'

/**
 * GET /api/test-results/added-tenants
 * Fetch tenants that were successfully added via the Add Additional Tenant endpoint
 * Used to auto-populate the Remove Tenant endpoint
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const credentialId = searchParams.get('credentialId')
    const limit = parseInt(searchParams.get('limit') || '50')

    if (!credentialId) {
      return NextResponse.json(
        { error: 'credentialId is required' },
        { status: 400 }
      )
    }

    // Build where clause - find successful Add Tenant tests
    // The endpoint format is: /services/apexrest/nrla/tenant/add/{DAN}
    const where: any = {
      test: {
        endpoint: {
          contains: 'tenant/add'
        }
      },
      credentialId,
      status: 'passed',
      // Only get results from last 30 days
      executedAt: {
        gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
      }
    }

    console.log('[Added Tenants] Query where clause:', JSON.stringify(where, null, 2))

    const results = await prisma.testResult.findMany({
      where,
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

    console.log(`[Added Tenants] Found ${results.length} test results matching query`)

    // Process results to extract tenant details
    const addedTenants: any[] = []

    for (const result of results) {
      try {
        // Parse request to get tenant details
        const request = JSON.parse(result.request)
        const requestBody = request.body

        console.log(`[Added Tenants] Processing result ${result.id}, endpoint: ${result.test.endpoint}`)
        console.log(`[Added Tenants] Request body keys:`, requestBody ? Object.keys(requestBody) : 'null')

        if (!requestBody || !requestBody.people || !Array.isArray(requestBody.people)) {
          console.log(`[Added Tenants] Skipping result ${result.id}: No people array in request body`)
          continue
        }

        // Extract DAN from endpoint (e.g., /services/apexrest/nrla/tenant/add/EWI01261682)
        const danMatch = result.test.endpoint.match(/(EWC|EWI|NI|SDS)\d+/i)
        const dan = danMatch ? danMatch[0] : null

        if (!dan) {
          continue
        }

        // Each person in the people array is a tenant that was added
        for (const tenant of requestBody.people) {
          // Only include tenants (not landlords)
          if (tenant.person_classification !== 'Tenant') {
            continue
          }

          addedTenants.push({
            id: `${result.id}-${tenant.person_id || tenant.person_email || Math.random()}`,
            testResultId: result.id,
            dan,
            tenant: {
              person_classification: tenant.person_classification,
              person_id: tenant.person_id,
              person_reference: tenant.person_reference,
              person_title: tenant.person_title,
              person_firstname: tenant.person_firstname,
              person_surname: tenant.person_surname,
              is_business: tenant.is_business,
              person_paon: tenant.person_paon,
              person_saon: tenant.person_saon,
              person_street: tenant.person_street,
              person_locality: tenant.person_locality,
              person_town: tenant.person_town,
              person_postcode: tenant.person_postcode,
              person_country: tenant.person_country,
              person_phone: tenant.person_phone,
              person_email: tenant.person_email,
              person_mobile: tenant.person_mobile,
              business_name: tenant.business_name,
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
        // Skip results with invalid data
        console.error('Error processing added tenant result:', e)
        continue
      }
    }

    console.log(`[Added Tenants] Found ${addedTenants.length} tenants for credential ${credentialId}`)

    return NextResponse.json(addedTenants)
  } catch (error) {
    console.error('Error fetching added tenants:', error)
    return NextResponse.json(
      { error: 'Failed to fetch added tenants' },
      { status: 500 }
    )
  }
}
