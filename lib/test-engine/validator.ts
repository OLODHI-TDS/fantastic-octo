import { Test } from '@/types/test'

export interface ValidationRule {
  field: string
  condition: 'equals' | 'contains' | 'exists' | 'notExists' | 'greaterThan' | 'lessThan'
  value?: any
}

export interface ValidationResult {
  field: string
  condition: string
  expected?: any
  actual: any
  passed: boolean
  message?: string
}

/**
 * Get nested property from object using dot notation
 * Example: getNestedValue({ a: { b: { c: 1 } } }, 'a.b.c') => 1
 */
function getNestedValue(obj: any, path: string): any {
  return path.split('.').reduce((current, key) => current?.[key], obj)
}

/**
 * Validate response data against test validation rules
 */
export function validateResponse(
  responseData: any,
  validations?: ValidationRule[]
): ValidationResult[] {
  if (!validations || validations.length === 0) {
    return []
  }

  const results: ValidationResult[] = []

  for (const rule of validations) {
    const actualValue = getNestedValue(responseData, rule.field)
    let passed = false
    let message: string | undefined

    switch (rule.condition) {
      case 'equals':
        passed = actualValue === rule.value
        message = passed
          ? `Field "${rule.field}" equals expected value`
          : `Expected "${rule.value}" but got "${actualValue}"`
        break

      case 'contains':
        if (typeof actualValue === 'string') {
          passed = actualValue.includes(rule.value)
          message = passed
            ? `Field "${rule.field}" contains "${rule.value}"`
            : `Expected field to contain "${rule.value}" but it doesn't`
        } else if (Array.isArray(actualValue)) {
          passed = actualValue.includes(rule.value)
          message = passed
            ? `Array "${rule.field}" contains expected value`
            : `Expected array to contain "${rule.value}" but it doesn't`
        } else {
          passed = false
          message = `Field "${rule.field}" is not a string or array`
        }
        break

      case 'exists':
        passed = actualValue !== undefined && actualValue !== null
        message = passed
          ? `Field "${rule.field}" exists`
          : `Field "${rule.field}" does not exist`
        break

      case 'notExists':
        passed = actualValue === undefined || actualValue === null
        message = passed
          ? `Field "${rule.field}" does not exist as expected`
          : `Field "${rule.field}" exists but should not`
        break

      case 'greaterThan':
        if (typeof actualValue === 'number' && typeof rule.value === 'number') {
          passed = actualValue > rule.value
          message = passed
            ? `Field "${rule.field}" (${actualValue}) is greater than ${rule.value}`
            : `Expected "${rule.field}" (${actualValue}) to be greater than ${rule.value}`
        } else {
          passed = false
          message = `Field "${rule.field}" or expected value is not a number`
        }
        break

      case 'lessThan':
        if (typeof actualValue === 'number' && typeof rule.value === 'number') {
          passed = actualValue < rule.value
          message = passed
            ? `Field "${rule.field}" (${actualValue}) is less than ${rule.value}`
            : `Expected "${rule.field}" (${actualValue}) to be less than ${rule.value}`
        } else {
          passed = false
          message = `Field "${rule.field}" or expected value is not a number`
        }
        break

      default:
        passed = false
        message = `Unknown validation condition: ${rule.condition}`
    }

    results.push({
      field: rule.field,
      condition: rule.condition,
      expected: rule.value,
      actual: actualValue,
      passed,
      message,
    })
  }

  return results
}

/**
 * Check if all validations passed
 */
export function allValidationsPassed(results: ValidationResult[]): boolean {
  return results.every(result => result.passed)
}
