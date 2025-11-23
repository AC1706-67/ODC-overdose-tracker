/**
 * Generate a random 8-character invite code
 * Format: XXXXXXXX (uppercase alphanumeric)
 */
export function generateInviteCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  return Array.from({ length: 8 })
    .map(() => chars.charAt(Math.floor(Math.random() * chars.length)))
    .join('');
}

/**
 * Format an invite code for display
 * Example: ABCD1234 -> ABCD-1234
 */
export function formatInviteCode(code: string): string {
  if (code.length !== 8) return code;
  return `${code.slice(0, 4)}-${code.slice(4)}`;
}
