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
 * Frontend logic: Show Outreach tab if user belongs to an organization with outreach enabled.
 * Backend RLS: Automatically filters data by organization membership.
 * 
 * @param org - The user's active organization
 * @returns true if user has an active organization with outreach_enabled = true
 */
export function canUseOutreach(org?: Org | null) {
  // Check if user has an active organization AND outreach is enabled for that org
  return !!org && !!org.id && org.outreach_enabled === true;
}
