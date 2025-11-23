import { supabase } from '@/lib/supabase';
import { generateInviteCode } from '@/src/utils/inviteCodes';

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
 * Creates the org, certification request, and generates an invite code for testing
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

  // 1) Create or find organization
  const { data: existingOrgs, error: orgLookupError } = await supabase
    .from('organizations')
    .select('id')
    .eq('name', organizationName.trim())
    .limit(1);

  if (orgLookupError) {
    console.error('Org lookup error', orgLookupError);
    throw new Error('Failed to submit request. Please try again.');
  }

  let organizationId: string;

  if (existingOrgs && existingOrgs.length > 0) {
    organizationId = existingOrgs[0].id;
  } else {
    // Create slug from name
    const slug = organizationName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');

    const { data: newOrg, error: createOrgError } = await supabase
      .from('organizations')
      .insert({
        name: organizationName.trim(),
        slug,
        type: organizationType,
        city: city || null,
        state: state || null,
        website: website || null,
        contact_email: contactEmail,
        contact_name: contactName,
        description: description || null,
        is_certified: false,
        is_public: true,
        is_active: true,
        status: 'pending',
        created_by: user.id,
      })
      .select('id')
      .single();

    if (createOrgError || !newOrg) {
      console.error('Create org error', createOrgError);
      throw new Error(createOrgError?.message || 'Failed to create organization. Please try again.');
    }

    organizationId = newOrg.id;
  }

  // 2) Insert certification request
  const { error: requestError } = await supabase
    .from('organization_certification_requests')
    .insert({
      organization_name: organizationName.trim(),
      organization_type: organizationType,
      city,
      state,
      website,
      contact_name: contactName,
      contact_email: contactEmail,
      description,
      created_by: user.id,
    });

  if (requestError) {
    console.error('Certification request error', requestError);
    throw new Error(requestError.message || 'Failed to submit certification request. Please try again.');
  }

  // 3) For testing: create an invite code so the user can immediately join
  const inviteCode = generateInviteCode();

  const { error: inviteError } = await supabase
    .from('organization_invite_codes')
    .insert({
      organization_id: organizationId,
      code: inviteCode,
      created_by: user.id,
      is_active: true,
    });

  if (inviteError) {
    console.error('Invite code creation error', inviteError);
    // Do not block the request, just log it.
  }

  return {
    organizationId,
    inviteCode, // show this to the user in a success message
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
