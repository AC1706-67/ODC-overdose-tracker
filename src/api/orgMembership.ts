import { supabase } from '@/lib/supabase';

export interface OrgMembership {
  organization_id: string;
  role: string;
  is_active: boolean;
  organizations: {
    id: string;
    name: string;
    slug: string;
    is_certified: boolean;
    is_public: boolean;
  } | null;
}

/**
 * Get all organizations the current user is a member of
 */
export async function getMyOrganizations(): Promise<OrgMembership[]> {
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    throw new Error('You must be logged in.');
  }

  const { data, error } = await supabase
    .from('user_organizations')
    .select(`
      organization_id,
      role,
      is_active,
      organizations (
        id,
        name,
        slug,
        is_certified,
        is_public
      )
    `)
    .eq('user_id', user.id)
    .eq('is_active', true);

  if (error) {
    console.error('Error loading org memberships', error);
    throw new Error(error.message || 'Failed to load organizations.');
  }

  // Filter out any memberships without organization data
  return ((data ?? []) as any[]).filter(m => m.organizations) as OrgMembership[];
}

/**
 * Get all certified, public organizations that users can join
 */
export async function getJoinableCertifiedOrganizations() {
  const { data, error } = await supabase
    .from('organizations')
    .select('id, name, slug, type, city, state, description, is_certified, is_public, is_demo_organization')
    .eq('is_certified', true)
    .eq('is_public', true)
    .eq('is_active', true)
    .order('is_demo_organization', { ascending: false }) // Show demo orgs first
    .order('name', { ascending: true });

  if (error) {
    console.error('Error loading certified orgs', error);
    throw new Error(error.message || 'Failed to load certified organizations.');
  }

  return data ?? [];
}

/**
 * Join an organization directly (without invite code)
 * Used for public, certified organizations
 */
export async function joinOrganization(orgId: string, role: string = 'Responder') {
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    throw new Error('You must be logged in to join an organization.');
  }

  // Check if already a member
  const { data: existing } = await supabase
    .from('user_organizations')
    .select('id')
    .eq('user_id', user.id)
    .eq('organization_id', orgId)
    .maybeSingle();

  if (existing) {
    throw new Error('You are already a member of this organization.');
  }

  // Add membership
  const { error } = await supabase
    .from('user_organizations')
    .insert({
      user_id: user.id,
      organization_id: orgId,
      role,
      is_active: true,
    });

  if (error) {
    console.error('Error joining organization', error);
    throw new Error(error.message || 'Failed to join organization.');
  }

  return { success: true, organizationId: orgId };
}

/**
 * Leave an organization
 */
export async function leaveOrganization(orgId: string) {
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    throw new Error('You must be logged in.');
  }

  const { error } = await supabase
    .from('user_organizations')
    .delete()
    .eq('user_id', user.id)
    .eq('organization_id', orgId);

  if (error) {
    console.error('Error leaving organization', error);
    throw new Error(error.message || 'Failed to leave organization.');
  }

  return { success: true };
}
