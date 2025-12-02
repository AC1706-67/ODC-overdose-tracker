/**
 * Authentication and authorization utilities
 */

import { createLogger } from './logger';
import { isUUID } from './validation';

const logger = createLogger('AuthUtils');

export interface AuthContext {
  userId?: string | null;
  orgId?: string | null;
}

export interface ValidatedAuthContext {
  userId: string;
  orgId: string;
}

/**
 * Validate and require both userId and orgId
 * Throws an error if either is missing or invalid
 *
 * Use this at the start of any function that requires authentication
 *
 * @example
 * const { userId, orgId } = requireAuthAndOrg({ userId, orgId });
 * // Now userId and orgId are guaranteed to be valid strings
 */
export function requireAuthAndOrg(context: AuthContext): ValidatedAuthContext {
  const { userId, orgId } = context;

  logger.assert(
    userId !== null && userId !== undefined,
    'Missing authenticated user ID',
    { hasUserId: !!userId, hasOrgId: !!orgId },
  );

  logger.assert(
    typeof orgId === 'string' && isUUID(orgId),
    'Invalid or missing organization ID',
    { orgId, isUUID: orgId ? isUUID(orgId) : false },
  );

  return {
    userId: userId as string,
    orgId: orgId as string,
  };
}

/**
 * Validate userId only (for operations that don't require org context)
 *
 * @example
 * const userId = requireAuth({ userId });
 */
export function requireAuth(context: { userId?: string | null }): string {
  const { userId } = context;

  logger.assert(
    userId !== null && userId !== undefined,
    'Missing authenticated user ID',
  );

  return userId as string;
}

/**
 * Validate orgId only
 *
 * @example
 * const orgId = requireOrg({ orgId });
 */
export function requireOrg(context: { orgId?: string | null }): string {
  const { orgId } = context;

  logger.assert(
    typeof orgId === 'string' && isUUID(orgId),
    'Invalid or missing organization ID',
    { orgId },
  );

  return orgId as string;
}
