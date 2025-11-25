import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/db/prisma'
import {
  getLoginUrl,
  exchangeCodeForTokens,
  decryptState,
  decrypt,
  encrypt,
} from '@/lib/salesforce/oauth'

// Remove trailing slash if present
const APP_URL = (process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000').replace(/\/$/, '')

/**
 * GET /api/auth/salesforce/callback
 * Handles the OAuth callback from Salesforce
 *
 * Query params:
 * - code: Authorization code from Salesforce
 * - state: Encrypted state parameter for CSRF protection
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const code = searchParams.get('code')
    const state = searchParams.get('state')
    const error = searchParams.get('error')
    const errorDescription = searchParams.get('error_description')

    // Handle OAuth errors
    if (error) {
      return renderCallbackPage({
        success: false,
        error: errorDescription || error,
      })
    }

    if (!code || !state) {
      return renderCallbackPage({
        success: false,
        error: 'Missing authorization code or state',
      })
    }

    // Decrypt and validate state
    const stateData = decryptState(state)
    if (!stateData) {
      return renderCallbackPage({
        success: false,
        error: 'Invalid or expired state parameter',
      })
    }

    const { environmentId } = stateData

    // Fetch the environment
    const environment = await prisma.environment.findUnique({
      where: { id: environmentId },
    })

    if (!environment) {
      return renderCallbackPage({
        success: false,
        error: 'Environment not found',
      })
    }

    if (!environment.sfConnectedAppClientId || !environment.sfConnectedAppClientSecret) {
      return renderCallbackPage({
        success: false,
        error: 'Connected App credentials not configured',
      })
    }

    // Decrypt the client secret
    const clientSecret = decrypt(environment.sfConnectedAppClientSecret)

    // Get the login URL
    const loginUrl = getLoginUrl(environment.instanceUrl)

    // Exchange code for tokens
    const redirectUri = `${APP_URL}/api/auth/salesforce/callback`
    const tokens = await exchangeCodeForTokens({
      loginUrl,
      code,
      clientId: environment.sfConnectedAppClientId,
      clientSecret,
      redirectUri,
    })

    // Calculate token expiry (Salesforce tokens typically last 2 hours)
    const tokenExpiresAt = new Date(Date.now() + 2 * 60 * 60 * 1000)

    // Update the environment with the new tokens
    await prisma.environment.update({
      where: { id: environmentId },
      data: {
        verificationBearerToken: tokens.access_token,
        sfRefreshToken: encrypt(tokens.refresh_token),
        sfTokenExpiresAt: tokenExpiresAt,
      },
    })

    // Return success page that communicates with parent window
    return renderCallbackPage({
      success: true,
      token: tokens.access_token,
      expiresAt: tokenExpiresAt.toISOString(),
    })
  } catch (error: any) {
    console.error('OAuth callback error:', error)
    return renderCallbackPage({
      success: false,
      error: error.message || 'Failed to complete OAuth flow',
    })
  }
}

interface CallbackPageParams {
  success: boolean
  token?: string
  expiresAt?: string
  error?: string
}

function renderCallbackPage(params: CallbackPageParams): NextResponse {
  const { success, token, expiresAt, error } = params

  const html = `
<!DOCTYPE html>
<html>
<head>
  <title>Salesforce Authentication</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      display: flex;
      justify-content: center;
      align-items: center;
      height: 100vh;
      margin: 0;
      background-color: #f5f5f5;
    }
    .container {
      text-align: center;
      padding: 40px;
      background: white;
      border-radius: 8px;
      box-shadow: 0 2px 10px rgba(0,0,0,0.1);
      max-width: 400px;
    }
    .success { color: #16a34a; }
    .error { color: #dc2626; }
    .icon { font-size: 48px; margin-bottom: 20px; }
    .message { margin-bottom: 20px; color: #666; }
  </style>
</head>
<body>
  <div class="container">
    ${
      success
        ? `
          <div class="icon success">&#10003;</div>
          <h2 class="success">Authentication Successful</h2>
          <p class="message">You can close this window.</p>
        `
        : `
          <div class="icon error">&#10007;</div>
          <h2 class="error">Authentication Failed</h2>
          <p class="message">${error || 'An unknown error occurred'}</p>
          <p><button onclick="window.close()">Close Window</button></p>
        `
    }
  </div>
  <script>
    (function() {
      const result = ${JSON.stringify({ success, token, expiresAt, error })};

      if (window.opener) {
        window.opener.postMessage({
          type: 'salesforce-oauth-${success ? 'success' : 'error'}',
          ...result
        }, '${APP_URL}');

        ${success ? 'setTimeout(() => window.close(), 1500);' : ''}
      }
    })();
  </script>
</body>
</html>
  `.trim()

  return new NextResponse(html, {
    headers: {
      'Content-Type': 'text/html',
    },
  })
}
