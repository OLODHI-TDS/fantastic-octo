# Deposit Creation Test Scenarios

## Summary
Created comprehensive test scenarios for the Deposit Creation endpoint based on actual API validation discovery through automated testing.

## Test Discovery Process
1. Ran automated validation tests against live API
2. Discovered 30 different validation scenarios
3. Identified which validations are enforced vs. not enforced
4. Created targeted test scenarios based on findings

## Test Scenarios Created (21 Total)

### ✅ Positive Tests (2)
1. **Positive: Full Valid Data** - All fields populated and valid
2. **Positive: Minimal Required Fields** - Only required fields, optional omitted

### ❌ Negative Tests - Missing Required Fields (6)
3. **Missing user_tenancy_reference** - Required field missing (400)
4. **Missing deposit_amount** - Required field missing (400)
5. **Missing tenancy_start_date** - Required field missing (400)
6. **Missing property_postcode** - Required field missing (400)
7. **Missing person_firstname** - Required field missing for tenant (400)
8. **Missing person_surname** - Required field missing for tenant (400)

### ❌ Negative Tests - People/Entity Validation (4)
9. **No Tenants** - People array contains no tenants (400)
10. **No Landlords** - People array contains no landlords (400)
11. **Tenant Count Mismatch** - number_of_tenants doesn't match actual (400)
12. **Landlord Count Mismatch** - number_of_landlords doesn't match actual (400)

### ❌ Negative Tests - Date Validation (3)
13. **Invalid Date Format** - YYYY-MM-DD instead of DD-MM-YYYY (400)
14. **End Date Before Start** - tenancy_expected_end_date before start (400)
15. **Deposit Received in Future** - deposit_received_date in future (400)

### ❌ Negative Tests - Amount Validation (3)
16. **Negative Amount** - deposit_amount is negative (400)
17. **Zero Amount** - deposit_amount is zero (400)
18. **Non-Numeric Amount** - deposit_amount contains non-numeric chars (400)

### ❌ Negative Tests - Other Field Validation (3)
19. **Invalid furnished_status** - Value not "true"/"false" (400)
20. **Invalid Email Format** - person_email has invalid format (409)
21. **String Too Long** - property_street exceeds max length (400)

## ❌ Validations NOT Enforced (Discovered but not tested)
- Postcode area validation (accepts any valid UK postcode format)
- Phone number format validation
- Mobile number prefix validation
- Business logic (is_business + business_name relationship)
- deposit_amount_to_protect > deposit_amount validation
- Missing optional fields (deposit_reference, property_id, person_email)

## Implementation Details

### File Structure
```
lib/test-scenarios/
  └── deposit-creation-scenarios.ts  # 21 test scenarios

app/tests/[endpointId]/page.tsx     # Updated to use dynamic scenarios
```

### How It Works
1. Each scenario has a `generatePayload()` function that creates test data
2. Scenarios specify expected HTTP status code
3. UI dynamically loads scenarios based on endpoint ID
4. Tests execute automatically with generated payloads
5. Results show in both individual cards and aggregated response viewer

### Key Features
- ✅ Auto-generates unique references to avoid duplicate errors
- ✅ Uses Faker.js for realistic data
- ✅ Validates against actual API responses
- ✅ Clear pass/fail indicators with status icons
- ✅ Side-by-side request/response viewing
- ✅ Wrapping tabs for unlimited scenarios

## Next Steps
To add tests for other endpoints:
1. Create new scenario file in `lib/test-scenarios/`
2. Add to switch statement in `getScenariosForEndpoint()`
3. Define scenarios with generatePayload functions
4. Run and validate!

## Usage
1. Navigate to Deposit Creation endpoint dashboard
2. Select environment and credentials
3. Click "Run Test" on any scenario card
4. View results in card or API Response section
5. Compare expected vs actual status codes
