const { SalesforceVerificationClient } = require('../lib/salesforce/verification-client');

const client = new SalesforceVerificationClient({
  instanceUrl: 'https://your-instance.my.salesforce.com',
  bearerToken: 'YOUR_SALESFORCE_BEARER_TOKEN_HERE',
});

async function testVerification() {
  console.log('🧪 Testing Salesforce Verification Client\n');
  console.log('='.repeat(80) + '\n');

  // Test 1: Connection test
  console.log('Test 1: Connection Test');
  console.log('-'.repeat(80));
  const connected = await client.testConnection();
  console.log('Result:', connected ? '✅ PASS' : '❌ FAIL');
  console.log('');

  // Test 2: Query deposit by DAN (EWI deposit we found earlier)
  console.log('Test 2: Query Deposit by DAN');
  console.log('-'.repeat(80));
  const dan = 'EWI01193986';
  const deposit = await client.queryDepositByDAN(dan);
  console.log('Result:', deposit ? '✅ PASS - Deposit found' : '❌ FAIL - Deposit not found');
  if (deposit) {
    console.log('Deposit Details:');
    console.log('  Name:', deposit.Name);
    console.log('  EWI DAN:', deposit.EWI_DAN_AutoNum__c);
    console.log('  Added to Cart:', deposit.Is_Added_to_cart__c);
    console.log('  Status:', deposit.Status__c);
  }
  console.log('');

  // Test 3: Verify Added to Cart (should be false for this deposit)
  console.log('Test 3: Verify Added to Cart Status');
  console.log('-'.repeat(80));
  const verificationResult = await client.verifyAddedToCart(dan);
  console.log('Result:', verificationResult.success ? '✅ Query Success' : '❌ Query Failed');
  console.log('Query Time:', verificationResult.queryTime + 'ms');
  console.log('Checks:');
  verificationResult.checks.forEach(check => {
    console.log(`  ${check.field}:`);
    console.log(`    Expected: ${check.expected}`);
    console.log(`    Actual: ${check.actual}`);
    console.log(`    Status: ${check.passed ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`    Message: ${check.message}`);
  });
  console.log('');

  // Test 4: Query a non-existent DAN
  console.log('Test 4: Query Non-Existent DAN');
  console.log('-'.repeat(80));
  const nonExistentDan = 'EWI99999999';
  const notFound = await client.queryDepositByDAN(nonExistentDan);
  console.log('Result:', !notFound ? '✅ PASS - Correctly returned null' : '❌ FAIL - Should not find deposit');
  console.log('');

  // Summary
  console.log('='.repeat(80));
  console.log('✅ Verification Client Test Complete!');
  console.log('='.repeat(80));
  console.log('\n📋 Confirmed Field Names:');
  console.log('  • Object: Deposit__c');
  console.log('  • DAN Fields: EWC_DAN__c, EWI_DAN_AutoNum__c');
  console.log('  • Cart Field: Is_Added_to_cart__c');
  console.log('  • Status Field: Status__c');
}

testVerification().catch(console.error);
