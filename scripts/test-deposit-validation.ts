/**
 * Automated test script to discover deposit creation API validation rules
 * This script will test various scenarios and report back the errors
 */

import axios from 'axios'

const BASE_URL = 'https://thedisputeservice--fullcopy.sandbox.my.salesforce-sites.com'
const ENDPOINT = '/services/apexrest/depositcreation'
const ACCESS_TOKEN = 'England & Wales Custodial-Custodial-A02636EW-BR3764SC-1761123892435-918616e607a54dc908bfeac2acfb461784707c9a2ba8c2957d0e1688d579e0ca'

// Working baseline payload
const BASELINE_PAYLOAD = {
  tenancy: {
    user_tenancy_reference: "UTROVLRMLZA",
    deposit_reference: "DEPA4FAK0BR",
    property_id: "PROP4PLQ2VCU",
    property_paon: "662",
    property_street: "Wood Street",
    property_town: "West Haley",
    property_administrative_area: "Durham",
    property_postcode: "LU42 9NL",
    tenancy_start_date: "10-02-2026",
    tenancy_expected_end_date: "09-09-2026",
    number_of_living_rooms: "1",
    number_of_bedrooms: "4",
    furnished_status: "true",
    rent_amount: "1944",
    deposit_amount: "2420",
    deposit_amount_to_protect: "2420",
    deposit_received_date: "17-10-2025",
    number_of_tenants: "2",
    number_of_landlords: "1",
    people: [
      {
        person_classification: "Tenant",
        person_id: "TENORVK7LC3",
        person_reference: "TENREFRW4GRV",
        person_title: "Mrs.",
        person_firstname: "Darron",
        person_surname: "Dickens-Goyette",
        is_business: "TRUE",
        person_paon: "752",
        person_street: "Hillside Close",
        person_locality: "Lake County",
        person_town: "Thompsonport",
        person_postcode: "LU82 5KM",
        person_country: "United Kingdom",
        person_phone: "02726990386",
        person_email: "Ted_Becker93@yahoo.com",
        person_mobile: "07057782151",
        business_name: "Dach - Metz"
      },
      {
        person_classification: "Tenant",
        person_id: "TENVXUAID3Q",
        person_reference: "TENREFYK78V2",
        person_title: "Mr.",
        person_firstname: "Lavada",
        person_surname: "Dooley",
        is_business: "TRUE",
        person_paon: "256",
        person_street: "Kuvalis Knoll",
        person_locality: "Buckinghamshire",
        person_town: "Fort Dorothycester",
        person_postcode: "LU96 8RL",
        person_country: "United Kingdom",
        person_phone: "01876787876",
        person_email: "Ezequiel.Considine@hotmail.com",
        person_mobile: "07770690260",
        business_name: "Schulist - Zieme"
      },
      {
        person_classification: "Primary Landlord",
        person_id: "LL2D4A4L0T",
        person_reference: "LLREFNGJMPS",
        person_title: "Miss",
        person_firstname: "Yessenia",
        person_surname: "Dach",
        is_business: "FALSE",
        person_paon: "8859",
        person_street: "Roderick Fords",
        person_locality: "Carroll County",
        person_town: "Osinskifield",
        person_postcode: "HX42 9MY",
        person_country: "United Kingdom",
        person_phone: "01026020147",
        person_email: "Adele_Aufderhar@yahoo.com",
        person_mobile: "07488841734",
        person_saon: "Flat 2"
      }
    ]
  }
}

interface TestResult {
  testName: string
  description: string
  status: 'PASS' | 'FAIL' | 'ERROR'
  statusCode?: number
  errorMessage?: string
  errorDetails?: any
}

const results: TestResult[] = []

