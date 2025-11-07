/**
 * Test script to validate if custom AccessToken works with standard Salesforce REST API
 */

const axios = require('axios');

// EWDDEV Sandbox instance
const INSTANCE_URL = 'https://thedisputeservice--ewddev.sandbox.my.salesforce.com';

// Test credentials - replace with actual values
const TEST_CONFIG = {
  // OAuth2 credentials for testing
  oauth2: {
    regionScheme: 'EW - Insured',
    memberId: 'BR6353SC', // Replace with actual
    clientId: 'YOUR_CLIENT_ID', // Replace with actual
    clientSecret: 'YOUR_CLIENT_SECRET', // Replace with actual
  }
};

/**
 * Build OAuth2 auth_code header
 */
function buildOAuth2AuthCode(regionScheme, clientId, clientSecret, memberId) {
  const regionPrefixMap = {
    'EW - Custodial': 'England & Wales Custodial-Custodial',
    'EW - Insured': 'England & Wales Insured-Insured',
    'NI - Custodial': 'Northern Ireland-Custodial',
    'NI - Insured': 'Northern Ireland-Insured',
    'SDS - Custodial': 'Safe Deposits Scotland-Custodial',
  };

  const regionPrefix = regionPrefixMap[regionScheme];
  return `${regionPrefix}-${clientId}-${clientSecret}-${memberId}`;
}

/**
 * Get custom AccessToken from /services/apexrest/authorise
 */
async function getCustomAccessToken(config) {
  try {
    const authCode = buildOAuth2AuthCode(
      config.regionScheme,
      config.clientId,
      config.clientSecret,
      config.memberId
    );

    console.log('🔑 Requesting custom AccessToken from /services/apexrest/authorise...');
    console.log('📍 Instance URL:', INSTANCE_URL);

    const response = await axios.get(`${INSTANCE_URL}/services/apexrest/authorise`, {
      headers: {
        'Content-Type': 'application/json',
        'auth_code': authCode,
      },
      timeout: 30000,
    });

    if (response.data.success === 'true' && response.data.AccessToken) {
      console.log('✅ Custom AccessToken retrieved successfully');
      console.log('🔑 Token length:', response.data.AccessToken.length);
      return response.data.AccessToken;
    } else {
      throw new Error('Failed to get AccessToken from response');
    }
  } catch (error) {
    console.error('❌ Failed to get custom AccessToken:', error.message);
    if (error.response) {
      console.error('📋 Response status:', error.response.status);
      console.error('📋 Response data:', JSON.stringify(error.response.data, null, 2));
    }
    throw error;
  }
}

/**
 * Test 1: Try custom AccessToken with standard REST API using "AccessToken" header
 */
async function testCustomTokenWithAccessTokenHeader(customToken) {
  try {
    console.log('\n📊 Test 1: Using custom token with "AccessToken" header on standard REST API');
    const response = await axios.get(
      `${INSTANCE_URL}/services/data/v59.0/query?q=SELECT+Id,Name+FROM+User+LIMIT+1`,
      {
        headers: {
          'Content-Type': 'application/json',
          'AccessToken': customToken,
        },
        timeout: 10000,
      }
    );

    console.log('✅ SUCCESS! Custom AccessToken works with standard REST API using "AccessToken" header');
    console.log('📋 Response:', JSON.stringify(response.data, null, 2));
    return true;
  } catch (error) {
    console.log('❌ FAILED: Custom AccessToken does NOT work with "AccessToken" header on standard REST API');
    console.log('📋 Status:', error.response?.status);
    console.log('📋 Error:', error.response?.data || error.message);
    return false;
  }
}

/**
 * Test 2: Try custom AccessToken with standard REST API using "Authorization: Bearer" header
 */
