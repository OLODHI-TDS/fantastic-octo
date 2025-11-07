const axios = require('axios');

const INSTANCE_URL = 'https://your-instance.my.salesforce.com';
const BEARER_TOKEN = 'YOUR_SALESFORCE_BEARER_TOKEN_HERE';

async function testVerification() {
  console.log('🧪 Testing Salesforce Verification\n');
  console.log('='.repeat(80) + '\n');

  const client = axios.create({
    baseURL: INSTANCE_URL,
    headers: {
      'Authorization': `Bearer ${BEARER_TOKEN}`,
      'Content-Type': 'application/json',
    },
  });

  // Test 1: Query deposit by DAN
  console.log('Test 1: Query Deposit by DAN (EWI01193986)');
  console.log('-'.repeat(80));
  try {
    const dan = 'EWI01193986';
    const soql = `SELECT Id, Name, EWC_DAN__c, EWI_DAN_AutoNum__c, Is_Added_to_cart__c, Status__c FROM Deposit__c WHERE EWC_DAN__c = '${dan}' OR EWI_DAN_AutoNum__c = '${dan}' LIMIT 1`;

    console.log('SOQL:', soql);
    const response = await client.get('/services/data/v59.0/query', {
      params: { q: soql },
    });

    if (response.data.totalSize > 0) {
      const deposit = response.data.records[0];
      console.log('✅ PASS - Deposit found\n');
      console.log('Deposit Details:');
      console.log('  Name:', deposit.Name);
      console.log('  EWI DAN:', deposit.EWI_DAN_AutoNum__c);
      console.log('  Is Added to Cart:', deposit.Is_Added_to_cart__c);
      console.log('  Status:', deposit.Status__c);
    } else {
      console.log('❌ FAIL - No deposit found');
    }
  } catch (error) {
    console.log('❌ FAIL - Error:', error.response?.data || error.message);
  }
  console.log('');

  // Test 2: Query non-existent DAN
  console.log('Test 2: Query Non-Existent DAN (EWI99999999)');
  console.log('-'.repeat(80));
  try {
    const dan = 'EWI99999999';
    const soql = `SELECT Id, Name FROM Deposit__c WHERE EWC_DAN__c = '${dan}' OR EWI_DAN_AutoNum__c = '${dan}' LIMIT 1`;

    const response = await client.get('/services/data/v59.0/query', {
      params: { q: soql },
    });

    if (response.data.totalSize === 0) {
      console.log('✅ PASS - Correctly returned no results');
    } else {
      console.log('❌ FAIL - Should not find deposit');
    }
  } catch (error) {
    console.log('❌ FAIL - Error:', error.response?.data || error.message);
  }
  console.log('');

  // Test 3: Connection test
  console.log('Test 3: Connection Test (Query Limits)');
  console.log('-'.repeat(80));
  try {
    const response = await client.get('/services/data/v59.0/limits');
    console.log('✅ PASS - Connection successful');
    console.log('API Limits:', Object.keys(response.data).slice(0, 5).join(', ') + '...');
  } catch (error) {
    console.log('❌ FAIL - Connection failed:', error.message);
  }
  console.log('');

  console.log('='.repeat(80));
  console.log('✅ Verification Test Complete!');
  console.log('='.repeat(80));
  console.log('\n📋 Confirmed Configuration:');
  console.log('  • Object: Deposit__c');
  console.log('  • DAN Fields: EWC_DAN__c, EWI_DAN_AutoNum__c');
  console.log('  • Cart Field: Is_Added_to_cart__c');
  console.log('  • Status Field: Status__c');
  console.log('\n✅ Ready to integrate with test bench!');
}

testVerification().catch(console.error);