async function makeRequest(payload: any, testName: string): Promise<TestResult> {
  try {
    const response = await axios.post(`${BASE_URL}${ENDPOINT}`, payload, {
      headers: {
        'Content-Type': 'application/json',
        'AccessToken': ACCESS_TOKEN
      },
      validateStatus: () => true // Don't throw on any status code
    })

    if (response.status === 201) {
      return {
        testName,
        description: '',
        status: 'PASS',
        statusCode: response.status,
        errorMessage: 'Request succeeded (unexpected for negative test)'
      }
    } else {
      return {
        testName,
        description: '',
        status: 'FAIL',
        statusCode: response.status,
        errorMessage: response.data?.message || 'Unknown error',
        errorDetails: response.data?.errors || response.data
      }
    }
  } catch (error: any) {
    return {
      testName,
      description: '',
      status: 'ERROR',
      errorMessage: error.message,
      errorDetails: error.response?.data
    }
  }
}

function clonePayload(): any {
  return JSON.parse(JSON.stringify(BASELINE_PAYLOAD))
}

function generateUniqueReferences() {
  const timestamp = Date.now()
  const random = Math.random().toString(36).substring(2, 10).toUpperCase()
  return {
    user_tenancy_reference: `UTR${timestamp}${random}`,
    deposit_reference: `DEP${timestamp}${random}`,
  }
}

