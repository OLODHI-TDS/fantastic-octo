import { faker } from '@faker-js/faker'

/**
 * Generate test data for different API endpoints
 */

// Helper function to remove empty/null fields from an object
function removeEmptyFields(obj: any): any {
  if (Array.isArray(obj)) {
    return obj.map(removeEmptyFields)
  }

  if (obj !== null && typeof obj === 'object') {
    const cleaned: any = {}
    for (const [key, value] of Object.entries(obj)) {
      if (value !== null && value !== undefined && value !== '') {
        cleaned[key] = removeEmptyFields(value)
      }
    }
    return cleaned
  }

  return obj
}

// Helper function to generate valid UK postcodes
function generateUKPostcode(): string {
  // Allowed postcode areas: B (Birmingham), HP (Hemel Hempstead), LU (Luton), HX (Halifax)
  const areas = ['B', 'HP', 'LU', 'HX']

  const area = faker.helpers.arrayElement(areas)
  const district = faker.number.int({ min: 1, max: 99 })
  const sector = faker.number.int({ min: 0, max: 9 })
  const unit = faker.string.alpha({ length: 2, casing: 'upper' })

  return `${area}${district} ${sector}${unit}`
}

export function generateDepositCreationData() {
  const numTenants = faker.number.int({ min: 1, max: 2 })
  const numLandlords = faker.number.int({ min: 1, max: 2 })

  const people = []

  // Generate tenants
  for (let i = 0; i < numTenants; i++) {
    const isBusiness = faker.datatype.boolean()
    // Generate UK landline number (01 or 02 prefix)
    const landlinePrefix = faker.helpers.arrayElement(['01', '02'])
    const landlineNumber = `${landlinePrefix}${faker.string.numeric(9)}`

    const person: any = {
      person_classification: i === 0 ? 'Tenant' : 'Tenant',
      person_id: `TEN${faker.string.alphanumeric(8).toUpperCase()}`,
      person_reference: `TENREF${faker.string.alphanumeric(6).toUpperCase()}`,
      person_title: faker.person.prefix(),
      person_firstname: faker.person.firstName(),
      person_surname: faker.person.lastName(),
      is_business: isBusiness.toString().toUpperCase(),
      person_paon: faker.location.buildingNumber(),
      person_street: faker.location.street(),
      person_locality: faker.location.county(),
      person_town: faker.location.city(),
      person_postcode: generateUKPostcode(),
      person_country: 'United Kingdom',
      person_phone: landlineNumber,
      person_email: faker.internet.email(),
      person_mobile: `07${faker.string.numeric(9)}`,
    }

    // Only add optional fields if they have values
    if (isBusiness) {
      person.business_name = faker.company.name()
    }

    const saon = faker.datatype.boolean() ? `Flat ${faker.number.int({ min: 1, max: 20 })}` : null
    if (saon) {
      person.person_saon = saon
    }

    people.push(person)
  }

  // Generate landlords
  for (let i = 0; i < numLandlords; i++) {
    const isBusiness = faker.datatype.boolean()
    // Generate UK landline number (01 or 02 prefix)
    const landlinePrefix = faker.helpers.arrayElement(['01', '02'])
    const landlineNumber = `${landlinePrefix}${faker.string.numeric(9)}`

    const person: any = {
      person_classification: i === 0 ? 'Primary Landlord' : 'Joint Landlord',
      person_id: `LL${faker.string.alphanumeric(8).toUpperCase()}`,
      person_reference: `LLREF${faker.string.alphanumeric(6).toUpperCase()}`,
      person_title: faker.person.prefix(),
      person_firstname: faker.person.firstName(),
      person_surname: faker.person.lastName(),
      is_business: isBusiness.toString().toUpperCase(),
      person_paon: faker.location.buildingNumber(),
      person_street: faker.location.street(),
      person_locality: faker.location.county(),
      person_town: faker.location.city(),
      person_postcode: generateUKPostcode(),
      person_country: 'United Kingdom',
      person_phone: landlineNumber,
      person_email: faker.internet.email(),
      person_mobile: `07${faker.string.numeric(9)}`,
    }

    // Only add optional fields if they have values
    if (isBusiness) {
      person.business_name = faker.company.name()
    }

    const saon = faker.datatype.boolean() ? `Flat ${faker.number.int({ min: 1, max: 20 })}` : null
    if (saon) {
      person.person_saon = saon
    }

    people.push(person)
  }

  // Generate rent amount first
  const rentAmount = faker.number.int({ min: 800, max: 3000 })
  // Calculate deposit as 5 weeks worth of rent (rent / 4 * 5)
  const depositAmount = Math.round((rentAmount / 4) * 5)

  const startDate = faker.date.future()
  const endDate = faker.date.future({ years: 1, refDate: startDate })
  // Deposit received date must be today or in the past (within last 10 days)
  const depositReceivedDate = faker.date.recent({ days: 10 })

  const tenancy: any = {
    user_tenancy_reference: `UTR${faker.string.alphanumeric(8).toUpperCase()}`,
    deposit_reference: `DEP${faker.string.alphanumeric(8).toUpperCase()}`,
    property_id: `PROP${faker.string.alphanumeric(8).toUpperCase()}`,
    property_paon: faker.location.buildingNumber(),
    property_street: faker.location.street(),
    property_town: faker.location.city(),
    property_administrative_area: faker.location.county(),
    property_postcode: generateUKPostcode(),
    tenancy_start_date: startDate.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' }).replace(/\//g, '-'),
    tenancy_expected_end_date: endDate.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' }).replace(/\//g, '-'),
    number_of_living_rooms: faker.number.int({ min: 1, max: 2 }).toString(),
    number_of_bedrooms: faker.number.int({ min: 1, max: 4 }).toString(),
    furnished_status: faker.datatype.boolean().toString(),
    rent_amount: rentAmount.toString(),
    deposit_amount: depositAmount.toString(),
    deposit_amount_to_protect: depositAmount.toString(),
    deposit_received_date: depositReceivedDate.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' }).replace(/\//g, '-'),
    number_of_tenants: numTenants.toString(),
    number_of_landlords: numLandlords.toString(),
    people,
  }

  // Only add property_saon if it has a value
  const propertySaon = faker.datatype.boolean() ? `Flat ${faker.number.int({ min: 1, max: 20 })}` : null
  if (propertySaon) {
    tenancy.property_saon = propertySaon
  }

  return removeEmptyFields({
    tenancy,
  })
}

