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
 * Creates org (if needed) and certification request
 */
export async function submitCertificationRequest(
  values: CertificationFormValues,
) {
  try {
    const {
      organizationName,
      organizationType,
      city,
      state,
      contactName,
      contactEmail,
      description,
    } = values;

    const { error: certInsertError } = await supabase
      .from('certification_requests')
      .insert({
        organization_name: organizationName.trim(),
        organization_type: organizationType,
        city: city || null,
        state: state || null,
        contact_name: contactName,
        contact_email: contactEmail,
        description: description || null,
        status: 'pending',
      });

    if (certInsertError) {
      console.error('Cert request insert error', certInsertError);
      throw certInsertError;
    }

    return { success: true };
  } catch (error: any) {
    console.error('submitCertificationRequest error', error);
    throw new Error(
      error?.message || 'Unknown error submitting certification request',
    );
  }
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

  // Check if user has accepted terms
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('terms_accepted_at, privacy_accepted_at')
    .eq('id', user.id)
    .single();

  if (profileError) {
    console.error('Profile lookup error', profileError);
    throw new Error('Failed to verify account status. Please try again.');
  }

  if (!profile?.terms_accepted_at || !profile?.privacy_accepted_at) {
    throw new Error('TERMS_NOT_ACCEPTED');
  }

  // 1) Look up invite code
  const { data: invite, error: inviteError } = await supabase
    .from('organization_invite_codes')
    .select(
      'id, organization_id, expires_at, is_active, max_uses, current_uses, role',
    )
    .eq('code', code)
    .maybeSingle();

  if (inviteError) {
    console.error('Invite lookup error', inviteError);
    throw new Error('Failed to join organization. Please try again.');
  }

  if (!invite) {
    throw new Error(
      'This code is not valid. Please check with your organization administrator.',
    );
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
    throw new Error(
      membershipError.message ||
        'Failed to join organization. Please try again.',
    );
  }

  // 4) Increment code usage (if RPC exists)
  try {
    await supabase.rpc('increment_invite_code_usage', { p_code: code });
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
    throw new Error(
      'Something went wrong loading organizations. Please try again.',
    );
  }

  return data ?? [];
}