async function runTests() {
  console.log('🧪 Starting Deposit Creation API Validation Tests...\n')

  // Test 1: Missing user_tenancy_reference
  let payload = clonePayload()
  const refs1 = generateUniqueReferences()
  payload.tenancy.deposit_reference = refs1.deposit_reference
  delete payload.tenancy.user_tenancy_reference
  results.push(await makeRequest(payload, 'Missing user_tenancy_reference'))

  // Test 2: Missing deposit_reference
  payload = clonePayload()
  const refs2 = generateUniqueReferences()
  payload.tenancy.user_tenancy_reference = refs2.user_tenancy_reference
  delete payload.tenancy.deposit_reference
  results.push(await makeRequest(payload, 'Missing deposit_reference'))

  // Test 3: Missing property_id
  payload = clonePayload()
  const refs3 = generateUniqueReferences()
  Object.assign(payload.tenancy, refs3)
  delete payload.tenancy.property_id
  results.push(await makeRequest(payload, 'Missing property_id'))

  // Test 4: Missing deposit_amount
  payload = clonePayload()
  const refs4 = generateUniqueReferences()
  Object.assign(payload.tenancy, refs4)
  delete payload.tenancy.deposit_amount
  results.push(await makeRequest(payload, 'Missing deposit_amount'))

  // Test 5: Missing tenancy_start_date
  payload = clonePayload()
  const refs5 = generateUniqueReferences()
  Object.assign(payload.tenancy, refs5)
  delete payload.tenancy.tenancy_start_date
  results.push(await makeRequest(payload, 'Missing tenancy_start_date'))

  // Test 6: Empty people array
  payload = clonePayload()
  const refs6 = generateUniqueReferences()
  Object.assign(payload.tenancy, refs6)
  payload.tenancy.people = []
  results.push(await makeRequest(payload, 'Empty people array'))

  // Test 7: No tenants in people array
  payload = clonePayload()
  const refs7 = generateUniqueReferences()
  Object.assign(payload.tenancy, refs7)
  payload.tenancy.people = payload.tenancy.people.filter((p: any) => p.person_classification !== 'Tenant')
  results.push(await makeRequest(payload, 'No tenants in people array'))

  // Test 8: No landlords in people array
  payload = clonePayload()
  const refs8 = generateUniqueReferences()
  Object.assign(payload.tenancy, refs8)
  payload.tenancy.people = payload.tenancy.people.filter((p: any) => !p.person_classification.includes('Landlord'))
  results.push(await makeRequest(payload, 'No landlords in people array'))

  // Test 9: Count mismatch - number_of_tenants
  payload = clonePayload()
  const refs9 = generateUniqueReferences()
  Object.assign(payload.tenancy, refs9)
  payload.tenancy.number_of_tenants = "5"
  results.push(await makeRequest(payload, 'number_of_tenants count mismatch'))

  // Test 10: Count mismatch - number_of_landlords
  payload = clonePayload()
  const refs10 = generateUniqueReferences()
  Object.assign(payload.tenancy, refs10)
  payload.tenancy.number_of_landlords = "5"
  results.push(await makeRequest(payload, 'number_of_landlords count mismatch'))

  // Test 11: Invalid date format (YYYY-MM-DD)
  payload = clonePayload()
  const refs11 = generateUniqueReferences()
  Object.assign(payload.tenancy, refs11)
  payload.tenancy.tenancy_start_date = "2026-02-10"
  results.push(await makeRequest(payload, 'Invalid date format (YYYY-MM-DD)'))

  // Test 12: End date before start date
  payload = clonePayload()
  const refs12 = generateUniqueReferences()
  Object.assign(payload.tenancy, refs12)
  payload.tenancy.tenancy_expected_end_date = "01-01-2026"
  results.push(await makeRequest(payload, 'End date before start date'))

  // Test 13: deposit_received_date in future
  payload = clonePayload()
  const refs13 = generateUniqueReferences()
  Object.assign(payload.tenancy, refs13)
  payload.tenancy.deposit_received_date = "01-01-2027"
  results.push(await makeRequest(payload, 'deposit_received_date in future'))

  // Test 14: Invalid postcode (not B*, HP*, LU*, HX*)
  payload = clonePayload()
  const refs14 = generateUniqueReferences()
  Object.assign(payload.tenancy, refs14)
  payload.tenancy.property_postcode = "SW1 2AB"
  results.push(await makeRequest(payload, 'Invalid postcode area (SW)'))

  // Test 15: Invalid furnished_status
  payload = clonePayload()
  const refs15 = generateUniqueReferences()
  Object.assign(payload.tenancy, refs15)
  payload.tenancy.furnished_status = "yes"
  results.push(await makeRequest(payload, 'Invalid furnished_status value'))

  // Test 16: Negative deposit amount
  payload = clonePayload()
  const refs16 = generateUniqueReferences()
  Object.assign(payload.tenancy, refs16)
  payload.tenancy.deposit_amount = "-100"
  results.push(await makeRequest(payload, 'Negative deposit amount'))

  // Test 17: deposit_amount_to_protect > deposit_amount
  payload = clonePayload()
  const refs17 = generateUniqueReferences()
  Object.assign(payload.tenancy, refs17)
  payload.tenancy.deposit_amount_to_protect = "5000"
  results.push(await makeRequest(payload, 'deposit_amount_to_protect > deposit_amount'))

  // Test 18: Invalid email format
  payload = clonePayload()
  const refs18 = generateUniqueReferences()
  Object.assign(payload.tenancy, refs18)
  payload.tenancy.people[0].person_email = "not-an-email"
  results.push(await makeRequest(payload, 'Invalid email format'))

  // Test 19: Invalid phone number (too short)
  payload = clonePayload()
  const refs19 = generateUniqueReferences()
  Object.assign(payload.tenancy, refs19)
  payload.tenancy.people[0].person_phone = "123"
  results.push(await makeRequest(payload, 'Invalid phone number (too short)'))

  // Test 20: Invalid mobile number (wrong prefix)
  payload = clonePayload()
  const refs20 = generateUniqueReferences()
  Object.assign(payload.tenancy, refs20)
  payload.tenancy.people[0].person_mobile = "08123456789"
  results.push(await makeRequest(payload, 'Invalid mobile number prefix'))

  // Test 21: is_business TRUE without business_name
  payload = clonePayload()
  const refs21 = generateUniqueReferences()
  Object.assign(payload.tenancy, refs21)
  delete payload.tenancy.people[0].business_name
  results.push(await makeRequest(payload, 'is_business TRUE without business_name'))

  // Test 22: is_business FALSE with business_name
  payload = clonePayload()
  const refs22 = generateUniqueReferences()
  Object.assign(payload.tenancy, refs22)
  payload.tenancy.people[2].is_business = "FALSE"
  payload.tenancy.people[2].business_name = "Should Not Be Here Ltd"
  results.push(await makeRequest(payload, 'is_business FALSE with business_name'))

  // Test 23: Missing person_firstname
  payload = clonePayload()
  const refs23 = generateUniqueReferences()
  Object.assign(payload.tenancy, refs23)
  delete payload.tenancy.people[0].person_firstname
  results.push(await makeRequest(payload, 'Missing person_firstname'))

  // Test 24: Missing person_surname
  payload = clonePayload()
  const refs24 = generateUniqueReferences()
  Object.assign(payload.tenancy, refs24)
  delete payload.tenancy.people[0].person_surname
  results.push(await makeRequest(payload, 'Missing person_surname'))

  // Test 25: Missing person_email
  payload = clonePayload()
  const refs25 = generateUniqueReferences()
  Object.assign(payload.tenancy, refs25)
  delete payload.tenancy.people[0].person_email
  results.push(await makeRequest(payload, 'Missing person_email'))

  // Test 26: Duplicate user_tenancy_reference (use original value)
  payload = clonePayload()
  results.push(await makeRequest(payload, 'Duplicate user_tenancy_reference'))

  // Test 27: Very long string (property_street)
  payload = clonePayload()
  const refs27 = generateUniqueReferences()
  Object.assign(payload.tenancy, refs27)
  payload.tenancy.property_street = "A".repeat(500)
  results.push(await makeRequest(payload, 'Very long property_street (500 chars)'))

  // Test 28: Zero deposit amount
  payload = clonePayload()
  const refs28 = generateUniqueReferences()
  Object.assign(payload.tenancy, refs28)
  payload.tenancy.deposit_amount = "0"
  payload.tenancy.deposit_amount_to_protect = "0"
  results.push(await makeRequest(payload, 'Zero deposit amount'))

  // Test 29: Missing property_postcode
  payload = clonePayload()
  const refs29 = generateUniqueReferences()
  Object.assign(payload.tenancy, refs29)
  delete payload.tenancy.property_postcode
  results.push(await makeRequest(payload, 'Missing property_postcode'))

  // Test 30: Non-numeric deposit_amount
  payload = clonePayload()
  const refs30 = generateUniqueReferences()
  Object.assign(payload.tenancy, refs30)
  payload.tenancy.deposit_amount = "abc"
  results.push(await makeRequest(payload, 'Non-numeric deposit_amount'))

  console.log('\n✅ All tests completed!\n')
  printResults()
}

