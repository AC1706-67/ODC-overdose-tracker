export type Org = {
  id?: string;
  slug?: string;
  name?: string;
  outreach_enabled?: boolean;
  features?: Record<string, any>;
};

/**
 * Determines if a user can access the Outreach feature.
 * 
 * With RLS enabled on outreach_logs, access control is handled at the database level.
 * Users can only see/create outreach logs for their own organization.
 * 
 * Frontend logic: Show Outreach tab if user belongs to any active organization.
 * Backend RLS: Automatically filters data by organization membership.
 * 
 * @param org - The user's active organization
 * @returns true if user has an active organization membership
 */
export function canUseOutreach(org?: Org | null) {
  // Simple check: if user has an active organization, they can see Outreach
  // RLS policies handle all data isolation automatically
  return !!org && !!org.id;
}