async function testCustomTokenWithBearerHeader(customToken) {
  try {
    console.log('\n📊 Test 2: Using custom token with "Authorization: Bearer" header on standard REST API');
    const response = await axios.get(
      `${INSTANCE_URL}/services/data/v59.0/query?q=SELECT+Id,Name+FROM+User+LIMIT+1`,
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${customToken}`,
        },
        timeout: 10000,
      }
    );

    console.log('✅ SUCCESS! Custom AccessToken works with standard REST API using "Authorization: Bearer" header');
    console.log('📋 Response:', JSON.stringify(response.data, null, 2));
    return true;
  } catch (error) {
    console.log('❌ FAILED: Custom AccessToken does NOT work with "Authorization: Bearer" header on standard REST API');
    console.log('📋 Status:', error.response?.status);
    console.log('📋 Error:', error.response?.data || error.message);
    return false;
  }
}

/**
 * Test 3: Verify custom token still works with custom Apex endpoints
 */
async function testCustomTokenWithCustomEndpoint(customToken) {
  try {
    console.log('\n📊 Test 3: Using custom token with custom Apex endpoint (/services/apexrest/...)');
    // Try the branches endpoint as a simple test
    const response = await axios.get(
      `${INSTANCE_URL}/services/apexrest/auth/branches`,
      {
        headers: {
          'Content-Type': 'application/json',
          'AccessToken': customToken,
        },
        timeout: 10000,
      }
    );

    console.log('✅ SUCCESS! Custom AccessToken works with custom Apex endpoints');
    console.log('📋 Response status:', response.status);
    return true;
  } catch (error) {
    console.log('⚠️  Custom Apex endpoint test result:');
    console.log('📋 Status:', error.response?.status);
    console.log('📋 Response:', JSON.stringify(error.response?.data, null, 2));
    return error.response?.status === 200;
  }
}

/**
 * Main test runner
 */
async function runTests() {
  console.log('='.repeat(80));
  console.log('🧪 SALESFORCE REST API ACCESS TEST');
  console.log('='.repeat(80));
  console.log('\n⚠️  IMPORTANT: Update TEST_CONFIG with actual OAuth2 credentials before running!\n');

  try {
    // Step 1: Get custom AccessToken
    const customToken = await getCustomAccessToken(TEST_CONFIG.oauth2);

    // Step 2: Test with AccessToken header
    const test1 = await testCustomTokenWithAccessTokenHeader(customToken);

    // Step 3: Test with Bearer header
    const test2 = await testCustomTokenWithBearerHeader(customToken);

    // Step 4: Test with custom endpoint
    const test3 = await testCustomTokenWithCustomEndpoint(customToken);

    // Summary
    console.log('\n' + '='.repeat(80));
    console.log('📊 TEST SUMMARY');
    console.log('='.repeat(80));
    console.log(`Custom token with "AccessToken" header on standard REST API: ${test1 ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`Custom token with "Authorization: Bearer" header on standard REST API: ${test2 ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`Custom token with custom Apex endpoint: ${test3 ? '✅ PASS' : '❌ FAIL'}`);

    console.log('\n' + '='.repeat(80));
    console.log('💡 RECOMMENDATION');
    console.log('='.repeat(80));

    if (test1 || test2) {
      console.log('✅ Your custom AccessToken WORKS with standard Salesforce REST APIs!');
      console.log('✅ You can implement SOQL queries without any Salesforce code changes.');
      console.log(`✅ Use header: "${test1 ? 'AccessToken' : 'Authorization: Bearer'}"`);
      console.log('\n📝 Next steps:');
      console.log('1. Add queryDeposit() method to EWCRestClient');
      console.log('2. Use /services/data/v59.0/query endpoint');
      console.log('3. Query deposit fields directly via SOQL');
    } else {
      console.log('❌ Your custom AccessToken does NOT work with standard Salesforce REST APIs.');
      console.log('⚠️  You will need to create a custom Apex endpoint for verification.');
      console.log('\n📝 Recommended approach:');
      console.log('1. Create /services/apexrest/verify/deposit/{DAN} endpoint');
      console.log('2. Use your existing custom authentication');
      console.log('3. Return deposit verification fields (Added_to_Cart__c, etc.)');
    }

  } catch (error) {
    console.error('\n💥 Test failed with error:', error.message);
    console.error('⚠️  Make sure to update TEST_CONFIG with valid credentials');
  }
}

// Run if executed directly
if (require.main === module) {
  runTests().catch(console.error);
}

module.exports = { runTests, getCustomAccessToken, testCustomTokenWithAccessTokenHeader, testCustomTokenWithBearerHeader };
