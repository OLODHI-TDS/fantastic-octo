const axios = require('axios');

const INSTANCE_URL = 'https://your-instance.my.salesforce.com';
const BEARER_TOKEN = 'YOUR_SALESFORCE_BEARER_TOKEN_HERE';

async function findDepositObject() {
  try {
    console.log('🔍 Fetching all Salesforce objects...\n');

    const response = await axios.get(`${INSTANCE_URL}/services/data/v59.0/sobjects/`, {
      headers: {
        'Authorization': `Bearer ${BEARER_TOKEN}`,
        'Content-Type': 'application/json',
      },
    });

    const objects = response.data.sobjects;

    // Search for deposit-related objects
    const searchTerms = ['deposit', 'protection', 'tenancy', 'cart'];

    console.log('📋 Deposit-related objects found:\n');

    const matches = objects.filter(obj => {
      const name = obj.name.toLowerCase();
      const label = obj.label.toLowerCase();
      return searchTerms.some(term => name.includes(term) || label.includes(term));
    });

    matches.forEach(obj => {
      console.log(`✓ ${obj.label} (${obj.name})`);
      console.log(`  Custom: ${obj.custom}`);
      console.log(`  URL: ${obj.urls.describe}\n`);
    });

    if (matches.length === 0) {
      console.log('⚠️  No deposit-related objects found. Listing all custom objects:\n');

      const customObjects = objects.filter(obj => obj.custom);
      customObjects.slice(0, 20).forEach(obj => {
        console.log(`  ${obj.label} (${obj.name})`);
      });
    }

    return matches;

  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
  }
}

async function describeObject(objectName) {
  try {
    console.log(`\n🔍 Describing ${objectName}...\n`);

    const response = await axios.get(`${INSTANCE_URL}/services/data/v59.0/sobjects/${objectName}/describe`, {
      headers: {
        'Authorization': `Bearer ${BEARER_TOKEN}`,
        'Content-Type': 'application/json',
      },
    });

    const fields = response.data.fields;

    // Look for key fields
    const keyFields = fields.filter(f => {
      const name = f.name.toLowerCase();
      return name.includes('dan') || name.includes('cart') || name.includes('status') || f.name === 'Name';
    });

    console.log('📋 Key fields found:\n');
    keyFields.forEach(f => {
      console.log(`  ${f.label} (${f.name})`);
      console.log(`    Type: ${f.type}`);
      console.log(`    Required: ${!f.nillable}`);
      console.log('');
    });

    return response.data;

  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
  }
}

// Run the script
(async () => {
  const matches = await findDepositObject();

  if (matches && matches.length > 0) {
    // Describe the first match
    await describeObject(matches[0].name);
  }
})();
