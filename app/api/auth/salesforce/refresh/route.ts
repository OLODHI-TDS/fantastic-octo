import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/db/prisma'
import {
  getLoginUrl,
  refreshAccessToken,
  decrypt,
} from '@/lib/salesforce/oauth'

/**
 * POST /api/auth/salesforce/refresh
 * Refreshes the access token using the stored refresh token
 *
 * Body:
 * - environmentId: The environment to refresh the token for
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { environmentId } = body

    if (!environmentId) {
      return NextResponse.json(
        { error: 'environmentId is required' },
        { status: 400 }
      )
    }

    // Fetch the environment
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

    if (!environment.sfRefreshToken) {
      return NextResponse.json(
        { error: 'No refresh token available. Please re-authenticate with Salesforce.' },
        { status: 400 }
      )
    }

    // Decrypt secrets
    const clientSecret = decrypt(environment.sfConnectedAppClientSecret)
    const refreshToken = decrypt(environment.sfRefreshToken)

    // Get the login URL
    const loginUrl = getLoginUrl(environment.instanceUrl)

    // Refresh the token
    const tokens = await refreshAccessToken({
      loginUrl,
      refreshToken,
      clientId: environment.sfConnectedAppClientId,
      clientSecret,
    })

    // Calculate new expiry (2 hours from now)
    const tokenExpiresAt = new Date(Date.now() + 2 * 60 * 60 * 1000)

    // Update the environment with the new access token
    await prisma.environment.update({
      where: { id: environmentId },
      data: {
        verificationBearerToken: tokens.access_token,
        sfTokenExpiresAt: tokenExpiresAt,
      },
    })

    return NextResponse.json({
      success: true,
      token: tokens.access_token,
      expiresAt: tokenExpiresAt.toISOString(),
    })
  } catch (error: any) {
    console.error('Token refresh error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to refresh token' },
      { status: 500 }
    )
  }
}