export function generateDepositUpdateData() {
  // Similar to creation but with fewer required fields
  // Generate rent amount first (even though not in update payload, used for calculation)
  const rentAmount = faker.number.int({ min: 800, max: 3000 })
  // Calculate deposit as 5 weeks worth of rent (rent / 4 * 5)
  const depositAmount = Math.round((rentAmount / 4) * 5)

  const startDate = faker.date.future()
  const endDate = faker.date.future({ years: 1, refDate: startDate })
  // Deposit received date must be today or in the past (within last 10 days)
  const depositReceivedDate = faker.date.recent({ days: 10 })

  const tenancy: any = {
    user_tenancy_reference: `UTR${faker.string.alphanumeric(8).toUpperCase()}`,
    deposit_reference: `DEP${faker.string.alphanumeric(8).toUpperCase()}`,
    property_id: `PROP${faker.string.alphanumeric(8).toUpperCase()}`,
    property_paon: faker.location.buildingNumber(),
    property_street: faker.location.street(),
    property_town: faker.location.city(),
    property_administrative_area: faker.location.county(),
    property_postcode: generateUKPostcode(),
    tenancy_start_date: startDate.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' }).replace(/\//g, '-'),
    tenancy_expected_end_date: endDate.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' }).replace(/\//g, '-'),
    deposit_amount: depositAmount.toString(),
    deposit_amount_to_protect: depositAmount.toString(),
    deposit_received_date: depositReceivedDate.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' }).replace(/\//g, '-'),
    number_of_tenants: '1',
    number_of_landlords: '1',
  }

  return removeEmptyFields({
    tenancy,
  })
}

