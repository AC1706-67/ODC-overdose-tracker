/**
 * Format a full name to "FirstName L." for privacy/anonymity
 * Examples:
 *   "John Doe" -> "John D."
 *   "Mary Jane Smith" -> "Mary S."
 *   "Alice" -> "Alice"
 */
export function formatAnonymousName(fullName: string | null | undefined): string {
  if (!fullName || typeof fullName !== 'string') {
    return 'Unknown';
  }

  const trimmed = fullName.trim();
  if (!trimmed) {
    return 'Unknown';
  }

  const parts = trimmed.split(/\s+/);
  
  if (parts.length === 1) {
    // Only first name provided
    return parts[0];
  }

  // Get first name and last initial
  const firstName = parts[0];
  const lastName = parts[parts.length - 1];
  const lastInitial = lastName.charAt(0).toUpperCase();

  return `${firstName} ${lastInitial}.`;
}
