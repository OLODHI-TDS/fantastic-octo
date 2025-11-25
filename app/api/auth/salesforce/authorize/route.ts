import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/db/prisma'
import {
  getLoginUrl,
  buildAuthorizationUrl,
  encryptState,
  decrypt,
} from '@/lib/salesforce/oauth'

// Remove trailing slash if present
const APP_URL = (process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000').replace(/\/$/, '')

/**
 * GET /api/auth/salesforce/authorize
 * Initiates the Salesforce OAuth flow
 *
 * Query params:
 * - environmentId: The environment to authenticate for
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const environmentId = searchParams.get('environmentId')

    if (!environmentId) {
      return NextResponse.json(
        { error: 'environmentId is required' },
        { status: 400 }
      )
    }

    // Fetch the environment to get OAuth credentials
    const environment = await prisma.environment.findUnique({
      where: { id: environmentId },
    })

    if (!environment) {
      return NextResponse.json(
        { error: 'Environment not found' },
        { status: 404 }
      )
    }

    if (!environment.sfConnectedAppClientId || !environment.sfConnectedAppClientSecret) {
      return NextResponse.json(
        { error: 'Connected App credentials not configured for this environment' },
        { status: 400 }
      )
    }

    // Determine login URL based on environment type
    const loginUrl = getLoginUrl(environment.instanceUrl)

    // Create encrypted state for CSRF protection
    const state = encryptState(environmentId)

    // Build the authorization URL
    const redirectUri = `${APP_URL}/api/auth/salesforce/callback`
    const authorizationUrl = buildAuthorizationUrl({
      loginUrl,
      clientId: environment.sfConnectedAppClientId,
      redirectUri,
      state,
    })

    // Redirect to Salesforce login
    return NextResponse.redirect(authorizationUrl)
  } catch (error) {
    console.error('Error initiating OAuth flow:', error)
    return NextResponse.json(
      { error: 'Failed to initiate OAuth flow' },
      { status: 500 }
    )
  }
}