function printResults() {
  console.log('📊 TEST RESULTS SUMMARY')
  console.log('='.repeat(80))

  const failed = results.filter(r => r.status === 'FAIL')
  const errors = results.filter(r => r.status === 'ERROR')
  const passed = results.filter(r => r.status === 'PASS')

  console.log(`\nTotal Tests: ${results.length}`)
  console.log(`Failed (Got Error Response): ${failed.length}`)
  console.log(`Passed (Should Have Failed): ${passed.length}`)
  console.log(`Errors (Network/Other): ${errors.length}`)

  console.log('\n\n📋 DETAILED RESULTS')
  console.log('='.repeat(80))

  results.forEach((result, index) => {
    console.log(`\n${index + 1}. ${result.testName}`)
    console.log(`   Status: ${result.status}`)
    console.log(`   HTTP Status Code: ${result.statusCode || 'N/A'}`)
    console.log(`   Error Message: ${result.errorMessage || 'N/A'}`)
    if (result.errorDetails) {
      console.log(`   Error Details: ${JSON.stringify(result.errorDetails, null, 2)}`)
    }
  })

  // Export to JSON file
  const fs = require('fs')
  const outputPath = 'C:\\Users\\Omar.Lodhi\\Projects\\EWC API Test Bench\\test-results.json'
  fs.writeFileSync(outputPath, JSON.stringify(results, null, 2))
  console.log(`\n\n💾 Results saved to: ${outputPath}`)
}

// Run the tests
runTests().catch(console.error)
