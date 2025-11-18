/**
 * Validation utilities for assertions and input checking
 */

/**
 * Check if a string is a valid UUID
 */
export function isUUID(value: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(value);
}

/**
 * Check if a string is a valid email
 */
export function isEmail(value: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(value);
}

/**
 * Check if a string is a valid 5-digit zip code
 */
export function isZipCode(value: string): boolean {
  return /^\d{5}$/.test(value);
}

/**
 * Check if a string is a valid phone number (10 digits)
 */
export function isPhoneNumber(value: string): boolean {
  return /^\d{10}$/.test(value);
}

/**
 * Check if a value is a non-empty string
 */
export function isNonEmptyString(value: any): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

/**
 * Check if a value is a positive integer
 */
export function isPositiveInteger(value: any): value is number {
  return Number.isInteger(value) && value > 0;
}

/**
 * Check if a value is a non-negative integer (includes 0)
 */
export function isNonNegativeInteger(value: any): value is number {
  return Number.isInteger(value) && value >= 0;
}
