import crypto from 'crypto'

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'dev-key-change-in-production-32b'
const ALGORITHM = 'aes-256-cbc'

export function encrypt(text: string): string {
  const iv = crypto.randomBytes(16)
  const cipher = crypto.createCipheriv(ALGORITHM, Buffer.from(ENCRYPTION_KEY.padEnd(32, '0').slice(0, 32)), iv)
  let encrypted = cipher.update(text, 'utf8', 'hex')
  encrypted += cipher.final('hex')
  return iv.toString('hex') + ':' + encrypted
}

export function decrypt(text: string): string {
  const parts = text.split(':')
  const iv = Buffer.from(parts[0], 'hex')
  const encryptedText = parts[1]
  const decipher = crypto.createDecipheriv(ALGORITHM, Buffer.from(ENCRYPTION_KEY.padEnd(32, '0').slice(0, 32)), iv)
  let decrypted = decipher.update(encryptedText, 'hex', 'utf8')
  decrypted += decipher.final('utf8')
  return decrypted
}

/**
 * Determine the correct Salesforce login URL based on the instance URL
 * Sandbox orgs use test.salesforce.com, production uses login.salesforce.com
 */
export function getLoginUrl(instanceUrl: string): string {
  // Sandbox orgs typically have URLs containing '.sandbox.' or '--' (scratch orgs)
  if (instanceUrl.includes('.sandbox.') || instanceUrl.includes('--')) {
    return 'https://test.salesforce.com'
  }
  return 'https://login.salesforce.com'
}

/**
 * Build the Salesforce OAuth authorization URL
 */
export function buildAuthorizationUrl(params: {
  loginUrl: string
  clientId: string
  redirectUri: string
  state: string
}): string {
  const { loginUrl, clientId, redirectUri, state } = params

  const authUrl = new URL(`${loginUrl}/services/oauth2/authorize`)
  authUrl.searchParams.set('response_type', 'code')
  authUrl.searchParams.set('client_id', clientId)
  authUrl.searchParams.set('redirect_uri', redirectUri)
  authUrl.searchParams.set('scope', 'api refresh_token')
  authUrl.searchParams.set('state', state)

  return authUrl.toString()
}

export interface TokenExchangeParams {
  loginUrl: string
  code: string
  clientId: string
  clientSecret: string
  redirectUri: string
}

export interface TokenResponse {
  access_token: string
  refresh_token: string
  instance_url: string
  id: string
  token_type: string
  issued_at: string
  signature: string
}

/**
 * Exchange authorization code for access and refresh tokens
 */
export async function exchangeCodeForTokens(params: TokenExchangeParams): Promise<TokenResponse> {
  const { loginUrl, code, clientId, clientSecret, redirectUri } = params

  const tokenUrl = `${loginUrl}/services/oauth2/token`

  const response = await fetch(tokenUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
    }),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(`Token exchange failed: ${error.error_description || error.error || 'Unknown error'}`)
  }

  return response.json()
}

export interface RefreshTokenParams {
  loginUrl: string
  refreshToken: string
  clientId: string
  clientSecret: string
}

export interface RefreshTokenResponse {
  access_token: string
  instance_url: string
  id: string
  token_type: string
  issued_at: string
  signature: string
}

/**
 * Refresh an access token using a refresh token
 */
export async function refreshAccessToken(params: RefreshTokenParams): Promise<RefreshTokenResponse> {
  const { loginUrl, refreshToken, clientId, clientSecret } = params

  const tokenUrl = `${loginUrl}/services/oauth2/token`

  const response = await fetch(tokenUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
      client_id: clientId,
      client_secret: clientSecret,
    }),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(`Token refresh failed: ${error.error_description || error.error || 'Unknown error'}`)
  }

  return response.json()
}

/**
 * Encrypt OAuth state parameter for CSRF protection
 * Contains environmentId and timestamp
 */
export function encryptState(environmentId: string): string {
  const stateData = JSON.stringify({
    environmentId,
    timestamp: Date.now(),
    nonce: crypto.randomBytes(8).toString('hex'),
  })
  return encrypt(stateData)
}

/**
 * Decrypt and validate OAuth state parameter
 * Returns null if invalid or expired (5 minute window)
 */
export function decryptState(encryptedState: string): { environmentId: string } | null {
  try {
    const stateData = JSON.parse(decrypt(encryptedState))

    // Check timestamp (5 minute window)
    const fiveMinutes = 5 * 60 * 1000
    if (Date.now() - stateData.timestamp > fiveMinutes) {
      return null
    }

    return { environmentId: stateData.environmentId }
  } catch {
    return null
  }
}
