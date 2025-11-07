# 🔍 Verification System Guide

Complete guide to leveraging the Salesforce verification system for any endpoint.

---

## 📋 Table of Contents

1. [Overview](#overview)
2. [How It Works](#how-it-works)
3. [Adding Verification to New Endpoints](#adding-verification-to-new-endpoints)
4. [Examples](#examples)
5. [Advanced Usage](#advanced-usage)
6. [Best Practices](#best-practices)

---

## Overview

The verification system automatically queries Salesforce after successful API tests to verify that expected changes were made. This provides **end-to-end validation** of your API calls.

### Current Status

✅ **Fully Configured Endpoints:**
- Add to Cart (`/cart/add/`)
- Deposit Creation (`/depositcreation`)
- Deposit Update (`/depositupdate`)
- Delete Deposit (`/delete/`)
- Repayment Request (`/raiserepaymentrequest`)
- Mark as Depository Managed (`/depositorymanaged`)

⚠️ **Ready to Add:** Any endpoint that modifies Salesforce data

---

## How It Works

### Architecture

```
┌──────────────────────────────────────────────────────┐
│  1. Test Execution                                    │
│     API call completes successfully                   │
└───────────────────┬──────────────────────────────────┘
                    │
                    ▼
┌──────────────────────────────────────────────────────┐
│  2. Verification Engine                               │
│     - Finds matching rule in config                   │
│     - Extracts identifier (DAN, ID, etc.)             │
│     - Waits for Salesforce processing                 │
└───────────────────┬──────────────────────────────────┘
                    │
                    ▼
┌──────────────────────────────────────────────────────┐
│  3. Query Salesforce                                  │
│     - Uses Bearer token authentication                │
│     - Queries Deposit__c or custom objects            │
│     - Checks field values                             │
└───────────────────┬──────────────────────────────────┘
                    │
                    ▼
┌──────────────────────────────────────────────────────┐
│  4. Display Results                                   │
│     - Scenario cards show badge                       │
│     - Response section shows details                  │
│     - Results page shows history                      │
│     - PDF reports include verification                │
└──────────────────────────────────────────────────────┘
```

### Key Components

1. **Configuration** (`lib/verification/config.ts`)
   - Define rules for each endpoint
   - Specify what to verify

2. **Engine** (`lib/verification/engine.ts`)
   - Automatically runs verifications
   - Handles all logic

3. **Client** (`lib/salesforce/verification-client.ts`)
   - Executes SOQL queries
   - Returns results

---

## Adding Verification to New Endpoints

### Quick Start (3 Steps)

1. Open `lib/verification/config.ts`
2. Add a new rule to `VERIFICATION_RULES` array
3. Test your endpoint

That's it! No other code changes needed.

---

## Examples

### Example 1: Simple Field Verification

**Goal:** Verify deposit status after deletion

```typescript
{
  endpointPattern: '/delete/',
  extractIdentifier: (endpoint) => {
    const match = endpoint.match(/(EWC|EWI|NI|SDS)\d+/i)
    return match ? match[0] : null
  },
  verificationType: 'deposit-fields',
  expectedFields: {
    Status__c: 'Released',
  },
  delay: 2000,
}
```

**What it does:**
- Matches endpoints containing `/delete/`
- Extracts DAN from URL (e.g., `EWI01261682`)
- Waits 2 seconds
- Queries `Deposit__c` WHERE DAN matches
- Verifies `Status__c` field equals `'Released'`

---

### Example 2: Dynamic Field Verification

**Goal:** Verify fields that were updated in a deposit update

```typescript
{
  endpointPattern: '/depositupdate',
  extractIdentifier: (endpoint, requestBody) => {
    return requestBody?.DAN || null
  },
  verificationType: 'deposit-fields',
  expectedFields: (request, response) => {
    const fields: Record<string, any> = {}

    // Only verify fields that were included in the update
    if (request.TenancyStartDate) {
      fields.Tenancy_Start_Date__c = request.TenancyStartDate
    }
    if (request.DepositAmount) {
      fields.Deposit_Amount__c = parseFloat(request.DepositAmount)
    }
    if (request.TenancyEndDate) {
      fields.Tenancy_End_Date__c = request.TenancyEndDate
    }

    return fields
  },
  delay: 2000,
}
```

**What it does:**
- Gets DAN from request body
- Dynamically builds expected fields based on what was sent
- Only verifies fields that were actually updated

---

### Example 3: Custom Query (Different Object)

**Goal:** Verify repayment request was created

```typescript
{
  endpointPattern: '/raiserepaymentrequest',
  extractIdentifier: (endpoint, requestBody) => {
    return requestBody?.DAN || null
  },
  verificationType: 'custom-query',
  customQuery: (dan, request, response) => ({
    soql: `
      SELECT Id, Status__c, Requested_Amount__c, Deposit__r.EWC_DAN__c
      FROM Repayment_Request__c
      WHERE Deposit__r.EWC_DAN__c = '${dan}'
      OR Deposit__r.EWI_DAN_AutoNum__c = '${dan}'
      ORDER BY CreatedDate DESC
      LIMIT 1
    `,
    checks: [
      {
        field: 'Repayment_Request__c.Status__c',
        expected: 'Pending',
        getMessage: (actual, expected) =>
          actual === expected
            ? 'Repayment request created successfully'
            : `Expected status ${expected}, got ${actual}`,
      },
      {
        field: 'Repayment_Request__c.Requested_Amount__c',
        expected: parseFloat(request.TotalAmount),
        getMessage: (actual, expected) =>
          actual === expected
            ? 'Repayment amount matches'
            : `Expected amount ${expected}, got ${actual}`,
      },
    ],
  }),
  delay: 3000,
}
```

**What it does:**
- Queries `Repayment_Request__c` object (not Deposit__c!)
- Finds the most recent request for the deposit
- Verifies status and amount
- Uses custom messages for results

---

### Example 4: Response-Based Identifier

**Goal:** Get DAN from API response (for creation endpoints)

```typescript
{
  endpointPattern: '/depositcreation',
  extractIdentifier: (endpoint, requestBody, response) => {
    // DAN comes from response after creation
    return response?.DAN || response?.dan || null
  },
  verificationType: 'deposit-fields',
  expectedFields: (request, response) => ({
    Status__c: 'Protected',
    Deposit_Amount__c: parseFloat(request.DepositAmount),
  }),
  delay: 3000,
}
```

**What it does:**
- Extracts DAN from response (since it's created by the API)
- Verifies deposit exists with correct status and amount

---

## Advanced Usage

### Verify Multiple Fields

```typescript
expectedFields: {
  Status__c: 'Protected',
  Deposit_Amount__c: 1000,
  Tenancy_Start_Date__c: '2025-01-01',
  Is_Added_to_cart__c: false,
  Deposit_Type__c: 'Insured',
}
```

All fields will be checked, and each will appear in verification results.

---

### Conditional Field Verification

```typescript
expectedFields: (request, response) => {
  const fields: Record<string, any> = {
    Status__c: 'Protected', // Always verify this
  }

  // Only verify start date if it was provided
  if (request.TenancyStartDate) {
    fields.Tenancy_Start_Date__c = request.TenancyStartDate
  }

  // Verify amount was calculated correctly
  if (request.DepositAmount && request.TaxAmount) {
    fields.Total_Amount__c = parseFloat(request.DepositAmount) + parseFloat(request.TaxAmount)
  }

  return fields
}
```

---

### Query Related Objects

```typescript
customQuery: (dan, request, response) => ({
  soql: `
    SELECT
      Id,
      Status__c,
      Deposit__r.Name,
      Tenant__r.Email,
      (SELECT Amount__c FROM Payment_Records__r ORDER BY CreatedDate DESC LIMIT 1)
    FROM Repayment_Request__c
    WHERE Deposit__r.EWC_DAN__c = '${dan}'
    LIMIT 1
  `,
  checks: [
    {
      field: 'Status__c',
      expected: 'Pending',
    },
    {
      field: 'Deposit__r.Name',
      expected: dan,
    },
  ],
})
```

---

### Verify Record Doesn't Exist

```typescript
customQuery: (dan, request, response) => ({
  soql: `
    SELECT Id
    FROM Deposit__c
    WHERE EWC_DAN__c = '${dan}'
    AND Status__c != 'Released'
  `,
  checks: [
    {
      field: 'totalSize',
      expected: 0,
      getMessage: (actual, expected) =>
        actual === 0
          ? 'Deposit successfully deleted/released'
          : 'Deposit still exists in non-Released status',
    },
  ],
})
```

---

## Best Practices

### 1. **Choose the Right Delay**

- **Simple updates:** 2000ms (2 seconds)
- **Creates/Deletes:** 3000ms (3 seconds)
- **Complex operations:** 5000ms (5 seconds)

```typescript
delay: 2000, // Adjust based on operation complexity
```

---

### 2. **Use Regex for Flexible Matching**

```typescript
// Match multiple patterns
endpointPattern: /\/(cart|basket)\/add\//i,

// Match with optional parts
endpointPattern: /\/deposit(creation|update)?/i,
```

---

### 3. **Provide Helpful Messages**

```typescript
getMessage: (actual, expected) => {
  if (actual === expected) {
    return 'Deposit successfully created with correct amount'
  }
  return `Amount mismatch: expected £${expected}, got £${actual}. Check calculation logic.`
}
```

---

### 4. **Handle Missing Data Gracefully**

```typescript
extractIdentifier: (endpoint, requestBody, response) => {
  // Try multiple sources
  return response?.DAN
    || response?.dan
    || requestBody?.DAN
    || endpoint.match(/(EWC|EWI)\d+/i)?.[0]
    || null
}
```

---

### 5. **Verify Calculations**

```typescript
expectedFields: (request, response) => ({
  Deposit_Amount__c: parseFloat(request.DepositAmount),
  VAT_Amount__c: parseFloat(request.DepositAmount) * 0.20,
  Total_Amount__c: parseFloat(request.DepositAmount) * 1.20,
})
```

---

## Common Patterns

### Pattern 1: DAN from URL

```typescript
extractIdentifier: (endpoint) => {
  const match = endpoint.match(/(EWC|EWI|NI|SDS)\d+/i)
  return match ? match[0] : null
}
```

### Pattern 2: DAN from Request Body

```typescript
extractIdentifier: (endpoint, requestBody) => {
  return requestBody?.DAN || null
}
```

### Pattern 3: DAN from Response

```typescript
extractIdentifier: (endpoint, requestBody, response) => {
  return response?.DAN || response?.depositNumber || null
}
```

### Pattern 4: Custom ID

```typescript
extractIdentifier: (endpoint, requestBody, response) => {
  // For endpoints that use a different identifier
  return response?.repaymentRequestId || null
}
```

---

## Troubleshooting

### Verification Not Running?

**Check:**
1. Environment has "Verification Queries" enabled
2. Bearer token is configured and valid
3. Test status is "passed" (verification only runs on success)
4. Rule pattern matches your endpoint

**Console logs to look for:**
```
🔍 Verification enabled, checking for rules...
🔍 Found verification rule for endpoint: /services/apexrest/cart/add/...
📋 Extracted identifier: EWI01261682
⏱️  Waiting 2000ms for Salesforce to process...
🔍 Verifying deposit fields: { Is_Added_to_cart__c: true }
✅ Verification complete: { passed: true, checks: [...] }
```

---

### No Rule Found?

Add a rule to `lib/verification/config.ts`:

```typescript
{
  endpointPattern: '/your-endpoint-here',
  extractIdentifier: (endpoint, request, response) => {
    // Your logic here
  },
  verificationType: 'deposit-fields',
  expectedFields: {
    Your_Field__c: 'expected value',
  },
  delay: 2000,
}
```

---

### Verification Failing?

**Common issues:**
1. **Wait time too short:** Increase `delay`
2. **Bearer token expired:** Refresh via: `sf org display --target-org EWDDEV --json`
3. **Field name wrong:** Check Salesforce object schema
4. **Expected value wrong:** Log actual values to debug

---

## Summary

### To Add Verification to Any Endpoint:

1. **Open:** `lib/verification/config.ts`
2. **Add rule:** Choose `deposit-fields` or `custom-query`
3. **Test:** Run test and check results

### Files You'll Modify:

- ✅ `lib/verification/config.ts` - **Add your rule here**
- ❌ `app/api/tests/[id]/execute/route.ts` - **Don't touch**
- ❌ `lib/verification/engine.ts` - **Don't touch**
- ❌ UI components - **Already integrated**

### Verification Appears In:

- ✅ Test dashboard scenario cards
- ✅ Test dashboard response section
- ✅ Results page detail view
- ✅ Results page table
- ✅ PDF reports

---

## Next Steps

1. **Review existing rules** in `lib/verification/config.ts`
2. **Add rules for your endpoints** following the examples above
3. **Test thoroughly** with your actual data
4. **Document expected behavior** in test scenarios

Happy verifying! 🎉
