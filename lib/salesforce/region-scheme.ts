/**
 * Region & Scheme mapping for EWC API authentication
 * Maps user-friendly region scheme names to the actual AccessToken/auth_code prefixes
 */

export type RegionScheme =
  | 'EW - Custodial'
  | 'EW - Insured'
  | 'NI - Custodial'
  | 'NI - Insured'
  | 'SDS - Custodial'

export const REGION_SCHEMES: RegionScheme[] = [
  'EW - Custodial',
  'EW - Insured',
  'NI - Custodial',
  'NI - Insured',
  'SDS - Custodial',
]

/**
 * Get the AccessToken prefix for a given region scheme
 * Returns the format: "{Region Name}-{Scheme}-"
 *
 * Examples:
 * - "EW - Custodial" → "England & Wales Custodial-Custodial-"
 * - "EW - Insured" → "England & Wales Insured-Insured-"
 * - "NI - Custodial" → "Northern Ireland-Custodial-"
 */
export function getRegionSchemePrefix(regionScheme: string): string {
  const mapping: Record<string, string> = {
    'EW - Custodial': 'England & Wales Custodial-Custodial',
    'EW - Insured': 'England & Wales Insured-Insured',
    'NI - Custodial': 'Northern Ireland-Custodial',
    'NI - Insured': 'Northern Ireland-Insured',
    'SDS - Custodial': 'Safe Deposits Scotland-Custodial',
  }

  const prefix = mapping[regionScheme]

  if (!prefix) {
    // Default to EW - Custodial if unknown
    console.warn(`Unknown region scheme: ${regionScheme}, defaulting to EW - Custodial`)
    return 'England & Wales Custodial-Custodial'
  }

  return prefix
}

/**
 * Build complete API Key AccessToken
 * Format: "{RegionPrefix}-{MemberID}-{BranchID}-{ApiKey}"
 */
export function buildApiKeyToken(
  regionScheme: string,
  memberId: string,
  branchId: string,
  apiKey: string
): string {
  const prefix = getRegionSchemePrefix(regionScheme)
  return `${prefix}-${memberId}-${branchId}-${apiKey}`
}

/**
 * Build OAuth2 auth_code header value
 * Format: "{RegionPrefix}-{ClientID}-{ClientSecret}-{MemberID}"
 */
export function buildOAuth2AuthCode(
  regionScheme: string,
  clientId: string,
  clientSecret: string,
  memberId: string
): string {
  const prefix = getRegionSchemePrefix(regionScheme)
  return `${prefix}-${clientId}-${clientSecret}-${memberId}`
}
