import { supabase } from '@/lib/supabase';

export type CertificationFormValues = {
  organizationName: string;
  organizationType: string;
  city?: string;
  state?: string;
  website?: string;
  contactName: string;
  contactEmail: string;
  description?: string;
};

/**
 * Submit an organization certification request
 * Just creates the certification request - no org creation or invite codes
 */
export async function submitCertificationRequest(values: CertificationFormValues) {
  const {
    organizationName,
    organizationType,
    city,
    state,
    website,
    contactName,
    contactEmail,
    description,
  } = values;

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    throw new Error('You must be logged in to submit a request.');
  }

  // 🔹 JUST create a certification request – no org creation here
  const { error: requestError } = await supabase
    .from('organization_certification_requests')
    .insert({
      organization_name: organizationName.trim(),
      organization_type: organizationType,
      city: city || null,
      state: state || null,
      website: website || null,
      contact_name: contactName,
      contact_email: contactEmail,
      description: description || null,
      created_by: user.id,
    });

  if (requestError) {
    console.error('Certification request error', requestError);
    throw new Error(
      requestError.message || 'Failed to submit certification request. Please try again.'
    );
  }

  // Keep return shape simple for now
  return {
    success: true,
  };
}

/**
 * Join an organization using an invite code
 */
export async function joinOrganizationWithCode(rawCode: string) {
  const code = rawCode.trim().toUpperCase();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    throw new Error('You must be logged in to join an organization.');
  }

  // 1) Look up invite code
  const { data: invite, error: inviteError } = await supabase
    .from('organization_invite_codes')
    .select('id, organization_id, expires_at, is_active, max_uses, current_uses, role')
    .eq('code', code)
    .maybeSingle();

  if (inviteError) {
    console.error('Invite lookup error', inviteError);
    throw new Error('Failed to join organization. Please try again.');
  }

  if (!invite) {
    throw new Error('This code is not valid. Please check with your organization administrator.');
  }

  if (!invite.is_active) {
    throw new Error('This code is no longer active.');
  }

  if (invite.expires_at && new Date(invite.expires_at) < new Date()) {
    throw new Error('This code has expired. Please request a new one.');
  }

  if (invite.max_uses && invite.current_uses >= invite.max_uses) {
    throw new Error('This code has reached its maximum uses.');
  }

  const organizationId = invite.organization_id;

  // 2) Check if already a member
  const { data: existing } = await supabase
    .from('user_organizations')
    .select('id')
    .eq('user_id', user.id)
    .eq('organization_id', organizationId)
    .maybeSingle();

  if (existing) {
    throw new Error('You are already a member of this organization.');
  }

  // 3) Add membership row
  const { error: membershipError } = await supabase
    .from('user_organizations')
    .insert({
      user_id: user.id,
      organization_id: organizationId,
      role: invite.role || 'Responder',
      is_active: true,
    });

  if (membershipError && membershipError.code !== '23505') {
    // 23505 = unique_violation
    console.error('Membership insert error', membershipError);
    throw new Error(membershipError.message || 'Failed to join organization. Please try again.');
  }

  // 4) Increment code usage (if RPC exists)
  try {
    await supabase.rpc('increment_invite_code_usage', { code_text: code });
  } catch (e) {
    console.warn('Could not increment invite code usage:', e);
  }

  return { organizationId };
}

/**
 * Load list of certified, public organizations
 */
export async function loadCertifiedOrganizations() {
  const { data, error } = await supabase
    .from('organizations')
    .select('id, name, slug, type, city, state, description')
    .eq('is_certified', true)
    .eq('is_public', true)
    .eq('is_active', true)
    .order('name', { ascending: true });

  if (error) {
    console.error('Certified orgs load error', error);
    throw new Error('Something went wrong loading organizations. Please try again.');
  }

  return data ?? [];
}
