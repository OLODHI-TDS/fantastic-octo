/**
 * EWC API Endpoint definitions from the technical documentation
 */

export interface ApiEndpoint {
  id: string
  name: string
  description: string
  endpoint: string
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'
  category: string
  expectedStatus?: number
  requiresPathParam?: boolean
  pathParamName?: string
  pathParamPlaceholder?: string
  // Alias URL support (for API-key credentials only)
  supportsAliasUrl?: boolean
  aliasEndpoint?: string // The alias endpoint path (will be combined with baseURL)
  aliasAuthInUrl?: boolean // If true, member_id/branch_id/api_key go in URL path
}

export const API_ENDPOINTS: ApiEndpoint[] = [
  {
    id: 'deposit-creation',
    name: 'Deposit Creation',
    description: 'Create a new deposit protection (tenancy)',
    endpoint: '/services/apexrest/depositcreation',
    method: 'POST',
    category: 'Deposit Management',
    expectedStatus: 201,
    supportsAliasUrl: true,
    aliasEndpoint: '/services/apexrest/v2/CreateDeposit',
    aliasAuthInUrl: false, // POST - auth stays in header
  },
  {
    id: 'deposit-update',
    name: 'Deposit Update',
    description: 'Update an existing deposit protection',
    endpoint: '/services/apexrest/depositupdate',
    method: 'POST',
    category: 'Deposit Management',
  },
  {
    id: 'deposit-status',
    name: 'Creation Status Check',
    description: 'Check the status of a deposit creation or update',
    endpoint: '/services/apexrest/CreateDepositStatus/{batch_id}',
    method: 'GET',
    category: 'Deposit Management',
    requiresPathParam: true,
    pathParamName: 'batch_id',
    pathParamPlaceholder: 'ERR-04238',
    supportsAliasUrl: true,
    aliasEndpoint: '/services/apexrest/v2/CreateDepositStatus/{member_id}/{branch_id}/{api_key}/{batch_id}',
    aliasAuthInUrl: true, // GET - auth in URL
  },
  {
    id: 'tenancy-info',
    name: 'Tenancy Information',
    description: 'Get summary information about a deposit',
    endpoint: '/services/apexrest/tenancyinformation/{DAN}',
    method: 'GET',
    category: 'Deposit Management',
    requiresPathParam: true,
    pathParamName: 'DAN',
    pathParamPlaceholder: 'EWC00004420',
    supportsAliasUrl: true,
    aliasEndpoint: '/services/apexrest/v2/TenancyInformation/{member_id}/{branch_id}/{api_key}/{DAN}',
    aliasAuthInUrl: true, // GET - auth in URL
  },
  {
    id: 'landlords-search',
    name: 'Landlords Search',
    description: 'Search for existing non-member landlords',
    endpoint: '/services/apexrest/nonmemberlandlord',
    method: 'GET',
    category: 'Search',
    supportsAliasUrl: true,
    aliasEndpoint: '/services/apexrest/v2/landlord/{member_id}/{branch_id}/{api_key}/',
    aliasAuthInUrl: true, // GET - auth in URL
  },
  {
    id: 'properties-search',
    name: 'Properties Search',
    description: 'Search for existing properties',
    endpoint: '/services/apexrest/property',
    method: 'GET',
    category: 'Search',
    supportsAliasUrl: true,
    aliasEndpoint: '/services/apexrest/v2/property/{member_id}/{branch_id}/{api_key}/',
    aliasAuthInUrl: true, // GET - auth in URL
  },
  {
    id: 'dpc-certificate',
    name: 'Deposit Protection Certificate',
    description: 'Get a link to download the DPC PDF file',
    endpoint: '/services/apexrest/dpc/{DAN}',
    method: 'GET',
    category: 'Documents',
    requiresPathParam: true,
    pathParamName: 'DAN',
    pathParamPlaceholder: 'EWC00005391',
    supportsAliasUrl: true,
    aliasEndpoint: '/services/apexrest/v2/dpc/{member_id}/{branch_id}/{api_key}/{DAN}',
    aliasAuthInUrl: true, // GET - auth in URL
  },
  {
    id: 'repayment-request',
    name: 'Repayment Request',
    description: 'Submit a repayment request against a deposit',
    endpoint: '/services/apexrest/raiserepaymentrequest/',
    method: 'POST',
    category: 'Repayment',
    supportsAliasUrl: true,
    aliasEndpoint: '/services/apexrest/v2/RaiseRepaymentRequest',
    aliasAuthInUrl: false, // POST - auth stays in header
  },
  {
    id: 'repayment-response',
    name: 'Respond to Repayment Request',
    description: 'Respond to a tenant repayment request',
    endpoint: '/services/apexrest/raiserepaymentrequest/',
    method: 'POST',
    category: 'Repayment',
  },
  {
    id: 'branches-list',
    name: 'Branches List',
    description: 'Get all branches associated with the member',
    endpoint: '/services/apexrest/branches',
    method: 'GET',
    category: 'Member Info',
    supportsAliasUrl: true,
    aliasEndpoint: '/services/apexrest/v2/branches/{member_id}/{branch_id}/{api_key}/',
    aliasAuthInUrl: true, // GET - auth in URL
  },
  {
    id: 'branch-single',
    name: 'Single Branch',
    description: 'Get information for a specific branch',
    endpoint: '/services/apexrest/branches/?name={branch_name}',
    method: 'GET',
    category: 'Member Info',
    requiresPathParam: true,
    pathParamName: 'branch_name',
    pathParamPlaceholder: 'EWC2',
  },
  {
    id: 'dispute-status',
    name: 'Dispute Status',
    description: 'Get the status of a dispute',
    endpoint: '/services/apexrest/dispute/status/{DAN}',
    method: 'GET',
    category: 'Dispute',
    requiresPathParam: true,
    pathParamName: 'DAN',
    pathParamPlaceholder: 'EWC00004420',
    supportsAliasUrl: true,
    aliasEndpoint: '/services/apexrest/v2/dispute/status/{member_id}/{branch_id}/{api_key}/{DAN}',
    aliasAuthInUrl: true, // GET - auth in URL
  },
  {
    id: 'transfer-deposit',
    name: 'Transfer Deposit',
    description: 'Transfer a deposit to another member (inter-member transfer)',
    endpoint: '/services/apexrest/transfer',
    method: 'POST',
    category: 'Deposit Management',
    expectedStatus: 200,
  },
  {
    id: 'transfer-branch-deposit',
    name: 'Transfer Branch Deposit',
    description: 'Transfer a deposit to another branch within the same member (intra-member transfer)',
    endpoint: '/services/apexrest/transferBranch/{DAN}',
    method: 'POST',
    category: 'Deposit Management',
    requiresPathParam: true,
    pathParamName: 'DAN',
    pathParamPlaceholder: 'NI00004420',
    expectedStatus: 200,
  },
  {
    id: 'all-tenancies',
    name: 'All Registered Tenancies',
    description: 'Get list of all registered tenancies',
    endpoint: '/services/apexrest/alltenanciesregistered',
    method: 'GET',
    category: 'Deposit Management',
    supportsAliasUrl: true,
    aliasEndpoint: '/services/apexrest/v2/alltenanciesregistered/{member_id}/{branch_id}/{api_key}/',
    aliasAuthInUrl: true, // GET - auth in URL
  },
  {
    id: 'mark-depository-managed',
    name: 'Mark Deposit as Depository Managed',
    description: 'Mark a deposit as depository managed',
    endpoint: '/services/apexrest/depositorymanaged',
    method: 'POST',
    category: 'Deposit Management',
  },
  {
    id: 'delete-deposit',
    name: 'Delete Deposit',
    description: 'Delete a deposit by DAN',
    endpoint: '/services/apexrest/delete/{DAN}',
    method: 'GET',
    category: 'Deposit Management',
    requiresPathParam: true,
    pathParamName: 'DAN',
    pathParamPlaceholder: 'EWC00004420',
  },
  {
    id: 'add-to-cart',
    name: 'Add to Cart (NRLA)',
    description: 'Add a deposit to the NRLA cart',
    endpoint: '/services/apexrest/nrla/cart/add/{DAN}',
    method: 'GET',
    category: 'Cart Management',
    requiresPathParam: true,
    pathParamName: 'DAN',
    pathParamPlaceholder: 'EWI01261682',
    expectedStatus: 200,
  },
  {
    id: 'add-additional-tenant',
    name: 'Add Additional Tenant',
    description: 'Add an additional tenant to an existing deposit',
    endpoint: '/services/apexrest/nrla/tenant/add/{DAN}',
    method: 'POST',
    category: 'Cart Management',
    requiresPathParam: true,
    pathParamName: 'DAN',
    pathParamPlaceholder: 'EWI01261682',
    expectedStatus: 200,
  },
  {
    id: 'remove-tenant',
    name: 'Remove Tenant',
    description: 'Remove a tenant from an existing deposit',
    endpoint: '/services/apexrest/nrla/tenant/remove/{DAN}',
    method: 'POST',
    category: 'Cart Management',
    requiresPathParam: true,
    pathParamName: 'DAN',
    pathParamPlaceholder: 'EWI01261682',
    expectedStatus: 200,
  },
  {
    id: 'remove-from-cart',
    name: 'Remove from Cart (NRLA)',
    description: 'Remove a deposit from the NRLA cart',
    endpoint: '/services/apexrest/nrla/cart/remove/{DAN}',
    method: 'GET',
    category: 'Cart Management',
    requiresPathParam: true,
    pathParamName: 'DAN',
    pathParamPlaceholder: 'EWI01261682',
    expectedStatus: 200,
  },
  {
    id: 'list-cart-contents',
    name: 'List Cart Contents',
    description: 'Get list of all deposits currently in the NRLA cart',
    endpoint: '/services/apexrest/cart/list',
    method: 'GET',
    category: 'Cart Management',
    expectedStatus: 200,
  },
]

export const API_CATEGORIES = [
  'All',
  'Deposit Management',
  'Cart Management',
  'Search',
  'Documents',
  'Repayment',
  'Member Info',
  'Dispute',
]

export function getEndpointById(id: string): ApiEndpoint | undefined {
  return API_ENDPOINTS.find(endpoint => endpoint.id === id)
}

export function getEndpointsByCategory(category: string): ApiEndpoint[] {
  if (category === 'All') {
    return API_ENDPOINTS
  }
  return API_ENDPOINTS.filter(endpoint => endpoint.category === category)
}