export function generateRepaymentRequestData() {
  const totalRepayment = faker.number.int({ min: 100, max: 2000 })
  const cleaning = faker.number.int({ min: 0, max: totalRepayment })
  const damage = faker.number.int({ min: 0, max: totalRepayment - cleaning })
  const rentArrears = totalRepayment - cleaning - damage

  const data: any = {
    dan: `EWC${faker.string.numeric(8)}`,
    tenancy_end_date: faker.date.recent().toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' }).replace(/\//g, '-'),
    tenant_repayment: faker.number.int({ min: 0, max: 1000 }).toString(),
    agent_repayment: {
      total: totalRepayment.toString(),
      cleaning: cleaning.toString(),
      rent_arrears: rentArrears.toString(),
      damage: damage.toString(),
      redecoration: '0',
      gardening: '0',
      other: '0',
    },
  }

  // Only add other_text if it has a value
  const otherText = faker.datatype.boolean() ? faker.lorem.sentence() : null
  if (otherText) {
    data.agent_repayment.other_text = otherText
  }

  return removeEmptyFields(data)
}

export function generateTransferDepositData() {
  // Inter-member transfer: transfer to another member by person email
  return {
    dan: `NI${faker.string.numeric(8)}`,
    person_email: faker.internet.email()
  }
}

export function generateTransferBranchDepositData() {
  // Intra-member transfer: transfer to another branch within same member
  // DAN is in path parameter, so we only need Branch_id (and optionally person_id)
  const data: any = {
    Branch_id: `BR${faker.string.numeric(4)}${faker.string.alpha({ length: 2, casing: 'upper' })}`
  }

  // Optionally include person_id to clone/link landlord
  if (faker.datatype.boolean()) {
    data.person_id = `${faker.string.numeric(3)}`
  }

  return removeEmptyFields(data)
}

export function generateDepositoryManagedData() {
  return removeEmptyFields({
    dan: `EWC${faker.string.numeric(8)}`,
    depository_managed: 'true',
    effective_date: faker.date.recent().toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' }).replace(/\//g, '-'),
  })
}

export function generateAddAdditionalTenantData() {
  const numTenants = faker.number.int({ min: 1, max: 2 })
  const people = []

  // Generate tenant(s)
  for (let i = 0; i < numTenants; i++) {
    const isBusiness = faker.datatype.boolean()
    // Generate UK landline number (01 or 02 prefix)
    const landlinePrefix = faker.helpers.arrayElement(['01', '02'])
    const landlineNumber = `${landlinePrefix}${faker.string.numeric(9)}`

    const person: any = {
      person_classification: 'Tenant',
      person_id: `TEN${faker.string.alphanumeric(8).toUpperCase()}`,
      person_reference: `TENREF${faker.string.alphanumeric(6).toUpperCase()}`,
      person_title: faker.person.prefix(),
      person_firstname: faker.person.firstName(),
      person_surname: faker.person.lastName(),
      is_business: isBusiness.toString().toUpperCase(),
      person_paon: faker.location.buildingNumber(),
      person_street: faker.location.street(),
      person_locality: faker.location.county(),
      person_town: faker.location.city(),
      person_postcode: generateUKPostcode(),
      person_country: 'United Kingdom',
      person_phone: landlineNumber,
      person_email: faker.internet.email(),
      person_mobile: `07${faker.string.numeric(9)}`,
    }

    // Add optional fields
    if (isBusiness) {
      person.business_name = faker.company.name()
    }

    const saon = faker.datatype.boolean() ? `Flat ${faker.number.int({ min: 1, max: 20 })}` : null
    if (saon) {
      person.person_saon = saon
    }

    people.push(person)
  }

  return removeEmptyFields({
    people
  })
}

