import { SupabaseClient } from '@supabase/supabase-js';

export async function createTeamMember(
  supabase: SupabaseClient,
  orgSlug: string,
  fullName: string,
  email?: string,
  role?: string,
) {
  const clean = fullName?.trim();
  if (!clean) throw new Error('Please enter a name.');

  const { data: session } = await supabase.auth.getSession();
  if (!session?.session?.user?.id) throw new Error('You must be signed in.');

  const { data: member, error } = await supabase.rpc('create_team_member', {
    p_full_name: clean,
    p_email: email?.trim() || null,
    p_role: role?.trim() || null,
    p_org_slug: orgSlug,
  });

  if (error) throw new Error(error.message || 'Could not create team member.');

  return member as {
    id: string;
    name: string;
    email: string | null;
    role: string | null;
    organization_id: string;
    is_active: boolean;
    created_at: string;
    updated_at: string;
    action: 'created' | 'updated';
  };
}