export function generateRemoveTenantData() {
  const numTenants = faker.number.int({ min: 1, max: 2 })
  const people = []

  // Generate tenant(s) to remove - now requires full tenant details like Add Tenant
  // Mandatory fields: person_classification, person_firstname, person_surname, and one of person_email/person_mobile/person_phone
  for (let i = 0; i < numTenants; i++) {
    const isBusiness = faker.datatype.boolean()
    // Generate UK landline number (01 or 02 prefix)
    const landlinePrefix = faker.helpers.arrayElement(['01', '02'])
    const landlineNumber = `${landlinePrefix}${faker.string.numeric(9)}`

    const person: any = {
      person_classification: 'Tenant',
      person_id: `TEN${faker.string.alphanumeric(8).toUpperCase()}`,
      person_reference: `TENREF${faker.string.alphanumeric(6).toUpperCase()}`,
      person_title: faker.person.prefix(),
      person_firstname: faker.person.firstName(),
      person_surname: faker.person.lastName(),
      is_business: isBusiness.toString().toUpperCase(),
      person_paon: faker.location.buildingNumber(),
      person_street: faker.location.street(),
      person_locality: faker.location.county(),
      person_town: faker.location.city(),
      person_postcode: generateUKPostcode(),
      person_country: 'United Kingdom',
      person_phone: landlineNumber,
      person_email: faker.internet.email(),
      person_mobile: `07${faker.string.numeric(9)}`,
    }

    // Add optional fields
    if (isBusiness) {
      person.business_name = faker.company.name()
    }

    const saon = faker.datatype.boolean() ? `Flat ${faker.number.int({ min: 1, max: 20 })}` : null
    if (saon) {
      person.person_saon = saon
    }

    people.push(person)
  }

  return removeEmptyFields({
    people
  })
}

/**
 * Generate NRLA ID in format RLA-XXXXX-XX
 * RLA prefix, 5 digits, 2 random letters
 */
export function generateNRLAId(): string {
  const digits = faker.string.numeric(5)
  const letters = faker.string.alpha({ length: 2, casing: 'upper' })
  return `RLA-${digits}-${letters}`
}

export function generateRegisterLandlordData() {
  const isBusiness = faker.datatype.boolean()

  const person: any = {
    nrla_id: generateNRLAId(),
    person_title: faker.person.prefix(),
    person_firstname: faker.person.firstName(),
    person_surname: faker.person.lastName(),
    is_business: isBusiness.toString().toLowerCase(),
    person_paon: faker.location.buildingNumber(),
    person_street: faker.location.street(),
    person_town: faker.location.city(),
    person_postcode: generateUKPostcode(),
    person_country: faker.helpers.arrayElement(['England', 'Wales', 'Scotland', 'Northern Ireland']),
    person_phone: `07${faker.string.numeric(9)}`,
    person_email: faker.internet.email(),
    person_classification: 'Primary Landlord',
  }

  // Add optional saon (secondary address - flat number etc)
  const saon = faker.datatype.boolean() ? `Flat ${faker.number.int({ min: 1, max: 20 })}` : null
  if (saon) {
    person.person_saon = saon
  }

  return {
    people: person
  }
}

export function generateCreateOfficeUserData() {
  // Generate 1-3 branch IDs
  const numBranches = faker.number.int({ min: 1, max: 3 })
  const branches: string[] = []
  for (let i = 0; i < numBranches; i++) {
    branches.push(`BR${faker.string.numeric(5)}${faker.string.alpha({ length: 1, casing: 'upper' })}`)
  }

  const jobRoles = [
    'Account administrator',
    'Dispute administrator',
    'Finance administrator',
    'Deposit, property & dispute administrator',
    'Deposit & property administrator',
    'View only access'
  ]

  return {
    user: {
      person_title: faker.helpers.arrayElement(['Mr', 'Mrs', 'Ms', 'Miss', 'Dr']),
      person_firstname: faker.person.firstName(),
      person_surname: faker.person.lastName(),
      person_email: faker.internet.email(),
      person_mobile: `07${faker.string.numeric(9)}`,
      job_role: faker.helpers.arrayElement(jobRoles),
      branches: branches.join(', ')
    }
  }
}

/**
 * Generate test data based on endpoint ID
 */
export function generateTestDataForEndpoint(endpointId: string): any {
  switch (endpointId) {
    case 'deposit-creation':
      return generateDepositCreationData()
    case 'deposit-update':
      return generateDepositUpdateData()
    case 'repayment-request':
    case 'repayment-response':
      return generateRepaymentRequestData()
    case 'transfer-deposit':
      return generateTransferDepositData()
    case 'transfer-branch-deposit':
      return generateTransferBranchDepositData()
    case 'mark-depository-managed':
      return generateDepositoryManagedData()
    case 'add-additional-tenant':
      return generateAddAdditionalTenantData()
    case 'remove-tenant':
      return generateRemoveTenantData()
    case 'register-landlord':
      return generateRegisterLandlordData()
    case 'create-office-user':
      return generateCreateOfficeUserData()
    default:
      // For GET endpoints or endpoints without specific generators
      return null
  }
}
